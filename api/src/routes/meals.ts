import { Hono } from 'hono'
import type { Env } from '../index'
import { fetchMealsFromD1 } from '../db'

const app = new Hono<Env>()

app.get('/', async (c) => {
  const db = c.env.DB
  try {
    const meals = await fetchMealsFromD1(db)
    c.header('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    return c.json(meals)
  } catch (error) {
    console.error('Error fetching meals:', error)
    return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
  }
})

export default app
