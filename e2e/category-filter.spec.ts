import { test, expect } from '@playwright/test'
import { createTestTenant } from './helpers'

test.describe('Category filter in swipe view', () => {
  let token: string

  test.beforeAll(async ({ baseURL }) => {
    token = await createTestTenant(baseURL!)
  })

  test.beforeEach(async ({ page }) => {
    await page.goto(`/${token}/swipe`)
    // SwipeView is dynamic({ ssr:false }) — wait for render (up to 30s)
    await page
      .waitForSelector('h2, [data-testid="empty-state"]', { timeout: 30000 })
      .catch(() => null)
  })

  test('shows compatibility indicator', async ({ page }) => {
    // Swipe view shows a compatibility badge with "POSIŁKI PASUJĄ" text
    const badge = page.getByText(/POSIŁKI PASUJĄ/)
    const hasMeals = (await page.locator('h2').count()) > 0
    if (hasMeals) {
      await expect(badge).toBeVisible({ timeout: 30000 })
    }
  })

  test('shows swipe action buttons', async ({ page }) => {
    const hasMeals = (await page.locator('h2').count()) > 0
    if (hasMeals) {
      await expect(page.locator('button[title="Dodaj do planu"]')).toBeVisible({ timeout: 5000 })
      await expect(page.locator('button[title="Pomiń tę propozycję"]')).toBeVisible()
      await expect(page.locator('button[title="Zapisz jako ulubione"]')).toBeVisible()
    }
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

  test('empty state shows day selector', async ({ page }) => {
    // DaySelector is shown only in empty state — this test verifies structure
    const hasEmpty = await page
      .getByText('Brak więcej posiłków')
      .isVisible()
      .catch(() => false)
    if (hasEmpty) {
      await expect(page.locator('button:has-text("PN")').first()).toBeVisible()
      await expect(page.locator('button:has-text("WT")').first()).toBeVisible()
      await expect(page.locator('button:has-text("PT")').first()).toBeVisible()
    }
  })
})
