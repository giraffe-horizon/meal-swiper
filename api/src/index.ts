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

export type Env = {
  Bindings: {
    DB: D1Database
    MEAL_SWIPER_API_KEY: string
  }
}

const app = new Hono<Env>()

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

app.get('/', (c) => c.json({ name: 'meal-swiper-api', version: '1.0.0' }))

export default app
