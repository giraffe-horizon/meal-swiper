import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import MealImagePlaceholder from '@/components/ui/MealImagePlaceholder'

describe('MealImagePlaceholder', () => {
  it('renders without crashing', () => {
    const { container } = render(<MealImagePlaceholder />)
    expect(container.firstChild).toBeTruthy()
  })

  it('renders gradient background', () => {
    const { container } = render(<MealImagePlaceholder />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('bg-gradient-to-br')
    expect(wrapper.className).toContain('from-emerald-900')
    expect(wrapper.className).toContain('to-emerald-950')
  })

  it('applies custom className to wrapper div', () => {
    const { container } = render(<MealImagePlaceholder className="w-full h-full" />)
    expect(container.firstChild).toHaveClass('w-full', 'h-full')
  })

  it('has aria-hidden on wrapper div', () => {
    const { container } = render(<MealImagePlaceholder />)
    expect((container.firstChild as HTMLElement).getAttribute('aria-hidden')).toBe('true')
  })

  it('renders restaurant icon', () => {
    const { container } = render(<MealImagePlaceholder />)
    const icon = container.querySelector('.material-symbols-outlined')
    expect(icon).toBeTruthy()
    expect(icon?.textContent).toBe('restaurant')
  })

  it('renders category text when provided', () => {
    const { getByText } = render(<MealImagePlaceholder category="pizza" />)
    expect(getByText('pizza')).toBeTruthy()
  })

  it('does not render category text when not provided', () => {
    const { container } = render(<MealImagePlaceholder />)
    const wrapper = container.firstChild as HTMLElement
    // Should only contain the restaurant icon text
    expect(wrapper.textContent).toBe('restaurant')
  })

  it('uses custom icon size when provided', () => {
    const { container } = render(<MealImagePlaceholder iconSize="text-7xl" />)
    const icon = container.querySelector('.material-symbols-outlined')
    expect(icon).toHaveClass('text-7xl')
  })
})
