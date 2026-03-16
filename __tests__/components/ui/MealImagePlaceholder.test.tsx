import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import MealImagePlaceholder from '@/components/ui/MealImagePlaceholder'

describe('MealImagePlaceholder', () => {
  it('renders without crashing', () => {
    const { container } = render(<MealImagePlaceholder />)
    expect(container.firstChild).toBeTruthy()
  })

  it('renders grey background', () => {
    const { container } = render(<MealImagePlaceholder />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('bg-slate-200')
  })

  it('applies custom className to wrapper div', () => {
    const { container } = render(<MealImagePlaceholder className="w-full h-full" />)
    expect(container.firstChild).toHaveClass('w-full', 'h-full')
  })

  it('has aria-hidden on wrapper div', () => {
    const { container } = render(<MealImagePlaceholder />)
    expect((container.firstChild as HTMLElement).getAttribute('aria-hidden')).toBe('true')
  })

  it('renders no emoji or text content', () => {
    const { container } = render(<MealImagePlaceholder category="pizza" />)
    expect(container.firstChild?.textContent).toBe('')
  })
})
