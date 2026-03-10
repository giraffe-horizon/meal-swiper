export interface Ingredient {
  name: string
  amount: string
  category?: 'mięso' | 'warzywa' | 'nabiał' | 'suche'
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
  kcal: number
  protein: number
}

export interface AppSettings {
  people: number
  persons: PersonSettings[]
  theme: 'light' | 'dark' | 'system'
}
