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
  PRIMARY KEY (tenant_id, week_key),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
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
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (meal_id) REFERENCES meals(id)
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
  notes TEXT DEFAULT '',
  FOREIGN KEY (meal_variant_id) REFERENCES meal_variants(id),
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
);

CREATE INDEX IF NOT EXISTS idx_mvi_variant ON meal_variant_ingredients(meal_variant_id);
CREATE INDEX IF NOT EXISTS idx_mvi_ingredient ON meal_variant_ingredients(ingredient_id);

-- Shopping checked items (tenant-scoped)
CREATE TABLE IF NOT EXISTS shopping_checked (
  tenant_id TEXT NOT NULL DEFAULT 'default',
  week_key TEXT NOT NULL,
  checked_data TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (tenant_id, week_key),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Settings table (tenant-scoped)
CREATE TABLE IF NOT EXISTS settings (
  tenant_id TEXT NOT NULL DEFAULT 'default',
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (tenant_id, key),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_meals_kuchnia ON meals(kuchnia);
CREATE INDEX IF NOT EXISTS idx_meals_trudnosc ON meals(trudnosc);
CREATE INDEX IF NOT EXISTS idx_meals_category ON meals(category);
