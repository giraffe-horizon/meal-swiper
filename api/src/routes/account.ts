import { Hono } from 'hono'
import type { Env } from '../index'
import { getTenantByToken } from '../db'
import { extractTenantToken } from '../middleware'

const app = new Hono<Env>()

// DELETE /account — delete tenant and all associated data (Apple requirement)
app.delete('/', async (c) => {
  const token = extractTenantToken(c)
  if (!token) return c.json({ error: 'Tenant token required' }, 401)

  const db = c.env.DB
  const tenant = await getTenantByToken(db, token)
  if (!tenant) return c.json({ error: 'Tenant not found' }, 404)

  try {
    await db.batch([
      db.prepare('DELETE FROM shopping_checked WHERE tenant_id = ?').bind(tenant.id),
      db.prepare('DELETE FROM weekly_plans WHERE tenant_id = ?').bind(tenant.id),
      db.prepare('DELETE FROM settings WHERE tenant_id = ?').bind(tenant.id),
      db.prepare('DELETE FROM tenants WHERE id = ?').bind(tenant.id),
    ])

    return c.json({ ok: true, deleted: tenant.id })
  } catch (error) {
    console.error('Error deleting account:', error)
    return c.json({ error: 'Failed to delete account' }, 500)
  }
})

export default app
