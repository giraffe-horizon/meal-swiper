import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Navigation from '@/components/Navigation'

// Mock next/link to render as a plain anchor
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode
    href: string
    [key: string]: unknown
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

describe('Navigation', () => {
  it('"Plan" link points to /plan', () => {
    render(<Navigation activeView="swipe" />)

    const planLinks = screen.getAllByText('Plan')
    const link = planLinks[0].closest('a')
    expect(link).toHaveAttribute('href', '/plan')
  })

  it('"Swipe" link points to /swipe', () => {
    render(<Navigation activeView="plan" />)

    const swipeLinks = screen.getAllByText('Swipe')
    const link = swipeLinks[0].closest('a')
    expect(link).toHaveAttribute('href', '/swipe')
  })

  it('"Lista" link points to /shopping', () => {
    render(<Navigation activeView="plan" />)

    const listaLinks = screen.getAllByText('Lista')
    const link = listaLinks[0].closest('a')
    expect(link).toHaveAttribute('href', '/shopping')
  })

  it('active view has semibold font', () => {
    render(<Navigation activeView="plan" />)

    const planLabels = screen.getAllByText('Plan')
    const hasSemibold = planLabels.some((el) => el.classList.contains('font-semibold'))
    expect(hasSemibold).toBe(true)
  })

  it('inactive view also has semibold font', () => {
    render(<Navigation activeView="plan" />)

    const swipeLabels = screen.getAllByText('Swipe')
    // All navigation items have font-semibold in the new design
    const hasSemibold = swipeLabels.some((el) => el.classList.contains('font-semibold'))
    expect(hasSemibold).toBe(true)
  })
})
