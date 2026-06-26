import { RssItem } from "@prisma/client";
import OpenAI from "openai";
import { prisma } from "../db/client";
import { getDecryptedKey } from "../crypto/api-keys";

interface AiConfig {
  apiKey: string;
  modelName: string;
  providerType: string;
}

async function getAiConfig(aiProviderId?: string | null): Promise<AiConfig> {
  // Check soft block and override status
  const blockSetting = await prisma.appSettings.findUnique({ where: { key: "ai_blocked" } });
  const overrideSetting = await prisma.appSettings.findUnique({ where: { key: "ai_override" } });
  const spentSetting = await prisma.appSettings.findUnique({ where: { key: "ai_spent_usd" } });
  const limitSetting = await prisma.appSettings.findUnique({ where: { key: "ai_cost_limit" } });
  
  const isBlocked = blockSetting?.value === "true";
  const isOverridden = overrideSetting?.value === "true";
  
  if (isBlocked && !isOverridden) {
    const spent = parseFloat(spentSetting?.value || "0").toFixed(2);
    const limit = parseFloat(limitSetting?.value || "10.0").toFixed(2);
    throw new Error(`AI Execution Blocked: API cost limit reached (Spent: $${spent} / Limit: $${limit} USD). Please resume/override from the settings or dashboard.`);
  }

  // Fetch AI Settings from Database
  const aiSettings = await prisma.appSettings.findUnique({ where: { key: "ai_providers" } });
  let apiKey = process.env.OPENAI_API_KEY || "";
  let modelName = "gpt-4o";
  let providerType = "openai";

  if (aiSettings?.value) {
    const providers = JSON.parse(aiSettings.value);
    let provider = aiProviderId ? providers.find((p: any) => p.id === aiProviderId) : null;
    if (!provider) provider = providers.find((p: any) => p.isDefault);
    
    if (provider && provider.apiKey) {
      apiKey = getDecryptedKey(provider.apiKey);
      modelName = provider.modelName || "gpt-4o";
      providerType = provider.type || "openai";
    }
  }

  if (!apiKey) {
    throw new Error("No API Key found in Settings or Environment Variables.");
  }

  // Guard: detect non-chat models (rerankers, embeddings) that can't generate text
  const nonChatPatterns = ["rerank", "embed", "embedding", "encoder"];
  if (nonChatPatterns.some(p => modelName.toLowerCase().includes(p))) {
    throw new Error(
      `Model "${modelName}" is a reranker/embedding model — it cannot generate text. ` +
      `Please go to Settings → AI Providers and choose a chat/instruct model, e.g. ` +
      `"meta-llama/llama-3.1-8b-instruct:free" or "mistralai/mistral-7b-instruct:free" on OpenRouter.`
    );
  }

  return { apiKey, modelName, providerType };
}

