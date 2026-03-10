import { getCloudflareContext } from '@opennextjs/cloudflare'
import type { NextRequest } from 'next/server'
import { getShoppingChecked, saveShoppingChecked, type D1Database } from '@/lib/db'

export async function GET(request: NextRequest) {
  const { env } = await getCloudflareContext()
  const db = (env as unknown as { DB: D1Database }).DB
  const week = request.nextUrl.searchParams.get('week')

  if (!week) return Response.json({ error: 'week required' }, { status: 400 })
  if (!db) return Response.json({ error: 'D1 not configured' }, { status: 500 })

  try {
    const data = await getShoppingChecked(db, week)
    return Response.json(data ? JSON.parse(data) : null)
  } catch (error) {
    console.error('Error reading shopping checked from D1:', error)
    return Response.json(null)
  }
}

export async function POST(request: NextRequest) {
  const { env } = await getCloudflareContext()
  const db = (env as unknown as { DB: D1Database }).DB
  if (!db) return Response.json({ error: 'D1 not configured' }, { status: 500 })

  const body = await request.json()
  const { week, checked } = body as { week?: string; checked?: Record<string, boolean> }
  if (!week || !checked)
    return Response.json({ error: 'week and checked required' }, { status: 400 })

  try {
    await saveShoppingChecked(db, week, JSON.stringify(checked))
    return Response.json({ ok: true })
  } catch (error) {
    console.error('Error saving shopping checked to D1:', error)
    return Response.json({ error: 'Failed to save' }, { status: 500 })
  }
}
