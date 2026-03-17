import { getCloudflareContext } from '@opennextjs/cloudflare'
import { NextResponse } from 'next/server'
import { fetchAllCuisines, type D1Database } from '@/lib/db'

export const runtime = 'edge'

export async function GET() {
  try {
    const { env } = await getCloudflareContext()
    const db = (env as unknown as { DB: D1Database }).DB

    if (!db) {
      return NextResponse.json([])
    }

    const cuisines = await fetchAllCuisines(db)
    return NextResponse.json(cuisines, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    })
  } catch (error) {
    console.error('Error fetching cuisines:', error)
    return NextResponse.json([])
  }
}
