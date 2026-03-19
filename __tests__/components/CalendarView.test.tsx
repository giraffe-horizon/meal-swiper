import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/plan',
}))

// Mock useAppContext
vi.mock('@/lib/context', () => ({
  useAppContext: () => ({
    settings: { people: 2, persons: [], theme: 'light' },
    scaleFactor: 1,
  }),
}))

// Mock useWeekDates
vi.mock('@/hooks/useWeekDates', () => ({
  useWeekDates: () => ({
    weekDates: [
      new Date(2024, 2, 4), // Mon Mar 4
      new Date(2024, 2, 5),
      new Date(2024, 2, 6),
      new Date(2024, 2, 7),
      new Date(2024, 2, 8), // Fri Mar 8
    ],
  }),
}))

// Mock MealModal
vi.mock('@/components/MealModal', () => ({
  default: () => null,
}))

const { default: CalendarView } = await import('@/components/CalendarView')

import type { WeeklyPlan } from '@/types'

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

describe('CalendarView', () => {
  const onDayClick = vi.fn()
  const onRemoveMeal = vi.fn()
  const onToggleVacation = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all 5 day cards', () => {
    render(
      <CalendarView
        weeklyPlan={emptyPlan}
        weekOffset={0}
        onDayClick={onDayClick}
        onRemoveMeal={onRemoveMeal}
        onToggleVacation={onToggleVacation}
      />
    )
    expect(screen.getByTestId('day-card-mon')).toBeInTheDocument()
    expect(screen.getByTestId('day-card-tue')).toBeInTheDocument()
    expect(screen.getByTestId('day-card-wed')).toBeInTheDocument()
    expect(screen.getByTestId('day-card-thu')).toBeInTheDocument()
    expect(screen.getByTestId('day-card-fri')).toBeInTheDocument()
  })

  it('shows "Dodaj posiłek" for empty days', () => {
    render(
      <CalendarView
        weeklyPlan={emptyPlan}
        weekOffset={0}
        onDayClick={onDayClick}
        onRemoveMeal={onRemoveMeal}
        onToggleVacation={onToggleVacation}
      />
    )
    const noPlanTexts = screen.getAllByText('Dodaj posiłek')
    expect(noPlanTexts).toHaveLength(5)
  })

  it('renders date strings', () => {
    render(
      <CalendarView
        weeklyPlan={emptyPlan}
        weekOffset={0}
        onDayClick={onDayClick}
        onRemoveMeal={onRemoveMeal}
        onToggleVacation={onToggleVacation}
      />
    )
    expect(screen.getByText(/4 Mar/)).toBeInTheDocument()
  })

  it('shows day names', () => {
    render(
      <CalendarView
        weeklyPlan={emptyPlan}
        weekOffset={0}
        onDayClick={onDayClick}
        onRemoveMeal={onRemoveMeal}
        onToggleVacation={onToggleVacation}
      />
    )
    expect(screen.getByText(/Poniedziałek/)).toBeInTheDocument()
    expect(screen.getByText(/Piątek/)).toBeInTheDocument()
  })
})
