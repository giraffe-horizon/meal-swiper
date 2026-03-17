import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useWeeklyPlan } from '@/hooks/useWeeklyPlan'
import type { Meal } from '@/types'

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

const mockMeal: Meal = {
  id: '1',
  nazwa: 'Test Meal',
  opis: '',
  photo_url: '',
  prep_time: 20,
  kcal_baza: 400,
  kcal_z_miesem: 500,
  bialko_baza: 15,
  bialko_z_miesem: 25,
  trudnosc: 'łatwe',
  kuchnia: 'polska',
  category: 'makarony',
  skladniki_baza: '[]',
  skladniki_mieso: '[]',
  przepis: '{}',
  tags: [],
}

describe('useWeeklyPlan', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => null,
    })
  })

  it('initializes with empty plan', async () => {
    const { result } = renderHook(() => useWeeklyPlan(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.weeklyPlan.mon).toBeNull()
      expect(result.current.weeklyPlan.tue).toBeNull()
    })
  })

  it('weekOffset starts at 0', () => {
    const { result } = renderHook(() => useWeeklyPlan(), { wrapper: createWrapper() })
    expect(result.current.weekOffset).toBe(0)
  })

  it('weekKey is a date string', () => {
    const { result } = renderHook(() => useWeeklyPlan(), { wrapper: createWrapper() })
    expect(result.current.weekKey).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('setMeal adds meal to plan', async () => {
    const { result } = renderHook(() => useWeeklyPlan(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.weeklyPlan.mon).toBeNull()
    })

    act(() => {
      result.current.setMeal('mon', mockMeal)
    })

    expect(result.current.weeklyPlan.mon).toEqual(mockMeal)
  })

  it('setMeal clears vacation flag for that day', async () => {
    const { result } = renderHook(() => useWeeklyPlan(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.weeklyPlan.mon).toBeNull()
    })

    // First set as vacation
    act(() => {
      result.current.toggleVacation('mon')
    })

    expect(result.current.weeklyPlan.mon_free).toBe(true)

    // Now set meal — should clear vacation
    act(() => {
      result.current.setMeal('mon', mockMeal)
    })

    expect(result.current.weeklyPlan.mon_free).toBe(false)
    expect(result.current.weeklyPlan.mon).toEqual(mockMeal)
  })

  it('removeMeal removes meal from plan', async () => {
    const { result } = renderHook(() => useWeeklyPlan(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.weeklyPlan.mon).toBeNull()
    })

    act(() => {
      result.current.setMeal('mon', mockMeal)
    })

    expect(result.current.weeklyPlan.mon).toEqual(mockMeal)

    act(() => {
      result.current.removeMeal('mon')
    })

    expect(result.current.weeklyPlan.mon).toBeNull()
  })

  it('toggleVacation sets free flag', async () => {
    const { result } = renderHook(() => useWeeklyPlan(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.weeklyPlan.mon_free).toBe(false)
    })

    act(() => {
      result.current.toggleVacation('mon')
    })

    expect(result.current.weeklyPlan.mon_free).toBe(true)
  })

  it('toggleVacation clears meal when setting vacation', async () => {
    const { result } = renderHook(() => useWeeklyPlan(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.weeklyPlan.mon).toBeNull()
    })

    act(() => {
      result.current.setMeal('mon', mockMeal)
    })

    act(() => {
      result.current.toggleVacation('mon')
    })

    expect(result.current.weeklyPlan.mon).toBeNull()
    expect(result.current.weeklyPlan.mon_free).toBe(true)
  })

  it('toggleVacation toggles off when already free', async () => {
    const { result } = renderHook(() => useWeeklyPlan(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.weeklyPlan.mon_free).toBe(false)
    })

    act(() => {
      result.current.toggleVacation('mon')
    })

    expect(result.current.weeklyPlan.mon_free).toBe(true)

    act(() => {
      result.current.toggleVacation('mon')
    })

    expect(result.current.weeklyPlan.mon_free).toBe(false)
  })

  it('setWeekOffset changes week', () => {
    const { result } = renderHook(() => useWeeklyPlan(), { wrapper: createWrapper() })

    act(() => {
      result.current.setWeekOffset(2)
    })

    expect(result.current.weekOffset).toBe(2)
  })

  it('loads plan from server when server returns valid plan', async () => {
    const serverPlan = {
      mon: mockMeal,
      tue: null,
      wed: null,
      thu: null,
      fri: null,
      mon_free: false,
      tue_free: false,
      wed_free: false,
      thu_free: false,
      fri_free: false,
    }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => serverPlan,
    })

    const { result } = renderHook(() => useWeeklyPlan(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.weeklyPlan.mon).toEqual(mockMeal)
    })
  })
})
