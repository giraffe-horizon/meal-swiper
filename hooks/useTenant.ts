'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'meal_swiper_tenant_token'

function generateToken(): string {
  return crypto.randomUUID()
}

/**
 * Manages tenant token lifecycle:
 * 1. Check URL for ?t=<token>
 * 2. If found, store it in localStorage and use it
 * 3. If not in URL, check localStorage
 * 4. If not in localStorage either, generate a new token
 * 5. Register the token with the server
 */
export function useTenant() {
  const [token, setToken] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function init() {
      // 1. Check URL param
      const urlParams = new URLSearchParams(window.location.search)
      let t = urlParams.get('t')

      // 2. Check localStorage
      if (!t) {
        t = localStorage.getItem(STORAGE_KEY)
      }

      // 3. Generate new token if none found
      if (!t) {
        t = generateToken()
      }

      // 4. Save to localStorage
      localStorage.setItem(STORAGE_KEY, t)

      // 5. Update URL without reload (add ?t= if not present)
      if (!urlParams.has('t')) {
        const url = new URL(window.location.href)
        url.searchParams.set('t', t)
        window.history.replaceState({}, '', url.toString())
      }

      // 6. Register with server (fire and forget — app works offline too)
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
