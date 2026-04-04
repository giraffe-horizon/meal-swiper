import { describe, it, expect } from 'vitest'
import { filterMealsByPreferences } from '../meal-filter'
import type { MealWithVariants, PersonSettings } from '@/types'

function makeMeal(overrides: Partial<MealWithVariants> = {}): MealWithVariants {
  return {
    id: 'meal-1',
    nazwa: 'Test Meal',
    opis: 'Opis',
    photo_url: '',
    prep_time: 30,
    trudnosc: 'łatwe',
    kuchnia: 'polska',
    category: 'obiad',
    przepis: '{"kroki":["Krok 1"]}',
    tags: [],
    variants: [
      {
        id: 'v1',
        meal_id: 'meal-1',
        name: 'Standard',
        kcal: 500,
        protein: 30,
        dietary_flags: [],
        is_default: true,
      },
    ],
    ...overrides,
  }
}

function makePerson(overrides: Partial<PersonSettings> = {}): PersonSettings {
  return {
    name: 'Łukasz',
    kcal: 2200,
    protein: 120,
    ...overrides,
  }
}

describe('filterMealsByPreferences', () => {
  it('returns all meals when no diet restrictions', () => {
    const meals = [makeMeal({ id: '1' }), makeMeal({ id: '2' })]
    const result = filterMealsByPreferences(meals, {
      persons: [makePerson()],
    })
    expect(result.total).toBe(2)
    expect(result.results).toHaveLength(2)
  })

  it('returns empty results when persons is empty', () => {
    const meals = [makeMeal()]
    const result = filterMealsByPreferences(meals, { persons: [] })
    expect(result.total).toBe(0)
    expect(result.warning).toBe('none')
  })

  it('filters out meals with no compatible variant for vegetarian', () => {
    const meatOnlyMeal = makeMeal({
      id: 'meat-only',
      variants: [
        {
          id: 'v1',
          meal_id: 'meat-only',
          name: 'Z mięsem',
          kcal: 600,
          protein: 40,
          dietary_flags: [],
          is_default: true,
        },
      ],
    })

    const vegMeal = makeMeal({
      id: 'veg',
      variants: [
        {
          id: 'v2',
          meal_id: 'veg',
          name: 'Wegetariański',
          kcal: 400,
          protein: 20,
          dietary_flags: ['vegetarian'],
          is_default: true,
        },
      ],
    })

    const result = filterMealsByPreferences([meatOnlyMeal, vegMeal], {
      persons: [makePerson({ name: 'Ala', diet: ['vegetarian'] })],
    })

    expect(result.total).toBe(1)
    expect(result.results[0].meal.id).toBe('veg')
  })

  it('accepts meals where both persons have a compatible variant', () => {
    const dualMeal = makeMeal({
      id: 'dual',
      variants: [
        {
          id: 'v-meat',
          meal_id: 'dual',
          name: 'Z mięsem',
          kcal: 600,
          protein: 40,
          dietary_flags: [],
          is_default: true,
        },
        {
          id: 'v-veg',
          meal_id: 'dual',
          name: 'Wegetariański',
          kcal: 400,
          protein: 20,
          dietary_flags: ['vegetarian'],
          is_default: false,
        },
      ],
    })

    const result = filterMealsByPreferences([dualMeal], {
      persons: [
        makePerson({ name: 'Łukasz' }), // no restrictions
        makePerson({ name: 'Ala', diet: ['vegetarian'] }),
      ],
    })

    expect(result.total).toBe(1)
    // Łukasz gets default (meat), Ala gets vegetarian
    expect(result.results[0].variantAssignment['Łukasz'].name).toBe('Z mięsem')
    expect(result.results[0].variantAssignment['Ala'].name).toBe('Wegetariański')
  })

  it('returns warning "too_few" when fewer than 5 meals pass', () => {
    const meals = [makeMeal({ id: '1' }), makeMeal({ id: '2' })]
    const result = filterMealsByPreferences(meals, {
      persons: [makePerson()],
    })
    expect(result.warning).toBe('too_few')
  })

  it('scores cuisine preferences correctly', () => {
    const polskaMeal = makeMeal({ id: 'pl', kuchnia: 'polska' })
    const wloskaMeal = makeMeal({ id: 'it', kuchnia: 'włoska' })

    const result = filterMealsByPreferences([polskaMeal, wloskaMeal], {
      persons: [makePerson({ cuisinePreferences: ['polska'] })],
    })

    // polska should have higher cuisine score
    const polskaResult = result.results.find((r) => r.meal.id === 'pl')
    const wloskaResult = result.results.find((r) => r.meal.id === 'it')
    expect(polskaResult!.cuisineScore).toBeGreaterThan(wloskaResult!.cuisineScore)
  })
})
