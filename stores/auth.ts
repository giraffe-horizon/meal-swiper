import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'

const TENANT_TOKEN_KEY = 'tenant_token'

interface AuthState {
  token: string | null
  isOnboarded: boolean
  isHydrated: boolean
  setToken: (token: string) => Promise<void>
  clearToken: () => Promise<void>
  hydrate: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  isOnboarded: false,
  isHydrated: false,

  setToken: async (token: string) => {
    try {
      await SecureStore.setItemAsync(TENANT_TOKEN_KEY, token)
      set({ token, isOnboarded: true })
    } catch {
      // SecureStore write failed — do not update in-memory state
    }
  },

  clearToken: async () => {
    try {
      await SecureStore.deleteItemAsync(TENANT_TOKEN_KEY)
      set({ token: null, isOnboarded: false })
    } catch {
      // Best-effort deletion — do not clear in-memory state if delete fails
    }
  },

  hydrate: async () => {
    const token = await SecureStore.getItemAsync(TENANT_TOKEN_KEY)
    set({ token, isOnboarded: !!token, isHydrated: true })
  },
}))
