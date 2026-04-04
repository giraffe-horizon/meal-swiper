import { describe, it, expect } from 'vitest'
import {
  computeScaleFactor,
  computePersonRatio,
  scaleIngredient,
  scaleNutrition,
  snapToNiceFraction,
  BASE_KCAL_PER_PERSON,
} from '../scaling'
import type { Ingredient } from '@/types'

describe('computeScaleFactor', () => {
  it('returns 1 for default 2 people × 2000 kcal', () => {
    const persons = [
      { name: 'A', kcal: 2000, protein: 100 },
      { name: 'B', kcal: 2000, protein: 100 },
    ]
    expect(computeScaleFactor(persons)).toBe(1)
  })

  it('returns 1 for empty persons array (fallback)', () => {
    expect(computeScaleFactor([])).toBe(1)
  })

  it('scales up for higher kcal needs', () => {
    const persons = [
      { name: 'A', kcal: 2500, protein: 120 },
      { name: 'B', kcal: 2500, protein: 120 },
    ]
    expect(computeScaleFactor(persons)).toBe(5000 / 4000)
  })

  it('scales down for single person with lower kcal', () => {
    const persons = [{ name: 'A', kcal: 1500, protein: 80 }]
    expect(computeScaleFactor(persons)).toBe(1500 / 4000)
  })
})

describe('computePersonRatio', () => {
  it('returns 1 for BASE_KCAL_PER_PERSON', () => {
    expect(computePersonRatio(BASE_KCAL_PER_PERSON)).toBe(1)
  })

  it('returns 1.1 for 2200 kcal', () => {
    expect(computePersonRatio(2200)).toBe(2200 / 2000)
  })
})

describe('snapToNiceFraction', () => {
  it('snaps very small values to 0.25', () => {
    expect(snapToNiceFraction(0.1)).toBe(0.25)
  })

  it('snaps 0.45 to 0.5', () => {
    expect(snapToNiceFraction(0.45)).toBe(0.5)
  })

  it('rounds values > 2 to nearest 0.5', () => {
    expect(snapToNiceFraction(2.7)).toBe(2.5)
    expect(snapToNiceFraction(3.3)).toBe(3.5)
  })
})

describe('scaleIngredient', () => {
  it('scales grams and rounds to nearest 5', () => {
    const ing: Ingredient = { name: 'Pomidor', amount: '200g' }
    const scaled = scaleIngredient(ing, 1.5)
    expect(scaled.amount).toBe('300 g')
  })

  it('returns original ingredient when amount is unparseable', () => {
    const ing: Ingredient = { name: 'do smaku', amount: 'do smaku' }
    expect(scaleIngredient(ing, 2)).toEqual(ing)
  })

  it('keeps scaleFactor=1 unchanged', () => {
    const ing: Ingredient = { name: 'Mleko', amount: '200 ml' }
    const scaled = scaleIngredient(ing, 1)
    expect(scaled.amount).toBe('200 ml')
  })

  it('scales spoon units to nice fractions', () => {
    const ing: Ingredient = { name: 'Oliwa', amount: '2 łyżki' }
    const scaled = scaleIngredient(ing, 0.5)
    expect(scaled.amount).toBe('1 łyżki')
  })
})

describe('scaleNutrition', () => {
  it('scales and rounds', () => {
    expect(scaleNutrition(500, 1.5)).toBe(750)
    expect(scaleNutrition(333, 0.5)).toBe(167)
  })
})
