import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { D1Adapter } from '@auth/d1-adapter'
import type { D1Database } from '@cloudflare/workers-types'

export function getAuthOptions(db: D1Database): NextAuthOptions {
  return {
    adapter: D1Adapter(db),
    providers: [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID ?? '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      }),
    ],
    session: {
      strategy: 'database',
    },
    callbacks: {
      session({ session, user }) {
        if (session.user) {
          session.user.id = user.id
        }
        return session
      },
    },
    pages: {
      signIn: '/login',
    },
  }
}

/** Extract user id from NextAuth session token in request headers/cookies. */
export async function getCurrentUserId(request: Request, db: D1Database): Promise<string | null> {
  const cookieHeader = request.headers.get('cookie') ?? ''
  const tokenMatch =
    cookieHeader.match(/next-auth\.session-token=([^;]+)/) ||
    cookieHeader.match(/__Secure-next-auth\.session-token=([^;]+)/)

  if (!tokenMatch) return null

  const token = decodeURIComponent(tokenMatch[1])
  const session = await db
    .prepare('SELECT userId FROM sessions WHERE sessionToken = ? AND expires > datetime("now")')
    .bind(token)
    .first<{ userId: string }>()

  return session?.userId ?? null
}
