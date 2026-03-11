import { test, expect } from '@playwright/test'

test.describe('Plan view - weekly calendar', () => {
  test('shows all 5 week days', async ({ page }) => {
    await page.goto('/plan')
    await page.waitForLoadState('networkidle')

    const pn = page.getByText(/Poniedziałek|^Pn$/).first()
    const pt = page.getByText(/Piątek|^Pt$/).first()
    await expect(pn).toBeVisible({ timeout: 10000 })
    await expect(pt).toBeVisible()
  })

  test('navigate to next week and back', async ({ page }) => {
    await page.goto('/plan')
    await page.waitForLoadState('networkidle')

    const dateSpan = page
      .locator('span')
      .filter({ hasText: /\d+-\d+\.\d+/ })
      .first()
    const initialText = await dateSpan.textContent()

    await page
      .locator('button')
      .filter({ has: page.locator('.material-symbols-outlined') })
      .filter({ hasText: 'chevron_right' })
      .first()
      .click()
    await page.waitForTimeout(300)

    const newText = await dateSpan.textContent()
    expect(newText).not.toBe(initialText)

    await page
      .locator('button')
      .filter({ has: page.locator('.material-symbols-outlined') })
      .filter({ hasText: 'chevron_left' })
      .first()
      .click()
    await page.waitForTimeout(300)

    const backText = await dateSpan.textContent()
    expect(backText).toBe(initialText)
  })

  test('empty day shows "Brak planu"', async ({ page }) => {
    await page.goto('/plan')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText('Brak planu').first()).toBeVisible({ timeout: 10000 })
  })

  test('settings link is visible in header', async ({ page }) => {
    await page.goto('/plan')
    await page.waitForLoadState('networkidle')

    const settingsLink = page.locator('a[href="/settings"]').first()
    await expect(settingsLink).toBeVisible()
  })

  test('navigates to swipe view from nav', async ({ page }) => {
    await page.goto('/plan')
    await page.waitForLoadState('networkidle')

    // Mobile nav: "Swipe", Desktop sidebar: "Propozycje" — click whichever is visible
    const mobileSwipe = page.locator('nav a[href="/swipe"]').first()
    await mobileSwipe.click()
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveURL(/\/swipe/)
  })
})