// Robust JSON parser — handles control chars, markdown fences, and mixed text
function safeParseJSON(raw: string): any {
  // 1. Strip markdown code fences
  let s = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  // 2. Extract first {...} block in case AI added extra text around it
  const match = s.match(/\{[\s\S]*\}/);
  if (match) s = match[0];
  // 3. Remove actual control characters that are illegal inside JSON strings
  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  // 4. Escape unescaped literal newlines/tabs inside string values
  s = s.replace(/(?<!\\)\n/g, "\\n").replace(/(?<!\\)\r/g, "\\r").replace(/(?<!\\)\t/g, "\\t");
  try {
    return JSON.parse(s);
  } catch (e) {
    console.warn(`[AI] safeParseJSON fallback triggered: ${(e as any).message}`);
    const get = (key: string) => {
      // Use [\s\S] instead of [^] for safer multiline matching
      const m = raw.match(new RegExp(`"${key}"\\s*:\\s*"([\\s\\S]*?)"\\s*(?:,|\\})`, "m"));
      if (!m) return "";
      let val = m[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
      // Fix potential trailing quotes caught by regex
      if (val.endsWith('"')) val = val.substring(0, val.length - 1);
      return val;
    };
    return {
      title: get("title"),
      summary: get("summary"),
      content: get("content"),
      sourceUrl: get("sourceUrl"),
      metaTitle: get("metaTitle"),
      metaDescription: get("metaDescription"),
      tags: get("tags"),
      socialText: get("socialText"),
      clusters: []
    };
  }
}

async function callLlm(
  config: AiConfig,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const { apiKey, modelName, providerType } = config;

  if (providerType === "anthropic") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: modelName,
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }]
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Anthropic API error ${res.status}: ${errText}`);
    }
    const data = await res.json();
    await trackCost(providerType, modelName, data.usage?.input_tokens || 0, data.usage?.output_tokens || 0);
    return data.content[0]?.text || "{}";
  } else {
    const openaiConfig: any = { apiKey };
    if (providerType === "openrouter") {
      openaiConfig.baseURL = "https://openrouter.ai/api/v1";
      openaiConfig.defaultHeaders = {
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "AutoFeed"
      };
    }
    
    const openai = new OpenAI(openaiConfig);
    const response = await openai.chat.completions.create({
      model: modelName,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: providerType === "openai" ? { type: "json_object" } : undefined
    });

    await trackCost(
      providerType,
      modelName,
      response.usage?.prompt_tokens || 0,
      response.usage?.completion_tokens || 0
    );
    return response.choices[0].message.content || "{}";
  }
}

export async function scoreAndClusterItems(
  items: RssItem[],
  topicName: string,
  aiProviderId?: string | null,
  enableStrictFiltering: boolean = true
): Promise<{ selectedItems: RssItem[]; skippedItemIds: string[]; rawAiJson?: any }> {
  console.log(`[RANKING] Scoring and clustering ${items.length} items for topic "${topicName}"...`);
  if (!items.length) return { selectedItems: [], skippedItemIds: [], rawAiJson: null };

  // PRE-FILTER: Reject "opinion", "sponsored", "ad" and items older than 7 days before AI sees them
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const spamRegex = /\b(opinion|sponsored|ad)\b/i;

  const preFilteredItems: RssItem[] = [];
  const autoSkippedIds: string[] = [];

  for (const item of items) {
    const titleRegexMatch = spamRegex.test(item.title);
    const pubDate = item.publishedAt ? new Date(item.publishedAt).getTime() : new Date(item.fetchedAt).getTime();
    const isOld = (now - pubDate) > SEVEN_DAYS_MS;

    if (titleRegexMatch || isOld) {
      autoSkippedIds.push(item.id);
    } else {
      preFilteredItems.push(item);
    }
  }

  if (autoSkippedIds.length > 0) {
    console.log(`[RANKING] Pre-filtered ${autoSkippedIds.length} items (spam/opinion/older than 7 days).`);
  }

  if (!preFilteredItems.length) {
    return { selectedItems: [], skippedItemIds: autoSkippedIds, rawAiJson: null };
  }

  const config = await getAiConfig(aiProviderId);

  // We will ask the LLM (using a cheaper/faster model setup if available, or the same provider)
  // to cluster similar articles and score relevance 1-10
  const systemPrompt = `You are a content relevance scorer for LegalSuvidha, an Indian legal and tax compliance services company serving business owners, startup founders, and CAs.

Your job is to filter news articles and keep only those that are directly useful for publishing on LegalSuvidha's blog.

ALWAYS REJECT (score 1-3):
- Opinion pieces, editorials, sponsored content
- Crime, politics, sports, entertainment
- Global news with no India business/compliance angle
- Personal finance (stock tips, mutual funds, insurance)
- Articles older than 7 days
- Vague or generic business news with no actionable compliance angle

ALWAYS ACCEPT (score 8-10):
- CBDT, MCA, GSTN, SEBI, EPFO, RBI official notifications
- Compliance deadline changes or extensions
- Tax rate or slab changes
- Court rulings directly impacting business compliance
- New government scheme or policy for businesses or startups

You also group duplicate stories.`;
  
  const userPrompt = `
Workflow topic: ${topicName}

You have a list of recent news articles.
Your task is to:
1. Group duplicate stories covering the exact same announcement together.
2. Pick the single best article from each group.
3. Score relevance 1-10 based on how directly useful this article is for LegalSuvidha's audience on the topic: ${topicName}

Articles:
${preFilteredItems.map(item => `ID: ${item.id}\nTitle: ${item.title}\nSnippet: ${item.snippet || "No snippet"}\nSource: ${item.source || "Unknown"}\n---`).join("\n")}

