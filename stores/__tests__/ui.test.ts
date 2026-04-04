import { describe, it, expect, beforeEach } from 'vitest'
import { useUIStore } from '../ui'

describe('UI store', () => {
  beforeEach(() => {
    // Reset to initial state
    useUIStore.setState({
      activeFilters: [],
      weekOffset: 0,
      toasts: [],
    })
  })

  it('has correct initial state', () => {
    const state = useUIStore.getState()
    expect(state.activeFilters).toEqual([])
    expect(state.weekOffset).toBe(0)
    expect(state.toasts).toEqual([])
  })

  describe('toggleFilter', () => {
    it('adds a filter when not present', () => {
      useUIStore.getState().toggleFilter('polska')
      expect(useUIStore.getState().activeFilters).toEqual(['polska'])
    })

    it('removes a filter when already present', () => {
      useUIStore.getState().toggleFilter('polska')
      useUIStore.getState().toggleFilter('polska')
      expect(useUIStore.getState().activeFilters).toEqual([])
    })

    it('handles multiple filters', () => {
      useUIStore.getState().toggleFilter('polska')
      useUIStore.getState().toggleFilter('włoska')
      expect(useUIStore.getState().activeFilters).toEqual(['polska', 'włoska'])
    })
  })

  describe('setWeekOffset', () => {
    it('updates weekOffset', () => {
      useUIStore.getState().setWeekOffset(2)
      expect(useUIStore.getState().weekOffset).toBe(2)
    })

    it('supports negative offsets', () => {
      useUIStore.getState().setWeekOffset(-1)
      expect(useUIStore.getState().weekOffset).toBe(-1)
    })
  })

  describe('toasts', () => {
    it('addToast adds a toast with generated id', () => {
      useUIStore.getState().addToast({ message: 'Saved!', type: 'success' })
      const toasts = useUIStore.getState().toasts
      expect(toasts).toHaveLength(1)
      expect(toasts[0].message).toBe('Saved!')
      expect(toasts[0].type).toBe('success')
      expect(toasts[0].id).toBeDefined()
    })

    it('removeToast removes specific toast', () => {
      useUIStore.getState().addToast({ message: 'A', type: 'info' })
      const id = useUIStore.getState().toasts[0].id
      useUIStore.getState().removeToast(id)
      expect(useUIStore.getState().toasts).toEqual([])
    })

    it('removeToast leaves other toasts intact', () => {
      useUIStore.getState().addToast({ message: 'A', type: 'info' })
      // Small delay to ensure different Date.now() id
      useUIStore.setState((state) => ({
        toasts: [
          ...state.toasts,
          { id: 'custom-id', message: 'B', type: 'error' as const },
        ],
      }))
      useUIStore.getState().removeToast('custom-id')
      const toasts = useUIStore.getState().toasts
      expect(toasts).toHaveLength(1)
      expect(toasts[0].message).toBe('A')
    })
  })
})
