import { getTenantByToken, createTenant } from './db'

export async function resolveTenantId(
  db: D1Database,
  token: string | null
): Promise<string | null> {
  if (!token) return null
  const tenant = await getTenantByToken(db, token)
  if (tenant) return tenant.id
  await createTenant(db, token, token)
  return token
}

export async function requireTenantId(db: D1Database, token: string | null): Promise<string> {
  if (!token) throw new Error('Tenant token required')
  const tenant = await getTenantByToken(db, token)
  if (!tenant) throw new Error('Invalid tenant token')
  return tenant.id
}
