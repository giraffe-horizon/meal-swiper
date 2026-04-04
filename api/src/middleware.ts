import { createMiddleware } from 'hono/factory'
import type { Context } from 'hono'
import type { Env } from './index'

/**
 * API key validation middleware.
 * Validates X-API-Key header against wrangler secret MEAL_SWIPER_API_KEY.
 * Public routes (GET /meals) skip validation.
 */
export const apiKeyAuth = createMiddleware<Env>(async (c, next) => {
  // Public endpoints — no API key required
  if (c.req.path === '/meals' && c.req.method === 'GET') {
    return next()
  }

  const apiKey = c.req.header('X-API-Key')
  if (!apiKey || apiKey !== c.env.MEAL_SWIPER_API_KEY) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  return next()
})

// Rate limiting: Use Cloudflare's built-in rate limiting rules in the dashboard
// or Advanced Rate Limiting (paid). For now, API key + per-tenant scoping is sufficient.
// TODO: Configure CF rate limiting rules for production:
//   - /meals GET: 60 req/min per IP
//   - All other routes: 30 req/min per API key

/**
 * Extract tenant token from request headers or query params.
 */
export function extractTenantToken(c: Context): string | null {
  const headerToken = c.req.header('X-Tenant-Token')
  if (headerToken) return headerToken
  return new URL(c.req.url).searchParams.get('token')
}
