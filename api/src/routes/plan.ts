import { Hono } from 'hono'
import type { Env } from '../index'
import { getWeeklyPlan, saveWeeklyPlan } from '../db'
import { requireTenantId } from '../tenant'
import { extractTenantToken } from '../middleware'

const app = new Hono<Env>()

app.get('/', async (c) => {
  const week = c.req.query('week')
  if (!week) return c.json({ error: 'week required' }, 400)

  try {
    const tenantId = await requireTenantId(c.env.DB, extractTenantToken(c))
    const data = await getWeeklyPlan(c.env.DB, week, tenantId)
    return c.json(data ? JSON.parse(data) : null)
  } catch (error) {
    const msg = error instanceof Error ? error.message : ''
    if (msg === 'Tenant token required' || msg === 'Invalid tenant token') {
      return c.json({ error: msg }, 401)
    }
    console.error('Error reading plan:', error)
    return c.json(null)
  }
})

app.post('/', async (c) => {
  const body = await c.req.json()
  const { week, plan } = body as { week?: string; plan?: unknown }
  if (!week || !plan) return c.json({ error: 'week and plan required' }, 400)

  try {
    const tenantId = await requireTenantId(c.env.DB, extractTenantToken(c))
    await saveWeeklyPlan(c.env.DB, week, JSON.stringify(plan), tenantId)
    return c.json({ ok: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : ''
    if (msg === 'Tenant token required' || msg === 'Invalid tenant token') {
      return c.json({ error: msg }, 401)
    }
    console.error('Error saving plan:', error)
    return c.json({ error: 'Failed to save' }, 500)
  }
})

export default app
