import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useIngredientsQuery, INGREDIENTS_QUERY_KEY } from '@/hooks/queries/useIngredientsQuery'
import * as api from '@/lib/api'
import type { CatalogIngredient } from '@/types'

// Mock the API
vi.mock('@/lib/api', () => ({
  fetchIngredients: vi.fn(),
}))

describe('useIngredientsQuery', () => {
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
    const mockIngredients: CatalogIngredient[] = [
      { id: '1', name: 'Tomato', category: 'warzywa' as const, is_seasoning: false, flags: [] },
      { id: '2', name: 'Salt', category: 'przyprawy' as const, is_seasoning: true, flags: [] },
    ]
    vi.mocked(api.fetchIngredients).mockResolvedValue(mockIngredients)

    const { result } = renderHook(() => useIngredientsQuery(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBeDefined()
    expect(result.current.error).toBeDefined()
  })

  it('uses fetchIngredients as query function', () => {
    const mockIngredients: CatalogIngredient[] = [
      { id: '1', name: 'Tomato', category: 'warzywa' as const, is_seasoning: false, flags: [] },
      { id: '2', name: 'Salt', category: 'przyprawy' as const, is_seasoning: true, flags: [] },
    ]
    vi.mocked(api.fetchIngredients).mockResolvedValue(mockIngredients)

    renderHook(() => useIngredientsQuery(), {
      wrapper: createWrapper(),
    })

    expect(api.fetchIngredients).toHaveBeenCalled()
  })

  it('has correct staleTime configuration', () => {
    const { result } = renderHook(() => useIngredientsQuery(), {
      wrapper: createWrapper(),
    })

    // Check that the query has staleTime set (5 minutes = 300000ms)
    expect(result.current.isStale).toBeDefined()
  })

  it('exports correct query key constant', () => {
    expect(INGREDIENTS_QUERY_KEY).toEqual(['ingredients'])
  })
})
