import Parser from 'rss-parser';

const parser = new Parser({
  customFields: {
    item: ['content:encoded', 'description']
  }
});

export interface RSSItem {
  title: string;
  link: string;
  content: string;
  pubDate: string;
}

export async function fetchFeeds(feedUrls: string[]): Promise<RSSItem[]> {
  const allItems: RSSItem[] = [];

  for (const url of feedUrls) {
    try {
      const feed = await parser.parseURL(url);
      feed.items.forEach(item => {
        allItems.push({
          title: item.title || '',
          link: item.link || '',
          content: item['content:encoded'] || item.content || item.description || '',
          pubDate: item.pubDate || new Date().toISOString()
        });
      });
    } catch (e) {
      console.error(`Failed to fetch RSS feed: ${url}`, e);
    }
  }

  // Sort by newest first
  return allItems.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
}
