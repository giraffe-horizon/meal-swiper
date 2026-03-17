import { describe, it, expect } from 'vitest'
import { filterMealsByPreferences } from '@/lib/meal-filter'
import type {
  MealWithVariants,
  MealVariant,
  PersonSettings,
  CatalogIngredient,
  MealVariantIngredient,
} from '@/types'

describe('meal-filter', () => {
  // Mock ingredients
  const mockBeef: CatalogIngredient = {
    id: 'beef-1',
    name: 'Wołowina',
    category: 'mięso',
    flags: [],
    is_seasoning: false,
  }

  const mockTomato: CatalogIngredient = {
    id: 'tomato-1',
    name: 'Pomidor',
    category: 'warzywa',
    flags: ['vegetarian', 'vegan'],
    is_seasoning: false,
  }

  const mockSalt: CatalogIngredient = {
    id: 'salt-1',
    name: 'Sól',
    category: 'przyprawy',
    flags: ['vegetarian', 'vegan'],
    is_seasoning: true,
  }

  const mockCheese: CatalogIngredient = {
    id: 'cheese-1',
    name: 'Ser',
    category: 'nabiał',
    flags: ['vegetarian'],
    is_seasoning: false,
  }

  // Mock ingredient mappings
  const beefIngredient: MealVariantIngredient = {
    id: 'mapping-1',
    meal_variant_id: 'variant-meat',
    ingredient_id: 'beef-1',
    amount_grams: 200,
    display_amount: '200g',
    scalable: true,
    optional: false,
    ingredient: mockBeef,
  }

  const tomatoIngredient: MealVariantIngredient = {
    id: 'mapping-2',
    meal_variant_id: 'variant-veggie',
    ingredient_id: 'tomato-1',
    amount_grams: 300,
    display_amount: '300g',
    scalable: true,
    optional: false,
    ingredient: mockTomato,
  }

  const saltIngredient: MealVariantIngredient = {
    id: 'mapping-3',
    meal_variant_id: 'variant-meat',
    ingredient_id: 'salt-1',
    amount_grams: 5,
    display_amount: '1 łyżeczka',
    scalable: true,
    optional: false,
    ingredient: mockSalt,
  }

  const cheeseIngredient: MealVariantIngredient = {
    id: 'mapping-4',
    meal_variant_id: 'variant-veggie',
    ingredient_id: 'cheese-1',
    amount_grams: 100,
    display_amount: '100g',
    scalable: true,
    optional: false,
    ingredient: mockCheese,
  }

  // Mock variants
  const meatVariant: MealVariant = {
    id: 'variant-meat',
    meal_id: 'meal-1',
    name: 'Z mięsem',
    kcal: 520,
    protein: 35,
    dietary_flags: [],
    is_default: true,
    ingredients: [beefIngredient, saltIngredient],
  }

  const veggieVariant: MealVariant = {
    id: 'variant-veggie',
    meal_id: 'meal-1',
    name: 'Wegetariańska',
    kcal: 380,
    protein: 15,
    dietary_flags: ['vegetarian'],
    is_default: false,
    ingredients: [tomatoIngredient, cheeseIngredient, saltIngredient],
  }

  const veganVariant: MealVariant = {
    id: 'variant-vegan',
    meal_id: 'meal-1',
    name: 'Wegańska',
    kcal: 320,
    protein: 12,
    dietary_flags: ['vegetarian', 'vegan'],
    is_default: false,
    ingredients: [tomatoIngredient, saltIngredient],
  }

  // Mock meal
  const mockMeal: MealWithVariants = {
    id: 'meal-1',
    nazwa: 'Pasta z pomidorami',
    opis: 'Klasyczna pasta',
    photo_url: '',
    prep_time: 30,
    trudnosc: 'łatwe',
    kuchnia: 'włoska',
    category: 'main',
    przepis: '{}',
    tags: [],
    variants: [meatVariant, veggieVariant, veganVariant],
  }

  describe('filterMealsByPreferences', () => {
    it('allows omnivore + vegetarian combination', () => {
      const omnivore: PersonSettings = {
        name: 'Łukasz',
        kcal: 2500,
        protein: 120,
        diet: [], // no restrictions
      }

      const vegetarian: PersonSettings = {
        name: 'Ala',
        kcal: 1800,
        protein: 80,
        diet: ['vegetarian'],
      }

      const result = filterMealsByPreferences([mockMeal], { persons: [omnivore, vegetarian] })

      expect(result.results).toHaveLength(1)
      expect(result.results[0].variantAssignment['Łukasz']).toEqual(meatVariant) // default variant
      expect(result.results[0].variantAssignment['Ala']).toEqual(veggieVariant) // compatible with vegetarian
      expect(result.warning).toBe('too_few') // Only 1 result < 5
    })

    it('filters out meals when person excludes ingredients', () => {
      const person: PersonSettings = {
        name: 'Anna',
        kcal: 2000,
        protein: 100,
        excludedIngredients: ['beef-1'], // excludes beef
      }

      const result = filterMealsByPreferences([mockMeal], { persons: [person] })

      expect(result.results).toHaveLength(1)
      // Should get vegetarian variant (without beef)
      expect(result.results[0].variantAssignment['Anna']).toEqual(veggieVariant)
    })

    it('filters out meals when no variant satisfies all persons', () => {
      const strictVegan: PersonSettings = {
        name: 'Jan',
        kcal: 2000,
        protein: 100,
        diet: ['vegan'],
        excludedIngredients: ['tomato-1'], // excludes tomato, but vegan variant needs tomato
      }

      const result = filterMealsByPreferences([mockMeal], { persons: [strictVegan] })

      expect(result.results).toHaveLength(0)
      expect(result.warning).toBe('none')
    })

    it('ignores seasoning ingredients when filtering', () => {
      const person: PersonSettings = {
        name: 'Maria',
        kcal: 2000,
        protein: 100,
        excludedIngredients: ['salt-1'], // excludes salt (seasoning)
      }

      const result = filterMealsByPreferences([mockMeal], { persons: [person] })

      // Should still pass because salt is seasoning (is_seasoning: true)
      expect(result.results).toHaveLength(1)
      expect(result.results[0].variantAssignment['Maria']).toEqual(meatVariant) // default
    })

    it('handles empty preferences - all meals pass', () => {
      const person: PersonSettings = {
        name: 'Empty',
        kcal: 2000,
        protein: 100,
        // no diet, cuisinePreferences, or excludedIngredients
      }

      const result = filterMealsByPreferences([mockMeal], { persons: [person] })

      expect(result.results).toHaveLength(1)
      expect(result.results[0].variantAssignment['Empty']).toEqual(meatVariant) // default variant
    })

    it('calculates cuisine score correctly', () => {
      const italianLover: PersonSettings = {
        name: 'Mario',
        kcal: 2000,
        protein: 100,
        cuisinePreferences: ['włoska'],
      }

      const neutralPerson: PersonSettings = {
        name: 'Neutral',
        kcal: 2000,
        protein: 100,
        // no cuisine preferences
      }

      const result = filterMealsByPreferences([mockMeal], {
        persons: [italianLover, neutralPerson],
      })

      expect(result.results).toHaveLength(1)
      expect(result.results[0].cuisineScore).toBe(1) // only Mario likes Italian
    })

    it('returns warning when too few results', () => {
      // Create only 3 meals to test too_few warning
      const meals = [mockMeal, mockMeal, mockMeal] // 3 identical meals

      const person: PersonSettings = {
        name: 'Test',
        kcal: 2000,
        protein: 100,
      }

      const result = filterMealsByPreferences(meals, { persons: [person] })

      expect(result.results).toHaveLength(3)
      expect(result.warning).toBe('too_few') // <5 results
    })

    it('returns warning none when zero results', () => {
      const impossiblePerson: PersonSettings = {
        name: 'Impossible',
        kcal: 2000,
        protein: 100,
        diet: ['vegan'],
        excludedIngredients: ['tomato-1'], // vegan needs tomato, but excludes it
      }

      const result = filterMealsByPreferences([mockMeal], { persons: [impossiblePerson] })

      expect(result.results).toHaveLength(0)
      expect(result.warning).toBe('none')
    })

    it('handles empty persons array', () => {
      const result = filterMealsByPreferences([mockMeal], { persons: [] })

      expect(result.results).toHaveLength(0)
      expect(result.warning).toBe('none')
    })

    it('prefers default variant when compatible', () => {
      const person: PersonSettings = {
        name: 'Default',
        kcal: 2000,
        protein: 100,
        // no restrictions, so all variants are compatible
      }

      const result = filterMealsByPreferences([mockMeal], { persons: [person] })

      expect(result.results).toHaveLength(1)
      // Should choose the default variant (meatVariant)
      expect(result.results[0].variantAssignment['Default']).toEqual(meatVariant)
    })
  })
})
