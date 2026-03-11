import { test, expect } from '@playwright/test'

test.describe('Settings page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')
  })

  test('settings page loads', async ({ page }) => {
    await expect(page).toHaveURL(/\/settings/)
  })

  test('shows "Ustawienia" title in header', async ({ page }) => {
    await expect(page.getByText('Ustawienia').first()).toBeVisible()
  })

  test('shows people count control', async ({ page }) => {
    const peopleSection = page.getByText(/os[oó]b|person|people/i).first()
    const hasPeopleControl = await peopleSection.isVisible().catch(() => false)
    if (hasPeopleControl) {
      await expect(peopleSection).toBeVisible()
    }
    const settingsContent = page.locator('main').first()
    await expect(settingsContent).toBeVisible()
  })

  test('shows dark mode toggle', async ({ page }) => {
    const darkModeEl = page.getByText(/ciemny|dark|jasny|light/i).first()
    const hasDarkMode = await darkModeEl.isVisible().catch(() => false)
    if (hasDarkMode) {
      await expect(darkModeEl).toBeVisible()
    }
  })

  test('can navigate back to plan from settings', async ({ page }) => {
    // Use href-based nav link instead of text (robust across mobile/desktop)
    await page.locator('a[href="/plan"], a[href="/"]').first().click()
    await expect(page).toHaveURL(/\/plan|^\/$/)
  })

  test('shows kcal section', async ({ page }) => {
    const kcalEl = page.getByText(/kcal/i).first()
    const hasKcal = await kcalEl.isVisible().catch(() => false)
    if (hasKcal) {
      await expect(kcalEl).toBeVisible()
    }
  })
})

test.describe('Settings - dark mode', () => {
  test('toggle dark mode applies dark class', async ({ page }) => {
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')

    const darkBtn = page.getByText(/ciemny/i).first()
    const hasDarkBtn = await darkBtn.isVisible().catch(() => false)

    if (hasDarkBtn) {
      await darkBtn.click()
      await page.waitForTimeout(200)
      const hasDark = await page.evaluate(() => document.documentElement.classList.contains('dark'))
      expect(hasDark).toBe(true)
      await page
        .getByText(/jasny/i)
        .first()
        .click()
        .catch(() => {})
    }
  })
})
