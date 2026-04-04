import { describe, it, expect, beforeEach } from 'vitest'
import { useSwipeStore } from '../swipe'

describe('swipe store', () => {
  beforeEach(() => {
    useSwipeStore.getState().reset()
  })

  it('has correct initial state', () => {
    const state = useSwipeStore.getState()
    expect(state.currentIndex).toBe(0)
    expect(state.seenIds).toEqual([])
    expect(state.currentDay).toBe('mon')
  })

  it('setCurrentIndex updates index', () => {
    useSwipeStore.getState().setCurrentIndex(5)
    expect(useSwipeStore.getState().currentIndex).toBe(5)
  })

  it('addSeenId adds unique IDs', () => {
    useSwipeStore.getState().addSeenId('meal-1')
    useSwipeStore.getState().addSeenId('meal-2')
    expect(useSwipeStore.getState().seenIds).toEqual(['meal-1', 'meal-2'])
  })

  it('addSeenId deduplicates', () => {
    useSwipeStore.getState().addSeenId('meal-1')
    useSwipeStore.getState().addSeenId('meal-1')
    expect(useSwipeStore.getState().seenIds).toEqual(['meal-1'])
  })

  it('clearSeenIds empties the array', () => {
    useSwipeStore.getState().addSeenId('meal-1')
    useSwipeStore.getState().clearSeenIds()
    expect(useSwipeStore.getState().seenIds).toEqual([])
  })

  it('setCurrentDay changes the day', () => {
    useSwipeStore.getState().setCurrentDay('wed')
    expect(useSwipeStore.getState().currentDay).toBe('wed')
  })

  it('reset restores initial state', () => {
    useSwipeStore.getState().setCurrentIndex(10)
    useSwipeStore.getState().addSeenId('meal-1')
    useSwipeStore.getState().setCurrentDay('fri')

    useSwipeStore.getState().reset()

    const state = useSwipeStore.getState()
    expect(state.currentIndex).toBe(0)
    expect(state.seenIds).toEqual([])
    expect(state.currentDay).toBe('mon')
  })
})
