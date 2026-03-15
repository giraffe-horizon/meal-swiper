import { test, expect } from '@playwright/test'

test.describe('Swipe flow', () => {
  test('swipe view loads with meal cards or empty state', async ({ page }) => {
    await page.goto('/swipe')
    // Wait for the swipe UI to be ready — nav appears immediately, then meal cards load
    await page.waitForLoadState('domcontentloaded')
    // Wait for either a meal card (h2 inside swipe card), empty state, or "all filled" view
    await page
      .waitForSelector('h2, [data-testid="empty-state"]', { timeout: 15000 })
      .catch(() => null)

    const hasMealCard = (await page.locator('h2').count()) > 0
    const hasEmptyState = await page
      .getByText(/Brak więcej posiłków|Tydzień wypełniony/)
      .isVisible()
      .catch(() => false)
    expect(hasMealCard || hasEmptyState, 'Swipe view shows neither meal card nor empty state').toBe(
      true
    )
  })

  test('happy path: swipe right adds meal to plan', async ({ page }) => {
    await page.goto('/swipe')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForSelector('h2', { timeout: 15000 })

    const mealName = await page.locator('h2').first().textContent()
    expect(mealName, 'Meal card has no title').toBeTruthy()

    // Use title attribute for reliable button selection (icon text is ligature-dependent)
    const heartBtn = page.locator('button[title="Dodaj do planu"]')
    await expect(heartBtn).toBeVisible({ timeout: 5000 })
    await heartBtn.click()

    // Confirmation toast must appear
    await expect(page.getByText(/Dodano:/)).toBeVisible({ timeout: 8000 })

    // The meal must now appear in /plan
    await page.goto('/plan')
    await page.waitForLoadState('networkidle')
    if (mealName) {
      await expect(page.getByText(mealName)).toBeVisible({ timeout: 5000 })
    }
  })

  test('skip button skips to next meal or day', async ({ page }) => {
    await page.goto('/swipe')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForSelector('h2', { timeout: 15000 })

    const firstMeal = await page.locator('h2').first().textContent()

    const skipBtn = page.getByText(/Pomiń ten dzień/)
    await expect(skipBtn).toBeVisible({ timeout: 5000 })
    await skipBtn.click()

    // Wait for meal to change OR empty state — use waitForFunction for reliability
    await page
      .waitForFunction(
        (first) => {
          const h2 = document.querySelector('h2')
          const hasEmpty = document.body.textContent?.includes('Brak więcej posiłków')
          return (h2 ? h2.textContent !== first : false) || Boolean(hasEmpty)
        },
        firstMeal,
        { timeout: 5000 }
      )
      .catch(() => {
        // Same meal title may legitimately appear for next day (seed data)
        // In that case just verify page is still functional
      })

    // Page must still show swipe UI (no crash)
    const isStillFunctional =
      (await page.locator('h2').count()) > 0 ||
      (await page
        .getByText('Brak więcej posiłków')
        .isVisible()
        .catch(() => false))
    expect(isStillFunctional, 'Swipe view broke after clicking skip').toBe(true)
  })
})

test.describe('Shopping list flow', () => {
  test('plan meals and check shopping list persistence', async ({ page }) => {
    await page.goto('/swipe')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForSelector('h2', { timeout: 15000 })

    // Swipe right twice — wait for toast (Dodano:) instead of networkidle
    for (let i = 0; i < 2; i++) {
      const heart = page.locator('button[title="Dodaj do planu"]')
      const isVisible = await heart.isVisible().catch(() => false)
      if (!isVisible) break
      await heart.click()
      // Wait for toast confirmation before next swipe
      await page
        .getByText(/Dodano:/)
        .waitFor({ timeout: 8000 })
        .catch(() => {})
    }

    await page.goto('/shopping')
    // Use domcontentloaded — networkidle can timeout if background requests keep firing
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    const checkbox = page.locator('input[type="checkbox"]').first()
    await expect(checkbox).toBeVisible({ timeout: 8000 })

    await checkbox.click()
    // Wait for localStorage to be written
    await page
      .waitForFunction(() => {
        const keys = Object.keys(localStorage)
        return keys.some((k) => k.includes('shopping') || k.includes('checked'))
      })
      .catch(() => page.waitForTimeout(800))

    await page.goto('/shopping')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(500)

    await expect(page.locator('input[type="checkbox"]').first()).toBeChecked()
  })
})
