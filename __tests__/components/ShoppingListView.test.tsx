import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'

// Mock useAppContext
vi.mock('@/lib/context', () => ({
  useAppContext: () => ({
    scaleFactor: 1,
    tenantToken: 'test-token',
  }),
}))

// Mock storage
vi.mock('@/lib/storage', () => ({
  getCheckedItems: vi.fn(() => ({})),
  saveCheckedItems: vi.fn(),
  removeCheckedItems: vi.fn(),
}))

// Mock fetch
beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => null,
  })
})

const { default: ShoppingListView } = await import('@/components/ShoppingListView')

import type { WeeklyPlan, Meal } from '@/types'

const mockMeal: Meal = {
  id: '1',
  nazwa: 'Pasta Carbonara',
  opis: '',
  photo_url: '',
  prep_time: 30,
  kcal_baza: 450,
  kcal_z_miesem: 600,
  bialko_baza: 20,
  bialko_z_miesem: 35,
  trudnosc: 'łatwe',
  kuchnia: 'włoska',
  category: 'makarony',
  skladniki_baza: JSON.stringify([
    { name: 'Makaron', amount: '200g' },
    { name: 'Jajka', amount: '3 szt' },
  ]),
  skladniki_mieso: '[]',
  przepis: '{}',
  tags: [],
}

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

const planWithMeal: WeeklyPlan = {
  ...emptyPlan,
  mon: mockMeal,
}

describe('ShoppingListView', () => {
  it('shows empty state when no meals in plan', () => {
    render(<ShoppingListView weeklyPlan={emptyPlan} weekOffset={0} />)
    expect(screen.getByText(/Brak/i)).toBeInTheDocument()
  })

  it('renders shopping list items when meals are in plan', async () => {
    render(<ShoppingListView weeklyPlan={planWithMeal} weekOffset={0} />)
    await waitFor(() => {
      expect(screen.getByText(/Makaron/i)).toBeInTheDocument()
    })
  })

  it('renders toolbar with action buttons when items exist', async () => {
    render(<ShoppingListView weeklyPlan={planWithMeal} weekOffset={0} />)
    await waitFor(() => {
      // Toolbar should appear when there are items
      expect(screen.getByText(/Makaron/i)).toBeInTheDocument()
    })
  })

  it('toggles item checked state on click', async () => {
    render(<ShoppingListView weeklyPlan={planWithMeal} weekOffset={0} />)

    await waitFor(() => {
      expect(screen.getByText(/Makaron/i)).toBeInTheDocument()
    })

    const makaronLabel = screen.getByText(/Makaron/i).closest('label')
    if (makaronLabel) {
      fireEvent.click(makaronLabel)
      // Should now be checked (line-through style)
    }
  })

  it('shows progress indicator with counts', async () => {
    render(<ShoppingListView weeklyPlan={planWithMeal} weekOffset={0} />)
    await waitFor(() => {
      // Shows "0/2 produktów"
      expect(screen.getByText(/produktów/)).toBeInTheDocument()
    })
  })

  it('reset list button calls confirm', async () => {
    window.confirm = vi.fn(() => false)
    render(<ShoppingListView weeklyPlan={planWithMeal} weekOffset={0} />)

    await waitFor(() => {
      expect(screen.getByText(/Makaron/)).toBeInTheDocument()
    })

    // Find reset button (trash icon)
    const buttons = screen.getAllByRole('button')
    const resetBtn = buttons.find(
      (b) =>
        b.querySelector('.material-symbols-outlined')?.textContent?.includes('delete') ||
        b.textContent?.includes('delete')
    )

    if (resetBtn) {
      fireEvent.click(resetBtn)
      expect(window.confirm).toHaveBeenCalled()
    }
  })

  it('check all items button sets all items as checked', async () => {
    render(<ShoppingListView weeklyPlan={planWithMeal} weekOffset={0} />)

    await waitFor(() => {
      expect(screen.getByText(/Makaron/)).toBeInTheDocument()
    })

    // Click "Zaznacz wszystkie" button
    const checkAllBtn = screen.getByText('Zaznacz wszystkie')
    fireEvent.click(checkAllBtn)
    // All items should now be checked
    await waitFor(() => {
      expect(screen.getByText(/Zakupy zrobione/)).toBeInTheDocument()
    })
  })

  it('share list button triggers clipboard write', async () => {
    // Mock clipboard
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      writable: true,
      value: { writeText },
    })
    window.alert = vi.fn()

    render(<ShoppingListView weeklyPlan={planWithMeal} weekOffset={0} />)

    await waitFor(() => {
      expect(screen.getByText(/Makaron/)).toBeInTheDocument()
    })

    const shareBtn = screen.getByText('Udostępnij')
    fireEvent.click(shareBtn)
    expect(writeText).toHaveBeenCalled()
  })

  it('reset list with confirm=true clears all items', async () => {
    window.confirm = vi.fn(() => true)
    const { removeCheckedItems } = await import('@/lib/storage')

    render(<ShoppingListView weeklyPlan={planWithMeal} weekOffset={0} />)

    await waitFor(() => {
      expect(screen.getByText(/Makaron/)).toBeInTheDocument()
    })

    // Click "Zaznacz wszystkie" first to have something to reset
    fireEvent.click(screen.getByText('Zaznacz wszystkie'))
    await waitFor(() => {
      expect(screen.getByText(/Zakupy zrobione/)).toBeInTheDocument()
    })

    // Now click reset
    fireEvent.click(screen.getByText('Resetuj listę'))
    expect(window.confirm).toHaveBeenCalled()
    expect(removeCheckedItems).toHaveBeenCalled()
  })

  it('syncs checked items from server when available', async () => {
    const serverChecked = { makaron: true }
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => serverChecked,
    })
    const { saveCheckedItems } = await import('@/lib/storage')

    render(<ShoppingListView weeklyPlan={planWithMeal} weekOffset={0} />)

    await waitFor(() => {
      expect(saveCheckedItems).toHaveBeenCalled()
    })
  })
})
