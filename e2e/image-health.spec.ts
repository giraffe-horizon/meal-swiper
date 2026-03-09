import { test, expect } from '@playwright/test'

test.describe('Image health check', () => {
  test('all meal photo_urls are non-empty and return 200 with image content-type', async ({ request }) => {
    // 1. Fetch meals from API
    const response = await request.get('/api/meals')
    expect(response.status()).toBe(200)

    const meals = await response.json()
    expect(meals.length).toBeGreaterThan(0)

    const failures: string[] = []

    for (const meal of meals) {
      // 2. photo_url must be non-empty
      if (!meal.photo_url || meal.photo_url.trim() === '') {
        failures.push(`"${meal.nazwa}" (${meal.id}): photo_url is empty`)
        continue
      }

      // 3. photo_url must start with https://
      if (!meal.photo_url.startsWith('https://')) {
        failures.push(`"${meal.nazwa}": photo_url doesn't start with https:// — got: ${meal.photo_url.slice(0, 50)}`)
        continue
      }

      // 4. Fetch the image URL and check response
      try {
        const imgResponse = await request.fetch(meal.photo_url, {
          timeout: 10000,
        })

        if (imgResponse.status() !== 200) {
          failures.push(`"${meal.nazwa}": photo_url returned ${imgResponse.status()} — ${meal.photo_url}`)
          continue
        }

        // 5. Content-Type must be image/*
        const contentType = imgResponse.headers()['content-type'] || ''
        if (!contentType.startsWith('image/')) {
          failures.push(`"${meal.nazwa}": Content-Type is "${contentType}", expected image/* — ${meal.photo_url}`)
        }
      } catch (err) {
        failures.push(`"${meal.nazwa}": fetch failed — ${meal.photo_url} — ${err}`)
      }
    }

    if (failures.length > 0) {
      console.error('Image health check failures:\n' + failures.join('\n'))
    }
    expect(failures).toEqual([])
  })
})
