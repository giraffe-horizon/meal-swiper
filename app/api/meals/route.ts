import { getCloudflareContext } from '@opennextjs/cloudflare'
import { NextResponse } from 'next/server'
import { fetchMealsFromD1, fetchAllMealsWithVariants, type D1Database } from '@/lib/db'

export const runtime = 'edge'

export async function GET(request: Request) {
  try {
    const { env } = await getCloudflareContext()
    const db = (env as unknown as { DB: D1Database }).DB

    if (!db) {
      return NextResponse.json([])
    }

    const url = new URL(request.url)
    const format = url.searchParams.get('format')

    let meals
    if (format === 'variants') {
      meals = await fetchAllMealsWithVariants(db)
    } else {
      meals = await fetchMealsFromD1(db)
    }

    return NextResponse.json(meals, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    })
  } catch (error) {
    // Graceful fallback: return empty array when D1/CF context unavailable (e.g. E2E tests)
    console.error('Error fetching meals:', error)
    return NextResponse.json([])
  }
}
