import type {
  Meal,
  MealWithVariants,
  CatalogIngredient,
  MealVariant,
  MealVariantIngredient,
} from '@/types'

// D1 binding type
export interface D1Database {
  prepare(query: string): D1PreparedStatement
  exec(query: string): Promise<D1ExecResult>
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement
  first<T = unknown>(colName?: string): Promise<T | null>
  run<T = unknown>(): Promise<D1Result<T>>
  all<T = unknown>(): Promise<D1Result<T>>
  raw<T = unknown[]>(): Promise<T[]>
}

interface D1Result<T = unknown> {
  results: T[]
  success: boolean
  meta: {
    duration: number
    changes: number
    last_row_id: number
    rows_read: number
    rows_written: number
  }
}

interface D1ExecResult {
  count: number
  duration: number
}

// Fetch all meals from D1 (shared across all tenants)
export async function fetchMealsFromD1(db: D1Database): Promise<Meal[]> {
  const result = await db.prepare('SELECT * FROM meals ORDER BY nazwa').all<{
    id: string
    nazwa: string
    opis: string
    photo_url: string
    prep_time: number
    kcal_baza: number
    kcal_z_miesem: number
    bialko_baza: number
    bialko_z_miesem: number
    trudnosc: string
    kuchnia: string
    category: string
    skladniki_baza: string
    skladniki_mieso: string
    przepis: string
    tags: string
  }>()

  return result.results.map((row) => ({
    id: row.id,
    nazwa: row.nazwa,
    opis: row.opis || '',
    photo_url: row.photo_url || '',
    prep_time: row.prep_time || 0,
    kcal_baza: row.kcal_baza || 0,
    kcal_z_miesem: row.kcal_z_miesem || 0,
    bialko_baza: row.bialko_baza || 0,
    bialko_z_miesem: row.bialko_z_miesem || 0,
    trudnosc: (row.trudnosc as Meal['trudnosc']) || '',
    kuchnia: row.kuchnia || '',
    category: row.category || '',
    skladniki_baza: row.skladniki_baza || '[]',
    skladniki_mieso: row.skladniki_mieso || '[]',
    przepis: row.przepis || '{}',
    tags: JSON.parse(row.tags || '[]'),
  }))
}

// Tenant management
export async function getTenantByToken(
  db: D1Database,
  token: string
): Promise<{ id: string; token: string } | null> {
  const row = await db
    .prepare('SELECT id, token FROM tenants WHERE token = ?')
    .bind(token)
    .first<{ id: string; token: string }>()
  return row ?? null
}

export async function getTenantInfo(
  db: D1Database,
  token: string
): Promise<{ id: string; token: string; name: string; created_at: string } | null> {
  const row = await db
    .prepare('SELECT id, token, name, created_at FROM tenants WHERE token = ?')
    .bind(token)
    .first<{ id: string; token: string; name: string; created_at: string }>()
  return row ?? null
}

export async function updateTenantName(db: D1Database, token: string, name: string): Promise<void> {
  await db.prepare('UPDATE tenants SET name = ? WHERE token = ?').bind(name, token).run()
}

export async function createTenant(
  db: D1Database,
  id: string,
  token: string,
  name: string = ''
): Promise<void> {
  await db
    .prepare("INSERT INTO tenants (id, token, name, created_at) VALUES (?, ?, ?, datetime('now'))")
    .bind(id, token, name)
    .run()
}

// Weekly plans (tenant-scoped)
export async function getWeeklyPlan(
  db: D1Database,
  weekKey: string,
  tenantId: string = 'default'
): Promise<string | null> {
  const row = await db
    .prepare('SELECT plan_data FROM weekly_plans WHERE tenant_id = ? AND week_key = ?')
    .bind(tenantId, weekKey)
    .first<{ plan_data: string }>()
  return row?.plan_data ?? null
}

