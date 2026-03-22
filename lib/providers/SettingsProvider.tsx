'use client'

import { createContext, useContext, useEffect, type ReactNode } from 'react'
import type { AppSettings } from '@/types'
import { useSettings } from '@/hooks/useSettings'
import { useAuth } from './AuthProvider'

export interface SettingsContextType {
  settings: AppSettings
  updateSettings: (settings: AppSettings) => void
  scaleFactor: number
}

const SettingsContext = createContext<SettingsContextType | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { tenantToken } = useAuth()
  const { settings, updateSettings, scaleFactor } = useSettings(tenantToken)

  // Theme management
  useEffect(() => {
    const root = window.document.documentElement
    const theme = settings.theme

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const applyTheme = (isDark: boolean) => {
        if (isDark) {
          root.classList.add('dark')
        } else {
          root.classList.remove('dark')
        }
      }

      applyTheme(mediaQuery.matches)

      const listener = (e: MediaQueryListEvent) => applyTheme(e.matches)
      mediaQuery.addEventListener('change', listener)
      return () => mediaQuery.removeEventListener('change', listener)
    } else {
      if (theme === 'dark') {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }
  }, [settings.theme])

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, scaleFactor }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettingsContext() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettingsContext must be used within SettingsProvider')
  return ctx
}
