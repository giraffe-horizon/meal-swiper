import type { Meal, Ingredient } from '@/types'

export interface IngredientWithCategory {
  name: string
  category: 'mięso' | 'warzywa' | 'nabiał' | 'suche' | 'inne'
}

export function parseIngredients(jsonStr: string): Ingredient[] {
  try {
    return JSON.parse(jsonStr) as Ingredient[]
  } catch {
    return []
  }
}

export function getMealMatchScore(meal: Meal, availableIngredients: Set<string>): number {
  const ingredients = parseIngredients(meal.skladniki_baza)
  if (ingredients.length === 0) return 0
  const matched = ingredients.filter((ing) => availableIngredients.has(ing.name.toLowerCase()))
  return matched.length / ingredients.length
}

export function getAllIngredients(meals: Meal[]): IngredientWithCategory[] {
  const ingredientMap = new Map<string, IngredientWithCategory>()

  for (const meal of meals) {
    const ingredients = parseIngredients(meal.skladniki_baza)
    for (const ing of ingredients) {
      const key = ing.name.toLowerCase()
      if (!ingredientMap.has(key)) {
        const cat = ing.category as IngredientWithCategory['category'] | undefined
        ingredientMap.set(key, {
          name: ing.name,
          category: cat ?? 'inne',
        })
      }
    }
  }

  return Array.from(ingredientMap.values()).sort(
    (a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
  )
}

export function filterMealsByFridge(
  meals: Meal[],
  availableIngredients: string[],
  minScore = 0.5
): Meal[] {
  if (availableIngredients.length === 0) return meals
  const available = new Set(availableIngredients.map((i) => i.toLowerCase()))
  return meals.filter((m) => getMealMatchScore(m, available) >= minScore)
}

export function countMatchingMeals(meals: Meal[], availableIngredients: string[]): number {
  return filterMealsByFridge(meals, availableIngredients).length
}