export async function saveWeeklyPlan(
  db: D1Database,
  weekKey: string,
  planData: string,
  tenantId: string = 'default'
): Promise<void> {
  await db
    .prepare(
      "INSERT OR REPLACE INTO weekly_plans (tenant_id, week_key, plan_data, updated_at) VALUES (?, ?, ?, datetime('now'))"
    )
    .bind(tenantId, weekKey, planData)
    .run()
}

// Settings (tenant-scoped)
export async function getSettings(
  db: D1Database,
  key: string,
  tenantId: string = 'default'
): Promise<string | null> {
  const row = await db
    .prepare('SELECT value FROM settings WHERE tenant_id = ? AND key = ?')
    .bind(tenantId, key)
    .first<{ value: string }>()
  return row?.value ?? null
}

export async function saveSettings(
  db: D1Database,
  key: string,
  value: string,
  tenantId: string = 'default'
): Promise<void> {
  await db
    .prepare(
      "INSERT OR REPLACE INTO settings (tenant_id, key, value, updated_at) VALUES (?, ?, ?, datetime('now'))"
    )
    .bind(tenantId, key, value)
    .run()
}

// Shopping checked (tenant-scoped)
export async function getShoppingChecked(
  db: D1Database,
  weekKey: string,
  tenantId: string = 'default'
): Promise<string | null> {
  const row = await db
    .prepare('SELECT checked_data FROM shopping_checked WHERE tenant_id = ? AND week_key = ?')
    .bind(tenantId, weekKey)
    .first<{ checked_data: string }>()
  return row?.checked_data ?? null
}

export async function saveShoppingChecked(
  db: D1Database,
  weekKey: string,
  checkedData: string,
  tenantId: string = 'default'
): Promise<void> {
  await db
    .prepare(
      "INSERT OR REPLACE INTO shopping_checked (tenant_id, week_key, checked_data, updated_at) VALUES (?, ?, ?, datetime('now'))"
    )
    .bind(tenantId, weekKey, checkedData)
    .run()
}

// New variant architecture query functions

