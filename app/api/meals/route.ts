import { getCloudflareContext } from '@opennextjs/cloudflare'
import { NextResponse } from 'next/server'
import { fetchMealsFromD1, type D1Database } from '@/lib/db'

export async function GET() {
  const { env } = await getCloudflareContext()
  const db = (env as unknown as { DB: D1Database }).DB

  if (!db) {
    return NextResponse.json({ error: 'D1 database not configured' }, { status: 500 })
  }

  try {
    const meals = await fetchMealsFromD1(db)
    return NextResponse.json(meals, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    })
  } catch (error) {
    console.error('Error fetching meals from D1:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
