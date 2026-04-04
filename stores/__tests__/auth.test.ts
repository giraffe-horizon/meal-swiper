import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock expo-secure-store
const mockSetItemAsync = vi.fn()
const mockDeleteItemAsync = vi.fn()
const mockGetItemAsync = vi.fn()

vi.mock('expo-secure-store', () => ({
  setItemAsync: (...args: unknown[]) => mockSetItemAsync(...args),
  deleteItemAsync: (...args: unknown[]) => mockDeleteItemAsync(...args),
  getItemAsync: (...args: unknown[]) => mockGetItemAsync(...args),
}))

describe('auth store', () => {
  beforeEach(() => {
    vi.resetModules()
    mockSetItemAsync.mockReset()
    mockDeleteItemAsync.mockReset()
    mockGetItemAsync.mockReset()
  })

  it('setToken awaits SecureStore before updating state', async () => {
    // SecureStore write takes time — state should only update after it resolves
    let resolveWrite!: () => void
    mockSetItemAsync.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveWrite = resolve
      })
    )

    const { useAuthStore } = await import('../auth')
    const store = useAuthStore.getState()

    // setToken should be async and return a promise
    const promise = store.setToken('test-token')

    // State should NOT be updated yet (SecureStore hasn't resolved)
    expect(useAuthStore.getState().token).toBeNull()

    // Now resolve the write
    resolveWrite()
    await promise

    // NOW state should be updated
    expect(useAuthStore.getState().token).toBe('test-token')
    expect(useAuthStore.getState().isOnboarded).toBe(true)
  })

  it('setToken does not update state if SecureStore write fails', async () => {
    mockSetItemAsync.mockRejectedValue(new Error('write failed'))

    const { useAuthStore } = await import('../auth')

    await useAuthStore.getState().setToken('bad-token')

    // State should remain null because write failed
    expect(useAuthStore.getState().token).toBeNull()
    expect(useAuthStore.getState().isOnboarded).toBe(false)
  })

  it('clearToken awaits SecureStore before clearing state', async () => {
    // First set up a token
    mockSetItemAsync.mockResolvedValue(undefined)
    mockDeleteItemAsync.mockResolvedValue(undefined)

    const { useAuthStore } = await import('../auth')

    await useAuthStore.getState().setToken('existing-token')
    expect(useAuthStore.getState().token).toBe('existing-token')

    await useAuthStore.getState().clearToken()

    expect(useAuthStore.getState().token).toBeNull()
    expect(useAuthStore.getState().isOnboarded).toBe(false)
    expect(mockDeleteItemAsync).toHaveBeenCalledWith('tenant_token')
  })
})
