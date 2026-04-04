import type { Ingredient, Meal, MealWithVariants } from '@/types'

export function toMealForModal(meal: Meal | MealWithVariants): Meal {
  if (!('variants' in meal)) return meal
  const dv = meal.variants.find((v) => v.is_default) ?? meal.variants[0]

  // Convert variant ingredients to legacy Ingredient[] format for shopping list / recipe parsing
  const ingredients: Ingredient[] = (dv?.ingredients ?? []).map((vi) => ({
    name: vi.ingredient?.name ?? `Składnik ${vi.ingredient_id}`,
    amount: vi.display_amount,
  }))

  return {
    id: meal.id,
    nazwa: meal.nazwa,
    opis: meal.opis,
    photo_url: meal.photo_url,
    prep_time: meal.prep_time,
    kcal_baza: dv?.kcal || 0,
    kcal_z_miesem: dv?.kcal || 0,
    bialko_baza: dv?.protein || 0,
    bialko_z_miesem: dv?.protein || 0,
    trudnosc: meal.trudnosc,
    kuchnia: meal.kuchnia,
    category: meal.category,
    skladniki_baza: JSON.stringify(ingredients),
    skladniki_mieso: '[]',
    przepis: meal.przepis,
    tags: meal.tags,
  }
}
