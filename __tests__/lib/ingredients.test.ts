import { describe, it, expect } from 'vitest'
import { normalizeIngredient, buildIngredientIndex } from '@/lib/ingredients'
import type { CatalogIngredient } from '@/types'

describe('lib/ingredients', () => {
  describe('normalizeIngredient', () => {
    it('converts to lowercase', () => {
      expect(normalizeIngredient('TOMATO')).toBe('tomato')
    })

    it('trims whitespace', () => {
      expect(normalizeIngredient('  tomato  ')).toBe('tomato')
    })

    it('removes parentheses and their contents', () => {
      expect(normalizeIngredient('tomato (fresh)')).toBe('tomato')
      expect(normalizeIngredient('tomato (canned, diced)')).toBe('tomato')
    })

    it('collapses multiple spaces to single space', () => {
      expect(normalizeIngredient('cherry    tomato')).toBe('cherry tomato')
    })

    it('handles complex combinations', () => {
      expect(normalizeIngredient('  CHERRY   Tomato (fresh, organic)  ')).toBe('cherry tomato')
    })

    it('handles empty parentheses', () => {
      expect(normalizeIngredient('tomato ()')).toBe('tomato')
    })

    it('handles multiple parentheses', () => {
      expect(normalizeIngredient('tomato (fresh) (organic)')).toBe('tomato')
    })
  })

  describe('buildIngredientIndex', () => {
    const mockIngredients: CatalogIngredient[] = [
      {
        id: '1',
        name: 'Fresh Tomato (organic)',
        category: 'warzywa',
        is_seasoning: false,
        flags: [],
      },
      {
        id: '2',
        name: 'RED ONION',
        category: 'warzywa',
        is_seasoning: false,
        flags: [],
      },
      {
        id: '3',
        name: '  Garlic   Powder  ',
        category: 'przyprawy',
        is_seasoning: true,
        flags: [],
      },
    ]

    it('creates a map with normalized names as keys', () => {
      const index = buildIngredientIndex(mockIngredients)

      expect(index.has('fresh tomato')).toBe(true)
      expect(index.has('red onion')).toBe(true)
      expect(index.has('garlic powder')).toBe(true)
    })

    it('maps normalized names to original ingredient objects', () => {
      const index = buildIngredientIndex(mockIngredients)

      const tomato = index.get('fresh tomato')
      expect(tomato).toBeDefined()
      expect(tomato?.id).toBe('1')
      expect(tomato?.name).toBe('Fresh Tomato (organic)')
    })

    it('handles empty ingredients array', () => {
      const index = buildIngredientIndex([])
      expect(index.size).toBe(0)
    })

    it('returns Map instance', () => {
      const index = buildIngredientIndex(mockIngredients)
      expect(index).toBeInstanceOf(Map)
    })

    it('preserves all original ingredient properties', () => {
      const index = buildIngredientIndex(mockIngredients)

      const garlic = index.get('garlic powder')
      expect(garlic).toEqual({
        id: '3',
        name: '  Garlic   Powder  ',
        category: 'przyprawy',
        is_seasoning: true,
      })
    })
  })
})
