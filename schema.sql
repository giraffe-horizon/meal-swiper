-- Tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
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
