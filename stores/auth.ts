import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'

const TENANT_TOKEN_KEY = 'tenant_token'

interface AuthState {
  token: string | null
  isOnboarded: boolean
  isHydrated: boolean
  setToken: (token: string) => void
  clearToken: () => void
  hydrate: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  isOnboarded: false,
  isHydrated: false,

  setToken: (token: string) => {
    set({ token, isOnboarded: true })
    SecureStore.setItemAsync(TENANT_TOKEN_KEY, token).catch(() => {
      // SecureStore write failed — clear in-memory state to stay consistent
      set({ token: null, isOnboarded: false })
    })
  },

  clearToken: () => {
    set({ token: null, isOnboarded: false })
    SecureStore.deleteItemAsync(TENANT_TOKEN_KEY).catch(() => {
      // Best-effort deletion — token already cleared from memory
    })
  },

  hydrate: async () => {
    const token = await SecureStore.getItemAsync(TENANT_TOKEN_KEY)
    set({ token, isOnboarded: !!token, isHydrated: true })
  },
}))
