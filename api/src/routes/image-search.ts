import { Hono } from 'hono'
import type { Env } from '../index'

const app = new Hono<Env>()

// GET /image-search?q=<query> — Google Custom Search for meal images
app.get('/', async (c) => {
  const query = c.req.query('q')

  if (!query) {
    return c.json({ error: 'Missing query parameter ?q=' }, 400)
  }

  if (query.length > 100) {
    return c.json({ error: 'Query too long (max 100 characters)' }, 400)
  }

  const apiKey = c.env.GOOGLE_CSE_API_KEY
  const cx = c.env.GOOGLE_CSE_CX

  if (!apiKey || !cx) {
    return c.json(
      { error: 'Missing GOOGLE_CSE_API_KEY or GOOGLE_CSE_CX environment variables' },
      500
    )
  }

  try {
    const searchQuery = `${query} danie przepis`
    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(searchQuery)}&searchType=image&num=3&imgSize=large&safe=active`

    const response = await fetch(searchUrl)

    if (!response.ok) {
      const error = await response.text()
      console.error('Google CSE API error:', error)
      return c.json({ error: 'Failed to search images' }, response.status as 400)
    }

    const data = (await response.json()) as { items?: { link: string }[] }

    if (!data.items || data.items.length === 0) {
      return c.json({ error: 'No images found', imageUrl: null }, 404)
    }

    const imageUrl = data.items[0].link

    return c.json({ imageUrl, query: searchQuery })
  } catch (error) {
    console.error('Error searching images:', error)
    return c.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      500
    )
  }
})

export default app
