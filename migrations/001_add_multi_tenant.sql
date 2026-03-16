-- Migration 001: Add multi-tenant support
-- Adds NextAuth.js tables + user_id to user-specific tables

-- NextAuth required tables
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  emailVerified TEXT,
  image TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  providerAccountId TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  UNIQUE(provider, providerAccountId)
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  sessionToken TEXT UNIQUE NOT NULL,
  userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires TEXT NOT NULL,
  PRIMARY KEY(identifier, token)
);

-- Drop and recreate user-specific tables with user_id
-- (SQLite doesn't support ADD COLUMN with constraints easily for PKs)

-- Rename old tables
ALTER TABLE weekly_plans RENAME TO weekly_plans_old;
ALTER TABLE shopping_checked RENAME TO shopping_checked_old;
ALTER TABLE settings RENAME TO settings_old;

-- weekly_plans with user_id
CREATE TABLE weekly_plans (
  user_id TEXT NOT NULL,
  week_key TEXT NOT NULL,
  plan_data TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, week_key)
);

-- Migrate existing data to a default user (backward compat)
INSERT INTO weekly_plans (user_id, week_key, plan_data, updated_at)
SELECT 'default', week_key, plan_data, updated_at FROM weekly_plans_old;

DROP TABLE weekly_plans_old;

-- shopping_checked with user_id
CREATE TABLE shopping_checked (
  user_id TEXT NOT NULL,
  week_key TEXT NOT NULL,
  checked_data TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, week_key)
);

INSERT INTO shopping_checked (user_id, week_key, checked_data, updated_at)
SELECT 'default', week_key, checked_data, updated_at FROM shopping_checked_old;

DROP TABLE shopping_checked_old;

-- settings with user_id
CREATE TABLE settings (
  user_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, key)
);

INSERT INTO settings (user_id, key, value, updated_at)
SELECT 'default', key, value, updated_at FROM settings_old;

DROP TABLE settings_old;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_weekly_plans_user ON weekly_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_checked_user ON shopping_checked(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_user ON settings(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_userId ON accounts(userId);
CREATE INDEX IF NOT EXISTS idx_sessions_userId ON sessions(userId);
