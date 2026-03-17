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
    expect(screen.getByText('Pn')).toBeInTheDocument()
    expect(screen.getByText('Wt')).toBeInTheDocument()
    expect(screen.getByText('Śr')).toBeInTheDocument()
    expect(screen.getByText('Cz')).toBeInTheDocument()
    expect(screen.getByText('Pt')).toBeInTheDocument()
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
    fireEvent.click(screen.getByText('Pn'))
    expect(onSelect).toHaveBeenCalledWith('mon')
  })

  it('active day has ring styling', () => {
    render(
      <DaySelector
        weeklyPlan={emptyPlan}
        weekDates={weekDates}
        selectedDay="mon"
        onSelect={vi.fn()}
      />
    )
    const pnBtn = screen.getByText('Pn').closest('button')
    expect(pnBtn?.className).toContain('ring-2')
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
    const pnBtn = screen.getByText('Pn').closest('button')
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
    const pnBtn = screen.getByText('Pn').closest('button')
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
    fireEvent.click(screen.getByText('Pn'))
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('renders thumbnails when showThumbnails is true', () => {
    const plan = {
      ...emptyPlan,
      mon: {
        id: '1',
        nazwa: 'Test',
        opis: '',
        photo_url: 'https://example.com/photo.jpg',
        prep_time: 20,
        kcal_baza: 400,
        kcal_z_miesem: 500,
        bialko_baza: 15,
        bialko_z_miesem: 25,
        trudnosc: 'łatwe' as const,
        kuchnia: 'polska',
        category: 'makarony',
        skladniki_baza: '[]',
        skladniki_mieso: '[]',
        przepis: '{}',
        tags: [],
      },
    }
    render(
      <DaySelector
        weeklyPlan={plan}
        weekDates={weekDates}
        selectedDay={null}
        onSelect={vi.fn()}
        showThumbnails
      />
    )
    const img = screen.getByAltText('Test')
    expect(img).toBeInTheDocument()
  })

  it('shows meal icon when showThumbnails=true and no meal', () => {
    render(
      <DaySelector
        weeklyPlan={emptyPlan}
        weekDates={weekDates}
        selectedDay={null}
        onSelect={vi.fn()}
        showThumbnails
      />
    )
    const icons = screen.getAllByText('restaurant_menu')
    expect(icons.length).toBeGreaterThan(0)
  })

  it('shows airplane emoji for free day thumbnails', () => {
    const freePlan = { ...emptyPlan, mon_free: true }
    render(
      <DaySelector
        weeklyPlan={freePlan}
        weekDates={weekDates}
        selectedDay={null}
        onSelect={vi.fn()}
        showThumbnails
      />
    )
    expect(screen.getByText('✈️')).toBeInTheDocument()
  })
})
