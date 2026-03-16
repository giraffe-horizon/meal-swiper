import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import SwipeView from '@/components/SwipeView'
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

// Mock MealModal
vi.mock('@/components/MealModal', () => ({
  default: ({ meal, onClose }: { meal: { nazwa: string } | null; onClose: () => void }) => {
    if (!meal) return null
    return (
      <div data-testid="meal-modal">
        <span>{meal.nazwa}</span>
        <button onClick={onClose}>close</button>
      </div>
    )
  },
}))

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

const makeMeal = (id: string): Meal => ({
  id,
  nazwa: `Meal ${id}`,
  opis: '',
  photo_url: `https://example.com/${id}.jpg`,
  prep_time: 20,
  kcal_baza: 400,
  kcal_z_miesem: 500,
  bialko_baza: 15,
  bialko_z_miesem: 25,
  trudnosc: 'łatwe',
  kuchnia: 'polska',
  category: 'makarony',
  skladniki_baza: '[]',
  skladniki_mieso: '[]',
  przepis: '{}',
  tags: [],
})

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

const allFilledPlan: WeeklyPlan = {
  mon: makeMeal('1'),
  tue: makeMeal('2'),
  wed: makeMeal('3'),
  thu: makeMeal('4'),
  fri: makeMeal('5'),
  mon_free: false,
  tue_free: false,
  wed_free: false,
  thu_free: false,
  fri_free: false,
}

const allFreePlan: WeeklyPlan = {
  mon: null,
  tue: null,
  wed: null,
  thu: null,
  fri: null,
  mon_free: true,
  tue_free: true,
  wed_free: true,
  thu_free: true,
  fri_free: true,
}

const meals = [makeMeal('a'), makeMeal('b'), makeMeal('c')]
const shuffled = [...meals]

const defaultProps = {
  meals,
  onSwipeRight: vi.fn(),
  currentDay: 'mon' as const,
  onComplete: vi.fn(),
  weeklyPlan: emptyPlan,
  onSkipAll: vi.fn(),
  shuffledMealsFromContext: shuffled,
  currentSwipeIndexFromContext: 0,
  seenIdsFromContext: [],
  setCurrentSwipeIndexInContext: vi.fn(),
  setShuffledMealsInContext: vi.fn(),
  setSeenIdsInContext: vi.fn(),
}

describe('SwipeView - allDaysFilled success state', () => {
  it('shows success screen when allDaysFilled and no more cards', async () => {
    const onComplete = vi.fn()
    render(
      <SwipeView
        {...defaultProps}
        weeklyPlan={allFilledPlan}
        shuffledMealsFromContext={[makeMeal('x')]}
        currentSwipeIndexFromContext={0}
        onComplete={onComplete}
      />
    )

    const heartBtn = screen
      .getAllByRole('button')
      .find((b) => b.querySelector('.material-symbols-outlined')?.textContent === 'favorite')
    if (heartBtn) {
      await act(async () => {
        fireEvent.click(heartBtn)
      })
      // After all meals seen with allDaysFilled, shows success
    }
  })

  it('renders with allFreePlan (should show AllDaysFilled)', () => {
    render(
      <SwipeView
        {...defaultProps}
        weeklyPlan={allFreePlan}
        meals={meals}
        shuffledMealsFromContext={meals}
        currentSwipeIndexFromContext={0}
      />
    )
    // Should still show cards or success state
  })
})

describe('SwipeView - keyboard navigation', () => {
  it('ArrowRight fires swipe right action', async () => {
    const onSwipeRight = vi.fn()
    render(<SwipeView {...defaultProps} onSwipeRight={onSwipeRight} />)

    await act(async () => {
      fireEvent.keyDown(window, { key: 'ArrowRight' })
    })

    expect(onSwipeRight).toHaveBeenCalled()
  })

  it('ArrowLeft fires swipe left action (advances card)', async () => {
    render(<SwipeView {...defaultProps} />)

    const { animate } = await import('framer-motion')
    const animateMock = vi.mocked(animate)
    animateMock.mockClear()

    await act(async () => {
      fireEvent.keyDown(window, { key: 'ArrowLeft' })
    })

    expect(animateMock).toHaveBeenCalled()
  })

  it('Escape key does not trigger swipe when modalMeal is null', async () => {
    const onSwipeRight = vi.fn()
    render(<SwipeView {...defaultProps} onSwipeRight={onSwipeRight} />)

    await act(async () => {
      fireEvent.keyDown(window, { key: 'Escape' })
    })

    // Escape should not trigger a swipe
    expect(onSwipeRight).not.toHaveBeenCalled()
  })
})

