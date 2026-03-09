import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import CalendarView from '@/components/CalendarView'
import type { Meal, WeeklyPlan } from '@/types'

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
  skladniki_baza: '[]',
  skladniki_mieso: '[]',
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
  onDayClick: vi.fn(),
  onRemoveMeal: vi.fn(),
  onToggleVacation: vi.fn(),
}

describe('CalendarView', () => {
  it('renders 5 day cards', () => {
    render(<CalendarView {...defaultProps} />)
    const dayCards = screen.getAllByTestId(/^day-card-/)
    expect(dayCards).toHaveLength(5)
  })

  it('empty day shows "Brak planu"', () => {
    render(<CalendarView {...defaultProps} />)
    const brakPlanu = screen.getAllByText('Brak planu')
    expect(brakPlanu.length).toBeGreaterThan(0)
  })

  it('day with meal shows meal name', () => {
    const plan = { ...emptyPlan, mon: mockMeal }
    render(<CalendarView {...defaultProps} weeklyPlan={plan} />)
    expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument()
  })

  it('day with meal shows prep time and kcal', () => {
    const plan = { ...emptyPlan, mon: mockMeal }
    render(<CalendarView {...defaultProps} weeklyPlan={plan} />)
    expect(screen.getByText(/30 min/)).toBeInTheDocument()
    expect(screen.getByText(/450 kcal/)).toBeInTheDocument()
  })

  it('free day shows "Urlop"', () => {
    const plan = { ...emptyPlan, wed_free: true }
    render(<CalendarView {...defaultProps} weeklyPlan={plan} />)
    expect(screen.getByText('Urlop')).toBeInTheDocument()
  })

  it('does not show "Generuj listę zakupów" button (removed)', () => {
    const fullPlan: WeeklyPlan = {
      mon: mockMeal,
      tue: mockMeal,
      wed: mockMeal,
      thu: mockMeal,
      fri: mockMeal,
      mon_free: false,
      tue_free: false,
      wed_free: false,
      thu_free: false,
      fri_free: false,
    }
    render(<CalendarView {...defaultProps} weeklyPlan={fullPlan} />)
    expect(screen.queryByText('Generuj listę zakupów')).not.toBeInTheDocument()
  })
})
