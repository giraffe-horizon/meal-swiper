import { getCloudflareContext } from '@opennextjs/cloudflare'
import type { NextRequest } from 'next/server'
import {
  getTenantByToken,
  getTenantInfo,
  createTenant,
  updateTenantName,
  saveSettings,
  type D1Database,
} from '@/lib/db'

// GET /api/tenant?token=<token> — return tenant info
export async function GET(request: NextRequest) {
  const { env } = await getCloudflareContext()
  const db = (env as unknown as { DB: D1Database }).DB
  if (!db) return Response.json({ error: 'D1 not configured' }, { status: 500 })

  const token = new URL(request.url).searchParams.get('token')
  if (!token) return Response.json({ error: 'token required' }, { status: 400 })

  const tenant = await getTenantInfo(db, token)
  if (!tenant) return Response.json({ error: 'Tenant not found' }, { status: 404 })

  return Response.json({
    id: tenant.id,
    token: tenant.token,
    name: tenant.name,
    created_at: tenant.created_at,
  })
}

// POST /api/tenant — register a new tenant token or verify existing one
export async function POST(request: NextRequest) {
  const { env } = await getCloudflareContext()
  const db = (env as unknown as { DB: D1Database }).DB
  if (!db) return Response.json({ error: 'D1 not configured' }, { status: 500 })

  const body = await request.json()
  const { token, name, people, persons } = body as {
    token?: string
    name?: string
    people?: number
    persons?: { name: string; kcal: number; protein: number }[]
  }
  if (!token) return Response.json({ error: 'token required' }, { status: 400 })

  try {
    // Check if token already exists
    const existing = await getTenantByToken(db, token)
    if (existing) {
      return Response.json({ id: existing.id, token: existing.token, existing: true })
    }

    // Create new tenant
    await createTenant(db, token, token, name || '')

    // Store initial settings
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
    await saveSettings(db, 'app_settings', JSON.stringify(initialSettings), token)

    return Response.json({ id: token, token, existing: false })
  } catch (error) {
    console.error('Error in tenant registration:', error)
    return Response.json({ error: 'Failed to register tenant' }, { status: 500 })
  }
}

// PATCH /api/tenant — update tenant name
export async function PATCH(request: NextRequest) {
  const { env } = await getCloudflareContext()
  const db = (env as unknown as { DB: D1Database }).DB
  if (!db) return Response.json({ error: 'D1 not configured' }, { status: 500 })

  const body = await request.json()
  const { token, name } = body as { token?: string; name?: string }
  if (!token) return Response.json({ error: 'token required' }, { status: 400 })
  if (name === undefined) return Response.json({ error: 'name required' }, { status: 400 })

  const tenant = await getTenantByToken(db, token)
  if (!tenant) return Response.json({ error: 'Tenant not found' }, { status: 404 })

  await updateTenantName(db, token, name)
  return Response.json({ ok: true })
}
