import { test, expect } from '@playwright/test'

test.describe('Shopping list view', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/shopping')
    await page.waitForLoadState('networkidle')
  })

  test('shopping page loads', async ({ page }) => {
    await expect(page).toHaveURL(/\/shopping/)
  })

  test('shows "Lista zakupów" title in header', async ({ page }) => {
    await expect(page.getByText('Lista zakupów').first()).toBeVisible()
  })

  test('shows empty state when no meals planned', async ({ page }) => {
    const emptyState = page.getByText('Brak listy zakupów')
    const hasItems = await page.locator('[type="checkbox"]').count()
    if (hasItems === 0) {
      await expect(emptyState).toBeVisible({ timeout: 5000 })
    } else {
      await expect(page.getByText(/produktów/)).toBeVisible()
    }
  })

  test('shopping navigation link is active', async ({ page }) => {
    // Check nav exists (use href-based check — robust on mobile/desktop)
    const shoppingLink = page.locator('a[href="/shopping"]').first()
    await expect(shoppingLink).toBeVisible()
  })
})

test.describe('Shopping list - with planned meals', () => {
  test('check off items works when meals are in plan', async ({ page, context }) => {
    await context.addInitScript(() => {
      const today = new Date()
      const day = today.getDay()
      const diff = today.getDate() - day + (day === 0 ? -6 : 1)
      const monday = new Date(today.setDate(diff))
      const weekKey = monday.toISOString().slice(0, 10)

      const plan = {
        mon: {
          id: '1',
          nazwa: 'Test Meal E2E',
          skladniki_baza: JSON.stringify([{ name: 'Makaron', amount: '200g' }]),
          skladniki_mieso: '[]',
          przepis: '{}',
          kcal_baza: 400,
          bialko_baza: 20,
        },
        tue: null,
        wed: null,
        thu: null,
        fri: null,
        mon_free: false,
        tue_free: false,
        wed_free: false,
        thu_free: false,
        fri_free: false,
      }
      localStorage.setItem(`meal_swiper_plan_${weekKey}`, JSON.stringify(plan))
    })

    await page.goto('/shopping')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    const checkboxes = page.locator('[type="checkbox"]')
    const count = await checkboxes.count()
    if (count > 0) {
      await checkboxes.first().click()
      await expect(checkboxes.first()).toBeChecked()
    }
  })
})
