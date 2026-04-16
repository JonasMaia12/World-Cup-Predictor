import { chromium } from '@playwright/test'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  width: 1200px;
  height: 630px;
  background: #0c0a00;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
.container { text-align: center; padding: 40px; }
.emoji { font-size: 96px; margin-bottom: 24px; display: block; }
h1 { color: #f59e0b; font-size: 64px; font-weight: 800; letter-spacing: -1px; line-height: 1.1; margin-bottom: 16px; }
p { color: #fef3c7; font-size: 28px; opacity: 0.8; }
</style>
</head>
<body>
<div class="container">
  <span class="emoji">⚽</span>
  <h1>World Cup Predictor 2026</h1>
  <p>Monte seu bracket e compartilhe com seus amigos</p>
</div>
</body>
</html>`

const browser = await chromium.launch()
const page = await browser.newPage()
await page.setViewportSize({ width: 1200, height: 630 })
await page.setContent(html, { waitUntil: 'networkidle' })
await page.screenshot({
  path: join(__dirname, '../public/og-image.png'),
  clip: { x: 0, y: 0, width: 1200, height: 630 },
})
await browser.close()
console.log('✓ public/og-image.png gerado')
