import type { D1Database } from './db'

/**
 * Unified DB accessor that switches between local SQLite (development)
 * and Cloudflare D1 (production) based on the environment
 */
export async function getDb(): Promise<D1Database> {
  if (process.env.NODE_ENV === 'development' || !process.env.CF_PAGES) {
    const { getLocalDb } = await import('./local-db')
    return getLocalDb()
  }

  const { getCloudflareContext } = await import('@opennextjs/cloudflare')
  const { env } = await getCloudflareContext()
  return (env as unknown as { DB: D1Database }).DB
}
