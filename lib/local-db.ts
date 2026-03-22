import path from 'path'
import fs from 'fs'
import type { D1Database } from './db'

type BetterSqlite3Database = {
  prepare(sql: string): BetterSqlite3Statement
  exec(sql: string): void
  transaction<T>(fn: () => T): () => T
  close(): void
}

type BetterSqlite3Statement = {
  run(...params: unknown[]): { changes: number; lastInsertRowid: number | bigint }
  get(...params: unknown[]): Record<string, unknown> | undefined
  all(...params: unknown[]): Record<string, unknown>[]
  raw(...params: unknown[]): unknown[][]
}

interface SeedMeal {
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
  skladniki_baza: unknown[]
  skladniki_mieso: unknown[]
  przepis: { kroki: string[] }
  tags: string[]
}

interface SeedIngredient {
  id: string
  name: string
  category: string
}

let _localDb: LocalDatabase | null = null

class LocalPreparedStatement {
  constructor(
    private stmt: BetterSqlite3Statement,
    private values: unknown[] = []
  ) {}

  bind(...values: unknown[]): LocalPreparedStatement {
    return new LocalPreparedStatement(this.stmt, [...this.values, ...values])
  }

  async first<T = unknown>(colName?: string): Promise<T | null> {
    try {
      const result = this.stmt.get(...this.values)
      if (!result) return null
      if (colName && typeof result === 'object' && colName in result) {
        return result[colName] as T
      }
      return (result as T) || null
    } catch (error) {
      console.error('Error in first():', error)
      return null
    }
  }

  async run<T = unknown>() {
    try {
      const result = this.stmt.run(...this.values)
      return {
        results: [] as T[],
        success: true,
        meta: {
          duration: 0,
          changes: result.changes || 0,
          last_row_id: Number(result.lastInsertRowid || 0),
          rows_read: 0,
          rows_written: result.changes || 0,
        },
      }
    } catch (error) {
      console.error('Error in run():', error)
      return {
        results: [] as T[],
        success: false,
        meta: { duration: 0, changes: 0, last_row_id: 0, rows_read: 0, rows_written: 0 },
      }
    }
  }

  async all<T = unknown>() {
    try {
      const results = this.stmt.all(...this.values) as T[]
      return {
        results,
        success: true,
        meta: {
          duration: 0,
          changes: 0,
          last_row_id: 0,
          rows_read: results.length,
          rows_written: 0,
        },
      }
    } catch (error) {
      console.error('Error in all():', error)
      return {
        results: [] as T[],
        success: false,
        meta: { duration: 0, changes: 0, last_row_id: 0, rows_read: 0, rows_written: 0 },
      }
    }
  }

  async raw<T = unknown[]>(): Promise<T[]> {
    try {
      return this.stmt.raw(...this.values) as T[]
    } catch (error) {
      console.error('Error in raw():', error)
      return [] as T[]
    }
  }
}

class LocalDatabase implements D1Database {
  private db: BetterSqlite3Database

  constructor(dbPath: string) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require('better-sqlite3')
    this.db = new Database(dbPath) as BetterSqlite3Database
    this.initializeSchema()
    this.seedData()
  }

  prepare(query: string) {
    const stmt = this.db.prepare(query)
    return new LocalPreparedStatement(stmt)
  }

  async exec(query: string) {
    this.db.exec(query)
    return { count: 0, duration: 0 }
  }

  async batch<T = unknown>(statements: LocalPreparedStatement[]) {
    const transaction = this.db.transaction(() => {
      return statements.map((stmt) => stmt.run<T>())
    })
    return Promise.all(transaction())
  }

  private initializeSchema() {
    const schemaPath = path.resolve(__dirname, '..', 'data', 'schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf-8')
    this.db.exec(schema)
  }

  private seedData() {
    const mealCount = this.db.prepare('SELECT COUNT(*) as count FROM meals').get() as
      | { count: number }
      | undefined
    if (mealCount && mealCount.count > 0) return

    this.db
      .prepare(
        "INSERT OR IGNORE INTO tenants (id, token, name) VALUES ('default', 'dev-token-123', 'Development User')"
      )
      .run()

    const dataDir = path.resolve(__dirname, '..', 'data')
    const meals: SeedMeal[] = JSON.parse(
      fs.readFileSync(path.join(dataDir, 'seed-meals.json'), 'utf-8')
    )
    const ingredients: SeedIngredient[] = JSON.parse(
      fs.readFileSync(path.join(dataDir, 'seed-ingredients.json'), 'utf-8')
    )

    const insertMeal = this.db.prepare(`
      INSERT OR IGNORE INTO meals (
        id, nazwa, opis, photo_url, prep_time,
        kcal_baza, kcal_z_miesem, bialko_baza, bialko_z_miesem,
        trudnosc, kuchnia, category, skladniki_baza, skladniki_mieso,
        przepis, tags
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    for (const meal of meals) {
      insertMeal.run(
        meal.id,
        meal.nazwa,
        meal.opis,
        meal.photo_url,
        meal.prep_time,
        meal.kcal_baza,
        meal.kcal_z_miesem,
        meal.bialko_baza,
        meal.bialko_z_miesem,
        meal.trudnosc,
        meal.kuchnia,
        meal.category,
        JSON.stringify(meal.skladniki_baza),
        JSON.stringify(meal.skladniki_mieso),
        JSON.stringify(meal.przepis),
        JSON.stringify(meal.tags)
      )
    }

    const insertIngredient = this.db.prepare(
      'INSERT OR IGNORE INTO ingredients (id, name, category) VALUES (?, ?, ?)'
    )
    for (const ing of ingredients) {
      insertIngredient.run(ing.id, ing.name, ing.category)
    }
  }

  close() {
    if (this.db) {
      this.db.close()
    }
  }
}

export function getLocalDb(dbPath?: string): D1Database {
  if (!_localDb) {
    const resolvedPath = dbPath ?? path.resolve(process.cwd(), 'local.db')
    _localDb = new LocalDatabase(resolvedPath)
  }
  return _localDb
}

try {
  if (typeof process !== 'undefined' && typeof process.on === 'function') {
    process.on('exit', () => {
      if (_localDb) {
        _localDb.close()
      }
    })
  }
} catch {
  // Ignore errors in Edge Runtime
}
