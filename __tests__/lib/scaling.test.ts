import { describe, it, expect } from 'vitest'
import {
  scaleIngredient,
  scaleNutrition,
  computeScaleFactor,
  computePersonRatio,
  BASE_KCAL_PER_PERSON,
} from '@/lib/scaling'
import type { Ingredient, PersonSettings } from '@/types'

describe('scaling', () => {
  describe('computeScaleFactor', () => {
    it('returns 1 for 2 people × 2000 kcal (baseline)', () => {
      const persons: PersonSettings[] = [
        { name: 'Person 1', kcal: 2000, protein: 120 },
        { name: 'Person 2', kcal: 2000, protein: 100 },
      ]
      const result = computeScaleFactor(persons)
      expect(result).toBe(1) // (2000 + 2000) / (2 * 2000) = 1
    })

    it('returns 1.2 for Łukasz (3000 kcal) + Ala (1800 kcal)', () => {
      const persons: PersonSettings[] = [
        { name: 'Łukasz', kcal: 3000, protein: 150 },
        { name: 'Ala', kcal: 1800, protein: 90 },
      ]
      const result = computeScaleFactor(persons)
      expect(result).toBe(1.2) // (3000 + 1800) / (2 * 2000) = 4800 / 4000 = 1.2
    })

    it('returns 2 for 4 people × 2000 kcal', () => {
      const persons: PersonSettings[] = [
        { name: 'Person 1', kcal: 2000, protein: 120 },
        { name: 'Person 2', kcal: 2000, protein: 120 },
        { name: 'Person 3', kcal: 2000, protein: 120 },
        { name: 'Person 4', kcal: 2000, protein: 120 },
      ]
      const result = computeScaleFactor(persons)
      expect(result).toBe(2) // (4 * 2000) / (2 * 2000) = 2
    })

    it('returns 0.5 for 1 person × 2000 kcal', () => {
      const persons: PersonSettings[] = [{ name: 'Person 1', kcal: 2000, protein: 120 }]
      const result = computeScaleFactor(persons)
      expect(result).toBe(0.5) // 2000 / (2 * 2000) = 0.5
    })

    it('returns 1 for empty persons array (fallback)', () => {
      const result = computeScaleFactor([])
      expect(result).toBe(1)
    })

    it('uses custom basePeople', () => {
      const persons: PersonSettings[] = [
        { name: 'Person 1', kcal: 2000, protein: 120 },
        { name: 'Person 2', kcal: 2000, protein: 120 },
        { name: 'Person 3', kcal: 2000, protein: 120 },
      ]
      const result = computeScaleFactor(persons, 3)
      expect(result).toBe(1) // (3 * 2000) / (3 * 2000) = 1
    })
  })

  describe('computePersonRatio', () => {
    it('returns 1 for 2000 kcal (baseline)', () => {
      expect(computePersonRatio(2000)).toBe(1)
    })

    it('returns 1.5 for 3000 kcal', () => {
      expect(computePersonRatio(3000)).toBe(1.5)
    })

    it('returns 0.9 for 1800 kcal', () => {
      expect(computePersonRatio(1800)).toBe(0.9)
    })

    it('returns 0.5 for 1000 kcal', () => {
      expect(computePersonRatio(1000)).toBe(0.5)
    })
  })

  describe('scaleIngredient', () => {
    it('scales ingredient by scaleFactor', () => {
      const ing: Ingredient = { name: 'Pomidor', amount: '200g' }
      const result = scaleIngredient(ing, 1.5)
      expect(result.amount).toBe('300 g')
    })

    it('does not scale when scaleFactor is 1', () => {
      const ing: Ingredient = { name: 'Pomidor', amount: '200g' }
      const result = scaleIngredient(ing, 1)
      expect(result.amount).toBe('200 g')
    })

    it('scales ingredient with gramsHint', () => {
      const ing: Ingredient = { name: 'Czosnek', amount: '2 ząbki (16g)' }
      const result = scaleIngredient(ing, 1.5)
      expect(result.amount).toBe('3 ząbki (ok. 25g)')
    })

    it('preserves gramsHint when scaleFactor is 1', () => {
      const ing: Ingredient = { name: 'Czosnek', amount: '2 ząbki (16g)' }
      const result = scaleIngredient(ing, 1)
      // formatAmount adds "ok." prefix when gramsHint is present
      expect(result.amount).toBe('2 ząbki (ok. 16g)')
    })

    it('returns original ingredient for unparseable amount', () => {
      const ing: Ingredient = { name: 'Pomidor', amount: 'do smaku' }
      const result = scaleIngredient(ing, 2)
      expect(result.amount).toBe('do smaku')
    })
  })

  describe('scaleNutrition', () => {
    it('scales nutrition by scaleFactor', () => {
      expect(scaleNutrition(500, 1.5)).toBe(750)
    })

    it('does not scale when scaleFactor is 1', () => {
      expect(scaleNutrition(500, 1)).toBe(500)
    })

    it('rounds to nearest integer', () => {
      expect(scaleNutrition(500, 1.21)).toBe(605)
      expect(scaleNutrition(500, 1.24)).toBe(620)
    })
  })

  describe('BASE_KCAL_PER_PERSON constant', () => {
    it('is 2000', () => {
      expect(BASE_KCAL_PER_PERSON).toBe(2000)
    })
  })
})
