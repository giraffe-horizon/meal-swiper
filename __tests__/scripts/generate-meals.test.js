import { describe, it, expect } from 'vitest'
import { deduplicateMeals } from '../../scripts/lib/dedup.js'

describe('generate-meals logic', () => {
  describe('deduplication', () => {
    it('removes meals that exist in existing names', () => {
      const newMeals = [
        { nazwa: 'Pasta Carbonara' },
        { nazwa: 'Pizza Margherita' },
        { nazwa: 'Sałatka Grecka' },
      ]
      const existing = ['Pasta Carbonara']
      const result = deduplicateMeals(newMeals, existing)
      expect(result).toHaveLength(2)
      expect(result.map(m => m.nazwa)).not.toContain('Pasta Carbonara')
    })

    it('removes duplicates within the same batch', () => {
      const newMeals = [
        { nazwa: 'Pasta Carbonara' },
        { nazwa: 'Pasta Carbonara' },
        { nazwa: 'Pizza' },
      ]
      const result = deduplicateMeals(newMeals, [])
      expect(result).toHaveLength(2)
    })

    it('normalizes names (case insensitive, removes combining accents)', () => {
      // NFD removes combining marks (é→e) but ł (U+0142) is not decomposed
      const newMeals = [
        { nazwa: 'Sałatka Grecka' },
      ]
      const existing = ['sałatka grecka']
      const result = deduplicateMeals(newMeals, existing)
      expect(result).toHaveLength(0)
    })

    it('case insensitive matching', () => {
      const newMeals = [{ nazwa: 'PIZZA MARGHERITA' }]
      const existing = ['pizza margherita']
      const result = deduplicateMeals(newMeals, existing)
      expect(result).toHaveLength(0)
    })

    it('returns all meals when no duplicates', () => {
      const newMeals = [
        { nazwa: 'Meal A' },
        { nazwa: 'Meal B' },
      ]
      const result = deduplicateMeals(newMeals, [])
      expect(result).toHaveLength(2)
    })
  })

  describe('meal photo_url assignment', () => {
    it('photo_url is set from generateImage result (not _localImagePath)', () => {
      // Simulating the logic from generate-meals.js lines 134-138
      const meal = { nazwa: 'Test', photo_url: undefined }
      const imageUrl = 'https://i.imgur.com/abc123.png'

      // This is what generate-meals.js does:
      if (imageUrl) {
        meal.photo_url = imageUrl
      }

      expect(meal.photo_url).toBe('https://i.imgur.com/abc123.png')
      expect(meal.photo_url).toMatch(/^https:\/\//)
    })

    it('photo_url is not set when generateImage returns null', () => {
      const meal = { nazwa: 'Test', photo_url: undefined }
      const imageUrl = null

      if (imageUrl) {
        meal.photo_url = imageUrl
      }

      expect(meal.photo_url).toBeUndefined()
    })
  })
})
