import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import MealImagePlaceholder from '@/components/ui/MealImagePlaceholder'

describe('MealImagePlaceholder', () => {
  it('renders without crashing', () => {
    const { container } = render(<MealImagePlaceholder />)
    expect(container.firstChild).toBeTruthy()
  })

  it('renders pizza emoji for pizza category', () => {
    const { container } = render(<MealImagePlaceholder category="pizza" />)
    // aria-hidden="true" hides from a11y tree — use querySelector
    const span = container.querySelector('[aria-label]')
    expect(span?.textContent).toBe('🍕')
  })

  it('renders default emoji for unknown category', () => {
    const { container } = render(<MealImagePlaceholder category="xyz-unknown" />)
    const span = container.querySelector('[aria-label]')
    expect(span?.textContent).toBe('🍽️')
  })

  it('renders default emoji when category is null', () => {
    const { container } = render(<MealImagePlaceholder category={null} />)
    const span = container.querySelector('[aria-label]')
    expect(span?.textContent).toBe('🍽️')
  })

  it('applies custom className to wrapper div', () => {
    const { container } = render(<MealImagePlaceholder className="w-full h-full" />)
    expect(container.firstChild).toHaveClass('w-full', 'h-full')
  })

  it('applies custom iconSize to emoji span', () => {
    const { container } = render(<MealImagePlaceholder iconSize="text-7xl" />)
    const span = container.querySelector('[aria-label]')
    expect(span).toHaveClass('text-7xl')
  })

  it('uses default iconSize text-5xl when not specified', () => {
    const { container } = render(<MealImagePlaceholder />)
    const span = container.querySelector('[aria-label]')
    expect(span).toHaveClass('text-5xl')
  })

  it('renders gradient background for pasta category', () => {
    const { container } = render(<MealImagePlaceholder category="pasta" />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('from-amber-400')
  })

  it('has aria-hidden on wrapper div', () => {
    const { container } = render(<MealImagePlaceholder />)
    expect((container.firstChild as HTMLElement).getAttribute('aria-hidden')).toBe('true')
  })

  it('renders soup emoji for "zupa" category', () => {
    const { container } = render(<MealImagePlaceholder category="zupa" />)
    const span = container.querySelector('[aria-label]')
    expect(span?.textContent).toBe('🥣')
  })

  it('renders chicken emoji for "kurczak" category', () => {
    const { container } = render(<MealImagePlaceholder category="kurczak" />)
    const span = container.querySelector('[aria-label]')
    expect(span?.textContent).toBe('🍗')
  })
})
