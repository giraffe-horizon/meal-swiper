import { create } from 'zustand'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface UIState {
  activeFilters: string[]
  weekOffset: number
  toasts: Toast[]
  setActiveFilters: (filters: string[]) => void
  toggleFilter: (filter: string) => void
  setWeekOffset: (offset: number) => void
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  activeFilters: [],
  weekOffset: 0,
  toasts: [],

  setActiveFilters: (filters: string[]) => set({ activeFilters: filters }),

  toggleFilter: (filter: string) =>
    set((state) => ({
      activeFilters: state.activeFilters.includes(filter)
        ? state.activeFilters.filter((f) => f !== filter)
        : [...state.activeFilters, filter],
    })),

  setWeekOffset: (offset: number) => set({ weekOffset: offset }),

  addToast: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id: Date.now().toString() }],
    })),

  removeToast: (id: string) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}))
