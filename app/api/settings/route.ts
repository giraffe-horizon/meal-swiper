import type { NextRequest } from 'next/server'
import { getSettings, saveSettings } from '@/lib/db'
import { requireTenantId, extractTenantToken } from '@/lib/tenant'
import { getDb } from '@/lib/get-db'

// Use Node.js runtime for local SQLite compatibility
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const db = await getDb()
  const key = request.nextUrl.searchParams.get('key')

  if (!key) return Response.json({ error: 'key required' }, { status: 400 })
  if (!db) return Response.json({ error: 'D1 not configured' }, { status: 500 })

  try {
    const tenantId = await requireTenantId(db, extractTenantToken(request))
    const data = await getSettings(db, key, tenantId)
    return Response.json(data ? JSON.parse(data) : null)
  } catch (error) {
    const msg = error instanceof Error ? error.message : ''
    if (msg === 'Tenant token required' || msg === 'Invalid tenant token') {
      return Response.json({ error: msg }, { status: 401 })
    }
    console.error('Error reading settings from D1:', error)
    return Response.json(null)
  }
}

export async function POST(request: NextRequest) {
  const db = await getDb()
  if (!db) return Response.json({ error: 'D1 not configured' }, { status: 500 })

  const body = await request.json()
  const { key, value } = body as { key?: string; value?: unknown }
  if (!key || value === undefined)
    return Response.json({ error: 'key and value required' }, { status: 400 })

  try {
    const tenantId = await requireTenantId(db, extractTenantToken(request))
    await saveSettings(db, key, JSON.stringify(value), tenantId)
    return Response.json({ ok: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : ''
    if (msg === 'Tenant token required' || msg === 'Invalid tenant token') {
      return Response.json({ error: msg }, { status: 401 })
    }
    console.error('Error saving settings to D1:', error)
    return Response.json({ error: 'Failed to save' }, { status: 500 })
  }
}
