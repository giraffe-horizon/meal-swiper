// GET /api/image-search?q=meal+name
// Search Google Images for food photos using Custom Search API

export async function onRequest(context) {
  const url = new URL(context.request.url)
  const query = url.searchParams.get('q')

  if (!query) {
    return new Response(JSON.stringify({ error: 'Missing query parameter ?q=' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    // Google Custom Search API
    const apiKey = 'REDACTED_API_KEY'
    const cx = '017576662512468239146:omuauf8t8m5'
    const searchQuery = `${query} danie przepis`

    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(searchQuery)}&searchType=image&num=3&imgSize=large&safe=active`

    const response = await fetch(searchUrl)

    if (!response.ok) {
      const error = await response.text()
      console.error('Google CSE API error:', error)
      return new Response(JSON.stringify({ error: 'Failed to search images' }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const data = await response.json()

    if (!data.items || data.items.length === 0) {
      return new Response(JSON.stringify({ error: 'No images found', imageUrl: null }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Return the first image result
    const imageUrl = data.items[0].link

    return new Response(JSON.stringify({ imageUrl, query: searchQuery }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (error) {
    console.error('Error searching images:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
