import { describe, it, expect } from 'vitest'
import {
  getMonday,
  getWeekKey,
  getWeekDates,
  formatWeekRange,
  formatWeekRangeShort,
  formatDateShort,
  DAY_KEYS,
  DAY_NAMES,
  DAY_NAMES_MAP,
} from '../utils'

describe('getMonday', () => {
  it('returns a Monday (day 1) for weekOffset 0', () => {
    const monday = getMonday(0)
    expect(monday.getDay()).toBe(1)
  })

  it('returns previous week Monday for weekOffset -1', () => {
    const thisMonday = getMonday(0)
    const lastMonday = getMonday(-1)
    // Compare dates (not ms) to avoid DST issues
    const diffDays = Math.round(
      (thisMonday.getTime() - lastMonday.getTime()) / (1000 * 60 * 60 * 24)
    )
    expect(diffDays).toBe(7)
  })

  it('returns next week Monday for weekOffset +1', () => {
    const thisMonday = getMonday(0)
    const nextMonday = getMonday(1)
    const diffDays = Math.round(
      (nextMonday.getTime() - thisMonday.getTime()) / (1000 * 60 * 60 * 24)
    )
    expect(diffDays).toBe(7)
  })
})

describe('getWeekKey', () => {
  it('returns a date string in YYYY-MM-DD format', () => {
    const key = getWeekKey(0)
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('key corresponds to a Monday', () => {
    const key = getWeekKey(0)
    const date = new Date(key + 'T12:00:00')
    expect(date.getDay()).toBe(1)
  })
})

describe('getWeekDates', () => {
  it('returns 5 dates (Mon-Fri)', () => {
    const dates = getWeekDates(0)
    expect(dates).toHaveLength(5)
  })

  it('starts on Monday and ends on Friday', () => {
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
  it('formats same-month range', () => {
    // Create Mon-Fri in same month
    const dates = [
      new Date(2026, 3, 6), // Mon Apr 6
      new Date(2026, 3, 7),
      new Date(2026, 3, 8),
      new Date(2026, 3, 9),
      new Date(2026, 3, 10), // Fri Apr 10
    ]
    expect(formatWeekRange(dates)).toBe('6 - 10 Kwi')
  })

  it('formats cross-month range', () => {
    const dates = [
      new Date(2026, 2, 30), // Mon Mar 30
      new Date(2026, 2, 31),
      new Date(2026, 3, 1),
      new Date(2026, 3, 2),
      new Date(2026, 3, 3), // Fri Apr 3
    ]
    expect(formatWeekRange(dates)).toBe('30 Mar - 3 Kwi')
  })
})

describe('formatWeekRangeShort', () => {
  it('formats same-month range with dot notation', () => {
    const dates = [
      new Date(2026, 3, 6),
      new Date(2026, 3, 7),
      new Date(2026, 3, 8),
      new Date(2026, 3, 9),
      new Date(2026, 3, 10),
    ]
    expect(formatWeekRangeShort(dates)).toBe('6-10.04')
  })
})

describe('formatDateShort', () => {
  it('formats date as "day Month"', () => {
    expect(formatDateShort(new Date(2026, 0, 15))).toBe('15 Sty')
    expect(formatDateShort(new Date(2026, 11, 25))).toBe('25 Gru')
  })
})

describe('constants', () => {
  it('DAY_KEYS has 5 weekday keys', () => {
    expect(DAY_KEYS).toEqual(['mon', 'tue', 'wed', 'thu', 'fri'])
  })

  it('DAY_NAMES has 5 Polish day names', () => {
    expect(DAY_NAMES).toHaveLength(5)
    expect(DAY_NAMES[0]).toBe('Poniedziałek')
  })

  it('DAY_NAMES_MAP maps keys to Polish names', () => {
    expect(DAY_NAMES_MAP.mon).toBe('Poniedziałek')
    expect(DAY_NAMES_MAP.fri).toBe('Piątek')
  })
})
