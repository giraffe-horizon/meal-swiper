import { NextResponse } from 'next/server'
import { fetchMealsFromD1, fetchAllMealsWithVariants } from '@/lib/db'
import { getDb } from '@/lib/get-db'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const db = await getDb()

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
