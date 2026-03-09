import { test, expect } from '@playwright/test'

test.describe('Smoke tests', () => {
  test('page loads with 200 OK', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.status()).toBe(200)
  })

  test('no JS console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    expect(errors).toEqual([])
  })

  test('no failed network requests', async ({ page }) => {
    const failedRequests: string[] = []
    page.on('requestfailed', (req) => {
      failedRequests.push(`${req.method()} ${req.url()} - ${req.failure()?.errorText}`)
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    expect(failedRequests).toEqual([])
  })
})
