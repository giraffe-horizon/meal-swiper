import { test, expect } from '@playwright/test'
import { createTestTenant } from './helpers'

test.describe('Plan view - weekly calendar', () => {
  let token: string

  test.beforeAll(async ({ baseURL }) => {
    token = await createTestTenant(baseURL!)
  })

  test('shows all 5 week days', async ({ page }) => {
    await page.goto(`/${token}/plan`)
    await page.waitForLoadState('domcontentloaded')

    const pn = page.getByText(/Poniedziałek|^Pn$/).first()
    const pt = page.getByText(/Piątek|^Pt$/).first()
    await expect(pn).toBeVisible({ timeout: 10000 })
    await expect(pt).toBeVisible()
  })

  test('navigate to next week and back', async ({ page }) => {
    await page.goto(`/${token}/plan`)
    await page.waitForLoadState('domcontentloaded')

    // Week range is now displayed as "16 - 20 Marca" format in CalendarView header
    const dateHeading = page
      .locator('h2')
      .filter({ hasText: /\d+\s*-\s*\d+/ })
      .first()
    await expect(dateHeading).toBeVisible({ timeout: 10000 })
    const initialText = await dateHeading.textContent()

    await page
      .locator('button')
      .filter({ has: page.locator('.material-symbols-outlined') })
      .filter({ hasText: 'chevron_right' })
      .first()
      .click()
    await page.waitForTimeout(300)

    const newText = await dateHeading.textContent()
    expect(newText).not.toBe(initialText)

    await page
      .locator('button')
      .filter({ has: page.locator('.material-symbols-outlined') })
      .filter({ hasText: 'chevron_left' })
      .first()
      .click()
    await page.waitForTimeout(300)

    const backText = await dateHeading.textContent()
    expect(backText).toBe(initialText)
  })

  test('empty day shows add meal button', async ({ page }) => {
    await page.goto(`/${token}/plan`)
    await page.waitForLoadState('domcontentloaded')

    await expect(page.getByText('Dodaj posiłek').first()).toBeVisible({ timeout: 10000 })
  })

  test('settings link is visible in navigation', async ({ page }) => {
    await page.goto(`/${token}/plan`)
    await page.waitForLoadState('domcontentloaded')

    const settingsLink = page.locator('nav a[href*="/settings"]').first()
    await expect(settingsLink).toBeVisible()
  })

  test('navigates to swipe view from nav', async ({ page }) => {
    await page.goto(`/${token}/plan`)
    await page.waitForLoadState('domcontentloaded')

    // Mobile nav: "Swipe", Desktop sidebar: "Propozycje" — click whichever is visible
    const mobileSwipe = page.locator('nav a[href*="/swipe"]').first()
    await mobileSwipe.click()
    await page.waitForLoadState('domcontentloaded')

    await expect(page).toHaveURL(/\/swipe/)
  })
})
