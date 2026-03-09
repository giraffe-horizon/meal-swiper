import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useMeals } from '@/hooks/useMeals'

describe('useMeals', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('starts with loading=true', () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {}))) // never resolves
    const { result } = renderHook(() => useMeals())
    expect(result.current.loading).toBe(true)
  })

  it('loading=false after successful fetch', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: '1', nazwa: 'Test' }]),
    }))

    const { result } = renderHook(() => useMeals())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.meals).toHaveLength(1)
    expect(result.current.error).toBeNull()
  })

  it('sets error when API returns error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }))

    const { result } = renderHook(() => useMeals())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.error).toContain('500')
    expect(result.current.meals).toEqual([])
  })

  it('sets error when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

    const { result } = renderHook(() => useMeals())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.error).toBe('Network error')
  })

  it('meals contains data after successful fetch', async () => {
    const mockMeals = [
      { id: '1', nazwa: 'Pasta', photo_url: 'https://example.com/img.jpg' },
      { id: '2', nazwa: 'Pizza', photo_url: 'https://example.com/img2.jpg' },
    ]
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockMeals),
    }))

    const { result } = renderHook(() => useMeals())

    await waitFor(() => {
      expect(result.current.meals).toHaveLength(2)
    })
    expect(result.current.meals[0].nazwa).toBe('Pasta')
    expect(result.current.meals[1].nazwa).toBe('Pizza')
  })
})
