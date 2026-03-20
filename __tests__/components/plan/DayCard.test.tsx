import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DayCard from '@/components/plan/DayCard'
import type { Meal, DayKey } from '@/types'

const mockMeal: Meal = {
  id: '1',
  nazwa: 'Pasta Carbonara',
  opis: 'Pyszna pasta',
  photo_url: 'https://example.com/photo.jpg',
  prep_time: 30,
  kcal_baza: 450,
  kcal_z_miesem: 600,
  bialko_baza: 20,
  bialko_z_miesem: 35,
  trudnosc: 'łatwe',
  kuchnia: 'włoska',
  category: 'makarony',
  skladniki_baza: '[]',
  skladniki_mieso: '[]',
  przepis: '{}',
  tags: ['obiad'],
}

const defaultProps = {
  day: 'mon' as DayKey,
  meal: null,
  isFree: false,
  dateStr: '10 Mar',
  dayName: 'Poniedziałek',
  people: 2,
  onDayClick: vi.fn(),
  onRemoveMeal: vi.fn(),
  onToggleVacation: vi.fn(),
  onMealClick: vi.fn(),
}

describe('DayCard - empty state', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders empty state card', () => {
    render(<DayCard {...defaultProps} />)
    expect(screen.getByTestId('day-card-mon')).toBeInTheDocument()
  })

  it('shows "Dodaj posiłek" when no meal', () => {
    render(<DayCard {...defaultProps} />)
    expect(screen.getByText('Dodaj posiłek')).toBeInTheDocument()
  })

  it('calls onDayClick when empty card is clicked', () => {
    render(<DayCard {...defaultProps} />)
    const card = screen.getByTestId('day-card-mon')
    fireEvent.click(card)
    expect(defaultProps.onDayClick).toHaveBeenCalledWith('mon')
  })
})

describe('DayCard - with meal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders meal name', () => {
    render(<DayCard {...defaultProps} meal={mockMeal} />)
    expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument()
  })

  it('renders meal details (kcal and protein)', () => {
    render(<DayCard {...defaultProps} meal={mockMeal} />)
    expect(screen.getByText(/450 kcal/)).toBeInTheDocument()
    expect(screen.getByText(/20g protein/)).toBeInTheDocument()
  })

  it('calls onMealClick when meal card clicked', () => {
    render(<DayCard {...defaultProps} meal={mockMeal} />)
    const card = screen.getByTestId('day-card-mon')
    fireEvent.click(card)
    expect(defaultProps.onMealClick).toHaveBeenCalledWith(mockMeal)
  })
})

// Vacation state UI removed in new design - vacation functionality handled via context menu

describe('DayCard - context menu (right-click)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls onToggleVacation via context menu on empty day (confirm = true)', () => {
    window.confirm = vi.fn(() => true)
    render(<DayCard {...defaultProps} />)
    const card = screen.getByTestId('day-card-mon')
    fireEvent.contextMenu(card)
    expect(defaultProps.onToggleVacation).toHaveBeenCalledWith('mon')
  })

  it('handles context menu on empty day (confirm = false) → no action', () => {
    window.confirm = vi.fn(() => false)
    render(<DayCard {...defaultProps} />)
    const card = screen.getByTestId('day-card-mon')
    fireEvent.contextMenu(card)
    expect(defaultProps.onToggleVacation).not.toHaveBeenCalled()
    expect(defaultProps.onRemoveMeal).not.toHaveBeenCalled()
  })

  it('handles context menu on meal day (confirm = true) → removeMeal', () => {
    window.confirm = vi.fn(() => true)
    render(<DayCard {...defaultProps} meal={mockMeal} />)
    const card = screen.getByTestId('day-card-mon')
    fireEvent.contextMenu(card)
    expect(defaultProps.onRemoveMeal).toHaveBeenCalledWith('mon')
  })

  it('handles context menu on meal day (confirm = false) → toggleVacation', () => {
    window.confirm = vi.fn(() => false)
    render(<DayCard {...defaultProps} meal={mockMeal} />)
    const card = screen.getByTestId('day-card-mon')
    fireEvent.contextMenu(card)
    expect(defaultProps.onToggleVacation).toHaveBeenCalledWith('mon')
  })

  it('handles vacation day via menu "Anuluj urlop"', () => {
    render(<DayCard {...defaultProps} isFree={true} />)
    // Click the menu button
    const menuButton = screen.getByRole('button')
    fireEvent.click(menuButton)
    // Click "Anuluj urlop" option
    const cancelVacationButton = screen.getByText('Anuluj urlop')
    fireEvent.click(cancelVacationButton)
    expect(defaultProps.onToggleVacation).toHaveBeenCalledWith('mon')
  })
})
