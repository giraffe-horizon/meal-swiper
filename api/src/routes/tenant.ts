import { Hono } from 'hono'
import type { Env } from '../index'
import {
  getTenantByToken,
  getTenantInfo,
  createTenant,
  updateTenantName,
  saveSettings,
} from '../db'

const app = new Hono<Env>()

// GET /tenant?token=<token>
app.get('/', async (c) => {
  const token = c.req.query('token')
  if (!token) return c.json({ error: 'token required' }, 400)

  const tenant = await getTenantInfo(c.env.DB, token)
  if (!tenant) return c.json({ error: 'Tenant not found' }, 404)

  return c.json({
    id: tenant.id,
    token: tenant.token,
    name: tenant.name,
    created_at: tenant.created_at,
  })
})

// POST /tenant — register or verify tenant
app.post('/', async (c) => {
  const body = await c.req.json()
  const { token, name, people, persons } = body as {
    token?: string
    name?: string
    people?: number
    persons?: { name: string; kcal: number; protein: number }[]
  }
  if (!token) return c.json({ error: 'token required' }, 400)

  try {
    const existing = await getTenantByToken(c.env.DB, token)
    if (existing) {
      return c.json({ id: existing.id, token: existing.token, existing: true })
    }

    await createTenant(c.env.DB, token, token, name || '')

    const resolvedPersons =
      persons && persons.length > 0
        ? persons
        : Array.from({ length: people || 2 }, (_, i) => ({
            name: `Osoba ${i + 1}`,
            kcal: 2000,
            protein: 120,
          }))

    const initialSettings = {
      people: resolvedPersons.length,
      persons: resolvedPersons,
      theme: 'system',
    }
    await saveSettings(c.env.DB, 'app_settings', JSON.stringify(initialSettings), token)

    return c.json({ id: token, token, existing: false })
  } catch (error) {
    console.error('Error in tenant registration:', error)
    return c.json({ error: 'Failed to register tenant' }, 500)
  }
})

// PATCH /tenant — update name
app.patch('/', async (c) => {
  const body = await c.req.json()
  const { token, name } = body as { token?: string; name?: string }
  if (!token) return c.json({ error: 'token required' }, 400)
  if (name === undefined) return c.json({ error: 'name required' }, 400)

  const tenant = await getTenantByToken(c.env.DB, token)
  if (!tenant) return c.json({ error: 'Tenant not found' }, 404)

  await updateTenantName(c.env.DB, token, name)
  return c.json({ ok: true })
})

export default app
