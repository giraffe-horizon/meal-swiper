import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { AppProvider } from '@/lib/context'

// matchMedia mock required (not in jsdom by default)
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

// Mutable state shared with mock factories (vi.hoisted ensures they're available before vi.mock hoisting)
const mocks = vi.hoisted(() => ({
  theme: 'dark' as string,
  meals: [] as {
    id: string
    nazwa: string
    opis: string
    photo_url: string
    prep_time: number
    kcal_baza: number
    kcal_z_miesem: number
    bialko_baza: number
    bialko_z_miesem: number
    trudnosc: string
    kuchnia: string
    category?: string
    skladniki_baza: string
    skladniki_mieso: string
    przepis: string
    tags: string[]
  }[],
  weekOffset: 0 as number,
  shuffleMeals: vi.fn(),
}))

vi.mock('@/hooks/useMeals', () => ({
  useMeals: () => ({ meals: mocks.meals, loading: false, error: null, refetch: vi.fn() }),
  useMealsWithVariants: () => ({ meals: [], loading: false, error: null, refetch: vi.fn() }),
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
    weekOffset: mocks.weekOffset,
    weekKey: '2024-01-01',
    setWeekOffset: vi.fn(),
    setMeal: vi.fn(),
    removeMeal: vi.fn(),
    toggleVacation: vi.fn(),
  }),
}))

vi.mock('@/hooks/useSettings', () => ({
  useSettings: () => ({
    settings: { people: 2, theme: mocks.theme, persons: [] },
    updateSettings: vi.fn(),
    scaleFactor: 1,
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
    shuffleMeals: mocks.shuffleMeals,
    shuffleFilteredMeals: vi.fn(),
    getVariantAssignment: () => null,
    filteredMeals: [],
    advanceIndex: vi.fn(),
    resetSwipe: vi.fn(),
  }),
}))

const testMeal = {
  id: '1',
  nazwa: 'Zupa pomidorowa',
  opis: 'Klasyczna zupa',
  photo_url: '',
  prep_time: 20,
  kcal_baza: 300,
  kcal_z_miesem: 400,
  bialko_baza: 10,
  bialko_z_miesem: 20,
  trudnosc: 'łatwe',
  kuchnia: 'polska',
  category: 'zupy',
  skladniki_baza: '[]',
  skladniki_mieso: '[]',
  przepis: '{}',
  tags: [],
}

describe('AppProvider - dark/light theme branches', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark')
    mocks.meals = []
    mocks.weekOffset = 0
    mocks.shuffleMeals.mockClear()
  })

  it('adds dark class to documentElement when theme is dark', () => {
    mocks.theme = 'dark'
    render(
      <AppProvider>
        <div />
      </AppProvider>
    )
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('removes dark class from documentElement when theme is light', () => {
    document.documentElement.classList.add('dark')
    mocks.theme = 'light'
    render(
      <AppProvider>
        <div />
      </AppProvider>
    )
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})

describe('AppProvider - meal initialization effect', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark')
    mocks.theme = 'system'
    mocks.weekOffset = 0
    mocks.shuffleMeals.mockClear()
  })

  it('calls shuffleMeals when meals are loaded for the first time', async () => {
    mocks.meals = [testMeal]
    render(
      <AppProvider>
        <div />
      </AppProvider>
    )
    await waitFor(() => expect(mocks.shuffleMeals).toHaveBeenCalled())
    expect(mocks.shuffleMeals).toHaveBeenCalledWith(expect.arrayContaining([testMeal]))
  })

  it('re-shuffles meals when week offset changes', async () => {
    mocks.meals = [testMeal]
    mocks.weekOffset = 0
    const { rerender } = render(
      <AppProvider>
        <div />
      </AppProvider>
    )

    // Wait for initial shuffle
    await waitFor(() => expect(mocks.shuffleMeals).toHaveBeenCalledTimes(1))

    // Simulate week change
    mocks.weekOffset = 1
    mocks.shuffleMeals.mockClear()
    rerender(
      <AppProvider>
        <div />
      </AppProvider>
    )

    // Should re-shuffle for the new week
    await waitFor(() => expect(mocks.shuffleMeals).toHaveBeenCalled())
  })
})
