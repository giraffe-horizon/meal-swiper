'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { useTenant } from '@/hooks/useTenant'

export interface AuthContextType {
  tenantToken: string | null
  isReady: boolean
  getHeaders: () => Record<string, string>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { token: tenantToken, isReady, getHeaders } = useTenant()

  return (
    <AuthContext.Provider value={{ tenantToken, isReady, getHeaders }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
