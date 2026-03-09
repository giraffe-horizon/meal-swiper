import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import SwipeView from '@/components/SwipeView'
import type { Meal, WeeklyPlan } from '@/types'

// Mock framer-motion
vi.mock('framer-motion', () => {
  const React = require('react')

  const motionDiv = React.forwardRef(
    (props: Record<string, unknown>, ref: React.Ref<HTMLDivElement>) => {
      const { drag, dragElastic, dragConstraints, onDragEnd, style: _style, ...rest } = props
      return React.createElement('div', { ...rest, ref })
    }
  )
  motionDiv.displayName = 'motion.div'

  return {
    motion: { div: motionDiv },
    useMotionValue: () => ({ get: () => 0, set: vi.fn() }),
    useTransform: () => ({ get: () => 0 }),
    animate: vi.fn(() => Promise.resolve()),
  }
})

const mockMeal: Meal = {
  id: '1',
  nazwa: 'Pasta Carbonara',
  opis: 'Pyszna pasta z boczkiem',
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
  tags: ['obiad'],
}

const mockMeal2: Meal = {
  ...mockMeal,
  id: '2',
  nazwa: 'Pizza Margherita',
  photo_url: 'https://i.imgur.com/def456.jpg',
}

const defaultPlan: WeeklyPlan = {
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
  meals: [mockMeal, mockMeal2],
  onSwipeRight: vi.fn(),
  currentDay: 'mon' as const,
  onComplete: vi.fn(),
  weeklyPlan: defaultPlan,
  onSkipAll: vi.fn(),
  onSkipDay: vi.fn(),
}

describe('SwipeView', () => {
  it('renders card with a meal name (shuffled)', () => {
    render(<SwipeView {...defaultProps} />)
    // After shuffle, either meal could be first
    const hasMeal = screen.queryByText('Pasta Carbonara') || screen.queryByText('Pizza Margherita')
    expect(hasMeal).toBeInTheDocument()
  })

  it('renders image with non-empty src', () => {
    render(<SwipeView {...defaultProps} />)
    const imgs = screen.getAllByRole('img')
    expect(imgs[0]).toHaveAttribute('src')
    expect((imgs[0] as HTMLImageElement).src).not.toBe('')
  })

  it('clicking heart button triggers swipe right flow', async () => {
    render(<SwipeView {...defaultProps} />)

    const buttons = screen.getAllByRole('button')
    const heartButton = buttons.find(
      (btn) => btn.querySelector('.material-symbols-outlined')?.textContent === 'favorite'
    )
    expect(heartButton).toBeTruthy()

    await act(async () => {
      fireEvent.click(heartButton!)
    })

    // animate() resolves immediately in mock, so onSwipeRight should be called
    expect(defaultProps.onSwipeRight).toHaveBeenCalled()
  })

  it('clicking close button triggers swipe left animation', async () => {
    render(<SwipeView {...defaultProps} />)

    const buttons = screen.getAllByRole('button')
    const closeButton = buttons.find(
      (btn) => btn.querySelector('.material-symbols-outlined')?.textContent === 'close'
    )
    expect(closeButton).toBeTruthy()

    // Verify close button is rendered and clickable
    await act(async () => {
      fireEvent.click(closeButton!)
    })

    // animate() mock should have been called (swipe left animation triggered)
    const { animate } = await import('framer-motion')
    expect(animate).toHaveBeenCalled()
  })

  it('renders "Brak więcej posiłków" when no meals', () => {
    render(<SwipeView {...defaultProps} meals={[]} />)
    expect(screen.getByText('Brak więcej posiłków')).toBeInTheDocument()
  })

  it('shows toast with meal name on swipe right', async () => {
    render(<SwipeView {...defaultProps} />)

    const buttons = screen.getAllByRole('button')
    const heartButton = buttons.find(
      (btn) => btn.querySelector('.material-symbols-outlined')?.textContent === 'favorite'
    )

    await act(async () => {
      fireEvent.click(heartButton!)
    })

    expect(screen.getByText(/Dodano:/)).toBeInTheDocument()
  })

  it('shows interactive day selector with day chips', () => {
    render(<SwipeView {...defaultProps} />)
    expect(screen.getByText('Pn')).toBeInTheDocument()
    expect(screen.getByText('Wt')).toBeInTheDocument()
    expect(screen.getByText('Śr')).toBeInTheDocument()
    expect(screen.getByText('Cz')).toBeInTheDocument()
    expect(screen.getByText('Pt')).toBeInTheDocument()
  })

  it('shows "Pomiń ten dzień" button when currentDay is set', () => {
    render(<SwipeView {...defaultProps} />)
    expect(screen.getByText(/Pomiń ten dzień/)).toBeInTheDocument()
  })

  it('does not show "Pomiń ten dzień" when currentDay is null', () => {
    render(<SwipeView {...defaultProps} currentDay={null} />)
    expect(screen.queryByText(/Pomiń ten dzień/)).not.toBeInTheDocument()
  })

  it('calls onSkipDay when "Pomiń ten dzień" is clicked', () => {
    const onSkipDay = vi.fn()
    render(<SwipeView {...defaultProps} onSkipDay={onSkipDay} />)
    fireEvent.click(screen.getByText(/Pomiń ten dzień/))
    expect(onSkipDay).toHaveBeenCalled()
  })
})
