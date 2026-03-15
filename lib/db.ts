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

export async function createTenant(db: D1Database, id: string, token: string): Promise<void> {
  await db
    .prepare("INSERT INTO tenants (id, token, created_at) VALUES (?, ?, datetime('now'))")
    .bind(id, token)
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
