import { describe, it, expect } from 'vitest'
import { getWeekKey, getWeekDates, formatWeekRange } from '@/lib/utils'

// useWeekDates is a thin useMemo wrapper around these pure functions.
// We test the underlying logic directly (no React rendering needed).

describe('useWeekDates — underlying logic', () => {
  describe('weekKey format', () => {
    it('returns YYYY-MM-DD format for current week', () => {
      const key = getWeekKey(0)
      expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('different offsets produce different keys', () => {
      const key0 = getWeekKey(0)
      const key1 = getWeekKey(1)
      const keyNeg = getWeekKey(-1)
      expect(key0).not.toBe(key1)
      expect(key0).not.toBe(keyNeg)
    })
  })

  describe('Monday-based calculation', () => {
    it('weekDates[0] is always Monday', () => {
      for (const offset of [-2, -1, 0, 1, 2]) {
        const dates = getWeekDates(offset)
        expect(dates[0].getDay()).toBe(1)
      }
    })

    it('weekDates spans Mon-Fri (5 days)', () => {
      const dates = getWeekDates(0)
      expect(dates).toHaveLength(5)
      expect(dates[4].getDay()).toBe(5)
    })
  })

  describe('weekOffset handling', () => {
    it('offset +1 returns dates 7 days after offset 0', () => {
      const dates0 = getWeekDates(0)
      const dates1 = getWeekDates(1)
      const diffDays = Math.round(
        (dates1[0].getTime() - dates0[0].getTime()) / (1000 * 60 * 60 * 24)
      )
      expect(diffDays).toBe(7)
    })

    it('offset -1 returns dates 7 days before offset 0', () => {
      const dates0 = getWeekDates(0)
      const datesNeg = getWeekDates(-1)
      const diffDays = Math.round(
        (dates0[0].getTime() - datesNeg[0].getTime()) / (1000 * 60 * 60 * 24)
      )
      expect(diffDays).toBe(7)
    })
  })

  describe('formatWeekRange', () => {
    it('produces a human-readable range string', () => {
      const dates = getWeekDates(0)
      const range = formatWeekRange(dates)
      expect(range).toBeTruthy()
      expect(range).toContain('-')
    })
  })
})
