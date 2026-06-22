import { prisma } from "../db/client";
import { fetchRssForWorkflow } from "./fetcher";
import { clusterItemsAndGeneratePost, scoreAndClusterItems } from "./ai";
import { publishToCMS, publishToSocial } from "./publish";
import { generateHeroImage } from "../engine/image";
import { fetchFullContent } from "../engine/scraper";

// ─── Timeline helpers ──────────────────────────────────────────────────────────

type LogLevel = "info" | "success" | "error" | "warning";
type LogEntry = { step: string; message: string; level: LogLevel; ts: string; data?: any };

function makeLogger(runId: string) {
  const entries: LogEntry[] = [];

  async function log(step: string, message: string, level: LogLevel = "info", data?: any) {
    const entry: LogEntry = { step, message, level, ts: new Date().toISOString(), ...(data ? { data } : {}) };
    entries.push(entry);
    console.log(`[${level.toUpperCase()}] [${step}] ${message}`);
    // Flush to DB after every event so the UI shows real-time progress
    await prisma.workflowRun.update({
      where: { id: runId },
      data: { logs: JSON.stringify(entries) },
    });
  }

  return { log, entries };
}

// ──────────────────────────────────────────────────────────────────────────────

export async function runWorkflow(workflowId: string, existingRunId?: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[PIPELINE] Starting workflow: ${workflowId}`);
  console.log(`${'='.repeat(60)}`);

  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    include: { destinations: { include: { integration: true } } },
  });

  if (!workflow) throw new Error("Workflow not found");
  console.log(`[PIPELINE] Loaded workflow: "${workflow.name}"`);

  const run = existingRunId
    ? await prisma.workflowRun.findUniqueOrThrow({ where: { id: existingRunId } })
    : await prisma.workflowRun.create({
        data: { workflowId: workflow.id, status: "RUNNING" },
      });

  const { log } = makeLogger(run.id);
  const startedAt = Date.now();

  await log("Started", `Workflow "${workflow.name}" started.`, "info");

  try {
    // ── Step 1: Fetch RSS ────────────────────────────────────────────────────
    await log("Fetch RSS", "Fetching new items from RSS feeds...", "info");
    const newItems = await fetchRssForWorkflow(workflow.id);
    
    if (newItems.length === 0) {
      await log("Fetch RSS", "No new RSS items found. Skipping.", "warning");
      await prisma.workflowRun.update({
        where: { id: run.id },
        data: {
          status: "SUCCESS",
          completedAt: new Date(),
          durationMs: Date.now() - startedAt,
          errorLog: "No new items found.",
        },
      });
      await prisma.notification.create({
        data: {
          title: "Workflow Run Completed",
          message: `Workflow "${workflow.name}" completed. No new RSS items found.`,
          type: "INFO",
          workflowId: workflow.id,
          runId: run.id,
        },
      });
      return;
    }

    await log("Fetch RSS", `Found ${newItems.length} item(s) in feeds.`, "info");

    // ── Step 1.5: Relevance Filter & Clustering ──────────────────────────────
    await log("Relevance Filter", "Scoring and clustering items based on relevance and recency...", "info");
    const { selectedItems, skippedItemIds } = await scoreAndClusterItems(
      newItems,
      workflow.name,
      workflow.aiProviderId,
      workflow.enableStrictFiltering
    );

    if (selectedItems.length === 0) {
      await log("Relevance Filter", "No relevant items selected after filtering. Skipping.", "warning");
      // Mark all fetched items as processed to clear them
      await prisma.rssItem.updateMany({
        where: { id: { in: newItems.map((i: any) => i.id) } },
        data: { processed: true },
      });
      await prisma.workflowRun.update({
        where: { id: run.id },
        data: {
          status: "SUCCESS",
          completedAt: new Date(),
          durationMs: Date.now() - startedAt,
          errorLog: "No relevant items found after filtering.",
        },
      });
      await prisma.notification.create({
        data: {
          title: "Workflow Run Completed",
          message: `Workflow "${workflow.name}" completed. No relevant items found after filtering.`,
          type: "INFO",
          workflowId: workflow.id,
          runId: run.id,
        },
      });
      return;
    }

    await log("Relevance Filter", `Selected ${selectedItems.length} top-scoring unique item(s) to process. Skipped ${skippedItemIds.length} duplicate/low-score item(s).`, "success", {
      selectedCount: selectedItems.length,
      skippedCount: skippedItemIds.length
    });

    // ── Step 1.75: Full-Text Scraping ────────────────────────────────────────
    await log("Full-Text Scraping", "Scraping full content for selected items...", "info");
    for (const item of selectedItems) {
        let snippet = "";
        
        if (workflow.scrapeFullContent && item.itemUrl) {
          console.log(`[Pipeline] Full-Text Scraping ON: Fetching full content for ${item.itemUrl}`);
          try {
            const fullContent = await fetchFullContent(item.itemUrl);
            if (fullContent && fullContent.trim().length > 100) {
              snippet = fullContent.trim();
              console.log(`[Pipeline] Successfully extracted ${snippet.length} characters of full text.`);
            } else {
              console.log(`[Pipeline] Scraped content was too short or empty. Falling back to RSS snippet.`);
              snippet = item.snippet || "";
            }
          } catch (scrapeErr: any) {
            console.error(`[Pipeline] Error scraping ${item.itemUrl}: ${scrapeErr.message}. Falling back to snippet.`);
            snippet = item.snippet || "";
          }
        } else {
          snippet = item.snippet || "";
        }
        (item as any).snippet = snippet;
    }

    // ── Step 2 & 3 & 4: AI Content Generation & Publish ───────────────────────
    const destTypes = workflow.destinations.map(d => d.integration.type.toUpperCase());
    const hasWebsite = destTypes.some(t => ["WORDPRESS", "GHOST", "PAYLOADCMS"].includes(t));
    const hasSocial  = destTypes.some(t => ["TWITTER", "LINKEDIN"].includes(t));

    const generationMode = workflow.generationMode || "ROUNDUP";
    const maxIndividualPosts = workflow.maxIndividualPosts || 5;

    let successCount = 0;
    let failCount = 0;

    const processPost = async (items: any[], isRoundup: boolean) => {
      const modeText = isRoundup ? "Roundup" : "Individual";
      await log("AI Generation", `Generating ${modeText} content via AI (website: ${hasWebsite}, social: ${hasSocial})...`, "info");

      let aiError: string | null = null;
      const generated = await clusterItemsAndGeneratePost(
        items,
        workflow.logoUrl,
        { hasWebsite, hasSocial, includeSourceLink: workflow.includeSourceLink, isRoundup },
        workflow.aiProviderId,
        workflow.systemPrompt
      ).catch((err: any) => {
        aiError = err?.message || String(err);
        return null;
      });

      if (!generated) {
        await log("AI Generation", `AI failed for ${modeText}: ${aiError}`, "error");
        failCount++;
        return false;
      }

      // Do not attach a single source link to a roundup master post
      if (isRoundup) {
        generated.sourceUrl = null;
      }

      await log("AI Generation", `${modeText} Content generated: "${generated.title}"`, "success", {
        title: generated.title,
        metaTitle: generated.metaTitle,
        tags: generated.tags,
      });

      // ── Step 2.5: Hero Image ──────────────────────────────────────────────────
      let imagePath = "";
      if (workflow.generateImages) {
        await log("Hero Image", "Generating hero image...", "info");
        try {
          imagePath = await generateHeroImage(generated.title, run.id, workflow.logoUrl);
          await log("Hero Image", `Image generated: ${imagePath}`, "success", { path: imagePath });
        } catch (e: any) {
          await log("Hero Image", `Image generation skipped: ${e.message}`, "warning");
        }
      }

      // ── Step 3: Publish to CMS ────────────────────────────────────────────────
      let liveCmsUrl = "";
      for (const dest of workflow.destinations) {
        const type = dest.integration.type.toUpperCase();
        if (hasWebsite && ["WORDPRESS", "PAYLOADCMS", "GHOST"].includes(type)) {
          await log("Publish CMS", `Publishing to ${type}...`, "info");
          try {
            liveCmsUrl = await publishToCMS(dest.integration, dest.config || null, generated, imagePath, workflow.cmsContentFormat, workflow.useNofollowLinks);
            await log("Publish CMS", `Published to ${type}. Live URL: ${liveCmsUrl}`, "success", { url: liveCmsUrl });
          } catch (e: any) {
            await log("Publish CMS", `${type} publish failed: ${e.message}`, "error");
            throw new Error(`Failed to publish to ${type} CMS: ${e.message}`);
          }
        }
      }

      const blogPost = await prisma.blogPost.create({
        data: {
          runId: run.id,
          title: generated.title,
          summary: generated.summary,
          content: generated.content,
          metaTitle: generated.metaTitle,
          metaDescription: generated.metaDescription,
          tags: generated.tags,
          status: liveCmsUrl ? "PUBLISHED" : "DRAFT",
          cmsUrl: liveCmsUrl || null,
          imagePath: imagePath || null,
        },
      });
      await log("Save Post", `Blog post saved (status: ${blogPost.status})`, "success");

      // ── Step 4: Publish to Social ─────────────────────────────────────────────
      for (const dest of workflow.destinations) {
        const type = dest.integration.type.toUpperCase();
        if (["LINKEDIN", "TWITTER"].includes(type)) {
          await log("Publish Social", `Posting to ${type}...`, "info");
          let postUrl = "";
          let socialStatus = "PENDING";
          let socialError = null;

          try {
            postUrl = await publishToSocial(dest.integration, generated.socialText, liveCmsUrl);
            socialStatus = "PUBLISHED";
            await log("Publish Social", `Posted to ${type}: ${postUrl}`, "success", { url: postUrl });
          } catch (e: any) {
            socialStatus = "FAILED";
            socialError = e.message;
            await log("Publish Social", `${type} post failed: ${e.message}`, "error");
            throw new Error(`Failed to publish to ${type} Social: ${e.message}`);
          }

          await prisma.socialPost.create({
            data: {
              blogPostId: blogPost.id,
              runId: run.id,
              platform: type,
              status: socialStatus,
              postUrl: postUrl || null,
              error: socialError,
            },
          });
        }
      }
      
      successCount++;
      return true;
    };

    if (generationMode === "ROUNDUP" || generationMode === "BOTH") {
      await processPost(selectedItems, true);
    }
    
    if (generationMode === "INDIVIDUAL" || generationMode === "BOTH") {
      const topItems = selectedItems.slice(0, maxIndividualPosts);
      for (const item of topItems) {
        await processPost([item], false);
      }
    }

    if (successCount === 0 && failCount > 0) {
      throw new Error(`All ${failCount} post generation attempts failed.`);
    }

    // ── Step 5: Complete ──────────────────────────────────────────────────────
    await log("Complete", "Workflow finished successfully! 🎉", "success");
    await prisma.workflowRun.update({
      where: { id: run.id },
      data: {
        status: "SUCCESS",
        completedAt: new Date(),
        durationMs: Date.now() - startedAt,
        errorLog: null,
      },
    });
    await prisma.notification.create({
      data: {
        title: "Workflow Run Succeeded",
        message: `Workflow "${workflow.name}" finished. Generated ${successCount} post(s).`,
        type: "SUCCESS",
        workflowId: workflow.id,
        runId: run.id,
      },
    });

    // Mark RSS items as processed
    await prisma.rssItem.updateMany({
      where: { id: { in: newItems.map((i: any) => i.id) } },
      data: { processed: true },
    });

    console.log(`${'='.repeat(60)}`);
    console.log(`[PIPELINE] Run ${run.id} finished successfully in ${Date.now() - startedAt}ms.`);
    console.log(`${'='.repeat(60)}\n`);

  } catch (error: any) {
    console.error(`[PIPELINE] Unhandled error in run ${run.id}:`, error);
    await log("Error", error.message, "error").catch(() => {});
    await prisma.workflowRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        durationMs: Date.now() - startedAt,
        errorLog: error.message,
      },
    });
    await prisma.notification.create({
      data: {
        title: "Workflow Run Failed",
        message: `Workflow "${workflow.name}" failed: ${error.message}`,
        type: "ERROR",
        workflowId: workflow.id,
        runId: run.id,
      },
    });
  }
}
