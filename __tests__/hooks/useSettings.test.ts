import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useSettings, DEFAULT_SETTINGS } from '@/hooks/useSettings'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  return Wrapper
}

describe('useSettings', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    // Mock fetch to avoid D1 calls
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => null,
    })
  })

  it('initializes with default settings', async () => {
    const { result } = renderHook(() => useSettings(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.settings.people).toBe(DEFAULT_SETTINGS.people)
    })
  })

  it('loads settings from localStorage', async () => {
    localStorage.setItem(
      'meal_swiper_settings',
      JSON.stringify({ people: 3, persons: DEFAULT_SETTINGS.persons, theme: 'dark' })
    )

    const { result } = renderHook(() => useSettings(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.settings.people).toBe(3)
    })
  })

  it('updateSettings changes settings', async () => {
    const { result } = renderHook(() => useSettings(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.settings.people).toBe(2)
    })

    act(() => {
      result.current.updateSettings({ ...DEFAULT_SETTINGS, people: 4 })
    })

    expect(result.current.settings.people).toBe(4)
  })

  it('updateSettings saves to localStorage', async () => {
    const { result } = renderHook(() => useSettings(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.settings.people).toBe(2)
    })

    act(() => {
      result.current.updateSettings({ ...DEFAULT_SETTINGS, people: 4 })
    })

    const stored = JSON.parse(localStorage.getItem('meal_swiper_settings') ?? '{}')
    expect(stored.people).toBe(4)
  })

  it('computes totalKcal from active persons', async () => {
    const { result } = renderHook(() => useSettings(), { wrapper: createWrapper() })

    await waitFor(() => {
      // 2 people: 2000 + 1800 = 3800
      expect(result.current.totalKcal).toBe(3800)
    })
  })

  it('computes totalProtein from active persons', async () => {
    const { result } = renderHook(() => useSettings(), { wrapper: createWrapper() })

    await waitFor(() => {
      // 2 people: 120 + 100 = 220
      expect(result.current.totalProtein).toBe(220)
    })
  })

  it('scaleFactor returns a number', async () => {
    const { result } = renderHook(() => useSettings(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(typeof result.current.scaleFactor).toBe('number')
    })
  })

  it('isLoaded becomes true after loading', async () => {
    const { result } = renderHook(() => useSettings(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true)
    })
  })

  it('handles invalid localStorage JSON gracefully', async () => {
    localStorage.setItem('meal_swiper_settings', 'invalid-json')
    global.fetch = vi.fn().mockResolvedValue({ ok: false, json: async () => null })
    const { result } = renderHook(() => useSettings(null), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true)
    }, { timeout: 5000 })

    // Should fallback to default settings
    expect(result.current.settings.people).toBe(DEFAULT_SETTINGS.people)
  })

  it('updates totalKcal when people count changes', async () => {
    const { result } = renderHook(() => useSettings(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.totalKcal).toBe(3800) // 2 people
    })

    act(() => {
      result.current.updateSettings({
        ...DEFAULT_SETTINGS,
        people: 1,
      })
    })

    // 1 person: 2000 kcal
    expect(result.current.totalKcal).toBe(2000)
  })

  it('fetches from D1 and overwrites local settings if ok', async () => {
    const token = 'test-token-123'
    const serverSettings = { people: 5, persons: DEFAULT_SETTINGS.persons, theme: 'dark' as const }
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => serverSettings,
    })

    const { result } = renderHook(() => useSettings(token), { wrapper: createWrapper() })

    // React Query fetches async — wait longer for server data to arrive
    await waitFor(() => {
      expect(result.current.settings.people).toBe(5)
    }, { timeout: 5000 })
  })
})
