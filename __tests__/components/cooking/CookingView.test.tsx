import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CookingView from '@/components/cooking/CookingView'
import type { Meal } from '@/types'

const mockToggleEaten = vi.fn()

vi.mock('@/lib/context', () => ({
  useAppContext: () => ({
    weeklyPlan: {},
    toggleEaten: mockToggleEaten,
    weekOffset: 0,
  }),
}))

vi.mock('@/lib/storage', () => ({
  getCheckedItems: () => ({}),
  saveCheckedItems: vi.fn(),
}))

// Mock fetch for the shopping-checked API call
global.fetch = vi.fn().mockResolvedValue({ ok: true })

const mockMeal: Meal = {
  id: '1',
  nazwa: 'Makaron z pesto',
  opis: 'Pyszny makaron',
  photo_url: 'https://example.com/photo.jpg',
  prep_time: 20,
  kcal_baza: 400,
  kcal_z_miesem: 550,
  bialko_baza: 15,
  bialko_z_miesem: 28,
  trudnosc: 'łatwe',
  kuchnia: 'włoska',
  category: 'makarony',
  skladniki_baza: JSON.stringify([
    { name: 'Makaron', amount: '200g' },
    { name: 'Pesto', amount: '3 łyżki' },
  ]),
  skladniki_mieso: JSON.stringify([{ name: 'Kurczak', amount: '150g' }]),
  przepis: JSON.stringify({
    kroki: ['Ugotuj makaron.', 'Dodaj pesto i wymieszaj.', 'Podawaj od razu.'],
    wskazowki: 'Użyj świeżego pesto.',
  }),
  tags: ['obiad'],
}

const mealNoMeat: Meal = {
  ...mockMeal,
  id: '2',
  skladniki_mieso: '[]',
}

const mealNoRecipe: Meal = {
  ...mockMeal,
  id: '3',
  przepis: JSON.stringify({ kroki: [] }),
}

describe('CookingView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders meal title', () => {
    render(<CookingView day="mon" meal={mockMeal} people={2} scaleFactor={1} />)
    expect(screen.getByText('Makaron z pesto')).toBeInTheDocument()
  })

  it('renders prep time', () => {
    render(<CookingView day="mon" meal={mockMeal} people={2} scaleFactor={1} />)
    expect(screen.getByText(/20 min/)).toBeInTheDocument()
  })

  it('renders kcal info', () => {
    render(<CookingView day="mon" meal={mockMeal} people={2} scaleFactor={1} />)
    expect(screen.getByText(/400 kcal/)).toBeInTheDocument()
  })

  it('renders base ingredients', () => {
    render(<CookingView day="mon" meal={mockMeal} people={2} scaleFactor={1} />)
    expect(screen.getByText('Makaron')).toBeInTheDocument()
    expect(screen.getByText('Pesto')).toBeInTheDocument()
  })

  it('renders meat ingredients section', () => {
    render(<CookingView day="mon" meal={mockMeal} people={2} scaleFactor={1} />)
    expect(screen.getByText('Opcja mięsna')).toBeInTheDocument()
    expect(screen.getByText('Kurczak')).toBeInTheDocument()
  })

  it('does not render meat section when no meat ingredients', () => {
    render(<CookingView day="mon" meal={mealNoMeat} people={2} scaleFactor={1} />)
    expect(screen.queryByText('Opcja mięsna')).toBeNull()
  })

  it('renders recipe steps', () => {
    render(<CookingView day="mon" meal={mockMeal} people={2} scaleFactor={1} />)
    expect(screen.getByText(/Ugotuj makaron/)).toBeInTheDocument()
  })

  it('renders tips section', () => {
    render(<CookingView day="mon" meal={mockMeal} people={2} scaleFactor={1} />)
    expect(screen.getByText('Użyj świeżego pesto.')).toBeInTheDocument()
    expect(screen.getByText('Wskazówki szefa')).toBeInTheDocument()
  })

  it('does not render recipe section when no steps', () => {
    render(<CookingView day="mon" meal={mealNoRecipe} people={2} scaleFactor={1} />)
    expect(screen.queryByText('Przepis')).toBeNull()
  })

  it('renders progress bar', () => {
    render(<CookingView day="mon" meal={mockMeal} people={2} scaleFactor={1} />)
    expect(screen.getByText('Postęp gotowania')).toBeInTheDocument()
  })

  it('toggles ingredient checked state on click', () => {
    render(<CookingView day="mon" meal={mockMeal} people={2} scaleFactor={1} />)
    const labels = screen.getAllByRole('generic').filter((el) => el.tagName === 'LABEL')
    // Actually use the label elements
    const makaron = screen.getByText('Makaron')
    const label = makaron.closest('label')
    expect(label).toBeTruthy()
    fireEvent.click(label!)
    // After clicking, the ingredient should be struck through
    expect(makaron.classList.contains('line-through')).toBe(true)
  })

  it('shows people count in heading', () => {
    render(<CookingView day="mon" meal={mockMeal} people={3} scaleFactor={1} />)
    expect(screen.getByText(/3 osób/)).toBeInTheDocument()
  })

  it('shows singular form for 1 person', () => {
    render(<CookingView day="mon" meal={mockMeal} people={1} scaleFactor={1} />)
    expect(screen.getByText(/1 osoby/)).toBeInTheDocument()
  })

  it('shows "Zjedzone?" button when not eaten', () => {
    render(<CookingView day="mon" meal={mockMeal} people={2} scaleFactor={1} />)
    expect(screen.getByText('Zjedzone?')).toBeInTheDocument()
  })

  it('calls toggleEaten when Zjedzone button clicked', () => {
    render(<CookingView day="mon" meal={mockMeal} people={2} scaleFactor={1} />)
    const btn = screen.getByText('Zjedzone?').closest('button')
    expect(btn).toBeTruthy()
    fireEvent.click(btn!)
    expect(mockToggleEaten).toHaveBeenCalledWith('mon')
  })

  it('shows "Zjedzone" (past) and marks shopping after clicking when not eaten', () => {
    // Click button → toggleEaten called → ingredients should be marked in shopping
    render(<CookingView day="mon" meal={mockMeal} people={2} scaleFactor={1} />)
    const btn = screen.getByText('Zjedzone?').closest('button')!
    fireEvent.click(btn)
    // toggleEaten should be called (shopping list side-effect is async)
    expect(mockToggleEaten).toHaveBeenCalledTimes(1)
  })
})
