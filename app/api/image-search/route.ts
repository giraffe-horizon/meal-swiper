import { NextRequest, NextResponse } from 'next/server'

let requestCount = 0
let windowStart = Date.now()
const RATE_LIMIT = 30
const WINDOW_MS = 60_000

export async function GET(request: NextRequest) {
  // Simple rate limiting
  const now = Date.now()
  if (now - windowStart > WINDOW_MS) {
    requestCount = 0
    windowStart = now
  }
  requestCount++
  if (requestCount > RATE_LIMIT) {
    return NextResponse.json({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 })
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ error: 'Missing query parameter ?q=' }, { status: 400 })
  }

  if (query.length > 100) {
    return NextResponse.json({ error: 'Query too long (max 100 characters)' }, { status: 400 })
  }

  const apiKey = process.env.GOOGLE_CSE_API_KEY
  const cx = process.env.GOOGLE_CSE_CX

  if (!apiKey || !cx) {
    return NextResponse.json(
      { error: 'Missing GOOGLE_CSE_API_KEY or GOOGLE_CSE_CX environment variables' },
      { status: 500 }
    )
  }

  try {
    const searchQuery = `${query} danie przepis`
    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(searchQuery)}&searchType=image&num=3&imgSize=large&safe=active`

    const response = await fetch(searchUrl)

    if (!response.ok) {
      const error = await response.text()
      console.error('Google CSE API error:', error)
      return NextResponse.json({ error: 'Failed to search images' }, { status: response.status })
    }

    const data = await response.json()

    if (!data.items || data.items.length === 0) {
      return NextResponse.json({ error: 'No images found', imageUrl: null }, { status: 404 })
    }

    const imageUrl = data.items[0].link

    return NextResponse.json({ imageUrl, query: searchQuery })
  } catch (error) {
    console.error('Error searching images:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
