import path from 'path'
import type { D1Database } from './db'

let _localDb: LocalDatabase | null = null

class LocalPreparedStatement {
  constructor(
    private stmt: any,
    private values: unknown[] = []
  ) {}

  bind(...values: unknown[]): LocalPreparedStatement {
    return new LocalPreparedStatement(this.stmt, [...this.values, ...values])
  }

  async first<T = unknown>(colName?: string): Promise<T | null> {
    try {
      const result = this.stmt.get(...this.values) as T
      if (colName && result && typeof result === 'object' && colName in result) {
        return (result as any)[colName]
      }
      return result || null
    } catch (error) {
      console.error('Error in first():', error)
      return null
    }
  }

  async run<T = unknown>() {
    try {
      const result = this.stmt.run(...this.values)
      return {
        results: [],
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
        results: [],
        success: false,
        meta: {
          duration: 0,
          changes: 0,
          last_row_id: 0,
          rows_read: 0,
          rows_written: 0,
        },
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
        results: [],
        success: false,
        meta: {
          duration: 0,
          changes: 0,
          last_row_id: 0,
          rows_read: 0,
          rows_written: 0,
        },
      }
    }
  }

  async raw<T = unknown[]>(): Promise<T[]> {
    try {
      const results = this.stmt.raw(...this.values)
      return results as T[]
    } catch (error) {
      console.error('Error in raw():', error)
      return [] as T[]
    }
  }
}

class LocalDatabase implements D1Database {
  private db: any

  constructor(dbPath: string) {
    try {
      // Dynamic import of better-sqlite3 to avoid bundling issues
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Database = require("better-sqlite3")
      this.db = new Database(dbPath)
      console.log(`Initialized local SQLite database at: ${dbPath}`)
      this.initializeSchema()
      this.seedData()
    } catch (error) {
      console.error('Failed to initialize local SQLite database:', error)
      throw error
    }
  }

  prepare(query: string) {
    try {
      const stmt = this.db.prepare(query)
      return new LocalPreparedStatement(stmt)
    } catch (error) {
      console.error(`Error preparing query: ${query}`, error)
      throw error
    }
  }

  async exec(query: string) {
    try {
      this.db.exec(query)
      return {
        count: 0,
        duration: 0,
      }
    } catch (error) {
      console.error(`Error executing query: ${query}`, error)
      throw error
    }
  }

  async batch(statements: any[]) {
    try {
      const transaction = this.db.transaction(() => {
        return statements.map((stmt) => {
          if (stmt instanceof LocalPreparedStatement) {
            return stmt.run()
          }
          throw new Error('Invalid statement type in batch')
        })
      })

      return await transaction()
    } catch (error) {
      console.error('Error in batch execution:', error)
      throw error
    }
  }

  private initializeSchema() {
    try {
      // Create all tables based on schema.sql
      const schema = `
        -- Tenants table
        CREATE TABLE IF NOT EXISTS tenants (
          id TEXT PRIMARY KEY,
          token TEXT NOT NULL UNIQUE,
          name TEXT DEFAULT '',
          created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_tenants_token ON tenants(token);

        -- Meals table (shared across all tenants)
        CREATE TABLE IF NOT EXISTS meals (
          id TEXT PRIMARY KEY,
          nazwa TEXT NOT NULL,
          opis TEXT DEFAULT '',
          photo_url TEXT DEFAULT '',
          prep_time INTEGER DEFAULT 0,
          kcal_baza INTEGER DEFAULT 0,
          kcal_z_miesem INTEGER DEFAULT 0,
          bialko_baza INTEGER DEFAULT 0,
          bialko_z_miesem INTEGER DEFAULT 0,
          trudnosc TEXT DEFAULT '',
          kuchnia TEXT DEFAULT '',
          category TEXT DEFAULT '',
          skladniki_baza TEXT DEFAULT '[]',
          skladniki_mieso TEXT DEFAULT '[]',
          przepis TEXT DEFAULT '{}',
          tags TEXT DEFAULT '[]',
          created_at TEXT DEFAULT (datetime('now'))
        );

        -- Weekly plans table (tenant-scoped)
        CREATE TABLE IF NOT EXISTS weekly_plans (
          tenant_id TEXT NOT NULL DEFAULT 'default',
          week_key TEXT NOT NULL,
          plan_data TEXT NOT NULL,
          updated_at TEXT DEFAULT (datetime('now')),
          PRIMARY KEY (tenant_id, week_key)
        );

        -- Ingredients catalog (shared)
        CREATE TABLE IF NOT EXISTS ingredients (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          category TEXT DEFAULT 'inne',
          flags TEXT DEFAULT '[]',
          is_seasoning INTEGER DEFAULT 0,
          created_at TEXT DEFAULT (datetime('now'))
        );

        -- Meal variants (e.g. meat vs vegetarian version)
        CREATE TABLE IF NOT EXISTS meal_variants (
          id TEXT PRIMARY KEY,
          meal_id TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT DEFAULT '',
          kcal INTEGER DEFAULT 0,
          protein INTEGER DEFAULT 0,
          carbs INTEGER DEFAULT 0,
          fat INTEGER DEFAULT 0,
          dietary_flags TEXT DEFAULT '[]',
          is_default INTEGER DEFAULT 0,
          created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_meal_variants_meal_id ON meal_variants(meal_id);

        -- Meal variant ingredients (junction table)
        CREATE TABLE IF NOT EXISTS meal_variant_ingredients (
          id TEXT PRIMARY KEY,
          meal_variant_id TEXT NOT NULL,
          ingredient_id TEXT NOT NULL,
          amount_grams REAL DEFAULT 0,
          display_amount TEXT DEFAULT '',
          scalable INTEGER DEFAULT 1,
          optional INTEGER DEFAULT 0,
          notes TEXT DEFAULT ''
        );

        CREATE INDEX IF NOT EXISTS idx_mvi_variant ON meal_variant_ingredients(meal_variant_id);
        CREATE INDEX IF NOT EXISTS idx_mvi_ingredient ON meal_variant_ingredients(ingredient_id);

        -- Shopping checked items (tenant-scoped)
        CREATE TABLE IF NOT EXISTS shopping_checked (
          tenant_id TEXT NOT NULL DEFAULT 'default',
          week_key TEXT NOT NULL,
          checked_data TEXT NOT NULL DEFAULT '{}',
          updated_at TEXT DEFAULT (datetime('now')),
          PRIMARY KEY (tenant_id, week_key)
        );

        -- Settings table (tenant-scoped)
        CREATE TABLE IF NOT EXISTS settings (
          tenant_id TEXT NOT NULL DEFAULT 'default',
          key TEXT NOT NULL,
          value TEXT NOT NULL,
          updated_at TEXT DEFAULT (datetime('now')),
          PRIMARY KEY (tenant_id, key)
        );

        -- Indexes for quick lookups
        CREATE INDEX IF NOT EXISTS idx_meals_kuchnia ON meals(kuchnia);
        CREATE INDEX IF NOT EXISTS idx_meals_trudnosc ON meals(trudnosc);
        CREATE INDEX IF NOT EXISTS idx_meals_category ON meals(category);
      `

      this.db.exec(schema)
      console.log('Database schema initialized successfully')
    } catch (error) {
      console.error('Error initializing schema:', error)
      throw error
    }
  }

