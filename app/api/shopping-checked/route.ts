export const runtime = 'edge'

import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const env = process.env as unknown as { MEAL_PLANS: KVNamespace }
  const week = request.nextUrl.searchParams.get('week')

  if (!week) {
    return Response.json({ error: 'week required' }, { status: 400 })
  }

  if (!env.MEAL_PLANS) {
    return Response.json({ error: 'KV namespace MEAL_PLANS not configured' }, { status: 500 })
  }

  const data = await env.MEAL_PLANS.get(`shopping_checked:${week}`)
  return Response.json(data ? JSON.parse(data) : null)
}

export async function POST(request: NextRequest) {
  const env = process.env as unknown as { MEAL_PLANS: KVNamespace }

  if (!env.MEAL_PLANS) {
    return Response.json({ error: 'KV namespace MEAL_PLANS not configured' }, { status: 500 })
  }

  const body = await request.json()
  const { week, checked } = body as {
    week?: string
    checked?: Record<string, boolean>
  }

  if (!week || !checked) {
    return Response.json({ error: 'week and checked required' }, { status: 400 })
  }

  await env.MEAL_PLANS.put(`shopping_checked:${week}`, JSON.stringify(checked), {
    expirationTtl: 60 * 60 * 24 * 90,
  })

  return Response.json({ ok: true })
}
