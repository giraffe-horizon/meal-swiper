'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'meal_swiper_tenant_token'
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function generateToken(): string {
  return crypto.randomUUID()
}

/**
 * Manages tenant token lifecycle:
 * 1. Check URL path first segment for /<uuid>/...
 * 2. If found, store it in localStorage and use it
 * 3. If not in path, check localStorage
 * 4. If not in localStorage either, generate a new token
 * 5. Register the token with the server
 */
export function useTenant() {
  const [token, setToken] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function init() {
      // 1. Extract token from URL path (e.g. /abc-uuid/plan -> abc-uuid)
      const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
      const pathParts = pathname.split('/').filter(Boolean)
      const pathToken = pathParts[0] && UUID_REGEX.test(pathParts[0]) ? pathParts[0] : null

      let t = pathToken

      // 2. Fall back to localStorage
      if (!t) {
        t = localStorage.getItem(STORAGE_KEY)
      }

      // 3. Generate new token if none found
      if (!t) {
        t = generateToken()
      }

      // 4. Save to localStorage
      localStorage.setItem(STORAGE_KEY, t)

      // 5. Register with server (fire and forget — app works offline too)
      try {
        await fetch('/api/tenant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: t }),
        })
      } catch {
        // Server unavailable — that's fine, token is stored locally
      }

      if (!cancelled) {
        setToken(t)
        setIsReady(true)
      }
    }

    init()
    return () => {
      cancelled = true
    }
  }, [])

  const getHeaders = useCallback((): Record<string, string> => {
    if (!token) return {}
    return { 'X-Tenant-Token': token }
  }, [token])

  return { token, isReady, getHeaders }
}
