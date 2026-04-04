import { describe, it, expect } from 'vitest'
import {
  generateShoppingList,
  normalizeIngredientName,
  mergeAmounts,
  isPantryStaple,
} from '../shopping'
import type { WeeklyPlan, Meal } from '@/types'

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
    skladniki_baza: JSON.stringify([
      { name: 'Pomidor', amount: '200g' },
      { name: 'Cebula', amount: '1 szt' },
    ]),
    skladniki_mieso: JSON.stringify([{ name: 'Kurczak', amount: '300g' }]),
    przepis: '{"kroki":["Krok 1"]}',
    tags: [],
    ...overrides,
  }
}

function makePlan(meals: Partial<Record<string, Meal | null>> = {}): WeeklyPlan {
  return {
    mon: null,
    tue: null,
    wed: null,
    thu: null,
    fri: null,
    mon_free: false,
    tue_free: false,
    wed_free: false,
    thu_free: false,
    fri_free: false,
    ...meals,
  } as WeeklyPlan
}

describe('normalizeIngredientName', () => {
  it('lowercases and strips diacritics', () => {
    expect(normalizeIngredientName('Łosoś')).toBe('losos')
  })

  it('maps plural forms to singular via lemmatization', () => {
    expect(normalizeIngredientName('Pomidory')).toBe('pomidor')
    expect(normalizeIngredientName('jajka')).toBe('jajko')
  })

  it('maps synonyms to canonical name', () => {
    expect(normalizeIngredientName('cebula czerwona')).toBe('cebula')
    expect(normalizeIngredientName('ryż jaśminowy')).toBe('ryz')
  })
})

describe('mergeAmounts', () => {
  it('adds same-unit amounts', () => {
    expect(mergeAmounts('200g', '300g')).toBe('500 g')
  })

  it('converts kg + g to grams then sums', () => {
    expect(mergeAmounts('1 kg', '500g')).toBe('1.5 kg')
  })

  it('concatenates incompatible units', () => {
    expect(mergeAmounts('2 szt', '300g')).toBe('2 szt + 300g')
  })
})

describe('isPantryStaple', () => {
  it('returns true for salt', () => {
    expect(isPantryStaple('Sól')).toBe(true)
  })

  it('returns true for olive oil', () => {
    expect(isPantryStaple('Oliwa z oliwek')).toBe(true)
  })

  it('returns false for chicken', () => {
    expect(isPantryStaple('Kurczak')).toBe(false)
  })
})

describe('generateShoppingList', () => {
  it('generates a list from a weekly plan', () => {
    const plan = makePlan({ mon: makeMeal() })
    const list = generateShoppingList(plan)
    expect(list.length).toBeGreaterThan(0)
    const names = list.map((i) => i.normalizedName)
    expect(names).toContain('pomidor')
    expect(names).toContain('kurczak')
  })

  it('merges duplicate ingredients across days', () => {
    const meal = makeMeal({
      skladniki_baza: JSON.stringify([{ name: 'Pomidor', amount: '200g' }]),
      skladniki_mieso: '[]',
    })
    const plan = makePlan({ mon: meal, tue: meal })
    const list = generateShoppingList(plan)
    const pomidor = list.find((i) => i.normalizedName === 'pomidor')
    expect(pomidor).toBeDefined()
    expect(pomidor!.amount).toBe('400 g')
  })

  it('excludes pantry staples', () => {
    const meal = makeMeal({
      skladniki_baza: JSON.stringify([
        { name: 'Sól', amount: '5g' },
        { name: 'Pomidor', amount: '200g' },
      ]),
      skladniki_mieso: '[]',
    })
    const plan = makePlan({ mon: meal })
    const list = generateShoppingList(plan)
    const names = list.map((i) => i.normalizedName)
    expect(names).not.toContain('sol')
  })

  it('returns empty list for empty plan', () => {
    const plan = makePlan()
    const list = generateShoppingList(plan)
    expect(list).toEqual([])
  })

  it('scales ingredients by scaleFactor', () => {
    const meal = makeMeal({
      skladniki_baza: JSON.stringify([{ name: 'Pomidor', amount: '200g' }]),
      skladniki_mieso: '[]',
    })
    const plan = makePlan({ mon: meal })
    const list = generateShoppingList(plan, 1.5)
    const pomidor = list.find((i) => i.normalizedName === 'pomidor')
    expect(pomidor).toBeDefined()
    expect(pomidor!.amount).toBe('300 g')
  })
})
