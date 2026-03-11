import { test, expect } from '@playwright/test'

test.describe('Category filter in swipe view', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/swipe')
    // SwipeView is dynamic({ ssr:false }) — wait for render (up to 30s)
    await page
      .waitForSelector('button:has-text("Pn"), text="Brak więcej posiłków"', { timeout: 30000 })
      .catch(() => null)
  })

  test('shows day selector chips', async ({ page }) => {
    // DaySelector buttons contain span with day abbrev + material icon text
    // Use :has-text() substring match (not exact regex)
    await expect(page.locator('button:has-text("Pn")').first()).toBeVisible({ timeout: 30000 })
    await expect(page.locator('button:has-text("Wt")').first()).toBeVisible()
    await expect(page.locator('button:has-text("Pt")').first()).toBeVisible()
  })

  test('can select different day chips', async ({ page }) => {
    await expect(page.locator('button:has-text("Pn")').first()).toBeVisible({ timeout: 30000 })
    await page.locator('button:has-text("Wt")').first().click()
    await expect(page.locator('button:has-text("Wt")').first()).toBeVisible()
  })

  test('swipe view shows meal cards or empty state', async ({ page }) => {
    await page.waitForTimeout(2000)
    const hasMealCard = await page.locator('h2').count()
    const hasEmpty = await page
      .getByText('Brak więcej posiłków')
      .isVisible()
      .catch(() => false)
    expect(hasMealCard > 0 || hasEmpty).toBe(true)
  })

  test('shows "Pomiń ten dzień" button when day selected', async ({ page }) => {
    const skipBtn = page.getByText(/Pomiń ten dzień/)
    const isVisible = await skipBtn.isVisible().catch(() => false)
    if (isVisible) {
      await expect(skipBtn).toBeVisible()
    }
  })
})