Return STRICTLY as JSON:
{
  "clusters": [
    {
      "representativeId": "item-id-here",
      "duplicateIds": ["duplicate-id-1"],
      "relevanceScore": 8.5,
      "reason": "CBDT circular on TDS directly impacts compliance"
    }
  ]
}
  `;

  let responseStr = "{}";
  try {
    // If we're on OpenAI, we use the cheaper gpt-4o-mini for ranking if possible, but we stay with the user's provider/model config
    responseStr = await callLlm(config, systemPrompt, userPrompt);
  } catch (error: any) {
    console.error(`[RANKING] AI call failed: ${error.message}`);
    // Fallback: if AI scoring fails, treat all items as independent and sort them solely by date
    console.log("[RANKING] Falling back to date-based sorting only.");
    const sorted = [...preFilteredItems].sort((a, b) => {
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : new Date(a.fetchedAt).getTime();
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : new Date(b.fetchedAt).getTime();
      return dateB - dateA;
    });
    const selected = sorted.slice(0, 10);
    const skipped = [...autoSkippedIds, ...sorted.slice(10).map(i => i.id)];
    return { selectedItems: selected, skippedItemIds: skipped, rawAiJson: { error: "AI call failed" } };
  }

  const parsed = safeParseJSON(responseStr);
  const clusters = parsed.clusters || [];
  
  // If the AI returns empty clusters (or the fallback parser failed to extract them), gracefully fallback to date-based sorting
  if (clusters.length === 0) {
    console.log("[RANKING] AI returned empty clusters. Falling back to date-based sorting.");
    const sorted = [...preFilteredItems].sort((a, b) => {
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : new Date(a.fetchedAt).getTime();
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : new Date(b.fetchedAt).getTime();
      return dateB - dateA;
    });
    const selected = sorted.slice(0, 10);
    const skipped = [...autoSkippedIds, ...sorted.slice(10).map(i => i.id)];
    return { selectedItems: selected, skippedItemIds: skipped, rawAiJson: parsed };
  }
  
  const representativeScores: Record<string, number> = {};
  const duplicateMap: Record<string, string[]> = {};
  const allRepresentedIds = new Set<string>();

  for (const cluster of clusters) {
    const repId = cluster.representativeId;
    if (repId) {
      representativeScores[repId] = cluster.relevanceScore || 5.0;
      duplicateMap[repId] = cluster.duplicateIds || [];
      allRepresentedIds.add(repId);
    }
  }

  // Programmatic Recency Boost
  const scoredItemsList = preFilteredItems.filter(item => allRepresentedIds.has(item.id)).map(item => {
    const relevance = representativeScores[item.id] || 5.0;
    const pubDate = item.publishedAt ? new Date(item.publishedAt) : new Date(item.fetchedAt);
    const hoursAgo = (Date.now() - pubDate.getTime()) / (1000 * 60 * 60);

    let recencyBoost = 0;
    if (hoursAgo <= 12) {
      recencyBoost = 2.0;
    } else if (hoursAgo <= 24) {
      recencyBoost = 1.0;
    } else if (hoursAgo > 72) {
      recencyBoost = -1.0;
    }

    const finalScore = relevance + recencyBoost;
    return { item, finalScore };
  });

  // Filter out items that are not relevant enough (finalScore < 5.0) if strict filtering is enabled
  const relevantItemsList = enableStrictFiltering 
    ? scoredItemsList.filter(s => s.finalScore >= 5.0)
    : scoredItemsList;

  // Sort by final score descending
  relevantItemsList.sort((a, b) => b.finalScore - a.finalScore);

  // Take top 10 unique representatives
  const topScored = relevantItemsList.slice(0, 10);
  const selectedItems = topScored.map(s => s.item);
  const selectedIds = new Set(selectedItems.map(i => i.id));

  // Determine skipped item IDs (duplicates + representatives that didn't make the top 10)
  const skippedItemIds: string[] = [...autoSkippedIds];
  
  for (const item of preFilteredItems) {
    if (!selectedIds.has(item.id)) {
      skippedItemIds.push(item.id);
    }
  }

  console.log(`[RANKING] Selected ${selectedItems.length} items. Skipped/deduped ${skippedItemIds.length} items.`);
  return { selectedItems, skippedItemIds, rawAiJson: parsed };
}

const defaultUserPromptTemplate = `
You are an expert tech journalist and SEO copywriter.
I have the following recent news stories:

{{stories}}

