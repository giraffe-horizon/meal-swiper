import NextAuth from 'next-auth'
import { getAuthOptions } from '@/lib/auth'
import { getRequestContext } from '@cloudflare/next-on-pages'

function handler(req: Request) {
  const { env } = getRequestContext()
  const authOptions = getAuthOptions(env.MEAL_SWIPER_DB)
  // @ts-expect-error: next-auth handler accepts Request in edge
  return NextAuth(req, authOptions)
}

export const GET = handler
export const POST = handler

export const runtime = 'edge'
