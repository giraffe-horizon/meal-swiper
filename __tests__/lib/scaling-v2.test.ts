import { describe, it, expect } from 'vitest'
import { calculatePersonScale, scaleIngredientAmount, aggregateShoppingList } from '@/lib/scaling'
import type {
  MealVariant,
  PersonSettings,
  MealVariantIngredient,
  CatalogIngredient,
  MealWithVariants,
} from '@/types'

describe('scaling-v2 (variant architecture)', () => {
  // Mock ingredients
  const mockTomato: CatalogIngredient = {
    id: 'tomato-1',
    name: 'Pomidory',
    category: 'warzywa',
    flags: [],
    is_seasoning: false,
  }

  const mockSalt: CatalogIngredient = {
    id: 'salt-1',
    name: 'Sól',
    category: 'przyprawy',
    flags: [],
    is_seasoning: true,
  }

  const mockChicken: CatalogIngredient = {
    id: 'chicken-1',
    name: 'Kurczak',
    category: 'mięso',
    flags: [],
    is_seasoning: false,
  }

  describe('calculatePersonScale', () => {
    const variant: MealVariant = {
      id: 'variant-1',
      meal_id: 'meal-1',
      name: 'Test Variant',
      kcal: 520,
      protein: 30,
      dietary_flags: [],
      is_default: true,
    }

    it('calculates scale for 2500 kcal / 5 meals = 500 per meal', () => {
      const person: PersonSettings = {
        name: 'Łukasz',
        kcal: 2000, // legacy field
        protein: 120,
        dailyKcal: 2500,
        dailyProtein: 150,
        mealsPerDay: 5,
      }

      const result = calculatePersonScale(variant, person)

      // Expected: (2500 / 5) / 520 = 500 / 520 ≈ 0.96
      expect(result.scale).toBeCloseTo(0.96, 2)
      expect(result.resultKcal).toBe(500) // 520 * 0.96 ≈ 500
      expect(result.resultProtein).toBe(29) // 30 * 0.96 ≈ 29
    })

    it('falls back to legacy kcal field', () => {
      const person: PersonSettings = {
        name: 'Legacy',
        kcal: 2400,
        protein: 120,
        // no dailyKcal, mealsPerDay
      }

      const result = calculatePersonScale(variant, person)

      // Expected: (2400 / 3) / 520 = 800 / 520 ≈ 1.54
      expect(result.scale).toBeCloseTo(1.54, 2)
      expect(result.resultKcal).toBe(800) // 520 * 1.54 ≈ 800
      expect(result.resultProtein).toBe(46) // 30 * 1.54 ≈ 46
    })

    it('uses defaults when fields missing', () => {
      const person: PersonSettings = {
        name: 'Default',
        kcal: 1000, // will be used since dailyKcal is missing
        protein: 50,
        // missing dailyKcal, dailyProtein, mealsPerDay (defaults to 3)
      }

      const result = calculatePersonScale(variant, person)

      // Expected: (1000 / 3) / 520 = 333.33 / 520 ≈ 0.64
      expect(result.scale).toBeCloseTo(0.64, 2)
      expect(result.resultKcal).toBe(333) // 520 * 0.64 ≈ 333
      expect(result.resultProtein).toBe(19) // 30 * 0.64 ≈ 19
    })

    it('handles zero kcal variant safely', () => {
      const zeroKcalVariant: MealVariant = {
        id: 'zero-variant',
        meal_id: 'meal-zero',
        name: 'Zero Kcal Variant',
        kcal: 0,
        protein: 10,
        dietary_flags: [],
        is_default: true,
      }

      const person: PersonSettings = {
        name: 'Test',
        kcal: 2000,
        protein: 120,
        dailyKcal: 2000,
        mealsPerDay: 3,
      }

      const result = calculatePersonScale(zeroKcalVariant, person)

      // Should not crash and should return reasonable defaults
      expect(result.scale).toBe(1)
      expect(result.resultKcal).toBe(0)
      expect(result.resultProtein).toBe(10)
    })

    it('handles negative kcal variant safely', () => {
      const negativeKcalVariant: MealVariant = {
        id: 'negative-variant',
        meal_id: 'meal-negative',
        name: 'Negative Kcal Variant',
        kcal: -100,
        protein: 10,
        dietary_flags: [],
        is_default: true,
      }

      const person: PersonSettings = {
        name: 'Test',
        kcal: 2000,
        protein: 120,
        dailyKcal: 2000,
        mealsPerDay: 3,
      }

      const result = calculatePersonScale(negativeKcalVariant, person)

      // Should handle negative values (though unrealistic)
      expect(result.scale).toBeLessThan(0)
      expect(result.resultKcal).toBe(667) // 2000/3 = 666.67, 666.67/-100 = -6.67, -100 * -6.67 = 667
      expect(result.resultProtein).toBe(-67) // 10 * -6.67 = -66.7 ≈ -67
    })
  })

  describe('scaleIngredientAmount', () => {
    it('scales scalable ingredient correctly', () => {
      const ingredient: MealVariantIngredient = {
        id: 'mapping-1',
        meal_variant_id: 'variant-1',
        ingredient_id: 'tomato-1',
        amount_grams: 200,
        display_amount: '200g',
        scalable: true,
        optional: false,
        ingredient: mockTomato,
      }

      const result = scaleIngredientAmount(ingredient, 1.5)

      expect(result.grams).toBe(300) // 200 * 1.5 = 300
      expect(result.display).toBe('300 g')
      expect(result.ml).toBeNull()
      expect(result.pieces).toBeNull()
    })

    it('returns original values when scalable=false', () => {
      const ingredient: MealVariantIngredient = {
        id: 'mapping-2',
        meal_variant_id: 'variant-1',
        ingredient_id: 'salt-1',
        amount_grams: 5,
        display_amount: 'do smaku',
        scalable: false,
        optional: true,
        ingredient: mockSalt,
      }

      const result = scaleIngredientAmount(ingredient, 2.0)

      expect(result.grams).toBe(5) // unchanged
      expect(result.display).toBe('do smaku') // unchanged
      expect(result.ml).toBeNull()
      expect(result.pieces).toBeNull()
    })

    it('rounds to nearest 5g', () => {
      const ingredient: MealVariantIngredient = {
        id: 'mapping-3',
        meal_variant_id: 'variant-1',
        ingredient_id: 'chicken-1',
        amount_grams: 150,
        display_amount: '150g',
        scalable: true,
        optional: false,
        ingredient: mockChicken,
      }

      // 150 * 1.21 = 181.5 → should round to 180
      const result = scaleIngredientAmount(ingredient, 1.21)

      expect(result.grams).toBe(180) // rounded to nearest 5g
      expect(result.display).toBe('180 g')
    })

    it('converts grams to kg when >= 1000g', () => {
      const ingredient: MealVariantIngredient = {
        id: 'mapping-4',
        meal_variant_id: 'variant-1',
        ingredient_id: 'chicken-1',
        amount_grams: 800,
        display_amount: '800g',
        scalable: true,
        optional: false,
        ingredient: mockChicken,
      }

      // 800 * 1.5 = 1200g → should show as "1.2 kg"
      const result = scaleIngredientAmount(ingredient, 1.5)

      expect(result.grams).toBe(1200)
      expect(result.display).toBe('1.2 kg')
    })
  })

  describe('aggregateShoppingList', () => {
    const tomatoIngredient: MealVariantIngredient = {
      id: 'mapping-1',
      meal_variant_id: 'variant-1',
      ingredient_id: 'tomato-1',
      amount_grams: 200,
      display_amount: '200g',
      scalable: true,
      optional: false,
      ingredient: mockTomato,
    }

    const chickenIngredient: MealVariantIngredient = {
      id: 'mapping-2',
      meal_variant_id: 'variant-2',
      ingredient_id: 'chicken-1',
      amount_grams: 300,
      display_amount: '300g',
      scalable: true,
      optional: false,
      ingredient: mockChicken,
    }

    const variant1: MealVariant = {
      id: 'variant-1',
      meal_id: 'meal-1',
      name: 'Variant 1',
      kcal: 400,
      protein: 20,
      dietary_flags: [],
      is_default: true,
      ingredients: [tomatoIngredient],
    }

    const variant2: MealVariant = {
      id: 'variant-2',
      meal_id: 'meal-2',
      name: 'Variant 2',
      kcal: 500,
      protein: 35,
      dietary_flags: [],
      is_default: true,
      ingredients: [chickenIngredient, tomatoIngredient], // also has tomatoes
    }

    const mockMeal1: MealWithVariants = {
      id: 'meal-1',
      nazwa: 'Meal 1',
      opis: 'Test meal 1',
      photo_url: '',
      prep_time: 30,
      trudnosc: 'łatwe',
      kuchnia: 'test',
      category: 'main',
      przepis: '{}',
      tags: [],
      variants: [variant1],
    }

    const mockMeal2: MealWithVariants = {
      id: 'meal-2',
      nazwa: 'Meal 2',
      opis: 'Test meal 2',
      photo_url: '',
      prep_time: 25,
      trudnosc: 'łatwe',
      kuchnia: 'test',
      category: 'main',
      przepis: '{}',
      tags: [],
      variants: [variant2],
    }

    it('aggregates ingredients from multiple meals and persons', () => {
      const weekPlan = [
        {
          meal: mockMeal1,
          variantAssignment: { Łukasz: variant1, Ala: variant1 },
          personScales: { Łukasz: 1.5, Ala: 0.8 },
        },
        {
          meal: mockMeal2,
          variantAssignment: { Łukasz: variant2 } as Record<string, MealVariant>,
          personScales: { Łukasz: 1.2 } as Record<string, number>,
        },
      ]

      const result = aggregateShoppingList(weekPlan)

      // Expected tomatoes: (200 * 1.5) + (200 * 0.8) + (200 * 1.2) = 300 + 160 + 240 = 700g
      // Expected chicken: 300 * 1.2 = 360g
      expect(result).toHaveLength(2)

      const tomatoes = result.find((item) => item.ingredient.id === 'tomato-1')
      expect(tomatoes).toBeDefined()
      expect(tomatoes!.totalGrams).toBe(700)
      expect(tomatoes!.display).toBe('700 g')

      const chicken = result.find((item) => item.ingredient.id === 'chicken-1')
      expect(chicken).toBeDefined()
      expect(chicken!.totalGrams).toBe(360)
      expect(chicken!.display).toBe('360 g')
    })

    it('sorts by category then by name', () => {
      const weekPlan = [
        {
          meal: mockMeal2, // has both chicken (mięso) and tomatoes (warzywa)
          variantAssignment: { Test: variant2 },
          personScales: { Test: 1.0 },
        },
      ]

      const result = aggregateShoppingList(weekPlan)

      expect(result).toHaveLength(2)
      // "mięso" should come before "warzywa" alphabetically
      expect(result[0].ingredient.category).toBe('mięso')
      expect(result[1].ingredient.category).toBe('warzywa')
    })

    it('converts to kg when >= 1000g', () => {
      const weekPlan = [
        {
          meal: mockMeal1,
          variantAssignment: { BigEater: variant1 },
          personScales: { BigEater: 6.0 }, // 200 * 6 = 1200g
        },
      ]

      const result = aggregateShoppingList(weekPlan)

      expect(result).toHaveLength(1)
      expect(result[0].totalGrams).toBe(1200)
      expect(result[0].display).toBe('1.2 kg')
    })
  })
})
