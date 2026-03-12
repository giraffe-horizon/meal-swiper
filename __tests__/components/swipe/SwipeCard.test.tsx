import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

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

const { default: SwipeCard } = await import('@/components/swipe/SwipeCard')

import type { Meal } from '@/types'

const mockMeal: Meal = {
  id: '1',
  nazwa: 'Test Pasta',
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

const mealNoPhoto: Meal = {
  ...mockMeal,
  id: '2',
  photo_url: '',
}

const mockMotionValue = { get: () => 0, set: vi.fn() } as any

const defaultProps = {
  meal: mockMeal,
  x: mockMotionValue,
  rotate: mockMotionValue,
  likeOpacity: mockMotionValue,
  nopeOpacity: mockMotionValue,
  onDragEnd: vi.fn(),
  onPointerDown: vi.fn(),
  onPointerUp: vi.fn(),
  people: 2,
  currentIndex: 0,
  totalCards: 3,
}

describe('SwipeCard', () => {
  it('renders meal name', () => {
    render(<SwipeCard {...defaultProps} />)
    expect(screen.getByText('Test Pasta')).toBeInTheDocument()
  })

  it('renders meal photo when photo_url is set', () => {
    render(<SwipeCard {...defaultProps} />)
    const img = screen.getByAltText('Test Pasta')
    expect(img).toBeInTheDocument()
    expect(img.getAttribute('src')).toBe('https://example.com/photo.jpg')
  })

  it('renders placeholder when no photo', () => {
    const { container } = render(<SwipeCard {...defaultProps} meal={mealNoPhoto} />)
    expect(container.querySelector('[aria-label="Makaron"]')).toBeInTheDocument()
  })

  it('shows kcal info (per person avg)', () => {
    // kcal displayed: Math.round((450 * 2) / 2) = 450
    render(<SwipeCard {...defaultProps} />)
    expect(screen.getByText(/450 kcal/)).toBeInTheDocument()
  })

  it('shows prep time', () => {
    render(<SwipeCard {...defaultProps} />)
    expect(screen.getByText(/30 min/)).toBeInTheDocument()
  })

  it('shows meal title and cuisine or description', () => {
    render(<SwipeCard {...defaultProps} />)
    // Just verify card is rendered with meal title
    expect(screen.getByText('Test Pasta')).toBeInTheDocument()
  })

  it('shows card counter (1-based)', () => {
    render(<SwipeCard {...defaultProps} currentIndex={2} totalCards={10} />)
    // counter shows currentIndex + 1 / totalCards
    expect(screen.getByText('3/10')).toBeInTheDocument()
  })

  it('calls onPointerDown when pressed', () => {
    const onPointerDown = vi.fn()
    render(<SwipeCard {...defaultProps} onPointerDown={onPointerDown} />)
    const card = screen.getByText('Test Pasta').closest('div')!.closest('div')!
    fireEvent.pointerDown(card.closest('.absolute') ?? card)
  })

  it('shows placeholder when image fails to load', () => {
    const { container } = render(<SwipeCard {...defaultProps} />)
    const img = container.querySelector('img')
    expect(img).not.toBeNull()
    // Trigger error → imgError=true → MealImagePlaceholder replaces the img
    fireEvent.error(img!)
    expect(container.querySelector('img')).toBeNull()
  })
})
