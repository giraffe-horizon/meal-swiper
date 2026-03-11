import { test, expect } from '@playwright/test'

test.describe('Swipe flow', () => {
  test('swipe view loads with meal cards or empty state', async ({ page }) => {
    await page.goto('/swipe')
    // SwipeView loads dynamically — wait for meal card or empty state
    await page
      .waitForSelector('h2, [data-testid="empty-state"]', { timeout: 30000 })
      .catch(() => null)
    await page.waitForLoadState('networkidle')

    const hasMealCard = (await page.locator('h2').count()) > 0
    const hasEmptyState = await page
      .getByText('Brak więcej posiłków')
      .isVisible()
      .catch(() => false)
    expect(hasMealCard || hasEmptyState, 'Swipe view shows neither meal card nor empty state').toBe(
      true
    )
  })

  test('happy path: swipe right adds meal to plan', async ({ page }) => {
    await page.goto('/swipe')
    await page.waitForSelector('h2', { timeout: 30000 })

    const mealName = await page.locator('h2').first().textContent()
    expect(mealName, 'Meal card has no title').toBeTruthy()

    // Click heart button (swipe right)
    const heartBtn = page
      .locator('button')
      .filter({ has: page.locator('text=favorite') })
      .first()
    await expect(heartBtn).toBeVisible({ timeout: 5000 })
    await heartBtn.click()

    // Confirmation toast must appear
    await expect(page.getByText(/Dodano:/)).toBeVisible({ timeout: 5000 })

    // The meal must now appear in /plan
    await page.goto('/plan')
    await page.waitForLoadState('networkidle')
    if (mealName) {
      await expect(page.getByText(mealName)).toBeVisible({ timeout: 5000 })
    }
  })

  test('skip button skips to next meal', async ({ page }) => {
    await page.goto('/swipe')
    await page.waitForSelector('h2', { timeout: 30000 })

    const firstMeal = await page.locator('h2').first().textContent()

    const skipBtn = page.getByText(/Pomiń ten dzień/)
    await expect(skipBtn).toBeVisible({ timeout: 5000 })
    await skipBtn.click()

    // After skipping, the card changes or empty state appears
    await page.waitForTimeout(300)
    const newMeal = await page
      .locator('h2')
      .first()
      .textContent()
      .catch(() => null)
    const hasEmpty = await page
      .getByText('Brak więcej posiłków')
      .isVisible()
      .catch(() => false)
    expect(newMeal !== firstMeal || hasEmpty, 'Skip button did not change the meal card').toBe(true)
  })
})

test.describe('Shopping list flow', () => {
  test('plan meals and check shopping list persistence', async ({ page }) => {
    await page.goto('/swipe')
    await page.waitForSelector('h2', { timeout: 30000 })

    // Swipe right twice
    for (let i = 0; i < 2; i++) {
      const heart = page
        .locator('button')
        .filter({ has: page.locator('text=favorite') })
        .first()
      const isVisible = await heart.isVisible().catch(() => false)
      if (!isVisible) break
      await heart.click()
      await page.waitForLoadState('networkidle')
    }

    await page.goto('/shopping')
    await page.waitForLoadState('networkidle')

    const checkbox = page.locator('input[type="checkbox"]').first()
    await expect(checkbox).toBeVisible({ timeout: 5000 })

    await checkbox.click()
    // Wait for localStorage to be written
    await page
      .waitForFunction(() => {
        const keys = Object.keys(localStorage)
        return keys.some((k) => k.includes('shopping') || k.includes('checked'))
      })
      .catch(() => page.waitForTimeout(800))

    await page.goto('/shopping')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('input[type="checkbox"]').first()).toBeChecked()
  })
})
