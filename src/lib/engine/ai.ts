import { RSSItem } from './rss';
import { getDecryptedKey } from '../crypto/api-keys';

export async function generateBlogPost(items: RSSItem[], provider: any): Promise<{ title: string; content: string }> {
  // If no items, fallback
  if (items.length === 0) {
    throw new Error("No RSS items provided to AI.");
  }

  const decryptedApiKey = getDecryptedKey(provider.apiKey);

  // Build the prompt context
  const context = items.slice(0, 15).map(item => `Title: ${item.title}\nLink: ${item.link}\nContent: ${item.content.substring(0, 500)}...\n`).join("\n---\n");

  const systemPrompt = `You are an expert tech blogger. Your job is to read the latest news items provided, identify the most important overarching story or trend, and write a compelling, comprehensive blog post. 
Format your output strictly in Markdown. 
Start with a single # H1 header as the Title of the blog post. 
Then write the body of the post. Do not include any other conversational text.`;

  const userPrompt = `Here are the latest news items:\n\n${context}\n\nPlease write the blog post.`;

  let title = "Generated Blog Post";
  let content = "Content generation failed.";

  if (provider.type === "openai" || provider.type === "openrouter" || provider.type === "deepseek") {
    let baseUrl = "https://api.openai.com/v1/chat/completions";
    if (provider.type === "openrouter") baseUrl = "https://openrouter.ai/api/v1/chat/completions";
    if (provider.type === "deepseek") baseUrl = "https://api.deepseek.com/v1/chat/completions";

    const res = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${decryptedApiKey}`
      },
      body: JSON.stringify({
        model: provider.modelName || (provider.type === "openai" ? "gpt-4o" : "auto"),
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7
      })
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`AI Provider Error (${provider.type}): ${err}`);
    }

    const data = await res.json();
    const rawMarkdown = data.choices[0]?.message?.content || "";
    
    // Extract title from first H1
    const lines = rawMarkdown.split("\n");
    if (lines[0].startsWith("# ")) {
      title = lines[0].replace("# ", "").trim();
      content = lines.slice(1).join("\n").trim();
    } else {
      content = rawMarkdown.trim();
    }
  } else if (provider.type === "anthropic") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": decryptedApiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: provider.modelName || "claude-3-opus-20240229",
        max_tokens: 2000,
        system: systemPrompt,
        messages: [
          { role: "user", content: userPrompt }
        ]
      })
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic Error: ${err}`);
    }

    const data = await res.json();
    const rawMarkdown = data.content[0]?.text || "";

    const lines = rawMarkdown.split("\n");
    if (lines[0].startsWith("# ")) {
      title = lines[0].replace("# ", "").trim();
      content = lines.slice(1).join("\n").trim();
    } else {
      content = rawMarkdown.trim();
    }
  } else {
    throw new Error(`Unsupported AI provider: ${provider.type}`);
  }

  return { title, content };
}
