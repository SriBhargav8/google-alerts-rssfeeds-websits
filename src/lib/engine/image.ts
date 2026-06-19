import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

export async function generateHeroImage(title: string, runId: string, logoUrl?: string | null): Promise<string> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 }
  });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;800&display=swap" rel="stylesheet">
        <style>
          body {
            margin: 0;
            padding: 0;
            width: 1200px;
            height: 630px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #4f46e5 0%, #10b981 100%);
            font-family: 'Inter', sans-serif;
            color: white;
            text-align: center;
            padding: 80px;
            box-sizing: border-box;
          }
          .container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            border-radius: 40px;
            padding: 60px;
            border: 2px solid rgba(255,255,255,0.2);
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
          }
          h1 {
            font-size: 72px;
            font-weight: 800;
            line-height: 1.1;
            margin: 0;
            text-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .logo {
            max-height: 80px;
            max-width: 300px;
            margin-bottom: 30px;
            object-fit: contain;
          }
        </style>
      </head>
      <body>
        <div class="container">
          ${logoUrl ? `<img src="${logoUrl}" class="logo" />` : ''}
          <h1>${title}</h1>
        </div>
      </body>
    </html>
  `;

  await page.setContent(html);

  const publicDir = path.join(process.cwd(), 'public', 'generated');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const fileName = `hero-${runId}.png`;
  const filePath = path.join(publicDir, fileName);

  await page.screenshot({ path: filePath });
  await browser.close();

  return `/generated/${fileName}`;
}