Please synthesize this into a professional, curated news article. 
CRITICAL WRITING INSTRUCTIONS (To bypass AI detectors and rank on Google):
1. Write in a natural, conversational, yet authoritative human tone. Use active voice.
2. Vary your sentence length and structure to create a natural rhythm.
3. Completely AVOID typical AI filler phrases such as "It's important to note", "In today's fast-paced digital world", "In conclusion", "Moreover", "Additionally", or "Delve into".
4. Do NOT use any conversational greetings or meta-commentary like "This week's roundup covers...", or "Here are the updates...". Start directly with the professional content.
5. Naturally weave in relevant SEO keywords without keyword stuffing.
6. Make it highly readable (aim for an 8th-10th grade reading level). Use short paragraphs.
{{websiteInstructions}}
{{socialInstructions}}

Return the result strictly as a JSON object with the following fields:
- title: The headline for the roundup (MAX 100 characters)
- summary: A detailed summary of at least 200 to 250 characters long. STRICTLY NO MARKDOWN ALLOWED IN SUMMARY (No ** or #).
- content: The markdown content
- sourceUrl: The primary original source URL (if requested)
- metaTitle: SEO title (max 60 chars)
- metaDescription: SEO description (max 150 chars)
- tags: Comma separated tags
- socialText: The short social media post text (leave empty if not requested)
`;

export async function clusterItemsAndGeneratePost(
  items: RssItem[], 
  logoUrl?: string | null,
  options?: { hasWebsite: boolean; hasSocial: boolean; includeSourceLink?: boolean; isRoundup?: boolean },
  aiProviderId?: string | null,
  customSystemPrompt?: string | null
) {
  console.log(`[AI] Generating post from ${items.length} pre-filtered items...`);
  if (!items.length) return null;

  const config = await getAiConfig(aiProviderId);

  const storiesText = items.map((item, i) => 
    `Story ${i+1}:\nTitle: ${item.title}\nSnippet: ${item.snippet || "No snippet"}\nLink: ${item.itemUrl}\nSource: ${item.source || "Unknown"}`
  ).join("\n\n");

  // Determine prompt template (default or custom override)
  let userPromptTemplate = customSystemPrompt?.trim() || defaultUserPromptTemplate.trim();

  // Enforce mandatory {{stories}} shortcode: if missing, append it to the bottom
  if (!userPromptTemplate.includes("{{stories}}")) {
    userPromptTemplate += "\n\nRecent news stories context:\n{{stories}}";
  }

  // Define values for replacement
  const logoReplacement = logoUrl ? `![Business Logo](${logoUrl})` : "";
  const websiteReplacement = options?.hasWebsite 
    ? "Generate a highly detailed, comprehensive blog post in Markdown format. Use H2 (##) headings for main sections and provide thorough paragraphs or bullet points under each heading. Never output empty headings. Ensure markdown formatting like **bold text** is used correctly." 
    : "Generate a short summary.";
  const socialReplacement = options?.hasSocial 
    ? "Also generate an engaging, short social media post (under 280 characters) with hashtags." 
    : "No social media post needed.";
    
  const sourceLinkInstruction = options?.includeSourceLink
    ? "\n- sourceUrl: The primary original source URL\n- content: The markdown content (You MUST embed hyperlinks back to the original source articles inside the content)"
    : "\n- sourceUrl: The primary original source URL\n- content: The markdown content (CRITICAL: DO NOT include any external hyperlinks or source URLs in the content)";

  const jsonInstructions = `

Return the result STRICTLY as a JSON object with the following fields:
- title: The headline for the ${options?.isRoundup ? 'roundup' : 'article'} (MAX 100 CHARACTERS)
- summary: A professional, detailed summary of at least 200 to 250 characters long. Do not use conversational filler like "This article covers". STRICTLY NO MARKDOWN ALLOWED (No ** or #).${sourceLinkInstruction}
- metaTitle: SEO title (max 60 chars)
- metaDescription: SEO description (max 150 chars)
- tags: Comma separated tags
- socialText: The short social media post text (leave empty if not requested)
`;

  // Replace shortcodes
  let prompt = userPromptTemplate
    .replace(/\{\{stories\}\}/g, storiesText)
    .replace(/\{\{logo\}\}/g, logoReplacement)
    .replace(/\{\{websiteInstructions\}\}/g, websiteReplacement)
    .replace(/\{\{socialInstructions\}\}/g, socialReplacement);
    
  // ALWAYS append JSON schema instructions so the user's custom prompt doesn't break the pipeline
  prompt += jsonInstructions;

  try {
    const systemPrompt = "You are a specialized JSON-outputting journalism AI. Always output valid JSON.";
    const responseStr = await callLlm(config, systemPrompt, prompt);
    const result = safeParseJSON(responseStr);

    // Add fallback logo if not injected by AI
    if (logoUrl && options?.hasWebsite && !result.content?.includes(logoUrl)) {
      result.content = `![Business Logo](${logoUrl})\n\n` + result.content;
    }
    
    if (logoUrl && options?.hasSocial && !result.socialText?.includes(logoUrl)) {
      result.socialText += `\n\n[Attached Image: ${logoUrl}]`;
    }

    return {
      title: (result.title || `Industry Roundup: ${new Date().toLocaleDateString()}`).replace(/\*\*/g, "").substring(0, 145),
      summary: (result.summary || "").replace(/\*\*/g, "").replace(/#/g, ""),
      content: result.content || "",
      sourceUrl: result.sourceUrl || "",
      metaTitle: (result.metaTitle || result.title || "").replace(/\*\*/g, ""),
      metaDescription: result.metaDescription || "",
      tags: result.tags || "News, Updates",
      socialText: result.socialText || "",
    };
  } catch (error: any) {
    console.error(`[AI] Error from provider "${config.providerType}" model "${config.modelName}":`);
    console.error(`[AI] Message: ${error?.message}`);
    throw error;
  }
}
async function trackCost(providerType: string, model: string, inputTokens: number, outputTokens: number) {
  try {
    let inputRate = 5.0; // USD per million tokens
    let outputRate = 15.0; // USD per million tokens

    const m = model.toLowerCase();
    if (providerType === "openai") {
      if (m.includes("gpt-4o-mini")) {
        inputRate = 0.15;
        outputRate = 0.60;
      } else if (m.includes("gpt-4o")) {
        inputRate = 5.0;
        outputRate = 15.0;
      } else if (m.includes("gpt-4-turbo") || m.includes("gpt-4")) {
        inputRate = 10.0;
        outputRate = 30.0;
      } else if (m.includes("gpt-3.5")) {
        inputRate = 0.5;
        outputRate = 1.5;
      }
    } else if (providerType === "anthropic") {
      if (m.includes("claude-3-5-sonnet") || m.includes("sonnet")) {
        inputRate = 3.0;
        outputRate = 15.0;
      } else if (m.includes("haiku")) {
        inputRate = 0.25;
        outputRate = 1.25;
      } else if (m.includes("opus")) {
        inputRate = 15.0;
        outputRate = 75.0;
      }
    }

    const calculatedCost = (inputTokens * inputRate + outputTokens * outputRate) / 1000000;
    
    // Retrieve current spend
    const currentSpendSetting = await prisma.appSettings.findUnique({
      where: { key: "ai_spent_usd" }
    });
    const currentSpend = parseFloat(currentSpendSetting?.value || "0");
    const newSpend = currentSpend + calculatedCost;

    // Save back to DB
    await prisma.appSettings.upsert({
      where: { key: "ai_spent_usd" },
      update: { value: newSpend.toFixed(6) },
      create: { key: "ai_spent_usd", value: newSpend.toFixed(6) }
    });

    // Check limit
    const limitSetting = await prisma.appSettings.findUnique({
      where: { key: "ai_cost_limit" }
    });
    const limit = parseFloat(limitSetting?.value || "10.0"); // Default limit $10 USD
    
    if (newSpend >= limit) {
      await prisma.appSettings.upsert({
        where: { key: "ai_blocked" },
        update: { value: "true" },
        create: { key: "ai_blocked", value: "true" }
      });
      
      // Create a warning notification
      await prisma.notification.create({
        data: {
          title: "AI Cost Limit Reached",
          message: `Your total AI spending has reached $${newSpend.toFixed(2)} USD (Limit: $${limit.toFixed(2)} USD). Workflows have been soft-blocked.`,
          type: "WARNING"
        }
      });
    }

    console.log(`Estimated cost for this run: $${calculatedCost.toFixed(6)}. New total spend: $${newSpend.toFixed(6)}.`);
  } catch (error) {
    console.error("Error in cost tracking:", error);
  }
}
