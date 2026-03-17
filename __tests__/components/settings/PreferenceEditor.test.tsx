import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import PreferenceEditor from '@/components/settings/PreferenceEditor'
import type { PersonSettings } from '@/types'
import * as ingredientsQuery from '@/hooks/queries/useIngredientsQuery'
import * as cuisinesQuery from '@/hooks/queries/useCuisinesQuery'

// Mock the query hooks
vi.mock('@/hooks/queries/useIngredientsQuery')
vi.mock('@/hooks/queries/useCuisinesQuery')

describe('PreferenceEditor', () => {
  const mockPerson: PersonSettings = {
    name: 'Test Person',
    diet: [],
    cuisinePreferences: [],
    excludedIngredients: [],
    mealsPerDay: 3
  }

  const mockOnChange = vi.fn()

  const mockIngredients = [
    { id: '1', name: 'Tomato', category: 'vegetables', is_seasoning: false },
    { id: '2', name: 'Onion', category: 'vegetables', is_seasoning: false },
    { id: '3', name: 'Salt', category: 'spices', is_seasoning: true },
    { id: '4', name: 'Chicken Breast', category: 'meat', is_seasoning: false }
  ]

  const mockCuisines = ['Italian', 'Mexican', 'Asian', 'American']

  function createWrapper() {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock the hooks to return successful data
    vi.mocked(ingredientsQuery.useIngredientsQuery).mockReturnValue({
      data: mockIngredients,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true
    } as any)

    vi.mocked(cuisinesQuery.useCuisinesQuery).mockReturnValue({
      data: mockCuisines,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true
    } as any)
  })

  it('renders collapsed by default', () => {
    render(
      <PreferenceEditor
        person={mockPerson}
        personIndex={0}
        onChange={mockOnChange}
      />,
      { wrapper: createWrapper() }
    )

    expect(screen.getByText('Preferencje — Test Person')).toBeInTheDocument()
    expect(screen.queryByText('Dieta')).not.toBeInTheDocument()
  })

  it('expands when header is clicked', async () => {
    render(
      <PreferenceEditor
        person={mockPerson}
        personIndex={0}
        onChange={mockOnChange}
      />,
      { wrapper: createWrapper() }
    )

    const header = screen.getByRole('button', { name: /Preferencje — Test Person/ })
    fireEvent.click(header)

    await waitFor(() => {
      expect(screen.getByText('Dieta')).toBeInTheDocument()
    })
  })

  it('renders diet options when expanded', async () => {
    render(
      <PreferenceEditor
        person={mockPerson}
        personIndex={0}
        onChange={mockOnChange}
      />,
      { wrapper: createWrapper() }
    )

    // Expand
    const header = screen.getByRole('button', { name: /Preferencje — Test Person/ })
    fireEvent.click(header)

    await waitFor(() => {
      expect(screen.getByLabelText('Brak')).toBeInTheDocument()
      expect(screen.getByLabelText('Wegetariańska')).toBeInTheDocument()
      expect(screen.getByLabelText('Wegańska')).toBeInTheDocument()
      expect(screen.getByLabelText('Bez glutenu')).toBeInTheDocument()
      expect(screen.getByLabelText('Bez laktozy')).toBeInTheDocument()
    })
  })

  it('handles diet selection', async () => {
    render(
      <PreferenceEditor
        person={mockPerson}
        personIndex={0}
        onChange={mockOnChange}
      />,
      { wrapper: createWrapper() }
    )

    // Expand
    const header = screen.getByRole('button', { name: /Preferencje — Test Person/ })
    fireEvent.click(header)

    await waitFor(() => {
      const vegetarianOption = screen.getByLabelText('Wegetariańska')
      fireEvent.click(vegetarianOption)

      expect(mockOnChange).toHaveBeenCalledWith(0, {
        ...mockPerson,
        diet: ['vegetarian']
      })
    })
  })

  it('renders cuisine preferences', async () => {
    render(
      <PreferenceEditor
        person={mockPerson}
        personIndex={0}
        onChange={mockOnChange}
      />,
      { wrapper: createWrapper() }
    )

    // Expand
    const header = screen.getByRole('button', { name: /Preferencje — Test Person/ })
    fireEvent.click(header)

    await waitFor(() => {
      expect(screen.getByText('Lubię kuchnie')).toBeInTheDocument()
      mockCuisines.forEach(cuisine => {
        expect(screen.getByText(cuisine)).toBeInTheDocument()
      })
    })
  })

  it('handles cuisine toggle', async () => {
    render(
      <PreferenceEditor
        person={mockPerson}
        personIndex={0}
        onChange={mockOnChange}
      />,
      { wrapper: createWrapper() }
    )

    // Expand
    const header = screen.getByRole('button', { name: /Preferencje — Test Person/ })
    fireEvent.click(header)

    await waitFor(() => {
      const italianButton = screen.getByText('Italian')
      fireEvent.click(italianButton)

      expect(mockOnChange).toHaveBeenCalledWith(0, {
        ...mockPerson,
        cuisinePreferences: ['Italian']
      })
    })
  })

  it('renders ingredient search', async () => {
    render(
      <PreferenceEditor
        person={mockPerson}
        personIndex={0}
        onChange={mockOnChange}
      />,
      { wrapper: createWrapper() }
    )

    // Expand
    const header = screen.getByRole('button', { name: /Preferencje — Test Person/ })
    fireEvent.click(header)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Szukaj składników...')).toBeInTheDocument()
    })
  })

  it('filters ingredients by search term', async () => {
    render(
      <PreferenceEditor
        person={mockPerson}
        personIndex={0}
        onChange={mockOnChange}
      />,
      { wrapper: createWrapper() }
    )

    // Expand
    const header = screen.getByRole('button', { name: /Preferencje — Test Person/ })
    fireEvent.click(header)

    await waitFor(async () => {
      const searchInput = screen.getByPlaceholderText('Szukaj składników...')
      fireEvent.change(searchInput, { target: { value: 'tom' } })

      await waitFor(() => {
        expect(screen.getByText('Tomato')).toBeInTheDocument()
        expect(screen.queryByText('Onion')).not.toBeInTheDocument()
      })
    })
  })

  it('filters out seasoning ingredients', async () => {
    render(
      <PreferenceEditor
        person={mockPerson}
        personIndex={0}
        onChange={mockOnChange}
      />,
      { wrapper: createWrapper() }
    )

    // Expand
    const header = screen.getByRole('button', { name: /Preferencje — Test Person/ })
    fireEvent.click(header)

    await waitFor(async () => {
      const searchInput = screen.getByPlaceholderText('Szukaj składników...')
      fireEvent.change(searchInput, { target: { value: 'salt' } })

      await waitFor(() => {
        expect(screen.queryByText('Salt')).not.toBeInTheDocument()
      })
    })
  })

  it('handles meals per day change', async () => {
    render(
      <PreferenceEditor
        person={mockPerson}
        personIndex={0}
        onChange={mockOnChange}
      />,
      { wrapper: createWrapper() }
    )

    // Expand
    const header = screen.getByRole('button', { name: /Preferencje — Test Person/ })
    fireEvent.click(header)

    await waitFor(() => {
      const mealsInput = screen.getByDisplayValue('3')
      fireEvent.change(mealsInput, { target: { value: '4' } })

      expect(mockOnChange).toHaveBeenCalledWith(0, {
        ...mockPerson,
        mealsPerDay: 4
      })
    })
  })

  it('clamps meals per day to valid range', async () => {
    render(
      <PreferenceEditor
        person={mockPerson}
        personIndex={0}
        onChange={mockOnChange}
      />,
      { wrapper: createWrapper() }
    )

    // Expand
    const header = screen.getByRole('button', { name: /Preferencje — Test Person/ })
    fireEvent.click(header)

    await waitFor(() => {
      const mealsInput = screen.getByDisplayValue('3')

      // Test upper limit
      fireEvent.change(mealsInput, { target: { value: '15' } })
      expect(mockOnChange).toHaveBeenCalledWith(0, {
        ...mockPerson,
        mealsPerDay: 10
      })

      // Test lower limit
      fireEvent.change(mealsInput, { target: { value: '0' } })
      expect(mockOnChange).toHaveBeenCalledWith(0, {
        ...mockPerson,
        mealsPerDay: 1
      })
    })
  })

  it('shows loading states', async () => {
    vi.mocked(ingredientsQuery.useIngredientsQuery).mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
      isError: false,
      isSuccess: false
    } as any)

    vi.mocked(cuisinesQuery.useCuisinesQuery).mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
      isError: false,
      isSuccess: false
    } as any)

    render(
      <PreferenceEditor
        person={mockPerson}
        personIndex={0}
        onChange={mockOnChange}
      />,
      { wrapper: createWrapper() }
    )

    // Expand
    const header = screen.getByRole('button', { name: /Preferencje — Test Person/ })
    fireEvent.click(header)

    await waitFor(() => {
      expect(screen.getAllByText('Ładowanie...')).toHaveLength(1)
    })
  })

  it('handles ingredient exclusion', async () => {
    render(
      <PreferenceEditor
        person={mockPerson}
        personIndex={0}
        onChange={mockOnChange}
      />,
      { wrapper: createWrapper() }
    )

    // Expand
    const header = screen.getByRole('button', { name: /Preferencje — Test Person/ })
    fireEvent.click(header)

    await waitFor(async () => {
      const searchInput = screen.getByPlaceholderText('Szukaj składników...')
      fireEvent.change(searchInput, { target: { value: 'tomato' } })

      await waitFor(() => {
        const tomatoButton = screen.getByText('Tomato')
        fireEvent.click(tomatoButton)

        expect(mockOnChange).toHaveBeenCalledWith(0, {
          ...mockPerson,
          excludedIngredients: ['1']
        })
      })
    })
  })

  it('shows selected excluded ingredients', async () => {
    const personWithExclusions = {
      ...mockPerson,
      excludedIngredients: ['1'] // Tomato excluded
    }

    render(
      <PreferenceEditor
        person={personWithExclusions}
        personIndex={0}
        onChange={mockOnChange}
      />,
      { wrapper: createWrapper() }
    )

    // Expand
    const header = screen.getByRole('button', { name: /Preferencje — Test Person/ })
    fireEvent.click(header)

    await waitFor(() => {
      expect(screen.getByText('Tomato')).toBeInTheDocument()
      expect(screen.getByTitle('Usuń')).toBeInTheDocument()
    })
  })
})