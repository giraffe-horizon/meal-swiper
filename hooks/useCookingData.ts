import { useMemo } from 'react'
import type {
  Meal,
  MealWithVariants,
  MealVariant,
  PersonSettings,
  MealVariantIngredient,
} from '@/types'
import {
  scaleIngredient,
  scaleNutrition,
  calculatePersonScale,
  scaleIngredientAmount,
} from '@/lib/scaling'
import { parseRecipe, enrichStepsStructured } from '@/lib/recipe'

export function useCookingData(
  meal: Meal | MealWithVariants,
  scaleFactor: number,
  persons: PersonSettings[],
  variantAssignment?: Record<string, MealVariant> | null
) {
  const isVariantMeal = 'variants' in meal && !!variantAssignment

  const legacyData = useMemo(() => {
    if (isVariantMeal) return null

    const legacyMeal = meal as Meal
    const { steps, tips, baseIngredients, meatIngredients } = parseRecipe(legacyMeal)
    const scaledBase = baseIngredients.map((ing) => scaleIngredient(ing, scaleFactor))
    const scaledMeat = meatIngredients.map((ing) => scaleIngredient(ing, scaleFactor))
    const structuredSteps = enrichStepsStructured(steps, [...scaledBase, ...scaledMeat])

    return {
      steps: structuredSteps,
      tips,
      scaledBase,
      scaledMeat,
      totalKcal: scaleNutrition(legacyMeal.kcal_baza, scaleFactor),
      totalProtein: scaleNutrition(legacyMeal.bialko_baza, scaleFactor),
    }
  }, [meal, scaleFactor, isVariantMeal])

  const variantData = useMemo(() => {
    if (!isVariantMeal || !variantAssignment) return null

    const variantMeal = meal as MealWithVariants
    const legacyForParsing: Meal = {
      id: variantMeal.id,
      nazwa: variantMeal.nazwa,
      opis: variantMeal.opis,
      photo_url: variantMeal.photo_url,
      prep_time: variantMeal.prep_time,
      kcal_baza: 0,
      kcal_z_miesem: 0,
      bialko_baza: 0,
      bialko_z_miesem: 0,
      trudnosc: variantMeal.trudnosc,
      kuchnia: variantMeal.kuchnia,
      category: variantMeal.category,
      skladniki_baza: '[]',
      skladniki_mieso: '[]',
      przepis: variantMeal.przepis,
      tags: variantMeal.tags,
    }

    const { steps, tips } = parseRecipe(legacyForParsing)

    const variantGroups = new Map<string, { persons: PersonSettings[]; variant: MealVariant }>()
    for (const person of persons) {
      const variant = variantAssignment[person.name]
      if (!variant) continue
      const key = variant.id
      if (!variantGroups.has(key)) variantGroups.set(key, { persons: [], variant })
      variantGroups.get(key)!.persons.push(person)
    }

    const allIngredientIds = new Set<string>()
    const ingredientsByVariant = new Map<string, Map<string, MealVariantIngredient>>()
    for (const [variantId, { variant }] of variantGroups) {
      const variantIngredients = new Map()
      for (const ing of variant.ingredients || []) {
        allIngredientIds.add(ing.ingredient_id)
        variantIngredients.set(ing.ingredient_id, ing)
      }
      ingredientsByVariant.set(variantId, variantIngredients)
    }

    const sharedIngredients: Array<MealVariantIngredient & { totalDisplay: string }> = []
    const uniqueByVariant = new Map<string, MealVariantIngredient[]>()

    for (const ingredientId of allIngredientIds) {
      const variants = Array.from(variantGroups.keys())
      const presentInAll = variants.every((vId) => ingredientsByVariant.get(vId)?.has(ingredientId))

      if (presentInAll && variants.length > 1) {
        let totalGrams = 0
        let displayIngredient = null
        for (const [vId, { persons: vPersons }] of variantGroups) {
          const ingredient = ingredientsByVariant.get(vId)!.get(ingredientId)!
          for (const person of vPersons) {
            const { scale } = calculatePersonScale(variantGroups.get(vId)!.variant, person)
            totalGrams += scaleIngredientAmount(ingredient, scale).grams || 0
          }
          if (!displayIngredient) displayIngredient = ingredient
        }
        if (displayIngredient) {
          sharedIngredients.push({
            ...displayIngredient,
            totalDisplay:
              totalGrams >= 1000 ? `${(totalGrams / 1000).toFixed(1)} kg` : `${totalGrams} g`,
          })
        }
      } else {
        for (const [vId] of variantGroups) {
          const ingredient = ingredientsByVariant.get(vId)?.get(ingredientId)
          if (!ingredient) continue
          if (!uniqueByVariant.has(vId)) uniqueByVariant.set(vId, [])
          uniqueByVariant.get(vId)!.push(ingredient)
        }
      }
    }

    const personData: Array<{
      person: PersonSettings
      variant: MealVariant
      resultKcal: number
      resultProtein: number
      scaledIngredients: Array<
        MealVariantIngredient & { scaled: ReturnType<typeof scaleIngredientAmount> }
      >
    }> = []

    for (const person of persons) {
      const variant = variantAssignment[person.name]
      if (!variant) continue
      const { scale, resultKcal, resultProtein } = calculatePersonScale(variant, person)
      personData.push({
        person,
        variant,
        resultKcal,
        resultProtein,
        scaledIngredients: (variant.ingredients || []).map((ing) => ({
          ...ing,
          scaled: scaleIngredientAmount(ing, scale),
        })),
      })
    }

    return {
      steps: enrichStepsStructured(steps, []),
      tips,
      sharedIngredients,
      uniqueByVariant,
      variantGroups,
      personData,
      hasSplit: variantGroups.size > 1,
    }
  }, [meal, variantAssignment, persons, isVariantMeal])

  return { isVariantMeal, legacyData, variantData }
}
