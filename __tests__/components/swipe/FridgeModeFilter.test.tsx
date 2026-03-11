import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FridgeModeFilter from '@/components/swipe/FridgeModeFilter'
import type { IngredientWithCategory } from '@/lib/fridge'

const sampleIngredients: IngredientWithCategory[] = [
  { name: 'kurczak', category: 'mięso' },
  { name: 'papryka', category: 'warzywa' },
  { name: 'cebula', category: 'warzywa' },
  { name: 'ryż', category: 'suche' },
]

const defaultProps = {
  enabled: false,
  allIngredients: sampleIngredients,
  selectedIngredients: [],
  matchingMealsCount: 0,
  onToggle: vi.fn(),
  onToggleIngredient: vi.fn(),
  onClear: vi.fn(),
}

describe('FridgeModeFilter', () => {
  it('renders toggle button', () => {
    render(<FridgeModeFilter {...defaultProps} />)
    expect(screen.getByText(/Co mam w lodówce/)).toBeInTheDocument()
  })

  it('calls onToggle when button clicked', () => {
    const onToggle = vi.fn()
    render(<FridgeModeFilter {...defaultProps} onToggle={onToggle} />)
    fireEvent.click(screen.getByRole('button', { name: /Co mam w lodówce/ }))
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('does not show ingredient panel when disabled', () => {
    render(<FridgeModeFilter {...defaultProps} enabled={false} />)
    expect(screen.queryByText('Zaznacz składniki, które masz')).not.toBeInTheDocument()
  })

  it('shows ingredient panel when enabled', () => {
    render(<FridgeModeFilter {...defaultProps} enabled={true} />)
    // Panel opens by default when enabled
    expect(screen.getByText(/Edytuj składniki|Zwiń/)).toBeInTheDocument()
  })

  it('shows selected ingredient count badge when enabled and ingredients selected', () => {
    render(
      <FridgeModeFilter
        {...defaultProps}
        enabled={true}
        selectedIngredients={['kurczak', 'papryka']}
      />
    )
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('shows matching meals count when enabled and ingredients selected', () => {
    render(
      <FridgeModeFilter
        {...defaultProps}
        enabled={true}
        selectedIngredients={['kurczak']}
        matchingMealsCount={5}
      />
    )
    expect(screen.getByText('5 dań')).toBeInTheDocument()
  })

  it('opens ingredient panel when "Edytuj składniki" clicked', () => {
    render(<FridgeModeFilter {...defaultProps} enabled={true} />)
    const editBtn = screen.getByText('Edytuj składniki')
    fireEvent.click(editBtn)
    expect(screen.getByText('Zaznacz składniki, które masz')).toBeInTheDocument()
  })

  it('shows ingredients grouped by category in panel', () => {
    render(<FridgeModeFilter {...defaultProps} enabled={true} />)
    fireEvent.click(screen.getByText('Edytuj składniki'))
    expect(screen.getByText('kurczak')).toBeInTheDocument()
    expect(screen.getByText('papryka')).toBeInTheDocument()
  })

  it('calls onToggleIngredient when ingredient chip clicked', () => {
    const onToggleIngredient = vi.fn()
    render(
      <FridgeModeFilter {...defaultProps} enabled={true} onToggleIngredient={onToggleIngredient} />
    )
    fireEvent.click(screen.getByText('Edytuj składniki'))
    fireEvent.click(screen.getByText('kurczak'))
    expect(onToggleIngredient).toHaveBeenCalledWith('kurczak')
  })

  it('marks selected ingredients as active', () => {
    render(<FridgeModeFilter {...defaultProps} enabled={true} selectedIngredients={['kurczak']} />)
    fireEvent.click(screen.getByText('Edytuj składniki'))
    const kurczakBtn = screen.getByText('kurczak')
    expect(kurczakBtn.classList.contains('bg-teal-500')).toBe(true)
  })

  it('calls onClear when clear button clicked', () => {
    const onClear = vi.fn()
    render(
      <FridgeModeFilter
        {...defaultProps}
        enabled={true}
        selectedIngredients={['kurczak']}
        onClear={onClear}
      />
    )
    fireEvent.click(screen.getByText('Edytuj składniki'))
    fireEvent.click(screen.getByText('Wyczyść'))
    expect(onClear).toHaveBeenCalledOnce()
  })

  it('shows search input in panel', () => {
    render(<FridgeModeFilter {...defaultProps} enabled={true} />)
    fireEvent.click(screen.getByText('Edytuj składniki'))
    expect(screen.getByPlaceholderText('Szukaj składnika...')).toBeInTheDocument()
  })

  it('filters ingredients by search', () => {
    render(<FridgeModeFilter {...defaultProps} enabled={true} />)
    fireEvent.click(screen.getByText('Edytuj składniki'))
    const search = screen.getByPlaceholderText('Szukaj składnika...')
    fireEvent.change(search, { target: { value: 'kurczak' } })
    expect(screen.getByText('kurczak')).toBeInTheDocument()
    expect(screen.queryByText('papryka')).not.toBeInTheDocument()
  })
})
