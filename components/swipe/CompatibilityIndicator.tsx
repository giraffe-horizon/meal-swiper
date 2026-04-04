import { View, Text } from 'react-native'
import type { MealWithVariants, MealVariant, PersonSettings, DietaryFlag } from '@/types'

export interface CompatibilityIndicatorProps {
  meal: MealWithVariants
  persons: PersonSettings[]
}

function isVariantCompatible(variant: MealVariant, person: PersonSettings): boolean {
  const diet = person.diet || []
  if (diet.length > 0 && !diet.every((flag: DietaryFlag) => variant.dietary_flags.includes(flag))) {
    return false
  }

  // Check excluded ingredients (skip seasonings)
  const excluded = person.excludedIngredients || []
  if (excluded.length > 0 && variant.ingredients) {
    const hasExcluded = variant.ingredients.some(
      (ing) => !ing.ingredient?.is_seasoning && excluded.includes(ing.ingredient_id)
    )
    if (hasExcluded) return false
  }

  return true
}

function countCompatiblePersons(meal: MealWithVariants, persons: PersonSettings[]): number {
  let count = 0
  for (const person of persons) {
    const hasCompatible = meal.variants.some((variant) => isVariantCompatible(variant, person))
    if (hasCompatible) count++
  }
  return count
}

export default function CompatibilityIndicator({ meal, persons }: CompatibilityIndicatorProps) {
  if (persons.length === 0) return null

  const compatibleCount = countCompatiblePersons(meal, persons)
  const allCompatible = compatibleCount === persons.length

  if (allCompatible) {
    return (
      <View
        className="bg-primary/20 rounded-full px-2 py-0.5"
        accessibilityRole="text"
        accessibilityLabel={`Posiłek pasuje dla ${persons.length} osób`}
      >
        <Text className="text-primary text-xs font-semibold">✓ Oboje</Text>
      </View>
    )
  }

  if (compatibleCount > 0) {
    return (
      <View
        className="bg-yellow-500/20 rounded-full px-2 py-0.5"
        accessibilityRole="text"
        accessibilityLabel={`Posiłek pasuje dla ${compatibleCount} z ${persons.length} osób`}
      >
        <Text className="text-yellow-500 text-xs font-semibold">{compatibleCount} osoba</Text>
      </View>
    )
  }

  return null
}
