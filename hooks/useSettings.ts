'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import type { AppSettings } from '@/types'
import { computeScaleFactor } from '@/lib/scaling'

const STORAGE_KEY = 'meal_swiper_settings'
const API_KEY = 'app_settings'

export const DEFAULT_SETTINGS: AppSettings = {
  people: 2,
  persons: [
    { name: 'Osoba 1', kcal: 2000, protein: 120 },
    { name: 'Osoba 2', kcal: 1800, protein: 100 },
  ],
  theme: 'system',
}

function tenantHeaders(token: string | null): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['X-Tenant-Token'] = token
  return headers
}

export function useSettings(tenantToken: string | null = null) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [isLoaded, setIsLoaded] = useState(false)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tenantTokenRef = useRef(tenantToken)
  tenantTokenRef.current = tenantToken

  // Load settings: try D1 first, fallback to localStorage
  useEffect(() => {
    let cancelled = false

    async function load() {
      // Immediately show localStorage data for fast UX
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored) as AppSettings
          if (!cancelled) setSettings((prev) => ({ ...prev, ...parsed }))
        }
      } catch {
        // ignore
      }

      // Then fetch from D1 (source of truth)
      try {
        const headers: Record<string, string> = {}
        if (tenantToken) headers['X-Tenant-Token'] = tenantToken

        const res = await fetch(`/api/settings?key=${API_KEY}`, { headers })
        if (res.ok) {
          const data = await res.json()
          if (data && !cancelled) {
            setSettings((prev) => {
              const next = { ...prev, ...data }
              // Sync to localStorage
              localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
              return next
            })
          }
        }
      } catch {
        // D1 unavailable, localStorage data already loaded
      } finally {
        if (!cancelled) setIsLoaded(true)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [tenantToken])

  // Save to D1 (debounced) + localStorage (immediate)
  const updateSettings = useCallback((newSettings: AppSettings) => {
    setSettings(newSettings)

    // Immediate localStorage save
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings))
    } catch {
      // ignore
    }

    // Debounced D1 save (300ms)
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch('/api/settings', {
          method: 'POST',
          headers: tenantHeaders(tenantTokenRef.current),
          body: JSON.stringify({ key: API_KEY, value: newSettings }),
        })
      } catch {
        console.error('Failed to save settings to D1')
      }
    }, 300)
  }, [])

  const totalKcal = useMemo(() => {
    return settings.persons.slice(0, settings.people).reduce((sum, person) => sum + person.kcal, 0)
  }, [settings])

  const totalProtein = useMemo(() => {
    return settings.persons
      .slice(0, settings.people)
      .reduce((sum, person) => sum + person.protein, 0)
  }, [settings])

  const scaleFactor = useMemo(() => {
    return computeScaleFactor(settings.persons.slice(0, settings.people))
  }, [settings])

  return {
    settings,
    updateSettings,
    totalKcal,
    totalProtein,
    scaleFactor,
    isLoaded,
  }
}
