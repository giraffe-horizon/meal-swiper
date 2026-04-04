import type { MealWithVariants, MealVariant, PersonSettings, DietaryFlag } from '@/types'

export interface HouseholdConfig {
  persons: PersonSettings[]
}

export interface FilteredMeal {
  meal: MealWithVariants
  variantAssignment: Record<string, MealVariant> // personName → najlepszy wariant
  cuisineScore: number
}

export interface FilterResult {
  results: FilteredMeal[]
  total: number
  warning?: 'too_few' | 'none' // too_few jeśli <5, none jeśli 0
}

/**
 * Sprawdza czy wariant pasuje do diety osoby
 */
function isVariantCompatibleWithDiet(variant: MealVariant, personDiet: DietaryFlag[]): boolean {
  if (!personDiet || personDiet.length === 0) {
    return true // brak ograniczeń diety
  }

  // Wszystkie flagi diety osoby muszą być zawarte w flagach wariantu
  return personDiet.every((dietFlag) => variant.dietary_flags.includes(dietFlag))
}

/**
 * Sprawdza czy wariant zawiera wykluczony składnik dla danej osoby
 */
function hasExcludedIngredients(variant: MealVariant, excludedIngredients: string[]): boolean {
  if (!excludedIngredients || excludedIngredients.length === 0) {
    return false
  }

  // Sprawdź czy jakikolwiek składnik wariantu jest wykluczony
  // Ignoruj przyprawy (is_seasoning=true)
  const variantIngredients = variant.ingredients || []
  return variantIngredients.some((ingredient) => {
    if (ingredient.ingredient?.is_seasoning) {
      return false // ignoruj przyprawy
    }
    return excludedIngredients.includes(ingredient.ingredient_id)
  })
}

/**
 * Znajduje najlepszy wariant dla danej osoby
 */
function findBestVariantForPerson(
  variants: MealVariant[],
  person: PersonSettings
): MealVariant | null {
  const compatibleVariants = variants.filter((variant) => {
    // Sprawdź zgodność z dietą
    if (!isVariantCompatibleWithDiet(variant, person.diet || [])) {
      return false
    }

    // Sprawdź wykluczzone składniki
    if (hasExcludedIngredients(variant, person.excludedIngredients || [])) {
      return false
    }

    return true
  })

  if (compatibleVariants.length === 0) {
    return null
  }

  // Preferuj domyślny wariant jeśli jest kompatybilny
  const defaultVariant = compatibleVariants.find((v) => v.is_default)
  if (defaultVariant) {
    return defaultVariant
  }

  // W przeciwnym razie zwróć pierwszy kompatybilny
  return compatibleVariants[0]
}

/**
 * Oblicza punkty za kuchnię dla posiłku
 */
function calculateCuisineScore(meal: MealWithVariants, persons: PersonSettings[]): number {
  if (!meal.kuchnia) {
    return 0
  }

  let score = 0
  for (const person of persons) {
    const preferences = person.cuisinePreferences || []
    if (preferences.length === 0) {
      // Brak preferencji = neutralny
      continue
    }
    if (preferences.includes(meal.kuchnia)) {
      score++
    }
  }

  return score
}

/**
 * Shuffle array in place (Fisher-Yates)
 */
function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
}

/**
 * Filtruje posiłki według preferencji gospodarstwa domowego
 * Każda osoba może mieć inny wariant tego samego posiłku
 */
export function filterMealsByPreferences(
  meals: MealWithVariants[],
  config: HouseholdConfig
): FilterResult {
  if (!config.persons || config.persons.length === 0) {
    return {
      results: [],
      total: 0,
      warning: 'none',
    }
  }

  const filteredMeals: FilteredMeal[] = []

  for (const meal of meals) {
    const variantAssignment: Record<string, MealVariant> = {}
    let hasAssignmentForAllPersons = true

    // Dla każdej osoby znajdź pasujący wariant
    for (const person of config.persons) {
      const bestVariant = findBestVariantForPerson(meal.variants, person)
      if (!bestVariant) {
        hasAssignmentForAllPersons = false
        break
      }
      variantAssignment[person.name] = bestVariant
    }

    // Posiłek przechodzi tylko jeśli każda osoba ma pasujący wariant
    if (hasAssignmentForAllPersons) {
      const cuisineScore = calculateCuisineScore(meal, config.persons)
      filteredMeals.push({
        meal,
        variantAssignment,
        cuisineScore,
      })
    }
  }

  // Sortuj po cuisineScore (malejąco), potem shuffle w ramach tego samego score
  const scoreGroups: Record<number, FilteredMeal[]> = {}
  for (const filteredMeal of filteredMeals) {
    const score = filteredMeal.cuisineScore
    if (!scoreGroups[score]) {
      scoreGroups[score] = []
    }
    scoreGroups[score].push(filteredMeal)
  }

  // Shuffle każdej grupy i połącz w kolejności malejącej po score
  const sortedResults: FilteredMeal[] = []
  const scores = Object.keys(scoreGroups)
    .map(Number)
    .sort((a, b) => b - a)

  for (const score of scores) {
    const group = scoreGroups[score]
    shuffleArray(group)
    sortedResults.push(...group)
  }

  // Ustal warning
  let warning: 'too_few' | 'none' | undefined
  if (sortedResults.length === 0) {
    warning = 'none'
  } else if (sortedResults.length < 5) {
    warning = 'too_few'
  }

  return {
    results: sortedResults,
    total: sortedResults.length,
    warning,
  }
}
