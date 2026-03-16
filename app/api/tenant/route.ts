import { getCloudflareContext } from '@opennextjs/cloudflare'
import type { NextRequest } from 'next/server'
import { getTenantByToken, createTenant, saveSettings, type D1Database } from '@/lib/db'

// POST /api/tenant — register a new tenant token or verify existing one
export async function POST(request: NextRequest) {
  const { env } = await getCloudflareContext()
  const db = (env as unknown as { DB: D1Database }).DB
  if (!db) return Response.json({ error: 'D1 not configured' }, { status: 500 })

  const body = await request.json()
  const { token, name, people } = body as { token?: string; name?: string; people?: number }
  if (!token) return Response.json({ error: 'token required' }, { status: 400 })

  try {
    // Check if token already exists
    const existing = await getTenantByToken(db, token)
    if (existing) {
      return Response.json({ id: existing.id, token: existing.token, existing: true })
    }

    // Create new tenant
    await createTenant(db, token, token, name || '')

    // Store initial settings if people count was provided
    if (people && people > 0) {
      const persons = Array.from({ length: people }, (_, i) => ({
        name: `Osoba ${i + 1}`,
        kcal: 2000,
        protein: 120,
      }))
      const initialSettings = { people, persons, theme: 'system' }
      await saveSettings(db, 'app_settings', JSON.stringify(initialSettings), token)
    }

    return Response.json({ id: token, token, existing: false })
  } catch (error) {
    console.error('Error in tenant registration:', error)
    return Response.json({ error: 'Failed to register tenant' }, { status: 500 })
  }
}
