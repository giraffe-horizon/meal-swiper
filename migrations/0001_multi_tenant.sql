-- Migration: Multi-tenant support
-- Adds tenant isolation to weekly_plans, shopping_checked, and settings tables.
-- Meals table remains shared (all tenants see the same meals).

-- 1. Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tenants_token ON tenants(token);

-- 2. Insert default tenant for backward compatibility
INSERT OR IGNORE INTO tenants (id, token) VALUES ('default', 'default');

-- 3. Add tenant_id to weekly_plans (recreate with composite PK)
CREATE TABLE IF NOT EXISTS weekly_plans_new (
  tenant_id TEXT NOT NULL DEFAULT 'default',
  week_key TEXT NOT NULL,
  plan_data TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (tenant_id, week_key),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

INSERT OR IGNORE INTO weekly_plans_new (tenant_id, week_key, plan_data, updated_at)
  SELECT 'default', week_key, plan_data, updated_at FROM weekly_plans;

DROP TABLE IF EXISTS weekly_plans;
ALTER TABLE weekly_plans_new RENAME TO weekly_plans;

-- 4. Add tenant_id to shopping_checked (recreate with composite PK)
CREATE TABLE IF NOT EXISTS shopping_checked_new (
  tenant_id TEXT NOT NULL DEFAULT 'default',
  week_key TEXT NOT NULL,
  checked_data TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (tenant_id, week_key),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

INSERT OR IGNORE INTO shopping_checked_new (tenant_id, week_key, checked_data, updated_at)
  SELECT 'default', week_key, checked_data, updated_at FROM shopping_checked;

DROP TABLE IF EXISTS shopping_checked;
ALTER TABLE shopping_checked_new RENAME TO shopping_checked;

-- 5. Add tenant_id to settings (recreate with composite PK)
CREATE TABLE IF NOT EXISTS settings_new (
  tenant_id TEXT NOT NULL DEFAULT 'default',
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (tenant_id, key),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

INSERT OR IGNORE INTO settings_new (tenant_id, key, value, updated_at)
  SELECT 'default', key, value, updated_at FROM settings;

DROP TABLE IF EXISTS settings;
ALTER TABLE settings_new RENAME TO settings;
