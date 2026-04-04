import { create } from 'zustand'
import type { DayKey } from '@/types'

interface SwipeState {
  currentIndex: number
  seenIds: Set<string>
  currentDay: DayKey
  setCurrentIndex: (index: number) => void
  addSeenId: (id: string) => void
  clearSeenIds: () => void
  setCurrentDay: (day: DayKey) => void
  reset: () => void
}

export const useSwipeStore = create<SwipeState>((set) => ({
  currentIndex: 0,
  seenIds: new Set(),
  currentDay: 'mon',

  setCurrentIndex: (index: number) => set({ currentIndex: index }),

  addSeenId: (id: string) =>
    set((state) => ({
      seenIds: new Set([...state.seenIds, id]),
    })),

  clearSeenIds: () => set({ seenIds: new Set() }),

  setCurrentDay: (day: DayKey) => set({ currentDay: day }),

  reset: () =>
    set({
      currentIndex: 0,
      seenIds: new Set(),
      currentDay: 'mon',
    }),
}))
