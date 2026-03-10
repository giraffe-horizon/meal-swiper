import { chromium } from 'playwright'
import { mkdirSync } from 'fs'

mkdirSync('screenshots', { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage()
await page.setViewportSize({ width: 390, height: 844 })

const views = ['plan', 'swipe', 'shopping', 'cooking', 'settings']

for (const view of views) {
  try {
    await page.goto(`http://localhost:3000/${view}`, {
      waitUntil: 'networkidle',
      timeout: 15000,
    })
    await page.waitForTimeout(1500)
    await page.screenshot({ path: `screenshots/${view}.png` })
    console.log(`✓ screenshots/${view}.png`)
  } catch (e) {
    console.error(`✗ ${view}: ${e.message}`)
  }
}

await browser.close()
