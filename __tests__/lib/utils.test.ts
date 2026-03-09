import { describe, it, expect } from 'vitest'
import { getWeekKey, getWeekDates, formatWeekRange, getMonday, formatDateShort, DAY_KEYS, DAY_NAMES } from '@/lib/utils'

describe('utils', () => {
  describe('getWeekKey', () => {
    it('returns date in YYYY-MM-DD format', () => {
      const key = getWeekKey(0)
      expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('returns a Monday', () => {
      const key = getWeekKey(0)
      const date = new Date(key + 'T00:00:00')
      // getDay() returns 1 for Monday
      expect(date.getDay()).toBe(1)
    })
  })

  describe('getMonday', () => {
    it('returns a Date for monday of given week offset', () => {
      const monday = getMonday(0)
      expect(monday.getDay()).toBe(1)
    })

    it('offset +1 gives next monday', () => {
      const thisMonday = getMonday(0)
      const nextMonday = getMonday(1)
      const diff = (nextMonday.getTime() - thisMonday.getTime()) / (1000 * 60 * 60 * 24)
      expect(diff).toBe(7)
    })
  })

  describe('getWeekDates', () => {
    it('returns 5 dates (Mon-Fri)', () => {
      const dates = getWeekDates(0)
      expect(dates).toHaveLength(5)
    })

    it('first date is Monday, last is Friday', () => {
      const dates = getWeekDates(0)
      expect(dates[0].getDay()).toBe(1) // Monday
      expect(dates[4].getDay()).toBe(5) // Friday
    })

    it('dates are consecutive', () => {
      const dates = getWeekDates(0)
      for (let i = 1; i < dates.length; i++) {
        const diff = (dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24)
        expect(diff).toBe(1)
      }
    })
  })

  describe('formatWeekRange', () => {
    it('returns a non-empty string', () => {
      const dates = getWeekDates(0)
      const range = formatWeekRange(dates)
      expect(range).toBeTruthy()
      expect(typeof range).toBe('string')
    })

    it('contains day numbers', () => {
      const dates = getWeekDates(0)
      const range = formatWeekRange(dates)
      // Should contain at least one number (day of month)
      expect(range).toMatch(/\d+/)
    })
  })

  describe('formatDateShort', () => {
    it('returns formatted date', () => {
      const date = new Date(2024, 2, 15) // March 15
      expect(formatDateShort(date)).toBe('15 Mar')
    })
  })

  describe('constants', () => {
    it('DAY_KEYS has 5 entries', () => {
      expect(DAY_KEYS).toHaveLength(5)
      expect(DAY_KEYS).toEqual(['mon', 'tue', 'wed', 'thu', 'fri'])
    })

    it('DAY_NAMES has 5 entries', () => {
      expect(DAY_NAMES).toHaveLength(5)
    })
  })
})
