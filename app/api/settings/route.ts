import { getCloudflareContext } from '@opennextjs/cloudflare'
import type { NextRequest } from 'next/server'
import { getSettings, saveSettings, type D1Database } from '@/lib/db'
import { resolveTenantId, extractTenantToken } from '@/lib/tenant'

export async function GET(request: NextRequest) {
  const { env } = await getCloudflareContext()
  const db = (env as unknown as { DB: D1Database }).DB
  const key = request.nextUrl.searchParams.get('key')

  if (!key) return Response.json({ error: 'key required' }, { status: 400 })
  if (!db) return Response.json({ error: 'D1 not configured' }, { status: 500 })

  try {
    const tenantId = await resolveTenantId(db, extractTenantToken(request))
    const data = await getSettings(db, key, tenantId)
    return Response.json(data ? JSON.parse(data) : null)
  } catch (error) {
    console.error('Error reading settings from D1:', error)
    return Response.json(null)
  }
}

export async function POST(request: NextRequest) {
  const { env } = await getCloudflareContext()
  const db = (env as unknown as { DB: D1Database }).DB
  if (!db) return Response.json({ error: 'D1 not configured' }, { status: 500 })

  const body = await request.json()
  const { key, value } = body as { key?: string; value?: unknown }
  if (!key || value === undefined)
    return Response.json({ error: 'key and value required' }, { status: 400 })

  try {
    const tenantId = await resolveTenantId(db, extractTenantToken(request))
    await saveSettings(db, key, JSON.stringify(value), tenantId)
    return Response.json({ ok: true })
  } catch (error) {
    console.error('Error saving settings to D1:', error)
    return Response.json({ error: 'Failed to save' }, { status: 500 })
  }
}
