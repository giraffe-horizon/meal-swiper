import type { NextRequest } from 'next/server'
import { getShoppingChecked, saveShoppingChecked } from '@/lib/db'
import { requireTenantId, extractTenantToken } from '@/lib/tenant'
import { getDb } from '@/lib/get-db'

// Use Node.js runtime for local SQLite compatibility
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const db = await getDb()
  const week = request.nextUrl.searchParams.get('week')

  if (!week) return Response.json({ error: 'week required' }, { status: 400 })
  if (!db) return Response.json({ error: 'D1 not configured' }, { status: 500 })

  try {
    const tenantId = await requireTenantId(db, extractTenantToken(request))
    const data = await getShoppingChecked(db, week, tenantId)
    return Response.json(data ? JSON.parse(data) : null)
  } catch (error) {
    const msg = error instanceof Error ? error.message : ''
    if (msg === 'Tenant token required' || msg === 'Invalid tenant token') {
      return Response.json({ error: msg }, { status: 401 })
    }
    console.error('Error reading shopping checked from D1:', error)
    return Response.json(null)
  }
}

export async function POST(request: NextRequest) {
  const db = await getDb()
  if (!db) return Response.json({ error: 'D1 not configured' }, { status: 500 })

  const body = await request.json()
  const { week, checked } = body as { week?: string; checked?: Record<string, boolean> }
  if (!week || !checked)
    return Response.json({ error: 'week and checked required' }, { status: 400 })

  try {
    const tenantId = await requireTenantId(db, extractTenantToken(request))
    await saveShoppingChecked(db, week, JSON.stringify(checked), tenantId)
    return Response.json({ ok: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : ''
    if (msg === 'Tenant token required' || msg === 'Invalid tenant token') {
      return Response.json({ error: msg }, { status: 401 })
    }
    console.error('Error saving shopping checked to D1:', error)
    return Response.json({ error: 'Failed to save' }, { status: 500 })
  }
}
