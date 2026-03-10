import type { Meal } from '@/types'

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

// Fetch all meals from D1
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

// Weekly plans
export async function getWeeklyPlan(db: D1Database, weekKey: string): Promise<string | null> {
  const row = await db
    .prepare('SELECT plan_data FROM weekly_plans WHERE week_key = ?')
    .bind(weekKey)
    .first<{ plan_data: string }>()
  return row?.plan_data ?? null
}

export async function saveWeeklyPlan(
  db: D1Database,
  weekKey: string,
  planData: string
): Promise<void> {
  await db
    .prepare(
      "INSERT OR REPLACE INTO weekly_plans (week_key, plan_data, updated_at) VALUES (?, ?, datetime('now'))"
    )
    .bind(weekKey, planData)
    .run()
}

// Settings
export async function getSettings(db: D1Database, key: string): Promise<string | null> {
  const row = await db
    .prepare('SELECT value FROM settings WHERE key = ?')
    .bind(key)
    .first<{ value: string }>()
  return row?.value ?? null
}

export async function saveSettings(db: D1Database, key: string, value: string): Promise<void> {
  await db
    .prepare(
      "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))"
    )
    .bind(key, value)
    .run()
}

// Shopping checked
export async function getShoppingChecked(db: D1Database, weekKey: string): Promise<string | null> {
  const row = await db
    .prepare('SELECT checked_data FROM shopping_checked WHERE week_key = ?')
    .bind(weekKey)
    .first<{ checked_data: string }>()
  return row?.checked_data ?? null
}

export async function saveShoppingChecked(
  db: D1Database,
  weekKey: string,
  checkedData: string
): Promise<void> {
  await db
    .prepare(
      "INSERT OR REPLACE INTO shopping_checked (week_key, checked_data, updated_at) VALUES (?, ?, datetime('now'))"
    )
    .bind(weekKey, checkedData)
    .run()
}
