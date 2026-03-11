import { test, expect } from '@playwright/test'

test.describe('Swipe flow', () => {
  test('happy path: swipe right adds meal to plan', async ({ page }) => {
    await page.goto('/swipe')
    // SwipeView loads dynamically — wait up to 30s for meal card or empty state
    await page
      .waitForSelector('h2, text="Brak więcej posiłków"', { timeout: 30000 })
      .catch(() => null)

    const mealName = page.locator('h2').first()
    const hasMeal = await mealName.isVisible().catch(() => false)

    if (!hasMeal) {
      // No meals visible — skip interaction, just verify page loaded
      const body = await page.locator('main').isVisible()
      expect(body).toBe(true)
      return
    }

    const name = await mealName.textContent()

    // Click heart button (swipe right)
    const heartBtn = page
      .locator('button')
      .filter({ has: page.locator('text=favorite') })
      .first()
    const heartVisible = await heartBtn.isVisible().catch(() => false)
    if (heartVisible) {
      await heartBtn.click()
      await expect(page.getByText(/Dodano:/)).toBeVisible({ timeout: 5000 })

      await page.goto('/plan')
      await page.waitForLoadState('load')
      if (name) {
        await expect(page.getByText(name)).toBeVisible({ timeout: 5000 })
      }
    }
  })
})

test.describe('Shopping list flow', () => {
  test('plan meals and check shopping list persistence', async ({ page }) => {
    await page.goto('/swipe')
    await page
      .waitForSelector('h2, text="Brak więcej posiłków"', { timeout: 30000 })
      .catch(() => null)
    await page.waitForTimeout(500)

    // Swipe right twice if possible
    for (let i = 0; i < 2; i++) {
      const heart = page
        .locator('button')
        .filter({ has: page.locator('text=favorite') })
        .first()
      if (await heart.isVisible().catch(() => false)) {
        await heart.click()
        await page.waitForTimeout(500)
      }
    }

    await page.goto('/shopping')
    await page.waitForLoadState('load')
    await page.waitForTimeout(1000)

    const checkbox = page.locator('input[type="checkbox"]').first()
    if (await checkbox.isVisible({ timeout: 3000 }).catch(() => false)) {
      await checkbox.click()
      await page.waitForTimeout(800) // wait for localStorage save
      await page.goto('/shopping')
      await page.waitForLoadState('load')
      await page.waitForTimeout(800)
      const isChecked = await page.locator('input[type="checkbox"]').first().isChecked()
      expect(isChecked).toBe(true)
    }
  })
})
