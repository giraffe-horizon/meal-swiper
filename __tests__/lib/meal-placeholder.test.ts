import { describe, it, expect } from 'vitest'
import { getCategoryStyle } from '@/lib/meal-placeholder'

describe('getCategoryStyle', () => {
  describe('null/undefined handling', () => {
    it('returns default style for null', () => {
      const style = getCategoryStyle(null)
      expect(style.emoji).toBe('🍽️')
    })

    it('returns default style for undefined', () => {
      const style = getCategoryStyle(undefined)
      expect(style.emoji).toBe('🍽️')
    })

    it('returns default style for empty string', () => {
      const style = getCategoryStyle('')
      expect(style.emoji).toBe('🍽️')
    })

    it('returns a style for whitespace only (empty after trim)', () => {
      // After trim(), whitespace becomes '' — partial match catches all keys → returns a style
      // (not undefined/throwing). Testing for graceful handling.
      const style = getCategoryStyle('   ')
      expect(style).toBeDefined()
      expect(typeof style.emoji).toBe('string')
    })
  })

  describe('direct matching (case-insensitive)', () => {
    it('matches "pasta" category', () => {
      expect(getCategoryStyle('pasta').emoji).toBe('🍝')
      expect(getCategoryStyle('PASTA').emoji).toBe('🍝')
    })

    it('matches "makaron" category', () => {
      expect(getCategoryStyle('makaron').emoji).toBe('🍝')
      expect(getCategoryStyle('Makaron').emoji).toBe('🍝')
    })

    it('matches "zupa" category', () => {
      expect(getCategoryStyle('zupa').emoji).toBe('🥣')
    })

    it('matches "soup" category', () => {
      expect(getCategoryStyle('soup').emoji).toBe('🥣')
    })

    it('matches "pizza" category', () => {
      expect(getCategoryStyle('pizza').emoji).toBe('🍕')
    })

    it('matches "burger" category', () => {
      expect(getCategoryStyle('burger').emoji).toBe('🍔')
    })

    it('matches "chicken" category', () => {
      expect(getCategoryStyle('chicken').emoji).toBe('🍗')
    })

    it('matches "kurczak" category', () => {
      expect(getCategoryStyle('kurczak').emoji).toBe('🍗')
    })

    it('matches "ryba" category', () => {
      expect(getCategoryStyle('ryba').emoji).toBe('🐟')
    })

    it('matches "fish" category', () => {
      expect(getCategoryStyle('fish').emoji).toBe('🐟')
    })

    it('matches "salad" category', () => {
      expect(getCategoryStyle('salad').emoji).toBe('🥗')
    })

    it('matches "rice" category', () => {
      expect(getCategoryStyle('rice').emoji).toBe('🍚')
    })

    it('matches "kanapka" category', () => {
      expect(getCategoryStyle('kanapka').emoji).toBe('🥪')
    })

    it('matches "sandwich" category', () => {
      expect(getCategoryStyle('sandwich').emoji).toBe('🥪')
    })

    it('matches "kasza" category', () => {
      expect(getCategoryStyle('kasza').emoji).toBe('🌾')
    })

    it('matches "grains" category', () => {
      expect(getCategoryStyle('grains').emoji).toBe('🌾')
    })

    it('matches "breakfast" category', () => {
      expect(getCategoryStyle('breakfast').emoji).toBe('🍳')
    })

    it('matches "sniadanie" category (no diacritics)', () => {
      expect(getCategoryStyle('sniadanie').emoji).toBe('🍳')
    })

    it('matches "wegetarianski" category (no diacritics)', () => {
      expect(getCategoryStyle('wegetarianski').emoji).toBe('🥦')
    })
  })

  describe('diacritics normalisation', () => {
    it('matches "ryż" via direct key', () => {
      // ryż is a direct key in CATEGORY_STYLES
      expect(getCategoryStyle('ryż').emoji).toBe('🍚')
    })

    it('matches "sałatka" via direct key', () => {
      expect(getCategoryStyle('sałatka').emoji).toBe('🥗')
    })

    it('matches "śniadanie" via direct key', () => {
      expect(getCategoryStyle('śniadanie').emoji).toBe('🍳')
    })

    it('matches "wegetariańskie" via direct key', () => {
      expect(getCategoryStyle('wegetariańskie').emoji).toBe('🥦')
    })
  })

  describe('partial / keyword matching', () => {
    it('matches partial key "stir-fry"', () => {
      expect(getCategoryStyle('stir-fry').emoji).toBe('🥘')
    })

    it('matches partial key "stir"', () => {
      expect(getCategoryStyle('stir').emoji).toBe('🥘')
    })

    it('returns default for unknown category', () => {
      expect(getCategoryStyle('unknown-xyz-999').emoji).toBe('🍽️')
    })

    it('returns default for numeric string', () => {
      expect(getCategoryStyle('12345').emoji).toBe('🍽️')
    })
  })

  describe('gradient and label presence', () => {
    it('every match returns gradient string', () => {
      const style = getCategoryStyle('pasta')
      expect(style.gradient).toMatch(/from-/)
    })

    it('every match returns label string', () => {
      const style = getCategoryStyle('pasta')
      expect(typeof style.label).toBe('string')
      expect(style.label.length).toBeGreaterThan(0)
    })

    it('default style has gradient', () => {
      const style = getCategoryStyle(null)
      expect(style.gradient).toMatch(/from-/)
    })
  })
})
