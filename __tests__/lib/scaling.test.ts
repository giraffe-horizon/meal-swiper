import { describe, it, expect } from 'vitest'
import {
  scaleIngredient,
  scaleNutrition,
  computeScaleFactor,
  computePersonRatio,
  snapToNiceFraction,
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

  describe('snapToNiceFraction', () => {
    it('snaps 0.25 to 1/4', () => {
      expect(snapToNiceFraction(0.25)).toBeCloseTo(0.25)
    })

    it('snaps 0.1 to 1/4 (minimum value)', () => {
      expect(snapToNiceFraction(0.1)).toBeCloseTo(0.25)
    })

    it('snaps 0.33 to 1/3', () => {
      expect(snapToNiceFraction(1 / 3)).toBeCloseTo(1 / 3)
    })

    it('snaps 0.5 to 1/2', () => {
      expect(snapToNiceFraction(0.5)).toBeCloseTo(0.5)
    })

    it('snaps 0.67 to 2/3', () => {
      expect(snapToNiceFraction(2 / 3)).toBeCloseTo(2 / 3)
    })

    it('snaps 0.75 to 3/4', () => {
      expect(snapToNiceFraction(0.75)).toBeCloseTo(0.75)
    })

    it('snaps 1.0 to 1', () => {
      expect(snapToNiceFraction(1.0)).toBe(1)
    })

    it('snaps values > 2 to 0.5 increments', () => {
      expect(snapToNiceFraction(2.3)).toBeCloseTo(2.5)
      expect(snapToNiceFraction(3.1)).toBeCloseTo(3)
    })
  })

  describe('fraction scaling for spoon units', () => {
    it('scales łyżeczka to 1/4 when result is small', () => {
      // 1 łyżeczka * 0.25 = 0.25 → "1/4 łyżeczki"
      const ing: Ingredient = { name: 'Sól', amount: '1 łyżeczka' }
      const result = scaleIngredient(ing, 0.25)
      expect(result.amount).toBe('1/4 łyżeczki')
    })

    it('scales łyżeczka to 1/3 when result is ~1/3', () => {
      // 1 łyżeczka * (1/3) ≈ 0.333 → "1/3 łyżeczki"
      const ing: Ingredient = { name: 'Pieprz', amount: '1 łyżeczka' }
      const result = scaleIngredient(ing, 1 / 3)
      expect(result.amount).toBe('1/3 łyżeczki')
    })

    it('scales łyżka to 1/2 when result is 0.5', () => {
      // 1 łyżka * 0.5 = 0.5 → "1/2 łyżki"
      const ing: Ingredient = { name: 'Oliwa', amount: '1 łyżka' }
      const result = scaleIngredient(ing, 0.5)
      expect(result.amount).toBe('1/2 łyżki')
    })

    it('scales łyżeczki to 2/3 when result is ~2/3', () => {
      // 2 łyżeczki * (1/3) ≈ 0.667 → "2/3 łyżeczki"
      const ing: Ingredient = { name: 'Kumin', amount: '2 łyżeczki' }
      const result = scaleIngredient(ing, 1 / 3)
      expect(result.amount).toBe('2/3 łyżeczki')
    })

    it('scales łyżka to 3/4 when result is 0.75', () => {
      // 3 łyżki * 0.25 = 0.75 → "3/4 łyżki"
      const ing: Ingredient = { name: 'Sos sojowy', amount: '3 łyżki' }
      const result = scaleIngredient(ing, 0.25)
      expect(result.amount).toBe('3/4 łyżki')
    })
  })
})
