import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
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

// Mock MealModal with a testable close button
vi.mock('@/components/MealModal', () => ({
  default: ({ meal, onClose }: { meal: { nazwa: string } | null; onClose: () => void }) => {
    if (!meal) return null
    return (
      <div data-testid="meal-modal">
        <span data-testid="modal-meal-name">{meal.nazwa}</span>
        <button onClick={onClose} data-testid="modal-close">
          Zamknij
        </button>
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
  opis: `Opis ${id}`,
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

const mealA = makeMeal('a')
const mealB = makeMeal('b')
const mealC = makeMeal('c')
const meals = [mealA, mealB, mealC, makeMeal('d')]

const defaultProps = {
  meals,
  onSwipeRight: vi.fn(),
  currentDay: 'mon' as const,
  onComplete: vi.fn(),
  weeklyPlan: emptyPlan,
  onSkipAll: vi.fn(),
  shuffledMealsFromContext: [mealA, mealB, mealC],
  currentSwipeIndexFromContext: 0,
  seenIdsFromContext: [],
  setCurrentSwipeIndexInContext: vi.fn(),
  setShuffledMealsInContext: vi.fn(),
  setSeenIdsInContext: vi.fn(),
}

function getHeartButton() {
  return screen
    .getAllByRole('button')
    .find((b) => b.querySelector('.material-symbols-outlined')?.textContent === 'favorite')
}

describe('SwipeView - success screen (allDaysFilled)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows success screen when allDaysFilled and at last card', async () => {
    const oneMeal = makeMeal('x')
    render(
      <SwipeView
        {...defaultProps}
        allDaysFilled={true}
        shuffledMealsFromContext={[oneMeal]}
        currentSwipeIndexFromContext={0}
      />
    )

    const heartBtn = getHeartButton()
    expect(heartBtn).toBeTruthy()

    await act(async () => {
      fireEvent.click(heartBtn!)
    })

    expect(screen.getByText('Wszystkie propozycje przejrzane!')).toBeInTheDocument()
    expect(screen.getByText('Nie ma więcej kart do przejrzenia')).toBeInTheDocument()
  })

  it('renders confetti on success screen', async () => {
    const oneMeal = makeMeal('x')
    render(
      <SwipeView
        {...defaultProps}
        allDaysFilled={true}
        shuffledMealsFromContext={[oneMeal]}
        currentSwipeIndexFromContext={0}
      />
    )

    await act(async () => {
      fireEvent.click(getHeartButton()!)
    })

    // Confetti is rendered as bouncing divs
    const bounce = document.querySelectorAll('.animate-bounce')
    expect(bounce.length).toBeGreaterThan(0)
  })

  it('"Losuj ponownie" button resets the success screen', async () => {
    const setIndex = vi.fn()
    const oneMeal = makeMeal('x')
    render(
      <SwipeView
        {...defaultProps}
        allDaysFilled={true}
        shuffledMealsFromContext={[oneMeal]}
        currentSwipeIndexFromContext={0}
        setCurrentSwipeIndexInContext={setIndex}
      />
    )

    await act(async () => {
      fireEvent.click(getHeartButton()!)
    })

    expect(screen.getByText('Wszystkie propozycje przejrzane!')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Losuj ponownie'))

    expect(screen.queryByText('Wszystkie propozycje przejrzane!')).not.toBeInTheDocument()
    expect(setIndex).toHaveBeenCalledWith(0)
  })
})

describe('SwipeView - reshuffle toast on last card', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows reshuffle toast when reaching last card without allDaysFilled', async () => {
    const oneMeal = makeMeal('x')
    const setShuffled = vi.fn()
    render(
      <SwipeView
        {...defaultProps}
        meals={meals}
        allDaysFilled={false}
        shuffledMealsFromContext={[oneMeal]}
        currentSwipeIndexFromContext={0}
        setShuffledMealsInContext={setShuffled}
      />
    )

    await act(async () => {
      fireEvent.click(getHeartButton()!)
    })

    expect(screen.getByText('Nowe propozycje!')).toBeInTheDocument()
    expect(setShuffled).toHaveBeenCalled()
  })
})

describe('SwipeView - handleCardTap and modal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('tapping card opens meal modal', () => {
    render(<SwipeView {...defaultProps} />)

    // Fire pointer events directly on the meal name text; events bubble to card div
    const mealNameEl = screen.getByText(mealA.nazwa)

    // pointerDown sets dragStartX; pointerUp within 10px triggers tap
    act(() => {
      fireEvent.pointerDown(mealNameEl, { clientX: 50 })
    })
    act(() => {
      fireEvent.pointerUp(mealNameEl, { clientX: 54 }) // diff = 4 < 10
    })

    expect(screen.getByTestId('meal-modal')).toBeInTheDocument()
    expect(screen.getByTestId('modal-meal-name').textContent).toBe(mealA.nazwa)
  })

  it('closing meal modal via onClose hides it', () => {
    render(<SwipeView {...defaultProps} />)

    const mealNameEl = screen.getByText(mealA.nazwa)

    act(() => {
      fireEvent.pointerDown(mealNameEl, { clientX: 50 })
    })
    act(() => {
      fireEvent.pointerUp(mealNameEl, { clientX: 54 })
    })

    expect(screen.getByTestId('meal-modal')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('modal-close'))

    expect(screen.queryByTestId('meal-modal')).not.toBeInTheDocument()
  })
})

describe('SwipeView - no-meals screen DaySelector callback', () => {
  it('calls onDaySelect when day chip clicked in no-meals view', () => {
    const onDaySelect = vi.fn()
    render(
      <SwipeView
        {...defaultProps}
        meals={[]}
        shuffledMealsFromContext={[]}
        onDaySelect={onDaySelect}
      />
    )

    expect(screen.getByText('Brak więcej posiłków')).toBeInTheDocument()

    // Click a day chip in the DaySelector rendered on the no-meals screen
    fireEvent.click(screen.getByText('WT'))
    expect(onDaySelect).toHaveBeenCalledWith('tue')
  })
})
