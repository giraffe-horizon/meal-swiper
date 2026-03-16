import { test, expect } from '@playwright/test'

test.describe('Smoke tests', () => {
  test('page loads with 200 OK', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.status()).toBe(200)
  })

  test('CSS is loaded and applied (styles are not broken)', async ({ page }) => {
    const errors: string[] = []
    page.on('requestfailed', (req) => {
      const url = req.url()
      if (url.includes('/_next/static/') && url.includes('.css')) {
        errors.push(`CSS failed: ${url} — ${req.failure()?.errorText}`)
      }
    })

    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    // Verify at least one stylesheet is loaded
    const sheetCount = await page.evaluate(() => document.styleSheets.length)
    expect(sheetCount, 'No stylesheets loaded — CSS likely 404').toBeGreaterThan(0)

    expect(errors, 'CSS requests failed').toEqual([])
  })

  test('static assets (CSS/JS) return 200', async ({ request }) => {
    // Fetch the HTML to get the actual CSS/JS URLs from this build
    const html = await request.get('/')
    const body = await html.text()

    const cssMatches = body.match(/\/_next\/static\/chunks\/[^"']+\.css/g) ?? []
    const jsMatches = (body.match(/\/_next\/static\/chunks\/[^"']+\.js(?![^"'])/g) ?? []).slice(
      0,
      3
    ) // check first 3 JS files

    const toCheck = [...new Set([...cssMatches, ...jsMatches])]
    expect(toCheck.length, 'No static asset URLs found in HTML').toBeGreaterThan(0)

    for (const assetPath of toCheck) {
      const res = await request.get(assetPath)
      expect(res.status(), `Static asset ${assetPath} returned ${res.status()}`).toBe(200)
    }
  })

  test('no critical JS console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text()
        if (
          !text.includes('favicon') &&
          !text.includes('hot-update') &&
          !text.includes('chrome-extension') &&
          !text.includes('Failed to load resource') &&
          !text.includes('net::ERR_') &&
          !text.includes('ERR_BLOCKED')
        ) {
          errors.push(text)
        }
      }
    })

    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    const criticalErrors = errors.filter(
      (e) => e.includes('SyntaxError') || e.includes('TypeError') || e.includes('React')
    )
    expect(criticalErrors).toEqual([])
  })

  test('no failed critical network requests', async ({ page }) => {
    const failedRequests: string[] = []
    page.on('requestfailed', (req) => {
      const url = req.url()
      if (url.includes('localhost')) {
        failedRequests.push(`${req.method()} ${url} - ${req.failure()?.errorText}`)
      }
    })

    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    expect(failedRequests).toEqual([])
  })
})
