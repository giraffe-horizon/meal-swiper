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

    // Week range heading (e.g. "23 - 27 Mar")
    const dateHeading = page.locator('h2').first()
    await expect(dateHeading).toBeVisible({ timeout: 10000 })
    const initialText = (await dateHeading.textContent())!

    // Navigate to next week
    await page.getByRole('button', { name: 'chevron_right' }).first().click()

    // Wait for the week number indicator to change (more stable than heading text)
    await expect(dateHeading).not.toHaveText(initialText, { timeout: 10000 })
    const newText = await dateHeading.textContent()
    expect(newText).not.toBe(initialText)

    // Navigate back
    await page.getByRole('button', { name: 'chevron_left' }).first().click()

    // Wait for heading to return to initial text
    await expect(dateHeading).toHaveText(initialText, { timeout: 10000 })
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
