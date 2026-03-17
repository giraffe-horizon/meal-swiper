'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import type { AppSettings } from '@/types'
import { computeScaleFactor } from '@/lib/scaling'
import { useSettingsQuery, useSettingsMutation } from '@/hooks/queries/useSettingsQuery'

function getStorageKey(): string {
  if (typeof window === 'undefined') return 'meal_swiper_settings'
  const token = localStorage.getItem('meal_swiper_tenant_token') || ''
  return token ? `${token}_meal_swiper_settings` : 'meal_swiper_settings'
}

export const DEFAULT_SETTINGS: AppSettings = {
  people: 2,
  persons: [
    { name: 'Osoba 1', kcal: 2000, protein: 120 },
    { name: 'Osoba 2', kcal: 1800, protein: 100 },
  ],
  theme: 'system',
}

export function useSettings(tenantToken: string | null = null) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [isLoaded, setIsLoaded] = useState(false)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load from localStorage immediately (fast UX)
  useEffect(() => {
    let cancelled = false
    try {
      const stored = localStorage.getItem(getStorageKey())
      if (stored && !cancelled) {
        const parsed = JSON.parse(stored) as AppSettings
        // eslint-disable-next-line react-hooks/set-state-in-effect -- celowe załadowanie localStorage przed renderem
        setSettings((prev) => ({ ...prev, ...parsed }))
      }
    } catch {
      // ignore
    }
    return () => {
      cancelled = true
    }
  }, [tenantToken])

  // Server sync via react-query
  const { data: serverSettings, isFetched } = useSettingsQuery(tenantToken)
  const { mutate: saveSettingsToServer } = useSettingsMutation(tenantToken)

  // When server data arrives: sync to state + localStorage
  useEffect(() => {
    if (isFetched) {
      if (serverSettings) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- sync danych z D1 po załadowaniu
        setSettings((prev) => {
          const next = { ...prev, ...serverSettings }
          try {
            localStorage.setItem(getStorageKey(), JSON.stringify(next))
          } catch {
            // ignore
          }
          return next
        })
      }
      setIsLoaded(true)
    }
  }, [serverSettings, isFetched])

  // Save to D1 (debounced) + localStorage (immediate)
  const updateSettings = useCallback(
    (newSettings: AppSettings) => {
      setSettings(newSettings)

      // Immediate localStorage save
      try {
        localStorage.setItem(getStorageKey(), JSON.stringify(newSettings))
      } catch {
        // ignore
      }

      // Debounced D1 save (300ms)
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = setTimeout(() => {
        saveSettingsToServer(newSettings)
      }, 300)
    },
    [saveSettingsToServer]
  )

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
