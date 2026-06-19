import Parser from "rss-parser";
import crypto from "crypto";
import { prisma } from "../db/client";

const parser = new Parser();

export async function fetchRssForWorkflow(workflowId: string) {
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    include: { feeds: true },
  });

  if (!workflow || !workflow.feeds.length) {
    console.log(`[FETCHER] No feeds configured for workflow ${workflowId}`);
    return [];
  }

  const brandNewItems = [];
  const feedIds = workflow.feeds.map(f => f.id);

  for (const feedConfig of workflow.feeds) {
    try {
      console.log(`[FETCHER] Fetching RSS feed: ${feedConfig.url}`);
      const feed = await parser.parseURL(feedConfig.url);
      console.log(`[FETCHER] Feed loaded: "${feed.title}" — ${feed.items.length} item(s)`);

      for (const item of feed.items) {
        if (!item.link) continue;

        // Skip YouTube links if strict filtering is enabled
        if (workflow.enableStrictFiltering && (item.link.includes('youtube.com') || item.link.includes('youtu.be'))) {
          console.log(`[FETCHER] Skipping YouTube video link: ${item.link}`);
          continue;
        }

        // Check if it already exists by URL
        const exists = await prisma.rssItem.findUnique({
          where: { itemUrl: item.link },
        });

        if (!exists) {
          const newItem = await prisma.rssItem.create({
            data: {
              feedId: feedConfig.id,
              itemUrl: item.link,
              title: item.title || "No Title",
              snippet: item.contentSnippet || item.content || "",
              source: feed.title || "",
              publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
            },
          });
          brandNewItems.push(newItem);
        }
      }
    } catch (error) {
      console.error(`[FETCHER] Error fetching feed ${feedConfig.url}:`, error);
    }
  }

  console.log(`[FETCHER] Brand-new items from RSS: ${brandNewItems.length}`);

  // Also pick up any UNPROCESSED items from previous failed/skipped runs
  const leftoverItems = await prisma.rssItem.findMany({
    where: {
      feedId: { in: feedIds },
      processed: false,
      // Exclude items we just created (they're already in brandNewItems)
      id: { notIn: brandNewItems.map(i => i.id) },
    },
    orderBy: { publishedAt: "desc" },
    take: 20,
  });

  console.log(`[FETCHER] Leftover unprocessed items from previous runs: ${leftoverItems.length}`);

  const allItems = [...brandNewItems, ...leftoverItems];
  console.log(`[FETCHER] Total items to process: ${allItems.length}`);
  return allItems;
}

