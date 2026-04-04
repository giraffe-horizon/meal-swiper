import { create } from 'zustand'

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
    // In Phase 1: persist to expo-secure-store
    // SecureStore.setItemAsync('tenant_token', token)
  },

  clearToken: () => {
    set({ token: null, isOnboarded: false })
    // In Phase 1: SecureStore.deleteItemAsync('tenant_token')
  },

  hydrate: async () => {
    // In Phase 1: read from expo-secure-store
    // const token = await SecureStore.getItemAsync('tenant_token')
    // set({ token, isOnboarded: !!token, isHydrated: true })
    set({ isHydrated: true })
  },
}))
