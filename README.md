This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## 🤖 AI Content Pipeline Architecture

### The Core Goal
A self-contained, fully autonomous Content Automation Pipeline that monitors news, curates the best stories using AI, writes blog posts, generates branded images, and cross-posts to social media—all without relying on third-party automation tools like n8n or Zapier.

### The "Workflows" Architecture
The system is highly flexible, built around **Workflows**. Instead of just one massive daily run, you can configure multiple independent pipelines.
For example, you could have:
*   **Workflow A**: Fetches *AI News* RSS feeds ➔ Posts to *Tech Blog CMS* & *Tech LinkedIn*.
*   **Workflow B**: Fetches *Healthcare News* RSS feeds ➔ Posts to a *Medical WordPress* & *Different Twitter Account*.

**Every Workflow consists of:**
1.  **Schedule:** A cron timer (e.g., daily at 8:00 AM) dictating when it runs.
2.  **Feeds (Inputs):** One or multiple Google Alerts RSS URLs to scrape.
3.  **Integrations (Outputs):** Specific connected accounts (Payload CMS, WordPress, LinkedIn, X) where the final content should be published.

### Detailed Step-by-Step Execution Flow
Here is the exact chronological sequence of how the system operates from start to finish:

1. **Step 1: Configuration & Inputs**
   - The user adds one or multiple **Google Alerts RSS feed URLs** to a Workflow.
   - The user connects **Destination Accounts** (Payload CMS, WordPress, LinkedIn, Twitter/X) to that Workflow.
   - The user sets a **Cron Schedule** (e.g., daily at 8:00 AM).

2. **Step 2: Trigger & Ingestion**
   - The cron timer hits (or the user clicks "Run Now").
   - The `fetcher.ts` script fetches the XML from all configured RSS feeds.
   - It extracts the titles, snippets, links, and dates of the news stories.

3. **Step 3: Deduplication**
   - Every story URL is hashed using SHA-256.
   - The database is checked. If the hash exists, the story is skipped. If it's new, it is saved for processing. If there are no new stories, the workflow safely exits.

4. **Step 4: AI Curation & Content Generation**
   - The new stories are sent to the AI API (OpenAI or Claude).
   - The AI acts as a journalist: it groups similar stories, selects the Top 5 most important ones, and writes a cohesive, human-readable blog post.
   - The AI also generates short, engaging social media snippets (respecting character limits) and SEO metadata.

5. **Step 5: Automated Image Generation**
   - A local, headless browser instance (Playwright) is launched.
   - It loads a beautifully styled, custom HTML template.
   - The generated blog headline and date are dynamically injected into the template.
   - Playwright takes a high-resolution `.png` screenshot of this HTML card and saves it to the local storage or AWS S3.

6. **Step 6: Blog Publishing**
   - The system makes an authenticated REST API call to your CMS (Payload or WordPress).
   - It uploads the final Blog Post text, the SEO metadata, and the newly generated PNG image.
   - The CMS returns the live URL of the published blog post.

7. **Step 7: Social Media Cross-Posting**
   - Using the live blog URL and the AI-generated snippets, the system calls the LinkedIn API v2 and X (Twitter) API v2.
   - It posts the short summary, attaches the image, and links back to the newly published blog.

8. **Step 8: Logging & Completion**
   - The workflow marks the run as `SUCCESS`.
   - All actions, errors, and returned post URLs are saved in the database, viewable directly from the Next.js Admin Dashboard.

### The Admin Dashboard
To manage all of this, the platform includes a **Next.js 14 Web Dashboard** backed by a database (SQLite/PostgreSQL) and secured by a custom JWT login system. 

Through this interface, you can:
*   Add new RSS feeds and Integrations (API keys).
*   Create, pause, or manually trigger workflows.
*   View a complete audit log of what the AI generated, what succeeded, and what failed (with the ability to retry).
