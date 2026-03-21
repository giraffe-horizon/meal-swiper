import { NextResponse } from 'next/server'
import { fetchAllIngredientsCatalog } from '@/lib/db'
import { getDb } from '@/lib/get-db'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const db = await getDb()

    if (!db) {
      return NextResponse.json([])
    }

    const ingredients = await fetchAllIngredientsCatalog(db)
    return NextResponse.json(ingredients, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    })
  } catch (error) {
    console.error('Error fetching ingredients:', error)
    return NextResponse.json([])
  }
}
