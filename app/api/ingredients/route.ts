import { getCloudflareContext } from '@opennextjs/cloudflare'
import { NextResponse } from 'next/server'
import { fetchAllIngredientsCatalog, type D1Database } from '@/lib/db'

export const runtime = 'edge'

export async function GET() {
  const { env } = await getCloudflareContext()
  const db = (env as unknown as { DB: D1Database }).DB

  if (!db) {
    return NextResponse.json({ error: 'D1 database not configured' }, { status: 500 })
  }

  try {
    const ingredients = await fetchAllIngredientsCatalog(db)
    return NextResponse.json(ingredients, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    })
  } catch (error) {
    console.error('Error fetching ingredients from D1:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
