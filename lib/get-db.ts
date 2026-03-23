import type { D1Database } from './db'

/**
 * Unified DB accessor: tries Cloudflare D1 binding first (wrangler dev / production),
 * then falls back to local SQLite via better-sqlite3 (next dev).
 */
export async function getDb(): Promise<D1Database> {
  // Try Cloudflare D1 binding first (works in wrangler dev + production)
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare')
    const { env } = await getCloudflareContext()
    const db = (env as unknown as { DB: D1Database }).DB
    if (db) return db
  } catch {
    // Not in Cloudflare runtime — fall through to local SQLite
  }

  // Fallback to local SQLite for `next dev`
  const { getLocalDb } = await import('./local-db')
  return getLocalDb()
}
