import { test, expect } from '@playwright/test';

test.describe('Meal Swiper E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://meal-swiper.pages.dev/');
    await page.waitForLoadState('networkidle');
  });

  test('should load and show the calendar', async ({ page }) => {
    await expect(page.locator('h1').first()).toContainText('Meal Swiper');
    await expect(page.locator('[data-testid="day-card-mon"]')).toBeVisible();
  });

  test('should navigate between views', async ({ page }) => {
    await page.click('text=Propozycje');
    await expect(page.locator('.material-symbols-outlined:has-text("favorite")')).toBeVisible();

    await page.click('text=Lista');
    await expect(page.locator('text=Lista zakupów')).toBeVisible();

    await page.click('text=Plan');
    await expect(page.locator('text=Poniedziałek')).toBeVisible();
  });

  test('should assign a meal via swipe from nav', async ({ page }) => {
    await page.evaluate(() => {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('weeklyPlan_')) localStorage.removeItem(key);
        });
    });
    await page.reload();
    await page.waitForLoadState('networkidle');

    await page.click('text=Propozycje');
    
    const heartBtn = page.locator('.bg-primary.rounded-full >> .material-symbols-outlined:has-text("favorite")');
    await expect(heartBtn).toBeVisible();

    await heartBtn.click();
    await page.waitForTimeout(500);

    await page.click('text=Plan');

    // First day card should show a meal (not "Brak planu")
    const monCard = page.locator('[data-testid="day-card-mon"]');
    await expect(monCard).not.toContainText('Brak planu');
  });

  test('should toggle vacation mode', async ({ page }) => {
    const monCard = page.locator('[data-testid="day-card-mon"]');
    
    // Hover to make menu visible (needed for some layouts)
    await monCard.hover();
    
    // Open menu
    await monCard.locator('.material-symbols-outlined:has-text("more_vert")').click();
    
    // Click "Oznacz jako wolny"
    await page.click('text=Oznacz jako wolny');
    
    // Card should say "Urlop"
    await expect(monCard).toContainText('Urlop');

    // Hover again on the vacation card
    await monCard.hover();

    // Open menu again
    await monCard.locator('.material-symbols-outlined:has-text("more_vert")').click();
    
    // Cancel vacation
    await page.click('text=Anuluj urlop');
    
    await expect(monCard).not.toContainText('Urlop');
  });

  test('should handle shopping list interactions', async ({ page }) => {
    await page.click('text=Lista');
    
    if (await page.locator('text=Brak listy zakupów').isVisible()) {
        await page.click('text=Plan');
        await page.locator('[data-testid="day-card-mon"]').click();
        await page.locator('.bg-primary.rounded-full >> .material-symbols-outlined:has-text("favorite")').click();
        await page.waitForTimeout(500);
        await page.click('text=Lista');
    }

    const firstCheckbox = page.locator('input[type="checkbox"]').first();
    await firstCheckbox.check();
    
    await expect(page.locator('text=/')).toBeVisible();
    
    page.on('dialog', dialog => dialog.accept());
    await page.click('text=Resetuj listę');
    
    const checkboxes = await page.locator('input[type="checkbox"]').all();
    if (checkboxes.length > 0) {
        for (const cb of checkboxes) {
            await expect(cb).not.toBeChecked();
        }
    }
  });
});
