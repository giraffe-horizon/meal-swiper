import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Navigation from '@/components/Navigation'

describe('Navigation', () => {
  it('clicking "Plan" calls onNavigate with "plan"', () => {
    const onNavigate = vi.fn()
    render(<Navigation activeView="swipe" onNavigate={onNavigate} />)

    const planButtons = screen.getAllByText('Plan')
    fireEvent.click(planButtons[0])
    expect(onNavigate).toHaveBeenCalledWith('plan')
  })

  it('clicking "Propozycje" calls onNavigate with "swipe"', () => {
    const onNavigate = vi.fn()
    render(<Navigation activeView="plan" onNavigate={onNavigate} />)

    const swipeButtons = screen.getAllByText('Propozycje')
    fireEvent.click(swipeButtons[0])
    expect(onNavigate).toHaveBeenCalledWith('swipe')
  })

  it('clicking "Lista" calls onNavigate with "shopping"', () => {
    const onNavigate = vi.fn()
    render(<Navigation activeView="plan" onNavigate={onNavigate} />)

    const listaButtons = screen.getAllByText('Lista')
    fireEvent.click(listaButtons[0])
    expect(onNavigate).toHaveBeenCalledWith('shopping')
  })

  it('active view has bold font', () => {
    render(<Navigation activeView="plan" onNavigate={vi.fn()} />)

    const planLabels = screen.getAllByText('Plan')
    // At least one of the "Plan" labels should be bold (active)
    const hasBold = planLabels.some(el => el.classList.contains('font-bold'))
    expect(hasBold).toBe(true)
  })

  it('inactive view does not have font-bold', () => {
    render(<Navigation activeView="plan" onNavigate={vi.fn()} />)

    const propLabels = screen.getAllByText('Propozycje')
    // All "Propozycje" labels should be font-medium (not active)
    propLabels.forEach(el => {
      expect(el.classList.contains('font-bold')).toBe(false)
    })
  })
})
