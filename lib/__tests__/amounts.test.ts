import { describe, it, expect } from 'vitest'
import { parseAmount, formatAmount, formatNumber } from '../amounts'

describe('parseAmount', () => {
  it('parses grams: "200g"', () => {
    const result = parseAmount('200g')
    expect(result).toEqual({ value: 200, unit: 'g' })
  })

  it('parses with space: "200 g"', () => {
    const result = parseAmount('200 g')
    expect(result).toEqual({ value: 200, unit: 'g' })
  })

  it('parses spoon units: "2 łyżki"', () => {
    const result = parseAmount('2 łyżki')
    expect(result).toEqual({ value: 2, unit: 'łyżki' })
  })

  it('normalizes unit aliases: "2 łyżka" → łyżki', () => {
    const result = parseAmount('2 łyżka')
    expect(result?.unit).toBe('łyżki')
  })

  it('parses fraction: "1/2 szklanki"', () => {
    const result = parseAmount('1/2 szklanki')
    expect(result).toEqual({ value: 0.5, unit: 'szklanki' })
  })

  it('parses unicode fractions: "½ szklanki"', () => {
    const result = parseAmount('½ szklanki')
    expect(result?.value).toBe(0.5)
    expect(result?.unit).toBe('szklanki')
  })

  it('parses amount with grams hint: "2 ząbki (16g)"', () => {
    const result = parseAmount('2 ząbki (16g)')
    expect(result).toEqual({
      value: 2,
      unit: 'ząbki',
      gramsHint: 16,
      hintUnit: 'g',
    })
  })

  it('parses amount with ml hint: "6 łyżki (60ml)"', () => {
    const result = parseAmount('6 łyżki (60ml)')
    expect(result).toEqual({
      value: 6,
      unit: 'łyżki',
      gramsHint: 60,
      hintUnit: 'ml',
    })
  })

  it('parses amount with "ok." prefix in hint: "2 ząbki (ok. 16g)"', () => {
    const result = parseAmount('2 ząbki (ok. 16g)')
    expect(result).toEqual({
      value: 2,
      unit: 'ząbki',
      gramsHint: 16,
      hintUnit: 'g',
    })
  })

  it('returns null for unparseable string', () => {
    expect(parseAmount('do smaku')).toBeNull()
    expect(parseAmount('')).toBeNull()
  })
})

describe('formatNumber', () => {
  it('formats integers without decimal', () => {
    expect(formatNumber(5)).toBe('5')
  })

  it('formats common fractions', () => {
    expect(formatNumber(0.5)).toBe('1/2')
    expect(formatNumber(0.25)).toBe('1/4')
    expect(formatNumber(0.75)).toBe('3/4')
  })

  it('formats decimals with one place', () => {
    expect(formatNumber(1.5)).toBe('1.5')
  })
})

describe('formatAmount', () => {
  it('formats basic amount', () => {
    expect(formatAmount(200, 'g')).toBe('200 g')
  })

  it('converts >= 1000g to kg', () => {
    expect(formatAmount(1500, 'g')).toBe('1.5 kg')
  })

  it('converts >= 1000ml to l', () => {
    expect(formatAmount(2000, 'ml')).toBe('2 l')
  })

  it('appends grams hint when provided', () => {
    expect(formatAmount(2, 'ząbki', 16, 'g')).toBe('2 ząbki (ok. 16g)')
  })

  it('does not append hint when 0', () => {
    expect(formatAmount(2, 'szt', 0)).toBe('2 szt')
  })
})