  private seedData() {
    try {
      // Check if we already have data
      const mealCount = this.db.prepare('SELECT COUNT(*) as count FROM meals').get() as {
        count: number
      }
      if (mealCount.count > 0) {
        console.log(`Database already seeded with ${mealCount.count} meals`)
        return // Already seeded
      }

      // Create default tenant
      this.db
        .prepare(
          `
        INSERT OR IGNORE INTO tenants (id, token, name)
        VALUES ('default', 'dev-token-123', 'Development User')
      `
        )
        .run()

      // Seed with variety of meals from different cuisines
      const meals = [
        {
          id: 'pierogi-ruskie',
          nazwa: 'Pierogi ruskie',
          opis: 'Tradycyjne polskie pierogi z ziemniakami i twarogiem',
          photo_url:
            'https://images.unsplash.com/photo-1626804475297-41608ea09aeb?w=400&h=300&fit=crop&crop=center',
          prep_time: 45,
          kcal_baza: 280,
          kcal_z_miesem: 280,
          bialko_baza: 12,
          bialko_z_miesem: 12,
          trudnosc: 'średnie',
          kuchnia: 'polska',
          category: 'danie główne',
          skladniki_baza: JSON.stringify([
            { name: 'mąka', amount: '300g', category: 'suche' },
            { name: 'ziemniaki', amount: '500g', category: 'warzywa' },
            { name: 'twaróg', amount: '200g', category: 'nabiał' },
            { name: 'cebula', amount: '1 szt.', category: 'warzywa' },
          ]),
          skladniki_mieso: JSON.stringify([]),
          przepis: JSON.stringify({
            kroki: [
              'Ugotuj ziemniaki, odstaw do ostudzenia',
              'Zrób ciasto z mąki, jajka i wody',
              'Przygotuj farsz z ziemniaków, twarogu i cebuli',
              'Lepiś pierogi i gotuj w osolonej wodzie',
            ],
          }),
          tags: JSON.stringify(['wegetariańskie', 'tradycyjne']),
        },
        {
          id: 'kotlet-schabowy',
          nazwa: 'Kotlet schabowy',
          opis: 'Klasyczny polski kotlet schabowy z ziemniakami i mizeria',
          photo_url:
            'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400&h=300&fit=crop&crop=center',
          prep_time: 30,
          kcal_baza: 0,
          kcal_z_miesem: 450,
          bialko_baza: 0,
          bialko_z_miesem: 35,
          trudnosc: 'łatwe',
          kuchnia: 'polska',
          category: 'danie główne',
          skladniki_baza: JSON.stringify([]),
          skladniki_mieso: JSON.stringify([
            { name: 'schab', amount: '4 kotlety', category: 'mięso' },
            { name: 'bułka tarta', amount: '200g', category: 'suche' },
            { name: 'jajka', amount: '2 szt.', category: 'nabiał' },
            { name: 'ziemniaki', amount: '600g', category: 'warzywa' },
          ]),
          przepis: JSON.stringify({
            kroki: [
              'Rozbij kotlety młotkiem',
              'Oprósz mąką, zanurz w jajku, obtocz w bułce',
              'Smaż na złocisty kolor z obu stron',
              'Podawaj z ziemniakami i mizeria',
            ],
          }),
          tags: JSON.stringify(['mięsne', 'klasyczne']),
        },
        {
          id: 'pasta-carbonara',
          nazwa: 'Pasta Carbonara',
          opis: 'Kremowa pasta z boczkiem, jajkami i parmezanem',
          photo_url:
            'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400&h=300&fit=crop&crop=center',
          prep_time: 20,
          kcal_baza: 380,
          kcal_z_miesem: 520,
          bialko_baza: 15,
          bialko_z_miesem: 28,
          trudnosc: 'średnie',
          kuchnia: 'włoska',
          category: 'danie główne',
          skladniki_baza: JSON.stringify([
            { name: 'makaron', amount: '400g', category: 'suche' },
            { name: 'jajka', amount: '3 szt.', category: 'nabiał' },
            { name: 'parmezan', amount: '100g', category: 'nabiał' },
          ]),
          skladniki_mieso: JSON.stringify([{ name: 'boczek', amount: '200g', category: 'mięso' }]),
          przepis: JSON.stringify({
            kroki: [
              'Gotuj makaron al dente',
              'Smaż boczek do chrupkości',
              'Ubij jajka z parmezanem',
              'Wymieszaj gorący makaron z jajkami i boczkiem',
            ],
          }),
          tags: JSON.stringify(['włoskie', 'szybkie']),
        },
        {
          id: 'curry-z-kurczakiem',
          nazwa: 'Curry z kurczakiem',
          opis: 'Aromatyczne curry z kurczakiem i warzywami w mleku kokosowym',
          photo_url:
            'https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&h=300&fit=crop&crop=center',
          prep_time: 35,
          kcal_baza: 320,
          kcal_z_miesem: 480,
          bialko_baza: 12,
          bialko_z_miesem: 35,
          trudnosc: 'średnie',
          kuchnia: 'azjatycka',
          category: 'danie główne',
          skladniki_baza: JSON.stringify([
            { name: 'mleko kokosowe', amount: '400ml', category: 'inne' },
            { name: 'curry', amount: '2 łyżki', category: 'przyprawy' },
            { name: 'cebula', amount: '1 szt.', category: 'warzywa' },
            { name: 'papryka', amount: '2 szt.', category: 'warzywa' },
          ]),
          skladniki_mieso: JSON.stringify([{ name: 'kurczak', amount: '500g', category: 'mięso' }]),
          przepis: JSON.stringify({
            kroki: [
              'Podsmaż cebulę i czosnek',
              'Dodaj kawałki kurczaka i podsmażaj',
              'Wsyp curry i warzywa',
              'Zalej mlekiem kokosowym i duś 20 min',
            ],
          }),
          tags: JSON.stringify(['azjatyckie', 'pikantne']),
        },
        {
          id: 'risotto-grzybowe',
          nazwa: 'Risotto grzybowe',
          opis: 'Kremowe risotto z mieszanką grzybów leśnych',
          photo_url:
            'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&h=300&fit=crop&crop=center',
          prep_time: 40,
          kcal_baza: 340,
          kcal_z_miesem: 340,
          bialko_baza: 14,
          bialko_z_miesem: 14,
          trudnosc: 'trudne',
          kuchnia: 'włoska',
          category: 'danie główne',
          skladniki_baza: JSON.stringify([
            { name: 'ryż arborio', amount: '300g', category: 'suche' },
            { name: 'grzyby leśne', amount: '300g', category: 'warzywa' },
            { name: 'bulion warzywny', amount: '1l', category: 'inne' },
            { name: 'parmezan', amount: '100g', category: 'nabiał' },
          ]),
          skladniki_mieso: JSON.stringify([]),
          przepis: JSON.stringify({
            kroki: [
              'Podsmaż cebulę na maśle',
              'Dodaj ryż i smaż 2 minuty',
              'Stopniowo dodawaj gorący bulion',
              'Mieszaj przez 20 min, na końcu grzyby i parmezan',
            ],
          }),
          tags: JSON.stringify(['wegetariańskie', 'włoskie']),
        },
        {
          id: 'pizza-margherita',
          nazwa: 'Pizza Margherita',
          opis: 'Klasyczna włoska pizza z mozzarellą, bazylią i pomidorami',
          photo_url:
            'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop&crop=center',
          prep_time: 25,
          kcal_baza: 420,
          kcal_z_miesem: 420,
          bialko_baza: 18,
          bialko_z_miesem: 18,
          trudnosc: 'łatwe',
          kuchnia: 'włoska',
          category: 'danie główne',
          skladniki_baza: JSON.stringify([
            { name: 'ciasto na pizzę', amount: '1 szt.', category: 'suche' },
            { name: 'sos pomidorowy', amount: '150ml', category: 'inne' },
            { name: 'mozzarella', amount: '200g', category: 'nabiał' },
            { name: 'bazylia', amount: '10 liści', category: 'warzywa' },
          ]),
          skladniki_mieso: JSON.stringify([]),
          przepis: JSON.stringify({
            kroki: [
              'Rozłóż ciasto na blaszce',
              'Posmaruj sosem pomidorowym',
              'Dodaj pokrojone mozzarellę',
              'Piecz 12-15 min w 220°C, dodaj bazylię',
            ],
          }),
          tags: JSON.stringify(['wegetariańskie', 'włoskie', 'szybkie']),
        },
        {
          id: 'tacos-z-kurczakiem',
          nazwa: 'Tacos z kurczakiem',
          opis: 'Meksykańskie tacos z kurczakiem, awokado i salsą',
          photo_url:
            'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400&h=300&fit=crop&crop=center',
          prep_time: 20,
          kcal_baza: 200,
          kcal_z_miesem: 380,
          bialko_baza: 8,
          bialko_z_miesem: 28,
          trudnosc: 'łatwe',
          kuchnia: 'meksykańska',
          category: 'danie główne',
          skladniki_baza: JSON.stringify([
            { name: 'tortille', amount: '8 szt.', category: 'suche' },
            { name: 'awokado', amount: '2 szt.', category: 'warzywa' },
            { name: 'pomidory', amount: '3 szt.', category: 'warzywa' },
            { name: 'cebula', amount: '1 szt.', category: 'warzywa' },
          ]),
          skladniki_mieso: JSON.stringify([{ name: 'kurczak', amount: '400g', category: 'mięso' }]),
          przepis: JSON.stringify({
            kroki: [
              'Pokrój kurczaka w paski i przypraw',
              'Smaż kurczaka na patelni 8-10 min',
              'Przygotuj salsę z pomidorów i cebuli',
              'Podgrzej tortille i nałóż składniki',
            ],
          }),
          tags: JSON.stringify(['meksykańskie', 'szybkie']),
        },
        {
          id: 'losos-z-grilla',
          nazwa: 'Łosoś z grilla',
          opis: 'Grillowany łosoś z ziemniakami i warzywami sezonowymi',
          photo_url:
            'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop&crop=center',
          prep_time: 25,
          kcal_baza: 0,
          kcal_z_miesem: 480,
          bialko_baza: 0,
          bialko_z_miesem: 38,
          trudnosc: 'średnie',
          kuchnia: 'skandynawska',
          category: 'danie główne',
          skladniki_baza: JSON.stringify([
            { name: 'ziemniaki młode', amount: '500g', category: 'warzywa' },
            { name: 'szparagi', amount: '300g', category: 'warzywa' },
            { name: 'cytryna', amount: '1 szt.', category: 'warzywa' },
          ]),
          skladniki_mieso: JSON.stringify([{ name: 'łosoś', amount: '600g', category: 'mięso' }]),
          przepis: JSON.stringify({
            kroki: [
              'Ziemniaki ugotuj z skórką do miękkości',
              'Łosoś skrop cytryną i przypraw',
              'Grilluj łosoś 4-5 min z każdej strony',
              'Podawaj z młodymi ziemniakami i szparagami',
            ],
          }),
          tags: JSON.stringify(['zdrowe', 'grillowane']),
        },
        {
          id: 'pad-thai',
          nazwa: 'Pad Thai',
          opis: 'Tajski makaron ryżowy z krewetkami i orzeszkami',
          photo_url:
            'https://images.unsplash.com/photo-1559314809-0f31657df93b?w=400&h=300&fit=crop&crop=center',
          prep_time: 15,
          kcal_baza: 350,
          kcal_z_miesem: 450,
          bialko_baza: 12,
          bialko_z_miesem: 25,
          trudnosc: 'średnie',
          kuchnia: 'azjatycka',
          category: 'danie główne',
          skladniki_baza: JSON.stringify([
            { name: 'makaron ryżowy', amount: '300g', category: 'suche' },
            { name: 'orzeszki ziemne', amount: '100g', category: 'inne' },
            { name: 'kiełki fasoli', amount: '200g', category: 'warzywa' },
            { name: 'sos sojowy', amount: '3 łyżki', category: 'przyprawy' },
          ]),
          skladniki_mieso: JSON.stringify([
            { name: 'krewetki', amount: '300g', category: 'mięso' },
          ]),
          przepis: JSON.stringify({
            kroki: [
              'Namocz makaron ryżowy w ciepłej wodzie',
              'Smaż krewetki na wysokiej temperaturze',
              'Dodaj makaron i warzywa, smaż 3-4 min',
              'Posyp orzeszkami i podawaj z limonką',
            ],
          }),
          tags: JSON.stringify(['azjatyckie', 'szybkie']),
        },
        {
          id: 'ratatouille',
          nazwa: 'Ratatouille',
          opis: 'Francuskie danie z bakłażana, cukinii i pomidorów',
          photo_url:
            'https://images.unsplash.com/photo-1572441713132-51c75654db73?w=400&h=300&fit=crop&crop=center',
          prep_time: 50,
          kcal_baza: 180,
          kcal_z_miesem: 180,
          bialko_baza: 6,
          bialko_z_miesem: 6,
          trudnosc: 'średnie',
          kuchnia: 'francuska',
          category: 'danie główne',
          skladniki_baza: JSON.stringify([
            { name: 'bakłażan', amount: '2 szt.', category: 'warzywa' },
            { name: 'cukinia', amount: '2 szt.', category: 'warzywa' },
            { name: 'pomidory', amount: '4 szt.', category: 'warzywa' },
            { name: 'papryka', amount: '2 szt.', category: 'warzywa' },
          ]),
          skladniki_mieso: JSON.stringify([]),
          przepis: JSON.stringify({
            kroki: [
              'Pokrój wszystkie warzywa w kostkę',
              'Podsmaż cebulę i czosnek na oliwie',
              'Dodaj warzywa i duś 30-40 min',
              'Dopraw ziołami prowansalskimi',
            ],
          }),
          tags: JSON.stringify(['wegetariańskie', 'francuskie', 'zdrowe']),
        },
        {
          id: 'goulash-wegierski',
          nazwa: 'Gulasz węgierski',
          opis: 'Tradycyjny węgierski gulasz z wołowiną i papryką',
          photo_url:
            'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=300&fit=crop&crop=center',
          prep_time: 90,
          kcal_baza: 0,
          kcal_z_miesem: 520,
          bialko_baza: 0,
          bialko_z_miesem: 42,
          trudnosc: 'trudne',
          kuchnia: 'węgierska',
          category: 'danie główne',
          skladniki_baza: JSON.stringify([
            { name: 'ziemniaki', amount: '600g', category: 'warzywa' },
            { name: 'papryka słodka', amount: '3 łyżki', category: 'przyprawy' },
            { name: 'cebula', amount: '2 szt.', category: 'warzywa' },
            { name: 'pomidory', amount: '3 szt.', category: 'warzywa' },
          ]),
          skladniki_mieso: JSON.stringify([
            { name: 'wołowina', amount: '800g', category: 'mięso' },
          ]),
          przepis: JSON.stringify({
            kroki: [
              'Pokrój wołowinę w kostkę i podsmaż',
              'Dodaj cebulę i paprykę słodką',
              'Zalej bulionem i duś 1 godzinę',
              'Dodaj ziemniaki i gotuj kolejne 30 min',
            ],
          }),
          tags: JSON.stringify(['węgierskie', 'duszone']),
        },
        {
          id: 'bibimbap',
          nazwa: 'Bibimbap',
          opis: 'Koreański ryż z warzywami, jajkiem i kimchi',
          photo_url:
            'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=400&h=300&fit=crop&crop=center',
          prep_time: 30,
          kcal_baza: 380,
          kcal_z_miesem: 480,
          bialko_baza: 14,
          bialko_z_miesem: 28,
          trudnosc: 'średnie',
          kuchnia: 'koreańska',
          category: 'danie główne',
          skladniki_baza: JSON.stringify([
            { name: 'ryż', amount: '300g', category: 'suche' },
            { name: 'kimchi', amount: '150g', category: 'warzywa' },
            { name: 'jajka', amount: '4 szt.', category: 'nabiał' },
            { name: 'marchewka', amount: '2 szt.', category: 'warzywa' },
          ]),
          skladniki_mieso: JSON.stringify([
            { name: 'wołowina', amount: '300g', category: 'mięso' },
          ]),
          przepis: JSON.stringify({
            kroki: [
              'Ugotuj ryż zgodnie z instrukcją',
              'Pokrój wołowinę i marinatą sojową',
              'Smaż mięso i warzywa osobno',
              'Ułóż na ryżu, dodaj jajko sadzone',
            ],
          }),
          tags: JSON.stringify(['koreańskie', 'zdrowe']),
        },
        {
          id: 'bigos-staropolski',
          nazwa: 'Bigos staropolski',
          opis: 'Tradycyjny polski bigos z kapustą i mięsem',
          photo_url:
            'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop&crop=center',
          prep_time: 120,
          kcal_baza: 280,
          kcal_z_miesem: 420,
          bialko_baza: 8,
          bialko_z_miesem: 25,
          trudnosc: 'trudne',
          kuchnia: 'polska',
          category: 'danie główne',
          skladniki_baza: JSON.stringify([
            { name: 'kapusta kiszona', amount: '800g', category: 'warzywa' },
            { name: 'kapusta świeża', amount: '400g', category: 'warzywa' },
            { name: 'grzyby suszone', amount: '50g', category: 'warzywa' },
            { name: 'cebula', amount: '2 szt.', category: 'warzywa' },
          ]),
          skladniki_mieso: JSON.stringify([
            { name: 'kiełbasa', amount: '300g', category: 'mięso' },
            { name: 'boczek', amount: '200g', category: 'mięso' },
          ]),
          przepis: JSON.stringify({
            kroki: [
              'Namocz grzyby, pokrój kapustę',
              'Podsmaż cebulę i mięso',
              'Dodaj kapustę i grzyby, duś 1.5 h',
              'Dopraw według smaku i duś kolejne 30 min',
            ],
          }),
          tags: JSON.stringify(['polskie', 'tradycyjne']),
        },
        {
          id: 'chili-con-carne',
          nazwa: 'Chili con carne',
          opis: 'Meksykańskie chili z wołowiną i fasolą',
          photo_url:
            'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&crop=center',
          prep_time: 60,
          kcal_baza: 320,
          kcal_z_miesem: 480,
          bialko_baza: 18,
          bialko_z_miesem: 38,
          trudnosc: 'średnie',
          kuchnia: 'meksykańska',
          category: 'danie główne',
          skladniki_baza: JSON.stringify([
            { name: 'fasola czerwona', amount: '400g', category: 'inne' },
            { name: 'pomidory w puszce', amount: '400g', category: 'warzywa' },
            { name: 'papryka chili', amount: '2 szt.', category: 'warzywa' },
            { name: 'cebula', amount: '2 szt.', category: 'warzywa' },
          ]),
          skladniki_mieso: JSON.stringify([
            { name: 'wołowina mielona', amount: '500g', category: 'mięso' },
          ]),
          przepis: JSON.stringify({
            kroki: [
              'Podsmaż cebulę i mięso mielone',
              'Dodaj paprykę chili i przyprawy',
              'Wsyp pomidory i fasolę',
              'Duś 45 min na małym ogniu',
            ],
          }),
          tags: JSON.stringify(['meksykańskie', 'pikantne']),
        },
        {
          id: 'buddha-bowl',
          nazwa: 'Buddha Bowl',
          opis: 'Zdrowa miska z quinoa, awokado i warzywami',
          photo_url:
            'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop&crop=center',
          prep_time: 25,
          kcal_baza: 420,
          kcal_z_miesem: 420,
          bialko_baza: 18,
          bialko_z_miesem: 18,
          trudnosc: 'łatwe',
          kuchnia: 'zdrowa',
          category: 'danie główne',
          skladniki_baza: JSON.stringify([
            { name: 'quinoa', amount: '200g', category: 'suche' },
            { name: 'awokado', amount: '2 szt.', category: 'warzywa' },
            { name: 'brokuł', amount: '300g', category: 'warzywa' },
            { name: 'bataty', amount: '400g', category: 'warzywa' },
          ]),
          skladniki_mieso: JSON.stringify([]),
          przepis: JSON.stringify({
            kroki: [
              'Ugotuj quinoa zgodnie z instrukcją',
              'Upiecz bataty w kawałkach',
              'Ugotuj brokuł na parze',
              'Ułóż w miseczkach z awokado i tahini',
            ],
          }),
          tags: JSON.stringify(['wegetariańskie', 'zdrowe', 'bezglutenowe']),
        },
        {
          id: 'moussaka',
          nazwa: 'Moussaka',
          opis: 'Grecka zapiekanka z bakłażana i mięsa mielonego',
          photo_url:
            'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop&crop=center',
          prep_time: 75,
          kcal_baza: 180,
          kcal_z_miesem: 450,
          bialko_baza: 8,
          bialko_z_miesem: 32,
          trudnosc: 'trudne',
          kuchnia: 'grecka',
          category: 'danie główne',
          skladniki_baza: JSON.stringify([
            { name: 'bakłażan', amount: '3 szt.', category: 'warzywa' },
            { name: 'ser feta', amount: '200g', category: 'nabiał' },
            { name: 'pomidory w puszce', amount: '400g', category: 'warzywa' },
            { name: 'mleko', amount: '300ml', category: 'nabiał' },
          ]),
          skladniki_mieso: JSON.stringify([
            { name: 'jagnięcina mielona', amount: '600g', category: 'mięso' },
          ]),
          przepis: JSON.stringify({
            kroki: [
              'Pokrój bakłażany i usmaż na złoto',
              'Przygotuj sos mięsny z pomidorami',
              'Ułóż warstwami w naczyniu żaroodpornym',
              'Polej sosem beszamel i piecz 45 min',
            ],
          }),
          tags: JSON.stringify(['greckie', 'zapiekane']),
        },
        {
          id: 'tom-yum',
          nazwa: 'Tom Yum',
          opis: 'Tajska kwaśno-ostra zupa z krewetkami',
          photo_url:
            'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop&crop=center',
          prep_time: 20,
          kcal_baza: 150,
          kcal_z_miesem: 280,
          bialko_baza: 8,
          bialko_z_miesem: 22,
          trudnosc: 'średnie',
          kuchnia: 'tajska',
          category: 'zupa',
          skladniki_baza: JSON.stringify([
            { name: 'bulion warzywny', amount: '1l', category: 'inne' },
            { name: 'trawa cytrynowa', amount: '3 łodygi', category: 'warzywa' },
            { name: 'limonka', amount: '3 szt.', category: 'warzywa' },
            { name: 'pieczarki', amount: '200g', category: 'warzywa' },
          ]),
          skladniki_mieso: JSON.stringify([
            { name: 'krewetki', amount: '300g', category: 'mięso' },
          ]),
          przepis: JSON.stringify({
            kroki: [
              'Zagotuj bulion z trawą cytrynową',
              'Dodaj pieczarki i krewetki',
              'Dopraw pastą tom yum i sosem rybnym',
              'Dodaj sok z limonki i listki kaffiru',
            ],
          }),
          tags: JSON.stringify(['tajskie', 'pikantne', 'zupa']),
        },
        {
          id: 'coq-au-vin',
          nazwa: 'Coq au vin',
          opis: 'Francuska potrawka z kurczaka w czerwonym winie',
          photo_url:
            'https://images.unsplash.com/photo-1532636918583-2bb4825b2e18?w=400&h=300&fit=crop&crop=center',
          prep_time: 90,
          kcal_baza: 0,
          kcal_z_miesem: 480,
          bialko_baza: 0,
          bialko_z_miesem: 38,
          trudnosc: 'trudne',
          kuchnia: 'francuska',
          category: 'danie główne',
          skladniki_baza: JSON.stringify([
            { name: 'wino czerwone', amount: '500ml', category: 'inne' },
            { name: 'cebulki perłowe', amount: '200g', category: 'warzywa' },
            { name: 'pieczarki', amount: '300g', category: 'warzywa' },
            { name: 'boczek', amount: '150g', category: 'mięso' },
          ]),
          skladniki_mieso: JSON.stringify([
            { name: 'kurczak', amount: '1.2kg', category: 'mięso' },
          ]),
          przepis: JSON.stringify({
            kroki: [
              'Podsmaż boczek i cebulki',
              'Oprósz kurczaka mąką i usmaż',
              'Zalej winem i dodaj zioła',
              'Duś 45 min, dodaj pieczarki na końcu',
            ],
          }),
          tags: JSON.stringify(['francuskie', 'duszone']),
        },
        {
          id: 'pho-bo',
          nazwa: 'Pho Bo',
          opis: 'Wietnamska zupa z makaronem ryżowym i wołowiną',
          photo_url:
            'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&crop=center',
          prep_time: 45,
          kcal_baza: 200,
          kcal_z_miesem: 380,
          bialko_baza: 8,
          bialko_z_miesem: 28,
          trudnosc: 'średnie',
          kuchnia: 'wietnamska',
          category: 'zupa',
          skladniki_baza: JSON.stringify([
            { name: 'makaron ryżowy', amount: '200g', category: 'suche' },
            { name: 'bulion warzywny', amount: '1.5l', category: 'inne' },
            { name: 'imbir', amount: '30g', category: 'warzywa' },
            { name: 'kolendra', amount: '20g', category: 'warzywa' },
          ]),
          skladniki_mieso: JSON.stringify([
            { name: 'wołowina', amount: '300g', category: 'mięso' },
          ]),
          przepis: JSON.stringify({
            kroki: [
              'Zagotuj bulion z kością wołową 2 godziny',
              'Dodaj przyprawy: cynamon, anyż, goździki',
              'Ugotuj makaron ryżowy osobno',
              'Podawaj z cienkim wołowiną i świeżymi ziołami',
            ],
          }),
          tags: JSON.stringify(['wietnamskie', 'zupa', 'aromatyczne']),
        },
        {
          id: 'shakshuka',
          nazwa: 'Shakshuka',
          opis: 'Jajka w sosie pomidorowym z papryką i cebulą',
          photo_url:
            'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&h=300&fit=crop&crop=center',
          prep_time: 25,
          kcal_baza: 320,
          kcal_z_miesem: 320,
          bialko_baza: 18,
          bialko_z_miesem: 18,
          trudnosc: 'łatwe',
          kuchnia: 'bliskowschodnia',
          category: 'śniadanie',
          skladniki_baza: JSON.stringify([
            { name: 'jajka', amount: '6 szt.', category: 'nabiał' },
            { name: 'pomidory w puszce', amount: '400g', category: 'warzywa' },
            { name: 'papryka czerwona', amount: '2 szt.', category: 'warzywa' },
            { name: 'cebula', amount: '1 szt.', category: 'warzywa' },
          ]),
          skladniki_mieso: JSON.stringify([]),
          przepis: JSON.stringify({
            kroki: [
              'Podsmaż cebulę i paprykę na oliwie',
              'Dodaj pomidory i przyprawy, duś 10 min',
              'Wbij jajka do sosu i przykryj',
              'Gotuj 5-7 min do ściągnięcia białek',
            ],
          }),
          tags: JSON.stringify(['wegetariańskie', 'śniadanie', 'jednogarniowe']),
        },
        {
          id: 'pierogi-z-kapusta',
          nazwa: 'Pierogi z kapustą i grzybami',
          opis: 'Tradycyjne pierogi z kapustą kiszoną i grzybami',
          photo_url:
            'https://images.unsplash.com/photo-1626804475297-41608ea09aeb?w=400&h=300&fit=crop&crop=center',
          prep_time: 60,
          kcal_baza: 290,
          kcal_z_miesem: 290,
          bialko_baza: 11,
          bialko_z_miesem: 11,
          trudnosc: 'średnie',
          kuchnia: 'polska',
          category: 'danie główne',
          skladniki_baza: JSON.stringify([
            { name: 'mąka', amount: '400g', category: 'suche' },
            { name: 'kapusta kiszona', amount: '500g', category: 'warzywa' },
            { name: 'grzyby suszone', amount: '50g', category: 'warzywa' },
            { name: 'cebula', amount: '2 szt.', category: 'warzywa' },
          ]),
          skladniki_mieso: JSON.stringify([]),
          przepis: JSON.stringify({
            kroki: [
              'Namocz grzyby, pokrój i podsmaż z cebulą',
              'Duś kapustę z grzybami 30 min',
              'Zrób ciasto pierożkowe, rozwałkuj',
              'Nałóż farsz, zlepi i ugotuj w osolonej wodzie',
            ],
          }),
          tags: JSON.stringify(['wegetariańskie', 'tradycyjne', 'wigilia']),
        },
        {
          id: 'ramen-miso',
          nazwa: 'Ramen Miso',
          opis: 'Japońska zupa z makaronem ramen i pastą miso',
          photo_url:
            'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop&crop=center',
          prep_time: 35,
          kcal_baza: 380,
          kcal_z_miesem: 520,
          bialko_baza: 16,
          bialko_z_miesem: 32,
          trudnosc: 'średnie',
          kuchnia: 'japońska',
          category: 'zupa',
          skladniki_baza: JSON.stringify([
            { name: 'makaron ramen', amount: '200g', category: 'suche' },
            { name: 'pasta miso', amount: '3 łyżki', category: 'inne' },
            { name: 'jajka', amount: '2 szt.', category: 'nabiał' },
            { name: 'nori', amount: '2 arkusze', category: 'inne' },
          ]),
          skladniki_mieso: JSON.stringify([
            { name: 'wieprzowina', amount: '200g', category: 'mięso' },
          ]),
          przepis: JSON.stringify({
            kroki: [
              'Przygotuj bulion z kości wieprzowych',
              'Wymieszaj pastę miso z bulionem',
              'Ugotuj makaron ramen al dente',
              'Podawaj z jajkiem na miękko i wieprzowiną',
            ],
          }),
          tags: JSON.stringify(['japońskie', 'umami', 'comfort food']),
        },
        {
          id: 'falafel-bowl',
          nazwa: 'Falafel Bowl',
          opis: 'Miska z falafelem, hummusem i świeżymi warzywami',
          photo_url:
            'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop&crop=center',
          prep_time: 40,
          kcal_baza: 450,
          kcal_z_miesem: 450,
          bialko_baza: 22,
          bialko_z_miesem: 22,
          trudnosc: 'średnie',
          kuchnia: 'bliskowschodnia',
          category: 'danie główne',
          skladniki_baza: JSON.stringify([
            { name: 'ciecierzyca', amount: '400g', category: 'inne' },
            { name: 'tahina', amount: '3 łyżki', category: 'inne' },
            { name: 'pomidory koktajlowe', amount: '200g', category: 'warzywa' },
            { name: 'ogórek', amount: '1 szt.', category: 'warzywa' },
          ]),
          skladniki_mieso: JSON.stringify([]),
          przepis: JSON.stringify({
            kroki: [
              'Namocz ciecierzycę przez noc',
              'Zmiksuj z ziołami i przyprawami',
              'Uformuj kulki i usmaż na głębokim oleju',
              'Podawaj z hummusem i świeżymi warzywami',
            ],
          }),
          tags: JSON.stringify(['wegańskie', 'białko roślinne', 'zdrowe']),
        },
        {
          id: 'gulasz-z-kluskami',
          nazwa: 'Gulasz wegierski z kluskami',
          opis: 'Węgierski gulasz z wołowiną i ziemniakami',
          photo_url:
            'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=300&fit=crop&crop=center',
          prep_time: 120,
          kcal_baza: 0,
          kcal_z_miesem: 580,
          bialko_baza: 0,
          bialko_z_miesem: 45,
          trudnosc: 'trudne',
          kuchnia: 'węgierska',
          category: 'danie główne',
          skladniki_baza: JSON.stringify([
            { name: 'ziemniaki', amount: '800g', category: 'warzywa' },
            { name: 'papryka słodka', amount: '4 łyżki', category: 'przyprawy' },
            { name: 'pomidory w puszce', amount: '400g', category: 'warzywa' },
            { name: 'kminek', amount: '1 łyżka', category: 'przyprawy' },
          ]),
          skladniki_mieso: JSON.stringify([{ name: 'wołowina', amount: '1kg', category: 'mięso' }]),
          przepis: JSON.stringify({
            kroki: [
              'Pokrój wołowinę w duże kawałki',
              'Podsmaż z cebulą i papryką słodką',
              'Zalej bulionem, duś 2 godziny',
              'Dodaj ziemniaki na końcu, gotuj 30 min',
            ],
          }),
          tags: JSON.stringify(['węgierskie', 'duszone', 'comfort food']),
        },
        {
          id: 'sushi-nigiri',
          nazwa: 'Nigiri Sushi',
          opis: 'Klasyczne japońskie sushi z łososiem i tuńczykiem',
          photo_url:
            'https://images.unsplash.com/photo-1553621042-f6e147245754?w=400&h=300&fit=crop&crop=center',
          prep_time: 60,
          kcal_baza: 0,
          kcal_z_miesem: 320,
          bialko_baza: 0,
          bialko_z_miesem: 24,
          trudnosc: 'trudne',
          kuchnia: 'japońska',
          category: 'przystawka',
          skladniki_baza: JSON.stringify([
            { name: 'ryż sushi', amount: '300g', category: 'suche' },
            { name: 'ocet ryżowy', amount: '3 łyżki', category: 'inne' },
            { name: 'wasabi', amount: '20g', category: 'przyprawy' },
            { name: 'sos sojowy', amount: '100ml', category: 'inne' },
          ]),
          skladniki_mieso: JSON.stringify([
            { name: 'łosoś sashimi', amount: '200g', category: 'mięso' },
            { name: 'tuńczyk sashimi', amount: '150g', category: 'mięso' },
          ]),
          przepis: JSON.stringify({
            kroki: [
              'Ugotuj ryż sushi, dopraw octem',
              'Pokrój rybę w cienkie plastry',
              'Uformuj ryż w małe poduszeczki',
              'Nałóż rybę na ryż z odrobiną wasabi',
            ],
          }),
          tags: JSON.stringify(['japońskie', 'ryba', 'eleganckie']),
        },
        {
          id: 'barszcz-bialy',
          nazwa: 'Biały barszcz z kiełbasą',
          opis: 'Tradycyjny polski biały barszcz z kiełbasą',
          photo_url:
            'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=300&fit=crop&crop=center',
          prep_time: 30,
          kcal_baza: 180,
          kcal_z_miesem: 380,
          bialko_baza: 8,
          bialko_z_miesem: 22,
          trudnosc: 'łatwe',
          kuchnia: 'polska',
          category: 'zupa',
          skladniki_baza: JSON.stringify([
            { name: 'żurek', amount: '500ml', category: 'inne' },
            { name: 'śmietana', amount: '200ml', category: 'nabiał' },
            { name: 'czosnek', amount: '4 ząbki', category: 'warzywa' },
            { name: 'majeranek', amount: '1 łyżka', category: 'przyprawy' },
          ]),
          skladniki_mieso: JSON.stringify([
            { name: 'kiełbasa biała', amount: '300g', category: 'mięso' },
          ]),
          przepis: JSON.stringify({
            kroki: [
              'Podsmaż kiełbasę i czosnek',
              'Dodaj żurek i bulion',
              'Gotuj 15 min na małym ogniu',
              'Na końcu dodaj śmietanę i przyprawy',
            ],
          }),
          tags: JSON.stringify(['polskie', 'tradycyjne', 'kwaśne']),
        },
        {
          id: 'korean-bbq',
          nazwa: 'Korean BBQ Bulgogi',
          opis: 'Koreańska wołowina bulgogi z ryżem i kimchi',
          photo_url:
            'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=400&h=300&fit=crop&crop=center',
          prep_time: 45,
          kcal_baza: 0,
          kcal_z_miesem: 520,
          bialko_baza: 0,
          bialko_z_miesem: 40,
          trudnosc: 'średnie',
          kuchnia: 'koreańska',
          category: 'danie główne',
          skladniki_baza: JSON.stringify([
            { name: 'ryż', amount: '300g', category: 'suche' },
            { name: 'kimchi', amount: '200g', category: 'warzywa' },
            { name: 'sos sojowy', amount: '100ml', category: 'inne' },
            { name: 'sezam', amount: '2 łyżki', category: 'inne' },
          ]),
          skladniki_mieso: JSON.stringify([
            { name: 'wołowina', amount: '500g', category: 'mięso' },
          ]),
          przepis: JSON.stringify({
            kroki: [
              'Pokrój wołowinę w cienkie paski',
              'Zamarynuj w sosie sojowym, czosnku i gruszce',
              'Smaż na bardzo gorącej patelni 3-4 min',
              'Podawaj z ryżem, kimchi i sezamem',
            ],
          }),
          tags: JSON.stringify(['koreańskie', 'bbq', 'pikantne']),
        },
        {
          id: 'caprese-salad',
          nazwa: 'Sałatka Caprese',
          opis: 'Włoska sałatka z mozzarellą, pomidorami i bazylią',
          photo_url:
            'https://images.unsplash.com/photo-1572441713132-51071997c9d2?w=400&h=300&fit=crop&crop=center',
          prep_time: 15,
          kcal_baza: 280,
          kcal_z_miesem: 280,
          bialko_baza: 16,
          bialko_z_miesem: 16,
          trudnosc: 'łatwe',
          kuchnia: 'włoska',
          category: 'sałatka',
          skladniki_baza: JSON.stringify([
            { name: 'mozzarella di bufala', amount: '250g', category: 'nabiał' },
            { name: 'pomidory malinowe', amount: '400g', category: 'warzywa' },
            { name: 'bazylia', amount: '20 liści', category: 'warzywa' },
            { name: 'oliwa extra virgin', amount: '4 łyżki', category: 'inne' },
          ]),
          skladniki_mieso: JSON.stringify([]),
          przepis: JSON.stringify({
            kroki: [
              'Pokrój pomidory i mozzarellę w plastry',
              'Ułóż naprzemian na talerzu',
              'Dodaj listki bazylii między plastry',
              'Skrop oliwą i octem balsamicznym',
            ],
          }),
          tags: JSON.stringify(['wegetariańskie', 'świeże', 'włoskie']),
        },
        {
          id: 'thai-green-curry',
          nazwa: 'Zielone Curry Tajskie',
          opis: 'Tajskie curry z zielonym chili i kurczakiem',
          photo_url:
            'https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&h=300&fit=crop&crop=center',
          prep_time: 30,
          kcal_baza: 350,
          kcal_z_miesem: 480,
          bialko_baza: 12,
          bialko_z_miesem: 35,
          trudnosc: 'średnie',
          kuchnia: 'tajska',
          category: 'danie główne',
          skladniki_baza: JSON.stringify([
            { name: 'mleko kokosowe', amount: '400ml', category: 'inne' },
            { name: 'pasta zielone curry', amount: '3 łyżki', category: 'przyprawy' },
            { name: 'bakłażan tajski', amount: '200g', category: 'warzywa' },
            { name: 'liście kaffiru', amount: '6 szt.', category: 'warzywa' },
          ]),
          skladniki_mieso: JSON.stringify([{ name: 'kurczak', amount: '400g', category: 'mięso' }]),
          przepis: JSON.stringify({
            kroki: [
              'Podsmaż pastę curry na oleju',
              'Dodaj kawałki kurczaka, smaż 5 min',
              'Zalej mlekiem kokosowym',
              'Duś z warzywami 15 min, dodaj liście kaffiru',
            ],
          }),
          tags: JSON.stringify(['tajskie', 'kokosowe', 'pikantne']),
        },
        {
          id: 'greek-moussaka',
          nazwa: 'Grecka Moussaka',
          opis: 'Grecka zapiekanka z bakłażana i jagnięciny',
          photo_url:
            'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop&crop=center',
          prep_time: 90,
          kcal_baza: 200,
          kcal_z_miesem: 520,
          bialko_baza: 12,
          bialko_z_miesem: 38,
          trudnosc: 'trudne',
          kuchnia: 'grecka',
          category: 'danie główne',
          skladniki_baza: JSON.stringify([
            { name: 'bakłażan', amount: '3 duże', category: 'warzywa' },
            { name: 'ser feta', amount: '200g', category: 'nabiał' },
            { name: 'mleko', amount: '500ml', category: 'nabiał' },
            { name: 'oregano', amount: '2 łyżki', category: 'przyprawy' },
          ]),
          skladniki_mieso: JSON.stringify([
            { name: 'jagnięcina mielona', amount: '600g', category: 'mięso' },
          ]),
          przepis: JSON.stringify({
            kroki: [
              'Pokrój i posoliź bakłażany, pozostaw na 30 min',
              'Usmaż jagnięcinę z cebulą i pomidorami',
              'Ułóż warstwami: bakłażan, mięso, bakłażan',
              'Zalej beszamelem, posyp fetą, piecz 45 min',
            ],
          }),
          tags: JSON.stringify(['greckie', 'zapiekane', 'comfort food']),
        },
        {
          id: 'vietnamese-spring-rolls',
          nazwa: 'Wietnamskie Spring Rolls',
          opis: 'Świeże wietnamskie sajgonki z krewetkami',
          photo_url:
            'https://images.unsplash.com/photo-1559314809-0f31657df93b?w=400&h=300&fit=crop&crop=center',
          prep_time: 25,
          kcal_baza: 180,
          kcal_z_miesem: 220,
          bialko_baza: 8,
          bialko_z_miesem: 18,
          trudnosc: 'średnie',
          kuchnia: 'wietnamska',
          category: 'przystawka',
          skladniki_baza: JSON.stringify([
            { name: 'papier ryżowy', amount: '12 szt.', category: 'inne' },
            { name: 'sałata masłowa', amount: '6 liści', category: 'warzywa' },
            { name: 'mięta', amount: '20 liści', category: 'warzywa' },
            { name: 'makaron ryżowy', amount: '100g', category: 'suche' },
          ]),
          skladniki_mieso: JSON.stringify([
            { name: 'krewetki', amount: '200g', category: 'mięso' },
          ]),
          przepis: JSON.stringify({
            kroki: [
              'Ugotuj krewetki i makaron ryżowy',
              'Namocz papier ryżowy w ciepłej wodzie',
              'Nałóż sałatę, krewetki, makaron i zioła',
              'Zwiń ciasno, podawaj z sosem orzechowym',
            ],
          }),
          tags: JSON.stringify(['wietnamskie', 'świeże', 'lekkie']),
        },
        {
          id: 'mexican-enchiladas',
          nazwa: 'Enchiladas Mexicanas',
          opis: 'Meksykańskie naleśniki z kurczakiem i sosem chili',
          photo_url:
            'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400&h=300&fit=crop&crop=center',
          prep_time: 40,
          kcal_baza: 320,
          kcal_z_miesem: 480,
          bialko_baza: 15,
          bialko_z_miesem: 32,
          trudnosc: 'średnie',
          kuchnia: 'meksykańska',
          category: 'danie główne',
          skladniki_baza: JSON.stringify([
            { name: 'tortille kukurydziane', amount: '8 szt.', category: 'suche' },
            { name: 'ser cheddar', amount: '200g', category: 'nabiał' },
            { name: 'sos enchilada', amount: '300ml', category: 'inne' },
            { name: 'śmietana', amount: '150ml', category: 'nabiał' },
          ]),
          skladniki_mieso: JSON.stringify([{ name: 'kurczak', amount: '400g', category: 'mięso' }]),
          przepis: JSON.stringify({
            kroki: [
              'Ugotuj i pokrusz kurczaka',
              'Nałóż kurczaka i ser na tortille',
              'Zwiń i ułóż w naczyniu żaroodpornym',
              'Polej sosem enchilada, posyp serem, piecz 25 min',
            ],
          }),
          tags: JSON.stringify(['meksykańskie', 'zapiekane', 'pikantne']),
        },
        {
          id: 'spaghetti-bolognese',
          nazwa: 'Spaghetti Bolognese',
          opis: 'Klasyczne włoskie spaghetti z sosem mięsno-pomidorowym',
          photo_url:
            'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&h=300&fit=crop&crop=center',
          prep_time: 45,
          kcal_baza: 320,
          kcal_z_miesem: 520,
          bialko_baza: 12,
          bialko_z_miesem: 32,
          trudnosc: 'łatwe',
          kuchnia: 'włoska',
          category: 'danie główne',
          skladniki_baza: JSON.stringify([
            { name: 'spaghetti', amount: '400g', category: 'suche' },
            { name: 'sos pomidorowy', amount: '400ml', category: 'inne' },
            { name: 'cebula', amount: '1 szt.', category: 'warzywa' },
            { name: 'marchewka', amount: '1 szt.', category: 'warzywa' },
          ]),
          skladniki_mieso: JSON.stringify([
            { name: 'mięso mielone wołowe', amount: '500g', category: 'mięso' },
          ]),
          przepis: JSON.stringify({
            kroki: [
              'Podsmaż drobno pokrojoną cebulę i marchewkę',
              'Dodaj mięso mielone i smaż do zarumienienia',
              'Wlej sos pomidorowy i duś 30 min',
              'Ugotuj spaghetti al dente i podawaj z sosem',
            ],
          }),
          tags: JSON.stringify(['włoskie', 'klasyczne']),
        },
        {
          id: 'tom-yum-goong',
          nazwa: 'Tom Yum Goong',
          opis: 'Tajska kwaśno-ostra zupa z krewetkami',
          photo_url:
            'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop&crop=center',
          prep_time: 20,
          kcal_baza: 120,
          kcal_z_miesem: 220,
          bialko_baza: 4,
          bialko_z_miesem: 18,
          trudnosc: 'średnie',
          kuchnia: 'tajska',
          category: 'zupa',
          skladniki_baza: JSON.stringify([
            { name: 'bulion warzywny', amount: '1l', category: 'inne' },
            { name: 'trawa cytrynowa', amount: '3 łodygi', category: 'przyprawy' },
            { name: 'limonka', amount: '3 szt.', category: 'warzywa' },
            { name: 'pieczarki', amount: '200g', category: 'warzywa' },
          ]),
          skladniki_mieso: JSON.stringify([
            { name: 'krewetki', amount: '400g', category: 'mięso' },
          ]),
          przepis: JSON.stringify({
            kroki: [
              'Zagotuj bulion z trawą cytrynową',
              'Dodaj pokrojone pieczarki',
              'Wrzuć krewetki na 3 minuty',
              'Dopraw sokiem z limonki i pastą chili',
            ],
          }),
          tags: JSON.stringify(['tajskie', 'ostre', 'zupa']),
        },
        {
          id: 'quiche-lorraine',
          nazwa: 'Quiche Lorraine',
          opis: 'Francuska tarta z jajkami, boczkiem i serem',
          photo_url:
            'https://images.unsplash.com/photo-1571197119861-1619602d8372?w=400&h=300&fit=crop&crop=center',
          prep_time: 60,
          kcal_baza: 380,
          kcal_z_miesem: 480,
          bialko_baza: 16,
          bialko_z_miesem: 24,
          trudnosc: 'średnie',
          kuchnia: 'francuska',
          category: 'danie główne',
          skladniki_baza: JSON.stringify([
            { name: 'ciasto kruche', amount: '1 szt.', category: 'suche' },
            { name: 'jajka', amount: '4 szt.', category: 'nabiał' },
            { name: 'śmietana', amount: '200ml', category: 'nabiał' },
            { name: 'ser gruyere', amount: '150g', category: 'nabiał' },
          ]),
          skladniki_mieso: JSON.stringify([
            { name: 'boczek wędzony', amount: '200g', category: 'mięso' },
          ]),
          przepis: JSON.stringify({
            kroki: [
              'Wyłóż ciasto do formy i nakłuj widelcem',
              'Podsmaż boczek do chrupkości',
              'Ubij jajka ze śmietaną',
              'Nałóż boczek i ser, zalej masą, piecz 35 min',
            ],
          }),
          tags: JSON.stringify(['francuskie', 'zapiekane']),
        },
        {
          id: 'buddha-bowl-quinoa',
          nazwa: 'Buddha Bowl',
          opis: 'Kolorowa miska z quinoa, awokado i warzywami',
          photo_url:
            'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop&crop=center',
          prep_time: 25,
          kcal_baza: 420,
          kcal_z_miesem: 420,
          bialko_baza: 18,
          bialko_z_miesem: 18,
          trudnosc: 'łatwe',
          kuchnia: 'fusion',
          category: 'danie główne',
          skladniki_baza: JSON.stringify([
            { name: 'quinoa', amount: '200g', category: 'suche' },
            { name: 'awokado', amount: '2 szt.', category: 'warzywa' },
            { name: 'brokuły', amount: '300g', category: 'warzywa' },
            { name: 'marchewka', amount: '2 szt.', category: 'warzywa' },
          ]),
          skladniki_mieso: JSON.stringify([]),
          przepis: JSON.stringify({
            kroki: [
              'Ugotuj quinoa zgodnie z instrukcją',
              'Ugotuj brokuły na parze',
              'Zetrzyj marchewkę na tarce',
              'Ułóż wszystko w misce, polej tahini',
            ],
          }),
          tags: JSON.stringify(['wegetariańskie', 'zdrowe', 'kolorowe']),
        },
        {
          id: 'chili-con-carne-pikantne',
          nazwa: 'Chili con Carne',
          opis: 'Meksykańskie pikantne danie z fasolą i wołowiną',
          photo_url:
            'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&crop=center',
          prep_time: 90,
          kcal_baza: 280,
          kcal_z_miesem: 450,
          bialko_baza: 15,
          bialko_z_miesem: 35,
          trudnosc: 'łatwe',
          kuchnia: 'meksykańska',
          category: 'danie główne',
          skladniki_baza: JSON.stringify([
            { name: 'fasola czerwona', amount: '400g', category: 'suche' },
            { name: 'pomidory z puszki', amount: '400g', category: 'inne' },
            { name: 'cebula', amount: '2 szt.', category: 'warzywa' },
            { name: 'papryka chili', amount: '2 szt.', category: 'warzywa' },
          ]),
          skladniki_mieso: JSON.stringify([
            { name: 'wołowina mielona', amount: '600g', category: 'mięso' },
          ]),
          przepis: JSON.stringify({
            kroki: [
              'Podsmaż cebulę do zeszklenia',
              'Dodaj mięso i smaż do zarumienienia',
              'Wrzuć pomidory, fasolę i przyprawy',
              'Duś na małym ogniu 60 minut',
            ],
          }),
          tags: JSON.stringify(['meksykańskie', 'ostre', 'duszone']),
        },
        {
          id: 'sushi-california-roll',
          nazwa: 'California Roll',
          opis: 'Sushi z krabem, awokado i ogórkiem',
          photo_url:
            'https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=400&h=300&fit=crop&crop=center',
          prep_time: 40,
          kcal_baza: 250,
          kcal_z_miesem: 320,
          bialko_baza: 8,
          bialko_z_miesem: 16,
          trudnosc: 'trudne',
          kuchnia: 'japońska',
          category: 'danie główne',
          skladniki_baza: JSON.stringify([
            { name: 'ryż do sushi', amount: '300g', category: 'suche' },
            { name: 'nori', amount: '6 arkuszy', category: 'inne' },
            { name: 'awokado', amount: '2 szt.', category: 'warzywa' },
            { name: 'ogórek', amount: '1 szt.', category: 'warzywa' },
          ]),
          skladniki_mieso: JSON.stringify([
            { name: 'surimi krab', amount: '200g', category: 'mięso' },
          ]),
          przepis: JSON.stringify({
            kroki: [
              'Ugotuj ryż do sushi z octem ryżowym',
              'Pokrój awokado i ogórka w paski',
              'Rozmieś ryż na nori, dodaj składniki',
              'Zwiń w mata bambusowa i pokrój',
            ],
          }),
          tags: JSON.stringify(['japońskie', 'surowe', 'elegant']),
        },
        {
          id: 'piernik-staropolski',
          nazwa: 'Piernik staropolski',
          opis: 'Tradycyjny polski piernik z miodem i przyprawami',
          photo_url:
            'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop&crop=center',
          prep_time: 120,
          kcal_baza: 320,
          kcal_z_miesem: 320,
          bialko_baza: 6,
          bialko_z_miesem: 6,
          trudnosc: 'średnie',
          kuchnia: 'polska',
          category: 'deser',
          skladniki_baza: JSON.stringify([
            { name: 'mąka żytnia', amount: '400g', category: 'suche' },
            { name: 'miód', amount: '200g', category: 'inne' },
            { name: 'jajka', amount: '2 szt.', category: 'nabiał' },
            { name: 'przyprawa do piernika', amount: '2 łyżki', category: 'przyprawy' },
          ]),
          skladniki_mieso: JSON.stringify([]),
          przepis: JSON.stringify({
            kroki: [
              'Rozgrzej miód z przyprawami',
              'Wymieszaj z mąką i jajkami',
              'Wymieszaj ciasto i odstaw na noc',
              'Uformuj i piecz 45 min w 180°C',
            ],
          }),
          tags: JSON.stringify(['polskie', 'słodkie', 'tradycyjne']),
        },
        {
          id: 'ramen-miso-klasyczny',
          nazwa: 'Ramen Miso',
          opis: 'Japońska zupa z makaronem, miso i jajkiem',
          photo_url:
            'https://images.unsplash.com/photo-1555126634-323283e090fa?w=400&h=300&fit=crop&crop=center',
          prep_time: 35,
          kcal_baza: 380,
          kcal_z_miesem: 520,
          bialko_baza: 16,
          bialko_z_miesem: 32,
          trudnosc: 'średnie',
          kuchnia: 'japońska',
          category: 'zupa',
          skladniki_baza: JSON.stringify([
            { name: 'makaron ramen', amount: '2 porcje', category: 'suche' },
            { name: 'pasta miso', amount: '3 łyżki', category: 'przyprawy' },
            { name: 'jajka', amount: '2 szt.', category: 'nabiał' },
            { name: 'nori', amount: '2 arkusze', category: 'inne' },
          ]),
          skladniki_mieso: JSON.stringify([
            { name: 'wieprzowina', amount: '300g', category: 'mięso' },
          ]),
          przepis: JSON.stringify({
            kroki: [
              'Ugotuj rosół z mięsem przez 2 godziny',
              'Rozpuść miso w bulionei',
              'Ugotuj makaron i jajka na miękko',
              'Ułóż w misce z mięsem i warzywami',
            ],
          }),
          tags: JSON.stringify(['japońskie', 'zupa', 'comfort food']),
        },
        {
          id: 'greek-salad',
          nazwa: 'Sałatka grecka',
          opis: 'Tradycyjna sałatka z fetą, oliwkami i pomidorami',
          photo_url:
            'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop&crop=center',
          prep_time: 15,
          kcal_baza: 280,
          kcal_z_miesem: 280,
          bialko_baza: 12,
          bialko_z_miesem: 12,
          trudnosc: 'łatwe',
          kuchnia: 'grecka',
          category: 'sałatka',
          skladniki_baza: JSON.stringify([
            { name: 'pomidory', amount: '4 szt.', category: 'warzywa' },
            { name: 'ogórek', amount: '2 szt.', category: 'warzywa' },
            { name: 'feta', amount: '200g', category: 'nabiał' },
            { name: 'oliwki kalamata', amount: '100g', category: 'inne' },
          ]),
          skladniki_mieso: JSON.stringify([]),
          przepis: JSON.stringify({
            kroki: [
              'Pokrój pomidory i ogórki w kostkę',
              'Dodaj pokruszoną fetę i oliwki',
              'Polej oliwą z oliwek i octem',
              'Posyp oregano i podawaj',
            ],
          }),
          tags: JSON.stringify(['greckie', 'świeże', 'zdrowe']),
        },
        {
          id: 'moroccan-tagine',
          nazwa: 'Tajin marokański',
          opis: 'Aromatyczne danie z jagnięciną i suszonymi owocami',
          photo_url:
            'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop&crop=center',
          prep_time: 150,
          kcal_baza: 220,
          kcal_z_miesem: 480,
          bialko_baza: 8,
          bialko_z_miesem: 38,
          trudnosc: 'trudne',
          kuchnia: 'marokańska',
          category: 'danie główne',
          skladniki_baza: JSON.stringify([
            { name: 'morele suszone', amount: '150g', category: 'owoce' },
            { name: 'cebula', amount: '2 szt.', category: 'warzywa' },
            { name: 'cynamon', amount: '1 łyżeczka', category: 'przyprawy' },
            { name: 'imbir', amount: '2 cm', category: 'przyprawy' },
          ]),
          skladniki_mieso: JSON.stringify([
            { name: 'jagnięcina', amount: '800g', category: 'mięso' },
          ]),
          przepis: JSON.stringify({
            kroki: [
              'Pokrój mięso w kostkę i przypraw',
              'Podsmaż z cebulą do zarumienienia',
              'Dodaj przyprawy i suszone owoce',
              'Duś w tajinie 2 godziny',
            ],
          }),
          tags: JSON.stringify(['marokańskie', 'egzotyczne', 'długo duszone']),
        },
        {
          id: 'korean-kimchi-jjigae',
          nazwa: 'Kimchi Jjigae',
          opis: 'Koreańska pikantna zupa z kimchi i tofu',
          photo_url:
            'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400&h=300&fit=crop&crop=center',
          prep_time: 25,
          kcal_baza: 180,
          kcal_z_miesem: 320,
          bialko_baza: 12,
          bialko_z_miesem: 25,
          trudnosc: 'łatwe',
          kuchnia: 'koreańska',
          category: 'zupa',
          skladniki_baza: JSON.stringify([
            { name: 'kimchi', amount: '300g', category: 'warzywa' },
            { name: 'tofu', amount: '200g', category: 'nabiał' },
            { name: 'cebula', amount: '1 szt.', category: 'warzywa' },
            { name: 'czosnek', amount: '3 ząbki', category: 'warzywa' },
          ]),
          skladniki_mieso: JSON.stringify([
            { name: 'wieprzowina', amount: '200g', category: 'mięso' },
          ]),
          przepis: JSON.stringify({
            kroki: [
              'Podsmaż pokrojone kimchi z cebulą',
              'Dodaj mięso i smaż 5 minut',
              'Zalej wodą i gotuj 15 minut',
              'Dodaj tofu na ostatnie 5 minut',
            ],
          }),
          tags: JSON.stringify(['koreańskie', 'pikantne', 'fermentowane']),
        },
        {
          id: 'italian-tiramisu',
          nazwa: 'Tiramisu',
          opis: 'Klasyczny włoski deser z mascarpone i kawą',
          photo_url:
            'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop&crop=center',
          prep_time: 30,
          kcal_baza: 420,
          kcal_z_miesem: 420,
          bialko_baza: 8,
          bialko_z_miesem: 8,
          trudnosc: 'średnie',
          kuchnia: 'włoska',
          category: 'deser',
          skladniki_baza: JSON.stringify([
            { name: 'biszkopty savoiardi', amount: '200g', category: 'suche' },
            { name: 'mascarpone', amount: '500g', category: 'nabiał' },
            { name: 'jajka', amount: '4 szt.', category: 'nabiał' },
            { name: 'kawa espresso', amount: '300ml', category: 'napoje' },
          ]),
          skladniki_mieso: JSON.stringify([]),
          przepis: JSON.stringify({
            kroki: [
              'Ubij żółtka z cukrem do białości',
              'Wymieszaj z mascarpone',
              'Ubij białka na sztywno i dodaj',
              'Ułóż warstwy z biszkoptami i kremem',
            ],
          }),
          tags: JSON.stringify(['włoskie', 'słodkie', 'kawowe']),
        },
        {
          id: 'indian-dal',
          nazwa: 'Dal z soczewicą',
          opis: 'Indyjski dal z żółtej soczewicy z kurkumą i imbirem',
          photo_url:
            'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop&crop=center',
          prep_time: 30,
          kcal_baza: 280,
          kcal_z_miesem: 280,
          bialko_baza: 18,
          bialko_z_miesem: 18,
          trudnosc: 'łatwe',
          kuchnia: 'indyjska',
          category: 'danie główne',
          skladniki_baza: JSON.stringify([
            { name: 'soczewica żółta', amount: '300g', category: 'suche' },
            { name: 'kurkuma', amount: '1 łyżeczka', category: 'przyprawy' },
            { name: 'imbir', amount: '3 cm', category: 'przyprawy' },
            { name: 'czosnek', amount: '4 ząbki', category: 'warzywa' },
          ]),
          skladniki_mieso: JSON.stringify([]),
          przepis: JSON.stringify({
            kroki: [
              'Ugotuj soczewicę z kurkumą do miękkości',
              'Podsmaż czosnek i imbir na maśle klarowanym',
              'Dodaj do soczewicy i wymieszaj',
              'Dopraw solą i kolendrą',
            ],
          }),
          tags: JSON.stringify(['indyjskie', 'wegetariańskie', 'białko roślinne']),
        },
        {
          id: 'spanish-paella',
          nazwa: 'Paella Valenciana',
          opis: 'Tradycyjna hiszpańska paella z kurczakiem i owoce morza',
          photo_url:
            'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=400&h=300&fit=crop&crop=center',
          prep_time: 45,
          kcal_baza: 380,
          kcal_z_miesem: 520,
          bialko_baza: 15,
          bialko_z_miesem: 35,
          trudnosc: 'trudne',
          kuchnia: 'hiszpańska',
          category: 'danie główne',
          skladniki_baza: JSON.stringify([
            { name: 'ryż bomba', amount: '400g', category: 'suche' },
            { name: 'szafran', amount: '0.5g', category: 'przyprawy' },
            { name: 'bulion kurczy', amount: '1l', category: 'inne' },
            { name: 'papryka', amount: '2 szt.', category: 'warzywa' },
          ]),
          skladniki_mieso: JSON.stringify([
            { name: 'kurczak', amount: '600g', category: 'mięso' },
            { name: 'krewetki', amount: '300g', category: 'mięso' },
          ]),
          przepis: JSON.stringify({
            kroki: [
              'Podsmaż kurczaka w paellera',
              'Dodaj warzywa i smaż 5 minut',
              'Wsyp ryż i zalej bulionem z szafranem',
              'Gotuj 20 min, dodaj krewetki na końcu',
            ],
          }),
          tags: JSON.stringify(['hiszpańskie', 'owoce morza', 'eleganckie']),
        },
        {
          id: 'zurek',
          nazwa: 'Żurek',
          opis: 'Tradycyjna polska zupa na zakwasie z białą kiełbasą i jajkiem',
          photo_url:
            'https://images.unsplash.com/photo-1607530543338-8e23c4a0e6e4?w=400&h=300&fit=crop&crop=center',
          prep_time: 60,
          kcal_baza: 220,
          kcal_z_miesem: 380,
          bialko_baza: 8,
          bialko_z_miesem: 22,
          trudnosc: 'średnie',
          kuchnia: 'polska',
          category: 'zupa',
          skladniki_baza: JSON.stringify([
            { name: 'zakwas żurowy', amount: '500ml', category: 'inne' },
            { name: 'ziemniaki', amount: '4 szt.', category: 'warzywa' },
            { name: 'jajka', amount: '4 szt.', category: 'nabiał' },
            { name: 'chrzan', amount: '2 łyżki', category: 'przyprawy' },
          ]),
          skladniki_mieso: JSON.stringify([
            { name: 'biała kiełbasa', amount: '400g', category: 'mięso' },
          ]),
          przepis: JSON.stringify({
            kroki: [
              'Ugotuj bulion z warzywami',
              'Dodaj zakwas żurowy i zagotuj',
              'Ugotuj ziemniaki i jajka osobno',
              'Pokrój kiełbasę, dodaj do zupy z ziemniakami i jajkami',
            ],
          }),
          tags: JSON.stringify(['polskie', 'zupa', 'tradycyjne']),
        },
        {
          id: 'placki-ziemniaczane',
          nazwa: 'Placki ziemniaczane',
          opis: 'Chrupiące placki z tartych ziemniaków podawane ze śmietaną',
          photo_url:
            'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&h=300&fit=crop&crop=center',
          prep_time: 40,
          kcal_baza: 320,
          kcal_z_miesem: 320,
          bialko_baza: 8,
          bialko_z_miesem: 8,
          trudnosc: 'łatwe',
          kuchnia: 'polska',
          category: 'danie główne',
          skladniki_baza: JSON.stringify([
            { name: 'ziemniaki', amount: '1kg', category: 'warzywa' },
            { name: 'cebula', amount: '1 szt.', category: 'warzywa' },
            { name: 'jajko', amount: '1 szt.', category: 'nabiał' },
            { name: 'mąka', amount: '3 łyżki', category: 'suche' },
            { name: 'śmietana', amount: '200ml', category: 'nabiał' },
          ]),
          skladniki_mieso: JSON.stringify([]),
          przepis: JSON.stringify({
            kroki: [
              'Zetrzyj ziemniaki i cebulę na drobnej tarce',
              'Odciśnij nadmiar wody',
              'Dodaj jajko i mąkę, wymieszaj',
              'Smaż na rozgrzanym oleju z obu stron na złoty kolor',
              'Podawaj ze śmietaną lub gulaszem',
            ],
          }),
          tags: JSON.stringify(['polskie', 'wegetariańskie', 'chrupiące']),
        },
        {
          id: 'golabki',
          nazwa: 'Gołąbki',
          opis: 'Kapusta faszerowana mięsem mielonym i ryżem w sosie pomidorowym',
          photo_url:
            'https://images.unsplash.com/photo-1604908177453-7462950a6a3b?w=400&h=300&fit=crop&crop=center',
          prep_time: 90,
          kcal_baza: 180,
          kcal_z_miesem: 380,
          bialko_baza: 6,
          bialko_z_miesem: 28,
          trudnosc: 'średnie',
          kuchnia: 'polska',
          category: 'danie główne',
          skladniki_baza: JSON.stringify([
            { name: 'kapusta włoska', amount: '1 główka', category: 'warzywa' },
            { name: 'ryż', amount: '200g', category: 'suche' },
            { name: 'passata pomidorowa', amount: '500ml', category: 'inne' },
            { name: 'cebula', amount: '2 szt.', category: 'warzywa' },
          ]),
          skladniki_mieso: JSON.stringify([
            { name: 'mięso mielone wieprzowo-wołowe', amount: '500g', category: 'mięso' },
          ]),
          przepis: JSON.stringify({
            kroki: [
              'Zblanszuj liście kapusty w osolonej wodzie',
              'Wymieszaj mięso z ugotowanym ryżem i cebulą',
              'Zawiń farsz w liście kapusty',
              'Ułóż w garnku, zalej passatą',
              'Duś pod przykryciem 60 minut',
            ],
          }),
          tags: JSON.stringify(['polskie', 'duszone', 'tradycyjne']),
        },
        {
          id: 'nalesniki',
          nazwa: 'Naleśniki z serem',
          opis: 'Cienkie naleśniki z nadzieniem twarogowym, podawane z dżemem',
          photo_url:
            'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=400&h=300&fit=crop&crop=center',
          prep_time: 35,
          kcal_baza: 340,
          kcal_z_miesem: 340,
          bialko_baza: 16,
          bialko_z_miesem: 16,
          trudnosc: 'łatwe',
          kuchnia: 'polska',
          category: 'danie główne',
          skladniki_baza: JSON.stringify([
            { name: 'mąka', amount: '250g', category: 'suche' },
            { name: 'mleko', amount: '500ml', category: 'nabiał' },
            { name: 'jajka', amount: '3 szt.', category: 'nabiał' },
            { name: 'twaróg', amount: '500g', category: 'nabiał' },
            { name: 'cukier waniliowy', amount: '2 saszetki', category: 'suche' },
          ]),
          skladniki_mieso: JSON.stringify([]),
          przepis: JSON.stringify({
            kroki: [
              'Wymieszaj mąkę, mleko i jajka na gładkie ciasto',
              'Smaż cienkie naleśniki na patelni',
              'Przygotuj nadzienie z twarogu, cukru i wanilii',
              'Nałóż farsz, zwiń naleśniki',
              'Podawaj z dżemem lub owocami',
            ],
          }),
          tags: JSON.stringify(['polskie', 'wegetariańskie', 'słodkie']),
        },
        {
          id: 'lasagne',
          nazwa: 'Lasagne',
          opis: 'Klasyczna włoska zapiekanka z makaronem, mięsem i beszamelem',
          photo_url:
            'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=400&h=300&fit=crop&crop=center',
          prep_time: 90,
          kcal_baza: 320,
          kcal_z_miesem: 520,
          bialko_baza: 18,
          bialko_z_miesem: 35,
          trudnosc: 'średnie',
          kuchnia: 'włoska',
          category: 'danie główne',
          skladniki_baza: JSON.stringify([
            { name: 'makaron lasagne', amount: '300g', category: 'suche' },
            { name: 'pomidory krojone', amount: '800g', category: 'warzywa' },
            { name: 'mleko', amount: '500ml', category: 'nabiał' },
            { name: 'masło', amount: '50g', category: 'nabiał' },
            { name: 'mąka', amount: '50g', category: 'suche' },
            { name: 'ser żółty', amount: '200g', category: 'nabiał' },
          ]),
          skladniki_mieso: JSON.stringify([
            { name: 'mięso mielone wołowe', amount: '500g', category: 'mięso' },
          ]),
          przepis: JSON.stringify({
            kroki: [
              'Podsmaż mięso z cebulą, dodaj pomidory i duś 30 min',
              'Przygotuj beszamel: rozpuść masło, dodaj mąkę i mleko',
              'Układaj warstwami: makaron, sos mięsny, beszamel',
              'Posyp serem i zapiekaj 40 min w 180°C',
            ],
          }),
          tags: JSON.stringify(['włoskie', 'zapiekane', 'comfort food']),
        },
        {
          id: 'bruschetta',
          nazwa: 'Bruschetta',
          opis: 'Chrupiące grzanki z pomidorami, bazylią i oliwą z oliwek',
          photo_url:
            'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400&h=300&fit=crop&crop=center',
          prep_time: 15,
          kcal_baza: 220,
          kcal_z_miesem: 220,
          bialko_baza: 6,
          bialko_z_miesem: 6,
          trudnosc: 'łatwe',
          kuchnia: 'włoska',
          category: 'przekąska',
          skladniki_baza: JSON.stringify([
            { name: 'bagietka', amount: '1 szt.', category: 'suche' },
            { name: 'pomidory', amount: '4 szt.', category: 'warzywa' },
            { name: 'bazylia', amount: '1 pęczek', category: 'zioła' },
            { name: 'oliwa z oliwek', amount: '3 łyżki', category: 'inne' },
            { name: 'czosnek', amount: '2 ząbki', category: 'warzywa' },
          ]),
          skladniki_mieso: JSON.stringify([]),
          przepis: JSON.stringify({
            kroki: [
              'Pokrój bagietkę w plastry i opiecz',
              'Pokrój pomidory w kostkę, wymieszaj z bazylią i oliwą',
              'Natrzyj grzanki czosnkiem',
              'Nałóż mieszankę pomidorową na grzanki',
            ],
          }),
          tags: JSON.stringify(['włoskie', 'wegetariańskie', 'przekąska']),
        },
        {
          id: 'stir-fry-tofu',
          nazwa: 'Stir-fry z tofu',
          opis: 'Smażone tofu z warzywami w sosie sojowo-imbirowym',
          photo_url:
            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop&crop=center',
          prep_time: 25,
          kcal_baza: 320,
          kcal_z_miesem: 320,
          bialko_baza: 22,
          bialko_z_miesem: 22,
          trudnosc: 'łatwe',
          kuchnia: 'azjatycka',
          category: 'danie główne',
          skladniki_baza: JSON.stringify([
            { name: 'tofu twarde', amount: '400g', category: 'inne' },
            { name: 'brokuły', amount: '200g', category: 'warzywa' },
            { name: 'papryka', amount: '2 szt.', category: 'warzywa' },
            { name: 'sos sojowy', amount: '3 łyżki', category: 'przyprawy' },
            { name: 'imbir', amount: '2 cm', category: 'przyprawy' },
            { name: 'ryż jaśminowy', amount: '200g', category: 'suche' },
          ]),
          skladniki_mieso: JSON.stringify([]),
          przepis: JSON.stringify({
            kroki: [
              'Pokrój tofu w kostkę i osusz papierowym ręcznikiem',
              'Podsmaż tofu na patelni do złotego koloru',
              'Dodaj warzywa i smaż 3-4 minuty',
              'Wlej sos sojowy z imbirem, wymieszaj',
              'Podawaj na ryżu jaśminowym',
            ],
          }),
          tags: JSON.stringify(['azjatyckie', 'wegańskie', 'szybkie']),
        },
        {
          id: 'burrito-bowl',
          nazwa: 'Burrito Bowl',
          opis: 'Meksykańska miska z ryżem, fasolą, awokado i salsą',
          photo_url:
            'https://images.unsplash.com/photo-1543352634-a1c51d9f1fa7?w=400&h=300&fit=crop&crop=center',
          prep_time: 30,
          kcal_baza: 380,
          kcal_z_miesem: 520,
          bialko_baza: 14,
          bialko_z_miesem: 32,
          trudnosc: 'łatwe',
          kuchnia: 'meksykańska',
          category: 'danie główne',
          skladniki_baza: JSON.stringify([
            { name: 'ryż', amount: '200g', category: 'suche' },
            { name: 'fasola czarna', amount: '400g', category: 'suche' },
            { name: 'awokado', amount: '2 szt.', category: 'warzywa' },
            { name: 'kukurydza', amount: '200g', category: 'warzywa' },
            { name: 'salsa', amount: '200ml', category: 'inne' },
            { name: 'limonka', amount: '2 szt.', category: 'owoce' },
          ]),
          skladniki_mieso: JSON.stringify([{ name: 'kurczak', amount: '400g', category: 'mięso' }]),
          przepis: JSON.stringify({
            kroki: [
              'Ugotuj ryż z limonką i kolendrą',
              'Podsmaż kurczaka z przyprawami meksykańskimi',
              'Podgrzej fasolę czarną',
              'Ułóż w misce: ryż, fasola, kurczak, awokado, kukurydza',
              'Polej salsą i wyciśnij limonkę',
            ],
          }),
          tags: JSON.stringify(['meksykańskie', 'zdrowe', 'kolorowe']),
        },
      ]

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
          meal.skladniki_baza,
          meal.skladniki_mieso,
          meal.przepis,
          meal.tags
        )
      }

