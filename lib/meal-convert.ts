import type { Meal, MealWithVariants } from '@/types'

export function toMealForModal(meal: Meal | MealWithVariants): Meal {
  if (!('variants' in meal)) return meal
  const dv = meal.variants.find((v) => v.is_default)
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
    skladniki_baza: meal.przepis,
    skladniki_mieso: '[]',
    przepis: meal.przepis,
    tags: meal.tags,
  }
}
