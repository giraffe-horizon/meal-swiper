import { getCloudflareContext } from '@opennextjs/cloudflare'
import type { NextRequest } from 'next/server'
import { getTenantByToken, createTenant, type D1Database } from '@/lib/db'

// POST /api/tenant — register a new tenant token or verify existing one
export async function POST(request: NextRequest) {
  const { env } = await getCloudflareContext()
  const db = (env as unknown as { DB: D1Database }).DB
  if (!db) return Response.json({ error: 'D1 not configured' }, { status: 500 })

  const body = await request.json()
  const { token } = body as { token?: string }
  if (!token) return Response.json({ error: 'token required' }, { status: 400 })

  try {
    // Check if token already exists
    const existing = await getTenantByToken(db, token)
    if (existing) {
      return Response.json({ id: existing.id, token: existing.token, existing: true })
    }

    // Create new tenant
    await createTenant(db, token, token)
    return Response.json({ id: token, token, existing: false })
  } catch (error) {
    console.error('Error in tenant registration:', error)
    return Response.json({ error: 'Failed to register tenant' }, { status: 500 })
  }
}
