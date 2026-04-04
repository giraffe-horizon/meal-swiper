import { Hono } from 'hono'
import type { Env } from '../index'
import { getSettings, saveSettings } from '../db'
import { requireTenantId } from '../tenant'
import { extractTenantToken } from '../middleware'

const app = new Hono<Env>()

app.get('/', async (c) => {
  const key = c.req.query('key')
  if (!key) return c.json({ error: 'key required' }, 400)

  try {
    const tenantId = await requireTenantId(c.env.DB, extractTenantToken(c))
    const data = await getSettings(c.env.DB, key, tenantId)
    return c.json(data ? JSON.parse(data) : null)
  } catch (error) {
    const msg = error instanceof Error ? error.message : ''
    if (msg === 'Tenant token required' || msg === 'Invalid tenant token') {
      return c.json({ error: msg }, 401)
    }
    console.error('Error reading settings:', error)
    return c.json(null)
  }
})

app.post('/', async (c) => {
  const body = await c.req.json()
  const { key, value } = body as { key?: string; value?: unknown }
  if (!key || value === undefined) return c.json({ error: 'key and value required' }, 400)

  try {
    const tenantId = await requireTenantId(c.env.DB, extractTenantToken(c))
    await saveSettings(c.env.DB, key, JSON.stringify(value), tenantId)
    return c.json({ ok: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : ''
    if (msg === 'Tenant token required' || msg === 'Invalid tenant token') {
      return c.json({ error: msg }, 401)
    }
    console.error('Error saving settings:', error)
    return c.json({ error: 'Failed to save' }, 500)
  }
})

export default app
