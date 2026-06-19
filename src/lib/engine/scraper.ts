import { chromium } from "playwright";

export async function fetchFullContent(url: string): Promise<string | null> {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    // Wait until network is idle to capture dynamic content, but set a timeout to avoid hanging
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
    
    // Attempt to extract meaningful article text, ignoring navbars/footers if possible
    // We fall back to the raw body innerText if readability-like extraction fails.
    const text = await page.evaluate(() => {
      const article = document.querySelector('article') || document.querySelector('main') || document.body;
      return article ? article.innerText.substring(0, 8000) : null;
    });

    return text || null;
  } catch (error) {
    console.warn(`[Scraper] Failed to fetch full content for ${url}:`, error);
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
