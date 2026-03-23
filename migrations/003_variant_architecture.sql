-- Variant architecture tables

CREATE TABLE IF NOT EXISTS ingredients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'inne',
  flags TEXT DEFAULT '[]',
  is_seasoning INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

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