      console.log(`Seeded ${meals.length} example meals in local SQLite database`)

      // Seed ingredients for exclusion feature
      const ingredientSeeds = [
        { id: 'orzechy', name: 'Orzechy', category: 'bakalie' },
        { id: 'mleko', name: 'Mleko', category: 'nabiał' },
        { id: 'jaja', name: 'Jaja', category: 'nabiał' },
        { id: 'gluten', name: 'Gluten', category: 'zboża' },
        { id: 'soja', name: 'Soja', category: 'inne' },
        { id: 'ryby', name: 'Ryby', category: 'mięso' },
        { id: 'owoce-morza', name: 'Owoce morza', category: 'mięso' },
        { id: 'laktoza', name: 'Laktoza', category: 'nabiał' },
        { id: 'seler', name: 'Seler', category: 'warzywa' },
        { id: 'gorczyca', name: 'Gorczyca', category: 'przyprawy' },
        { id: 'sezam', name: 'Sezam', category: 'bakalie' },
        { id: 'lupiny', name: 'Łubin', category: 'inne' },
        { id: 'miod', name: 'Miód', category: 'inne' },
        { id: 'wieprzowina', name: 'Wieprzowina', category: 'mięso' },
        { id: 'wolowina', name: 'Wołowina', category: 'mięso' },
        { id: 'drob', name: 'Drób', category: 'mięso' },
        { id: 'maslo', name: 'Masło', category: 'nabiał' },
        { id: 'ser', name: 'Ser', category: 'nabiał' },
        { id: 'cukier', name: 'Cukier', category: 'inne' },
        { id: 'kukurydza', name: 'Kukurydza', category: 'warzywa' },
      ]

      const insertIngredient = this.db.prepare(
        'INSERT OR IGNORE INTO ingredients (id, name, category) VALUES (?, ?, ?)'
      )
      for (const ing of ingredientSeeds) {
        insertIngredient.run(ing.id, ing.name, ing.category)
      }

      console.log(`Seeded ${ingredientSeeds.length} ingredients for exclusion feature`)
    } catch (error) {
      console.error('Error seeding data:', error)
      throw error
    }
  }

  close() {
    if (this.db) {
      this.db.close()
    }
  }
}

export function getLocalDb(): D1Database {
  if (!_localDb) {
    const dbPath = path.resolve(process.cwd(), 'local.db')
    console.log('Initializing local SQLite database at:', dbPath)
    _localDb = new LocalDatabase(dbPath)
  }
  return _localDb
}

// Cleanup on process exit - only in Node.js environment
try {
  if (typeof process !== 'undefined' && typeof process.on === 'function') {
    process.on('exit', () => {
      if (_localDb) {
        _localDb.close()
      }
    })
  }
} catch (error) {
  // Ignore errors in Edge Runtime
}
