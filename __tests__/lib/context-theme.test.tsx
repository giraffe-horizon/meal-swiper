import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

vi.mock('@/hooks/useMeals', () => ({
  useMeals: () => ({ meals: [], loading: false }),
}))

vi.mock('@/hooks/useWeeklyPlan', () => ({
  useWeeklyPlan: () => ({
    weeklyPlan: {
      mon: null,
      tue: null,
      wed: null,
      thu: null,
      fri: null,
      mon_free: false,
      tue_free: false,
      wed_free: false,
      thu_free: false,
      fri_free: false,
    },
    weekOffset: 0,
    weekKey: '2024-01-01',
    setWeekOffset: vi.fn(),
    setMeal: vi.fn(),
    removeMeal: vi.fn(),
    toggleVacation: vi.fn(),
  }),
}))

vi.mock('@/hooks/useSwipeState', () => ({
  useSwipeState: () => ({
    shuffledMeals: [],
    currentSwipeIndex: 0,
    seenIds: [],
    setShuffledMeals: vi.fn(),
    setCurrentSwipeIndex: vi.fn(),
    setSeenIds: vi.fn(),
    shuffleMeals: vi.fn(),
    advanceIndex: vi.fn(),
    resetSwipe: vi.fn(),
  }),
}))

describe('AppProvider dark theme', () => {
  beforeEach(() => {
    vi.resetModules()
    document.documentElement.classList.remove('dark')
  })

  it('adds dark class when theme is dark', async () => {
    vi.doMock('@/hooks/useSettings', () => ({
      useSettings: () => ({
        settings: {
          people: 2,
          persons: [
            { kcal: 2000, protein: 120 },
            { kcal: 1800, protein: 100 },
          ],
          theme: 'dark',
        },
        updateSettings: vi.fn(),
        scaleFactor: 1,
        isLoaded: true,
      }),
    }))

    const { AppProvider } = await import('@/lib/context')

    render(
      <AppProvider>
        <div>test</div>
      </AppProvider>
    )

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })
  })
})

describe('AppProvider light theme', () => {
  beforeEach(() => {
    vi.resetModules()
    document.documentElement.classList.add('dark')
  })

  it('removes dark class when theme is light', async () => {
    vi.doMock('@/hooks/useSettings', () => ({
      useSettings: () => ({
        settings: {
          people: 2,
          persons: [
            { kcal: 2000, protein: 120 },
            { kcal: 1800, protein: 100 },
          ],
          theme: 'light',
        },
        updateSettings: vi.fn(),
        scaleFactor: 1,
        isLoaded: true,
      }),
    }))

    const { AppProvider } = await import('@/lib/context')

    render(
      <AppProvider>
        <div>test</div>
      </AppProvider>
    )

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })
  })
})
