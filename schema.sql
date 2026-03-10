-- Meals table
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
  skladniki_baza TEXT DEFAULT '[]',
  skladniki_mieso TEXT DEFAULT '[]',
  przepis TEXT DEFAULT '{}',
  tags TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now'))
);

-- Weekly plans table (replaces KV)
CREATE TABLE IF NOT EXISTS weekly_plans (
  week_key TEXT PRIMARY KEY,
  plan_data TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Shopping checked items (replaces KV)
CREATE TABLE IF NOT EXISTS shopping_checked (
  week_key TEXT PRIMARY KEY,
  checked_data TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Settings table (replaces localStorage)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_meals_kuchnia ON meals(kuchnia);
CREATE INDEX IF NOT EXISTS idx_meals_trudnosc ON meals(trudnosc);
