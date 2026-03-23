import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useWeekDates } from '@/hooks/useWeekDates'

describe('useWeekDates', () => {
  it('returns 5 dates', () => {
    const { result } = renderHook(() => useWeekDates(0))
    expect(result.current.weekDates).toHaveLength(5)
  })

  it('first date is Monday', () => {
    const { result } = renderHook(() => useWeekDates(0))
    expect(result.current.weekDates[0].getDay()).toBe(1)
  })

  it('last date is Friday', () => {
    const { result } = renderHook(() => useWeekDates(0))
    expect(result.current.weekDates[4].getDay()).toBe(5)
  })

  it('returns weekRange string', () => {
    const { result } = renderHook(() => useWeekDates(0))
    expect(typeof result.current.formatWeekRange()).toBe('string')
    expect(result.current.formatWeekRange()).toMatch(/\d+/)
  })

  it('different weekOffset gives different dates (7 days apart)', () => {
    const { result: r0 } = renderHook(() => useWeekDates(0))
    const { result: r1 } = renderHook(() => useWeekDates(1))
    const diff = r1.current.weekDates[0].getTime() - r0.current.weekDates[0].getTime()
    // Use Math.round to handle DST transitions (days can be 23 or 25 hours)
    const diffDays = Math.round(diff / (1000 * 60 * 60 * 24))
    expect(diffDays).toBe(7)
  })
})