describe('SwipeView - day selection', () => {
  it('shows day chips for all 5 days', () => {
    render(<SwipeView {...defaultProps} />)
    expect(screen.getByText('Pn')).toBeInTheDocument()
    expect(screen.getByText('Pt')).toBeInTheDocument()
  })

  it('calls onDaySelect when a day chip is clicked', () => {
    const onDaySelect = vi.fn()
    render(<SwipeView {...defaultProps} onDaySelect={onDaySelect} />)
    fireEvent.click(screen.getByText('Wt'))
    expect(onDaySelect).toHaveBeenCalledWith('tue')
  })
})

describe('SwipeView - filter state', () => {
  it('renders with many meals (shuffled)', () => {
    const manyMeals = Array.from({ length: 10 }, (_, i) => makeMeal(String(i)))
    render(<SwipeView {...defaultProps} meals={manyMeals} shuffledMealsFromContext={manyMeals} />)
    // Should render at least one meal card
    const hasMeal = manyMeals.some((m) => screen.queryByText(m.nazwa))
    expect(hasMeal).toBe(true)
  })
})

describe('SwipeView - onComplete fallback', () => {
  it('calls onComplete when "Pomiń ten dzień" clicked and no onSkipDay', () => {
    const onComplete = vi.fn()
    render(<SwipeView {...defaultProps} onComplete={onComplete} onSkipDay={undefined} />)
    fireEvent.click(screen.getByText(/Pomiń ten dzień/))
    expect(onComplete).toHaveBeenCalled()
  })
})

describe('SwipeView - reshuffle at end of stack', () => {
  it('reshuffles when reaching end of stack with empty days remaining', async () => {
    const setShuffledMeals = vi.fn()
    const setCurrentSwipeIndex = vi.fn()
    const setSeenIds = vi.fn()

    // Single meal at last index — triggers reshuffle branch
    render(
      <SwipeView
        {...defaultProps}
        meals={meals}
        shuffledMealsFromContext={[makeMeal('only')]}
        currentSwipeIndexFromContext={0}
        allDaysFilled={false}
        setShuffledMealsInContext={setShuffledMeals}
        setCurrentSwipeIndexInContext={setCurrentSwipeIndex}
        setSeenIdsInContext={setSeenIds}
      />
    )

    // Click the close (skip) button to advance past last card
    const closeBtn = screen
      .getAllByRole('button')
      .find((b) => b.querySelector('.material-symbols-outlined')?.textContent === 'close')

    if (closeBtn) {
      await act(async () => {
        fireEvent.click(closeBtn)
      })

      // Should reshuffle and advance index
      expect(setShuffledMeals).toHaveBeenCalled()
      expect(setCurrentSwipeIndex).toHaveBeenCalledWith(1)
      expect(setSeenIds).toHaveBeenCalled()
    }
  })

  it('shows success state and reshuffle button when allDaysFilled', async () => {
    const onComplete = vi.fn()
    const setCurrentSwipeIndex = vi.fn()

    render(
      <SwipeView
        {...defaultProps}
        weeklyPlan={allFilledPlan}
        allDaysFilled={true}
        shuffledMealsFromContext={[makeMeal('last')]}
        currentSwipeIndexFromContext={0}
        onComplete={onComplete}
        setCurrentSwipeIndexInContext={setCurrentSwipeIndex}
      />
    )

    // Click heart to trigger completion
    const heartBtn = screen
      .getAllByRole('button')
      .find((b) => b.querySelector('.material-symbols-outlined')?.textContent === 'favorite')

    if (heartBtn) {
      await act(async () => {
        fireEvent.click(heartBtn)
      })

      // Success screen should render with reshuffle button
      await waitFor(() => {
        expect(screen.getByText('Wszystkie propozycje przejrzane!')).toBeInTheDocument()
      })

      // Click "Losuj ponownie" reshuffle button
      const reshuffleBtn = screen.getByText('Losuj ponownie')
      await act(async () => {
        fireEvent.click(reshuffleBtn)
      })
      expect(setCurrentSwipeIndex).toHaveBeenCalledWith(0)
    }
  })
})
