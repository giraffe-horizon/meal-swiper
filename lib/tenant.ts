import type { D1Database } from '@/lib/db'
import { getTenantByToken, createTenant } from '@/lib/db'

/**
 * Resolve a tenant token to a tenant ID.
 * If the token exists in DB, return the tenant ID.
 * If the token is new, create a new tenant and return the new ID.
 * If no token is provided, returns null.
 */
export async function resolveTenantId(db: D1Database, token: string | null): Promise<string | null> {
  if (!token) return null

  const tenant = await getTenantByToken(db, token)
  if (tenant) return tenant.id

  // Token not found — create new tenant with token as both id and token
  await createTenant(db, token, token)
  return token
}

/**
 * Require a valid tenant token, throwing if missing or not found in DB.
 * Use this for all tenant-scoped API endpoints.
 */
export async function requireTenantId(db: D1Database, token: string | null): Promise<string> {
  if (!token) throw new Error('Tenant token required')

  const tenant = await getTenantByToken(db, token)
  if (!tenant) throw new Error('Invalid tenant token')

  return tenant.id
}

/**
 * Extract tenant token from request headers (X-Tenant-Token) or query params (?token=).
 */
export function extractTenantToken(request: Request): string | null {
  const headerToken = request.headers.get('X-Tenant-Token')
  if (headerToken) return headerToken

  const url = new URL(request.url)
  return url.searchParams.get('token')
}
