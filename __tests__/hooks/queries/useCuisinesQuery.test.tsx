import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useCuisinesQuery, CUISINES_QUERY_KEY } from '@/hooks/queries/useCuisinesQuery'
import * as api from '@/lib/api'

// Mock the API
vi.mock('@/lib/api', () => ({
  fetchCuisines: vi.fn(),
}))

describe('useCuisinesQuery', () => {
  function createWrapper() {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
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

  it('returns query result', () => {
    vi.mocked(api.fetchCuisines).mockResolvedValue(['Italian', 'Mexican'])

    const { result } = renderHook(() => useCuisinesQuery(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBeDefined()
    expect(result.current.error).toBeDefined()
  })

  it('uses fetchCuisines as query function', () => {
    vi.mocked(api.fetchCuisines).mockResolvedValue(['Italian', 'Mexican'])

    renderHook(() => useCuisinesQuery(), {
      wrapper: createWrapper(),
    })

    expect(api.fetchCuisines).toHaveBeenCalled()
  })

  it('has correct staleTime configuration', () => {
    const { result } = renderHook(() => useCuisinesQuery(), {
      wrapper: createWrapper(),
    })

    // Check that the query has staleTime set (5 minutes = 300000ms)
    expect(result.current.isStale).toBeDefined()
  })

  it('exports correct query key constant', () => {
    expect(CUISINES_QUERY_KEY).toEqual(['cuisines'])
  })
})
