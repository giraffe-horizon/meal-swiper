import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RecipeSteps from '@/components/cooking/RecipeSteps'
import type { StepSegment } from '@/lib/recipe'

const textStep: StepSegment[] = [{ type: 'text', content: 'Ugotuj makaron.' }]
const amountStep: StepSegment[] = [
  { type: 'text', content: 'Dodaj ' },
  { type: 'amount', ingredient: 'mąka', amount: '200g', originalAmount: '200g' },
  { type: 'text', content: ' do miski.' },
]

describe('RecipeSteps', () => {
  it('renders steps with text content', () => {
    render(<RecipeSteps steps={[textStep]} />)
    expect(screen.getByText('Ugotuj makaron.')).toBeInTheDocument()
  })

  it('renders step number', () => {
    render(<RecipeSteps steps={[textStep, textStep]} />)
    expect(screen.getByText('01')).toBeInTheDocument()
    expect(screen.getByText('02')).toBeInTheDocument()
  })

  it('renders amount badges', () => {
    render(<RecipeSteps steps={[amountStep]} />)
    expect(screen.getByText('200g')).toBeInTheDocument()
  })

  it('calls onToggleStep when step clicked', () => {
    const onToggleStep = vi.fn()
    render(<RecipeSteps steps={[textStep]} onToggleStep={onToggleStep} />)
    const stepEl = screen.getByText('Ugotuj makaron.').closest('div[class*="flex"]')
    fireEvent.click(stepEl!)
    expect(onToggleStep).toHaveBeenCalledWith(0)
  })

  it('shows step number even when done', () => {
    render(<RecipeSteps steps={[textStep]} checkedSteps={{ 0: true }} />)
    expect(screen.getByText('01')).toBeInTheDocument()
  })

  it('applies line-through class when done', () => {
    render(<RecipeSteps steps={[textStep]} checkedSteps={{ 0: true }} />)
    const text = screen.getByText('Ugotuj makaron.')
    // line-through is on the <p> parent
    const pEl = text.closest('p')
    expect(pEl?.classList.contains('line-through')).toBe(true)
  })

  it('applies different styling when step done', () => {
    const { container } = render(<RecipeSteps steps={[textStep]} checkedSteps={{ 0: true }} />)
    const stepWrapper = container.querySelector('[class*="bg-surface-container-low"]')
    expect(stepWrapper).toBeTruthy()
  })

  it('renders multiple steps', () => {
    const steps = [textStep, amountStep]
    render(<RecipeSteps steps={steps} />)
    expect(screen.getByText('Ugotuj makaron.')).toBeInTheDocument()
    expect(screen.getByText('200g')).toBeInTheDocument()
  })

  it('does not throw when onToggleStep is not provided', () => {
    render(<RecipeSteps steps={[textStep]} />)
    const stepEl = screen.getByText('Ugotuj makaron.').closest('div[class*="flex"]')
    expect(() => fireEvent.click(stepEl!)).not.toThrow()
  })
})
