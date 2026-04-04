import { Hono } from 'hono'
import type { Env } from '../index'

const app = new Hono<Env>()

// GET /cuisines — returns all unique cuisine names
app.get('/', async (c) => {
  const db = c.env.DB
  try {
    const result = await db
      .prepare(
        `SELECT DISTINCT kuchnia FROM meals WHERE kuchnia IS NOT NULL AND kuchnia != '' ORDER BY kuchnia`
      )
      .all<{ kuchnia: string }>()

    return c.json(result.results.map((row) => row.kuchnia))
  } catch (error) {
    console.error('Error fetching cuisines:', error)
    return c.json({ error: 'Failed to fetch cuisines' }, 500)
  }
})

export default app
