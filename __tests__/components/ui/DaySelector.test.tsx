import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DaySelector from '@/components/ui/DaySelector'
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

const weekDates = [
  new Date(2024, 2, 4),
  new Date(2024, 2, 5),
  new Date(2024, 2, 6),
  new Date(2024, 2, 7),
  new Date(2024, 2, 8),
]

describe('DaySelector', () => {
  it('renders all 5 day buttons', () => {
    render(
      <DaySelector
        weeklyPlan={emptyPlan}
        weekDates={weekDates}
        selectedDay={null}
        onSelect={vi.fn()}
      />
    )
    expect(screen.getByText('PN')).toBeInTheDocument()
    expect(screen.getByText('WT')).toBeInTheDocument()
    expect(screen.getByText('ŚR')).toBeInTheDocument()
    expect(screen.getByText('CZ')).toBeInTheDocument()
    expect(screen.getByText('PT')).toBeInTheDocument()
  })

  it('calls onSelect when day clicked', () => {
    const onSelect = vi.fn()
    render(
      <DaySelector
        weeklyPlan={emptyPlan}
        weekDates={weekDates}
        selectedDay={null}
        onSelect={onSelect}
      />
    )
    fireEvent.click(screen.getByText('PN'))
    expect(onSelect).toHaveBeenCalledWith('mon')
  })

  it('active day has primary bg styling', () => {
    render(
      <DaySelector
        weeklyPlan={emptyPlan}
        weekDates={weekDates}
        selectedDay="mon"
        onSelect={vi.fn()}
      />
    )
    const pnBtn = screen.getByText('PN').closest('button')
    expect(pnBtn?.className).toContain('bg-primary')
  })

  it('inactive day does not have ring styling', () => {
    render(
      <DaySelector
        weeklyPlan={emptyPlan}
        weekDates={weekDates}
        selectedDay="tue"
        onSelect={vi.fn()}
      />
    )
    const pnBtn = screen.getByText('PN').closest('button')
    expect(pnBtn?.className).not.toContain('ring-2')
  })

  it('disabled when day is free', () => {
    const freePlan = { ...emptyPlan, mon_free: true }
    render(
      <DaySelector
        weeklyPlan={freePlan}
        weekDates={weekDates}
        selectedDay={null}
        onSelect={vi.fn()}
      />
    )
    const pnBtn = screen.getByText('PN').closest('button')
    expect(pnBtn).toBeDisabled()
  })

  it('does not call onSelect when free day clicked', () => {
    const onSelect = vi.fn()
    const freePlan = { ...emptyPlan, mon_free: true }
    render(
      <DaySelector
        weeklyPlan={freePlan}
        weekDates={weekDates}
        selectedDay={null}
        onSelect={onSelect}
      />
    )
    fireEvent.click(screen.getByText('PN'))
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('renders day number from date', () => {
    render(
      <DaySelector
        weeklyPlan={emptyPlan}
        weekDates={weekDates}
        selectedDay={null}
        onSelect={vi.fn()}
      />
    )
    // weekDates[0] = March 4 → should show "4"
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('uses rounded-2xl for pill shape', () => {
    render(
      <DaySelector
        weeklyPlan={emptyPlan}
        weekDates={weekDates}
        selectedDay="mon"
        onSelect={vi.fn()}
      />
    )
    const pnBtn = screen.getByText('PN').closest('button')
    expect(pnBtn?.className).toContain('rounded-2xl')
  })
})
