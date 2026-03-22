import { describe, it, expect } from 'vitest'
import {
  parseIngredients,
  getMealMatchScore,
  getAllIngredients,
  filterMealsByFridge,
  countMatchingMeals,
} from '@/lib/fridge'
import type { Meal } from '@/types'

function makeMeal(overrides: Partial<Meal> = {}): Meal {
  return {
    id: 'test-1',
    nazwa: 'Test Meal',
    opis: '',
    photo_url: '',
    prep_time: 30,
    kcal_baza: 500,
    kcal_z_miesem: 600,
    bialko_baza: 20,
    bialko_z_miesem: 30,
    trudnosc: 'łatwe',
    kuchnia: 'polska',
    category: 'jednogarnkowe',
    skladniki_baza: JSON.stringify([
      { name: 'kurczak', amount: '300g', category: 'mięso' },
      { name: 'papryka', amount: '1 szt', category: 'warzywa' },
      { name: 'cebula', amount: '1 szt', category: 'warzywa' },
    ]),
    skladniki_mieso: '[]',
    przepis: JSON.stringify({ kroki: [] }),
    tags: [],
    ...overrides,
  }
}

describe('parseIngredients', () => {
  it('parses valid JSON', () => {
    const result = parseIngredients(JSON.stringify([{ name: 'kurczak', amount: '300g' }]))
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('kurczak')
  })

  it('returns empty array for invalid JSON', () => {
    expect(parseIngredients('not-json')).toEqual([])
  })

  it('returns empty array for empty string', () => {
    expect(parseIngredients('')).toEqual([])
  })
})

describe('getMealMatchScore', () => {
  it('returns 1.0 when all ingredients available', () => {
    const meal = makeMeal()
    const available = new Set(['kurczak', 'papryka', 'cebula'])
    expect(getMealMatchScore(meal, available)).toBe(1)
  })

  it('returns 0 when no ingredients available', () => {
    const meal = makeMeal()
    const available = new Set<string>()
    expect(getMealMatchScore(meal, available)).toBe(0)
  })

  it('returns partial score', () => {
    const meal = makeMeal()
    const available = new Set(['kurczak'])
    expect(getMealMatchScore(meal, available)).toBeCloseTo(1 / 3)
  })

  it('lowercases ingredient names before lookup', () => {
    const meal = makeMeal()
    // Ingredient in meal is 'kurczak', Set contains lowercase 'kurczak'
    // getMealMatchScore lowercases ing.name before checking Set
    const available = new Set(['kurczak', 'papryka', 'cebula'])
    expect(getMealMatchScore(meal, available)).toBe(1)
  })

  it('returns 0 for meal with no ingredients', () => {
    const meal = makeMeal({ skladniki_baza: '[]' })
    const available = new Set(['kurczak'])
    expect(getMealMatchScore(meal, available)).toBe(0)
  })
})

describe('getAllIngredients', () => {
  it('returns unique ingredients from all meals', () => {
    const meal1 = makeMeal({ id: '1' })
    const meal2 = makeMeal({
      id: '2',
      skladniki_baza: JSON.stringify([
        { name: 'ryż', amount: '200g', category: 'suche' },
        { name: 'cebula', amount: '1 szt', category: 'warzywa' }, // duplicate
      ]),
    })
    const result = getAllIngredients([meal1, meal2])
    const names = result.map((i) => i.name)
    expect(names).toContain('kurczak')
    expect(names).toContain('papryka')
    expect(names).toContain('cebula')
    expect(names).toContain('ryż')
    // cebula should appear only once
    expect(names.filter((n) => n === 'cebula')).toHaveLength(1)
  })

  it('returns empty array for empty meals list', () => {
    expect(getAllIngredients([])).toEqual([])
  })

  it('assigns correct category', () => {
    const result = getAllIngredients([makeMeal()])
    const kurczak = result.find((i) => i.name === 'kurczak')
    expect(kurczak?.category).toBe('mięso')
  })

  it('defaults to inne for ingredients without category', () => {
    const meal = makeMeal({
      skladniki_baza: JSON.stringify([{ name: 'sól', amount: 'do smaku' }]),
    })
    const result = getAllIngredients([meal])
    const sol = result.find((i) => i.name === 'sól')
    expect(sol?.category).toBe('inne')
  })
})

describe('filterMealsByFridge', () => {
  it('returns all meals when no ingredients selected', () => {
    const meals = [makeMeal({ id: '1' }), makeMeal({ id: '2' })]
    expect(filterMealsByFridge(meals, [])).toHaveLength(2)
  })

  it('filters meals below minScore', () => {
    const meal1 = makeMeal({ id: '1' }) // 3 ingredients
    const meal2 = makeMeal({
      id: '2',
      skladniki_baza: JSON.stringify([{ name: 'ryż', amount: '200g', category: 'suche' }]),
    })
    // only kurczak selected — meal1 score = 1/3, meal2 score = 0
    const result = filterMealsByFridge([meal1, meal2], ['kurczak'], 0.5)
    expect(result).toHaveLength(0)
  })

  it('includes meals meeting minScore threshold', () => {
    const meal = makeMeal()
    // all 3 ingredients selected — score = 1.0
    const result = filterMealsByFridge([meal], ['kurczak', 'papryka', 'cebula'], 0.5)
    expect(result).toHaveLength(1)
  })

  it('uses 0.5 as default minScore', () => {
    const meal = makeMeal() // 3 ingredients
    // 2 of 3 = 0.67 >= 0.5
    const result = filterMealsByFridge([meal], ['kurczak', 'papryka'])
    expect(result).toHaveLength(1)
  })
})

describe('countMatchingMeals', () => {
  it('returns correct count', () => {
    const meals = [
      makeMeal({ id: '1' }), // kurczak, papryka, cebula
      makeMeal({
        id: '2',
        skladniki_baza: JSON.stringify([{ name: 'ryż', amount: '200g', category: 'suche' }]),
      }),
    ]
    // kurczak, papryka, cebula selected → only meal 1 matches
    expect(countMatchingMeals(meals, ['kurczak', 'papryka', 'cebula'])).toBe(1)
  })
})
