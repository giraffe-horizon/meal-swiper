import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  useTenantQuery,
  useCreateTenantMutation,
  useUpdateTenantNameMutation,
  tenantQueryKey,
} from '@/hooks/queries/useTenantQuery'
import * as api from '@/lib/api'

// Mock the API
vi.mock('@/lib/api', () => ({
  fetchTenantInfo: vi.fn(),
  createTenant: vi.fn(),
  updateTenantName: vi.fn(),
}))

describe('useTenantQuery hooks', () => {
  function createWrapper() {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    })
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    Wrapper.displayName = 'TestWrapper'
    return Wrapper
  }

  describe('useTenantQuery', () => {
    it('returns query result when token is provided', () => {
      const token = 'test-token'
      vi.mocked(api.fetchTenantInfo).mockResolvedValue({ id: '1', name: 'Test' })

      const { result } = renderHook(() => useTenantQuery(token), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBeDefined()
      expect(result.current.error).toBeDefined()
    })

    it('returns query result when token is null', () => {
      const { result } = renderHook(() => useTenantQuery(null), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBeDefined()
      expect(result.current.error).toBeDefined()
    })

    it('is enabled only when token is provided', () => {
      const { result: withToken } = renderHook(() => useTenantQuery('token'), {
        wrapper: createWrapper(),
      })
      const { result: withoutToken } = renderHook(() => useTenantQuery(null), {
        wrapper: createWrapper(),
      })

      expect(withToken.current.isEnabled).toBe(true)
      expect(withoutToken.current.isEnabled).toBe(false)
    })

    it('calls fetchTenantInfo with token', () => {
      const token = 'test-token'
      vi.mocked(api.fetchTenantInfo).mockResolvedValue({ id: '1', name: 'Test' })

      renderHook(() => useTenantQuery(token), {
        wrapper: createWrapper(),
      })

      expect(api.fetchTenantInfo).toHaveBeenCalledWith(token)
    })
  })

  describe('useCreateTenantMutation', () => {
    it('uses createTenant as mutation function', () => {
      const { result } = renderHook(() => useCreateTenantMutation(), {
        wrapper: createWrapper(),
      })

      expect(result.current.mutate).toBeDefined()
      expect(result.current.mutateAsync).toBeDefined()
    })

    it('calls createTenant when mutated', async () => {
      const mockTenant = { token: 'new-token', name: 'New Tenant' }
      vi.mocked(api.createTenant).mockResolvedValue({ id: '1', name: 'New Tenant' })

      const { result } = renderHook(() => useCreateTenantMutation(), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        await result.current.mutateAsync(mockTenant)
      })

      expect(api.createTenant).toHaveBeenCalledWith(mockTenant, expect.anything())
    })
  })

  describe('useUpdateTenantNameMutation', () => {
    it('uses updateTenantName as mutation function', () => {
      const token = 'test-token'
      const { result } = renderHook(() => useUpdateTenantNameMutation(token), {
        wrapper: createWrapper(),
      })

      expect(result.current.mutate).toBeDefined()
      expect(result.current.mutateAsync).toBeDefined()
    })

    it('calls updateTenantName with token and name', async () => {
      const token = 'test-token'
      const newName = 'Updated Name'
      vi.mocked(api.updateTenantName).mockResolvedValue({ id: '1', name: newName })

      const { result } = renderHook(() => useUpdateTenantNameMutation(token), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        result.current.mutate(newName)
      })

      expect(api.updateTenantName).toHaveBeenCalledWith(token, newName)
    })

    it('handles null token gracefully', () => {
      const { result } = renderHook(() => useUpdateTenantNameMutation(null), {
        wrapper: createWrapper(),
      })

      expect(result.current.mutate).toBeDefined()
    })
  })

  describe('tenantQueryKey', () => {
    it('returns correct query key format', () => {
      const token = 'test-token'
      expect(tenantQueryKey(token)).toEqual(['tenant', token])
    })
  })
})
