import { test, expect } from '@playwright/test'

test.describe('/api/meals', () => {
  test('GET returns 200', async ({ request }) => {
    const response = await request.get('/api/meals')
    expect(response.status()).toBe(200)
  })

  test('response is a JSON array', async ({ request }) => {
    const response = await request.get('/api/meals')
    const data = await response.json()
    expect(Array.isArray(data)).toBe(true)
  })

  test('each meal has required fields with non-empty photo_url', async ({ request }) => {
    const response = await request.get('/api/meals')
    const meals = await response.json()

    expect(meals.length).toBeGreaterThan(0)

    for (const meal of meals) {
      expect(meal).toHaveProperty('id')
      expect(meal).toHaveProperty('nazwa')
      expect(meal).toHaveProperty('photo_url')
      expect(meal).toHaveProperty('prep_time')
      expect(meal).toHaveProperty('kcal_baza')

      // CRITICAL: photo_url must not be empty
      expect(meal.photo_url).toBeTruthy()
      expect(meal.photo_url.length).toBeGreaterThan(0)
    }
  })

  test('photo_url starts with https:// (not a local path)', async ({ request }) => {
    const response = await request.get('/api/meals')
    const meals = await response.json()

    for (const meal of meals) {
      if (meal.photo_url) {
        expect(meal.photo_url).toMatch(/^https?:\/\//)
      }
    }
  })
})

test.describe('/api/image-search', () => {
  test('GET with q param returns 200', async ({ request }) => {
    const response = await request.get('/api/image-search?q=pasta')
    expect(response.status()).toBe(200)
  })

  test('GET without q param returns 400', async ({ request }) => {
    const response = await request.get('/api/image-search')
    expect(response.status()).toBe(400)
  })
})
