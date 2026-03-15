import type { D1Database } from '@/lib/db'
import { getTenantByToken, createTenant } from '@/lib/db'

/**
 * Resolve a tenant token to a tenant ID.
 * If the token exists in DB, return the tenant ID.
 * If the token is new, create a new tenant and return the new ID.
 * If no token is provided, return 'default'.
 */
export async function resolveTenantId(db: D1Database, token: string | null): Promise<string> {
  if (!token) return 'default'

  const tenant = await getTenantByToken(db, token)
  if (tenant) return tenant.id

  // Token not found — create new tenant with token as both id and token
  await createTenant(db, token, token)
  return token
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
