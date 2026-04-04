import { describe, it, expect } from 'vitest'
import { parseRecipe, enrichStepsWithAmounts } from '../recipe'
import type { Meal, Ingredient } from '@/types'

function makeMeal(overrides: Partial<Meal> = {}): Meal {
  return {
    id: 'meal-1',
    nazwa: 'Test Meal',
    opis: '',
    photo_url: '',
    prep_time: 30,
    kcal_baza: 400,
    kcal_z_miesem: 600,
    bialko_baza: 20,
    bialko_z_miesem: 40,
    trudnosc: 'łatwe',
    kuchnia: 'polska',
    category: 'obiad',
    skladniki_baza: JSON.stringify([{ name: 'Pomidor', amount: '200g' }]),
    skladniki_mieso: JSON.stringify([{ name: 'Kurczak', amount: '300g' }]),
    przepis: JSON.stringify({
      kroki: ['Pokrój pomidory', 'Usmaż kurczaka'],
      wskazowki: 'Podawaj ciepłe',
    }),
    tags: [],
    ...overrides,
  }
}

describe('parseRecipe', () => {
  it('parses valid recipe JSON', () => {
    const result = parseRecipe(makeMeal())
    expect(result.steps).toEqual(['Pokrój pomidory', 'Usmaż kurczaka'])
    expect(result.tips).toBe('Podawaj ciepłe')
    expect(result.baseIngredients).toHaveLength(1)
    expect(result.meatIngredients).toHaveLength(1)
  })

  it('returns empty arrays for invalid JSON', () => {
    const result = parseRecipe(makeMeal({ przepis: 'invalid' }))
    expect(result.steps).toEqual([])
    expect(result.tips).toBe('')
  })

  it('handles missing skladniki_mieso', () => {
    const result = parseRecipe(
      makeMeal({ skladniki_mieso: '' })
    )
    expect(result.meatIngredients).toEqual([])
  })

  it('handles already-parsed objects (non-string)', () => {
    const meal = makeMeal()
    // Simulate already-parsed data (not stringified)
    const parsed = {
      ...meal,
      przepis: { kroki: ['Step 1'], wskazowki: 'Tip' } as unknown as string,
      skladniki_baza: [{ name: 'A', amount: '1g' }] as unknown as string,
      skladniki_mieso: [{ name: 'B', amount: '2g' }] as unknown as string,
    }
    const result = parseRecipe(parsed)
    expect(result.steps).toEqual(['Step 1'])
    expect(result.baseIngredients).toHaveLength(1)
    expect(result.meatIngredients).toHaveLength(1)
  })
})

describe('enrichStepsWithAmounts', () => {
  it('enriches step text with ingredient amounts', () => {
    const steps = ['Pokrój pomidory na kawałki']
    const ingredients: Ingredient[] = [{ name: 'Pomidory', amount: '400g' }]
    const result = enrichStepsWithAmounts(steps, ingredients)
    expect(result).toHaveLength(1)
    // The step should contain the scaled amount somewhere
    expect(result[0]).toContain('400g')
  })

  it('returns original step text when no ingredient matches', () => {
    const steps = ['Zagotuj wodę']
    const ingredients: Ingredient[] = [{ name: 'Pomidor', amount: '200g' }]
    const result = enrichStepsWithAmounts(steps, ingredients)
    expect(result[0]).toBe('Zagotuj wodę')
  })

  it('handles empty ingredients', () => {
    const steps = ['Krok 1']
    const result = enrichStepsWithAmounts(steps, [])
    expect(result[0]).toBe('Krok 1')
  })
})
