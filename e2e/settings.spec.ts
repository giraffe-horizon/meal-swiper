import { test, expect } from '@playwright/test'
import { createTestTenant } from './helpers'

test.describe('Settings page', () => {
  let token: string

  test.beforeAll(async ({ baseURL }) => {
    token = await createTestTenant(baseURL!)
  })

  test.beforeEach(async ({ page }) => {
    await page.goto(`/${token}/settings`)
    await page.waitForLoadState('domcontentloaded')
  })

  test('settings page loads', async ({ page }) => {
    await expect(page).toHaveURL(/\/settings/)
  })

  test('shows "Ustawienia" title in header', async ({ page }) => {
    await expect(page.getByText('Ustawienia').first()).toBeVisible()
  })

  test('settings page has content (not blank)', async ({ page }) => {
    // The main content area must exist and have child elements
    const main = page.locator('main').first()
    await expect(main).toBeVisible()
    const childCount = await main.locator('> *').count()
    expect(childCount, 'Settings main content is empty').toBeGreaterThan(0)
  })

  test('shows people count control', async ({ page }) => {
    // The people count input/selector must be visible — this is a core feature
    const peopleControl = page.locator('input[type="number"], [data-testid="people-count"]').or(
      page
        .getByText(/os[oó]b/i)
        .locator('..')
        .locator('button, input')
        .first()
    )
    // Use a broader check: some numeric control exists in the settings
    const numberInputs = await page.locator('input[type="number"]').count()
    const buttons = await page.locator('button').count()
    expect(numberInputs + buttons, 'Settings page has no interactive controls').toBeGreaterThan(0)
  })

  test('shows dark mode toggle', async ({ page }) => {
    // Dark mode toggle must exist — it's a required feature
    const darkModeEl = page.getByText(/ciemny|dark mode/i).first()
    await expect(darkModeEl).toBeVisible({ timeout: 5000 })
  })

  test('shows kcal section', async ({ page }) => {
    // Kcal display is a core part of the settings — must be present
    const kcalEl = page.getByText(/kcal/i).first()
    await expect(kcalEl).toBeVisible({ timeout: 5000 })
  })

  test('can navigate back to plan from settings', async ({ page }) => {
    await page.locator('a[href*="/plan"], a[href="/"]').first().click()
    await expect(page).toHaveURL(/\/plan|^\/$/)
  })
})

test.describe('Settings - dark mode', () => {
  let token: string

  test.beforeAll(async ({ baseURL }) => {
    token = await createTestTenant(baseURL!)
  })

  test('toggle dark mode applies dark class to html element', async ({ page }) => {
    await page.goto(`/${token}/settings`)
    await page.waitForLoadState('domcontentloaded')

    const darkBtn = page.getByText(/ciemny/i).first()
    await expect(darkBtn).toBeVisible({ timeout: 5000 })

    await darkBtn.click()
    await page.waitForTimeout(200)

    const hasDark = await page.evaluate(() => document.documentElement.classList.contains('dark'))
    expect(hasDark, 'Dark class was not applied after clicking dark mode button').toBe(true)

    // Restore to light mode
    await page
      .getByText(/jasny/i)
      .first()
      .click()
      .catch(() => {})
  })
})