export async function fetchAllMealsWithVariants(db: D1Database): Promise<MealWithVariants[]> {
  // First, get all meals
  const mealsResult = await db
    .prepare(
      `
    SELECT id, nazwa, opis, photo_url, prep_time, trudnosc, kuchnia, category, przepis, tags, created_at
    FROM meals
    ORDER BY nazwa
  `
    )
    .all<{
      id: string
      nazwa: string
      opis: string
      photo_url: string
      prep_time: number
      trudnosc: string
      kuchnia: string
      category: string
      przepis: string
      tags: string
      created_at: string
    }>()

  // Then get all variants with their ingredients in a single query
  const variantsResult = await db
    .prepare(
      `
    SELECT
      mv.id as variant_id,
      mv.meal_id,
      mv.name as variant_name,
      mv.description as variant_description,
      mv.kcal,
      mv.protein,
      mv.carbs,
      mv.fat,
      mv.dietary_flags,
      mv.is_default,
      mv.created_at as variant_created_at,
      mvi.id as ingredient_mapping_id,
      mvi.amount_grams,
      mvi.display_amount,
      mvi.scalable,
      mvi.optional,
      mvi.notes,
      i.id as ingredient_id,
      i.name as ingredient_name,
      i.category as ingredient_category,
      i.flags as ingredient_flags,
      i.is_seasoning,
      i.created_at as ingredient_created_at
    FROM meal_variants mv
    LEFT JOIN meal_variant_ingredients mvi ON mv.id = mvi.meal_variant_id
    LEFT JOIN ingredients i ON mvi.ingredient_id = i.id
    ORDER BY mv.meal_id, mv.is_default DESC, mv.id, mvi.id
  `
    )
    .all<{
      variant_id: string
      meal_id: string
      variant_name: string
      variant_description?: string
      kcal: number
      protein: number
      carbs?: number
      fat?: number
      dietary_flags: string
      is_default: number
      variant_created_at: string
      ingredient_mapping_id?: string
      amount_grams?: number
      display_amount?: string
      scalable?: number
      optional?: number
      notes?: string
      ingredient_id?: string
      ingredient_name?: string
      ingredient_category?: string
      ingredient_flags?: string
      is_seasoning?: number
      ingredient_created_at?: string
    }>()

  // Group variants by meal_id
  const variantsByMealId: Record<string, MealVariant[]> = {}
  const ingredientsByVariantId: Record<string, MealVariantIngredient[]> = {}

  for (const row of variantsResult.results) {
    // Build variant object
    if (!variantsByMealId[row.meal_id]) {
      variantsByMealId[row.meal_id] = []
    }

    let variant = variantsByMealId[row.meal_id].find((v) => v.id === row.variant_id)
    if (!variant) {
      variant = {
        id: row.variant_id,
        meal_id: row.meal_id,
        name: row.variant_name,
        description: row.variant_description,
        kcal: row.kcal,
        protein: row.protein,
        carbs: row.carbs,
        fat: row.fat,
        dietary_flags: JSON.parse(row.dietary_flags || '[]'),
        is_default: Boolean(row.is_default),
        created_at: row.variant_created_at,
      }
      variantsByMealId[row.meal_id].push(variant)
    }

    // Build ingredient mapping if exists
    if (row.ingredient_mapping_id && row.ingredient_id) {
      if (!ingredientsByVariantId[row.variant_id]) {
        ingredientsByVariantId[row.variant_id] = []
      }

      const ingredientMapping: MealVariantIngredient = {
        id: row.ingredient_mapping_id,
        meal_variant_id: row.variant_id,
        ingredient_id: row.ingredient_id,
        amount_grams: row.amount_grams!,
        display_amount: row.display_amount!,
        scalable: Boolean(row.scalable),
        optional: Boolean(row.optional),
        notes: row.notes,
        ingredient: {
          id: row.ingredient_id,
          name: row.ingredient_name!,
          category: row.ingredient_category! as any,
          flags: JSON.parse(row.ingredient_flags || '[]'),
          is_seasoning: Boolean(row.is_seasoning),
          created_at: row.ingredient_created_at,
        },
      }
      ingredientsByVariantId[row.variant_id].push(ingredientMapping)
    }
  }

  // Combine meals with their variants
  return mealsResult.results.map(
    (meal): MealWithVariants => ({
      id: meal.id,
      nazwa: meal.nazwa,
      opis: meal.opis || '',
      photo_url: meal.photo_url || '',
      prep_time: meal.prep_time || 0,
      trudnosc: (meal.trudnosc as any) || '',
      kuchnia: meal.kuchnia || '',
      category: meal.category || '',
      przepis: meal.przepis || '{}',
      tags: JSON.parse(meal.tags || '[]'),
      variants: variantsByMealId[meal.id] || [],
      created_at: meal.created_at,
    })
  )
}

export async function fetchAllIngredientsCatalog(db: D1Database): Promise<CatalogIngredient[]> {
  const result = await db
    .prepare(
      `
    SELECT id, name, category, flags, is_seasoning, created_at
    FROM ingredients
    ORDER BY category, name
  `
    )
    .all<{
      id: string
      name: string
      category: string
      flags: string
      is_seasoning: number
      created_at: string
    }>()

  return result.results.map(
    (row): CatalogIngredient => ({
      id: row.id,
      name: row.name,
      category: row.category as any,
      flags: JSON.parse(row.flags || '[]'),
      is_seasoning: Boolean(row.is_seasoning),
      created_at: row.created_at,
    })
  )
}

export async function fetchAllCuisines(db: D1Database): Promise<string[]> {
  const result = await db
    .prepare(
      `
    SELECT DISTINCT kuchnia
    FROM meals
    WHERE kuchnia IS NOT NULL AND kuchnia != ''
    ORDER BY kuchnia
  `
    )
    .all<{ kuchnia: string }>()

  return result.results.map((row) => row.kuchnia)
}
