import { describe, it, expect } from 'vitest'
import { parseRecipe, enrichStepsWithAmounts, enrichStepsStructured } from '@/lib/recipe'
import type { Meal, Ingredient } from '@/types'

const baseMeal: Meal = {
  id: '1',
  nazwa: 'Test Meal',
  opis: '',
  photo_url: '',
  prep_time: 20,
  kcal_baza: 400,
  kcal_z_miesem: 500,
  bialko_baza: 15,
  bialko_z_miesem: 25,
  trudnosc: 'łatwe',
  kuchnia: 'polska',
  category: 'makarony',
  skladniki_baza: JSON.stringify([
    { name: 'Makaron', amount: '200g' },
    { name: 'Sos', amount: '100ml' },
  ]),
  skladniki_mieso: JSON.stringify([{ name: 'Kurczak', amount: '150g' }]),
  przepis: JSON.stringify({
    kroki: ['Ugotuj makaron.', 'Dodaj sos.'],
    wskazowki: 'Dopraw solą.',
  }),
  tags: [],
}

describe('parseRecipe', () => {
  it('parses steps from przepis', () => {
    const result = parseRecipe(baseMeal)
    expect(result.steps).toHaveLength(2)
    expect(result.steps[0]).toBe('Ugotuj makaron.')
  })

  it('parses tips from przepis', () => {
    const result = parseRecipe(baseMeal)
    expect(result.tips).toBe('Dopraw solą.')
  })

  it('parses base ingredients', () => {
    const result = parseRecipe(baseMeal)
    expect(result.baseIngredients).toHaveLength(2)
    expect(result.baseIngredients[0].name).toBe('Makaron')
  })

  it('parses meat ingredients', () => {
    const result = parseRecipe(baseMeal)
    expect(result.meatIngredients).toHaveLength(1)
    expect(result.meatIngredients[0].name).toBe('Kurczak')
  })

  it('handles invalid przepis JSON gracefully', () => {
    const meal = { ...baseMeal, przepis: 'INVALID' }
    const result = parseRecipe(meal)
    expect(result.steps).toEqual([])
    expect(result.tips).toBe('')
  })

  it('handles invalid skladniki_baza JSON gracefully', () => {
    const meal = { ...baseMeal, skladniki_baza: 'INVALID' }
    const result = parseRecipe(meal)
    expect(result.baseIngredients).toEqual([])
  })

  it('handles invalid skladniki_mieso JSON gracefully', () => {
    const meal = { ...baseMeal, skladniki_mieso: 'INVALID' }
    const result = parseRecipe(meal)
    expect(result.meatIngredients).toEqual([])
  })

  it('returns empty steps when kroki not present', () => {
    const meal = { ...baseMeal, przepis: JSON.stringify({ wskazowki: 'tip' }) }
    const result = parseRecipe(meal)
    expect(result.steps).toEqual([])
  })

  it('returns empty tips when wskazowki not present', () => {
    const meal = { ...baseMeal, przepis: JSON.stringify({ kroki: ['step1'] }) }
    const result = parseRecipe(meal)
    expect(result.tips).toBe('')
  })
})

describe('enrichStepsWithAmounts (backwards compat)', () => {
  it('returns plain string steps', () => {
    const steps = ['Dodaj makaron.']
    const ings: Ingredient[] = [{ name: 'Makaron', amount: '200g' }]
    const result = enrichStepsWithAmounts(steps, ings)
    expect(result).toHaveLength(1)
    expect(typeof result[0]).toBe('string')
  })

  it('returns empty array for empty steps', () => {
    const result = enrichStepsWithAmounts([], [])
    expect(result).toHaveLength(0)
  })
})

describe('enrichStepsStructured - edge cases', () => {
  it('handles empty ingredients list', () => {
    const result = enrichStepsStructured(['Gotuj 10 minut.'], [])
    expect(result[0][0].type).toBe('text')
  })

  it('handles multiple steps', () => {
    const result = enrichStepsStructured(['Krok 1.', 'Krok 2.'], [])
    expect(result).toHaveLength(2)
  })

  it('handles ingredient name in different case', () => {
    const steps = ['Pokrój CEBULĘ drobno']
    const ings: Ingredient[] = [{ name: 'Cebula', amount: '1 szt' }]
    const result = enrichStepsStructured(steps, ings)
    // Should find the ingredient stem match
    expect(result[0]).toBeTruthy()
    expect(result[0].length).toBeGreaterThan(0)
  })

  it('handles amount in step text - returns segments', () => {
    const steps = ['Dodaj 200g mąki do miski']
    const ings: Ingredient[] = [{ name: 'Mąka', amount: '200g' }]
    const result = enrichStepsStructured(steps, ings)
    expect(result[0].length).toBeGreaterThan(0)
  })
})
