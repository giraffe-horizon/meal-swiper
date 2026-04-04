import { Hono } from 'hono'
import type { Env } from '../index'

const app = new Hono<Env>()

// GET /ingredients — returns all unique ingredient names from meals
app.get('/', async (c) => {
  const db = c.env.DB
  try {
    const result = await db
      .prepare('SELECT skladniki_baza, skladniki_mieso FROM meals')
      .all<{ skladniki_baza: string; skladniki_mieso: string }>()

    const names = new Set<string>()
    for (const row of result.results) {
      for (const field of [row.skladniki_baza, row.skladniki_mieso]) {
        try {
          const ingredients = JSON.parse(field || '[]') as { name: string }[]
          for (const ing of ingredients) {
            if (ing.name) names.add(ing.name)
          }
        } catch {
          /* skip malformed */
        }
      }
    }

    return c.json([...names].sort((a, b) => a.localeCompare(b, 'pl')))
  } catch (error) {
    console.error('Error fetching ingredients:', error)
    return c.json({ error: 'Failed to fetch ingredients' }, 500)
  }
})

export default app
