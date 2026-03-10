import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ShoppingListView from '@/components/ShoppingListView'
import { getWeekKey } from '@/lib/utils'
import type { Meal, WeeklyPlan } from '@/types'

// Mock useAppContext
vi.mock('@/lib/context', () => ({
  useAppContext: () => ({
    settings: {
      people: 2,
      persons: [
        { kcal: 2000, protein: 120 },
        { kcal: 1800, protein: 100 },
      ],
    },
  }),
}))

const mockMeal: Meal = {
  id: '1',
  nazwa: 'Pasta Carbonara',
  opis: 'Pyszna pasta',
  photo_url: 'https://i.imgur.com/abc123.jpg',
  prep_time: 30,
  kcal_baza: 450,
  kcal_z_miesem: 600,
  bialko_baza: 15,
  bialko_z_miesem: 30,
  trudnosc: 'łatwe',
  kuchnia: 'włoska',
  skladniki_baza: JSON.stringify([
    { name: 'Makaron', amount: '200g', category: 'suche' },
    { name: 'Pomidory', amount: '3 szt', category: 'warzywa' },
  ]),
  skladniki_mieso: JSON.stringify([{ name: 'Boczek', amount: '100g', category: 'mięso' }]),
  przepis: '{}',
  tags: [],
}

const emptyPlan: WeeklyPlan = {
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
}

const defaultProps = {
  weeklyPlan: emptyPlan,
  weekOffset: 0,
  onWeekChange: vi.fn(),
}

describe('ShoppingListView', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('shows empty state when no meals planned', () => {
    render(<ShoppingListView {...defaultProps} />)
    expect(screen.getByText('Brak listy zakupów')).toBeInTheDocument()
  })

  it('shows ingredients when meals are planned', () => {
    const plan = { ...emptyPlan, mon: mockMeal }
    render(<ShoppingListView {...defaultProps} weeklyPlan={plan} />)
    expect(screen.getByText('Makaron')).toBeInTheDocument()
    expect(screen.getByText(/— 200\s*g/)).toBeInTheDocument()
    expect(screen.getByText('Pomidory')).toBeInTheDocument()
    expect(screen.getByText('Boczek')).toBeInTheDocument()
  })

  it('checkbox toggle persists to localStorage', () => {
    const plan = { ...emptyPlan, mon: mockMeal }
    render(<ShoppingListView {...defaultProps} weeklyPlan={plan} />)

    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes.length).toBeGreaterThan(0)

    fireEvent.click(checkboxes[0])

    // The weekKey is computed from getWeekKey(0) — get the current monday
    const weekKey = getWeekKey(0)
    const saved = localStorage.getItem(`checkedItems_${weekKey}`)
    expect(saved).toBeTruthy()
    const parsed = JSON.parse(saved!)
    expect(Object.values(parsed).some((v) => v === true)).toBe(true)
  })

  it('"Udostępnij" copies text to clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      writable: true,
      configurable: true,
    })
    vi.spyOn(window, 'alert').mockImplementation(() => {})

    const plan = { ...emptyPlan, mon: mockMeal }
    render(<ShoppingListView {...defaultProps} weeklyPlan={plan} />)

    const shareButton = screen.getByText('Udostępnij')
    fireEvent.click(shareButton)

    expect(writeText).toHaveBeenCalled()
    const copiedText = writeText.mock.calls[0][0]
    expect(copiedText).toContain('Lista zakupów')
  })
})
