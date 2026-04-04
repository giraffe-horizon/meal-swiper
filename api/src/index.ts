import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { apiKeyAuth } from './middleware'
import mealsRoutes from './routes/meals'
import planRoutes from './routes/plan'
import settingsRoutes from './routes/settings'
import shoppingCheckedRoutes from './routes/shopping-checked'
import tenantRoutes from './routes/tenant'
import accountRoutes from './routes/account'
import ingredientsRoutes from './routes/ingredients'
import cuisinesRoutes from './routes/cuisines'
import imageSearchRoutes from './routes/image-search'

export type Env = {
  Bindings: {
    DB: D1Database
    MEAL_SWIPER_API_KEY: string
    GOOGLE_CSE_API_KEY?: string
    GOOGLE_CSE_CX?: string
  }
}

const app = new Hono<Env>()

// CORS is fully open because the API is protected by API key auth (X-API-Key header).
// Only clients with a valid key can mutate data, so origin restriction is unnecessary.
app.use('*', cors())
app.use('*', apiKeyAuth)

app.route('/meals', mealsRoutes)
app.route('/plan', planRoutes)
app.route('/settings', settingsRoutes)
app.route('/shopping-checked', shoppingCheckedRoutes)
app.route('/tenant', tenantRoutes)
app.route('/account', accountRoutes)
app.route('/ingredients', ingredientsRoutes)
app.route('/cuisines', cuisinesRoutes)
app.route('/image-search', imageSearchRoutes)

app.get('/', (c) => c.json({ name: 'meal-swiper-api', version: '1.0.0' }))

export default app
