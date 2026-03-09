import { test, expect } from '@playwright/test'

test.describe('Swipe flow', () => {
  test('happy path: swipe right adds meal to plan', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Click "Propozycje" nav
    await page.getByText('Propozycje').first().click()

    // Wait for card to appear with meal name
    const mealName = page.locator('h2').first()
    await expect(mealName).toBeVisible({ timeout: 10000 })
    const name = await mealName.textContent()

    // Check image is visible and not broken
    const img = page.locator('img').first()
    await expect(img).toBeVisible()
    const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth)
    expect(naturalWidth).toBeGreaterThan(0)

    // Click heart button (swipe right)
    await page.locator('button:has(.material-symbols-outlined:text("favorite"))').click()

    // Toast should appear with meal name
    await expect(page.getByText(/Dodano:/)).toBeVisible({ timeout: 5000 })

    // Navigate to Plan
    await page.getByText('Plan').first().click()

    // The meal name should be visible in the calendar
    if (name) {
      await expect(page.getByText(name)).toBeVisible({ timeout: 5000 })
    }
  })
})

test.describe('Shopping list flow', () => {
  test('plan meals and check shopping list persistence', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Click "Propozycje" and accept 2 meals
    await page.getByText('Propozycje').first().click()
    await page.waitForTimeout(2000)

    // Swipe right twice
    for (let i = 0; i < 2; i++) {
      const heart = page.locator('button:has(.material-symbols-outlined:text("favorite"))').first()
      if (await heart.isVisible()) {
        await heart.click()
        await page.waitForTimeout(500)
      }
    }

    // Go to Lista
    await page.getByText('Lista').first().click()
    await page.waitForTimeout(1000)

    // If list has items, check a checkbox
    const checkbox = page.locator('input[type="checkbox"]').first()
    if (await checkbox.isVisible({ timeout: 3000 }).catch(() => false)) {
      await checkbox.click()

      // Reload page
      await page.reload()
      await page.waitForLoadState('networkidle')

      // Go to Lista again
      await page.getByText('Lista').first().click()
      await page.waitForTimeout(1000)

      // Checkbox should still be checked (localStorage persistence)
      const isChecked = await page.locator('input[type="checkbox"]').first().isChecked()
      expect(isChecked).toBe(true)
    }
  })
})
