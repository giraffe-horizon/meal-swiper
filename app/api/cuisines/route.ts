import { NextResponse } from 'next/server'
import { fetchAllCuisines } from '@/lib/db'
import { getDb } from '@/lib/get-db'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const db = await getDb()

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
