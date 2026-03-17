// Deprecated: Use CatalogIngredient instead
export interface Ingredient {
  name: string
  amount: string
  category?: 'mięso' | 'warzywa' | 'nabiał' | 'suche'
}

// New ingredient flags and types for variant architecture
export type IngredientFlag =
  | 'gluten_free'
  | 'dairy_free'
  | 'vegetarian'
  | 'vegan'
  | 'low_carb'
  | 'high_protein'

export type DietaryFlag =
  | 'vegetarian'
  | 'vegan'
  | 'gluten_free'
  | 'dairy_free'
  | 'low_carb'
  | 'keto'
  | 'paleo'

export type IngredientCategory =
  | 'mięso'
  | 'warzywa'
  | 'owoce'
  | 'nabiał'
  | 'zboża'
  | 'przyprawy'
  | 'oleje'
  | 'inne'

export interface CatalogIngredient {
  id: string
  name: string
  category: IngredientCategory
  flags: IngredientFlag[]
  is_seasoning: boolean
  created_at?: string
}

export interface MealVariant {
  id: string
  meal_id: string
  name: string
  description?: string
  kcal: number
  protein: number
  carbs?: number
  fat?: number
  dietary_flags: DietaryFlag[]
  is_default: boolean
  created_at?: string
}

export interface MealVariantIngredient {
  id: string
  meal_variant_id: string
  ingredient_id: string
  amount_grams: number
  display_amount: string
  scalable: boolean
  optional: boolean
  notes?: string
  ingredient?: CatalogIngredient
}

export interface MealWithVariants {
  id: string
  nazwa: string
  opis: string
  photo_url: string
  prep_time: number
  trudnosc: 'łatwe' | 'średnie' | 'trudne' | ''
  kuchnia: string
  category: string
  przepis: string // JSON string: RecipeStep
  tags: string[]
  variants: MealVariant[]
  created_at?: string
}

export interface RecipeStep {
  kroki: string[]
  wskazowki?: string
}

export interface Makro {
  kcal: number
  bialko: number
  wegle?: number
  tluszcz?: number
}

export interface Meal {
  id: string
  nazwa: string
  opis: string
  photo_url: string
  prep_time: number
  kcal_baza: number
  kcal_z_miesem: number
  bialko_baza: number
  bialko_z_miesem: number
  trudnosc: 'łatwe' | 'średnie' | 'trudne' | ''
  kuchnia: string
  category: string
  skladniki_baza: string // JSON string: Ingredient[]
  skladniki_mieso: string // JSON string: Ingredient[]
  przepis: string // JSON string: RecipeStep
  tags: string[]
}

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri'

export type WeeklyPlan = {
  [K in DayKey]: Meal | null
} & {
  [K in `${DayKey}_free`]: boolean
}

export type ViewId = 'plan' | 'swipe' | 'shopping' | 'cooking' | 'settings'

export interface Tab {
  id: ViewId
  label: string
  icon: string
}

export interface PersonSettings {
  name: string
  kcal: number // Deprecated: use dailyKcal
  protein: number // Deprecated: use dailyProtein
  dailyKcal?: number
  dailyProtein?: number
  mealsPerDay?: number
  diet?: DietaryFlag[]
  cuisinePreferences?: string[]
  excludedIngredients?: string[]
}

export interface AppSettings {
  people: number
  persons: PersonSettings[]
  theme: 'light' | 'dark' | 'system'
}

export interface TenantInfo {
  id: string
  token: string
  name: string
  created_at: string
}
