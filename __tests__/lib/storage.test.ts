import { describe, it, expect } from 'vitest'
import {
  getWeeklyPlan,
  saveWeeklyPlan,
  getCheckedItems,
  saveCheckedItems,
  removeCheckedItems,
  createDefaultPlan,
} from '@/lib/storage'

describe('storage', () => {
  describe('getWeeklyPlan', () => {
    it('returns default empty plan when nothing saved', () => {
      const plan = getWeeklyPlan('2024-03-04')
      expect(plan.mon).toBeNull()
      expect(plan.tue).toBeNull()
      expect(plan.wed).toBeNull()
      expect(plan.thu).toBeNull()
      expect(plan.fri).toBeNull()
      expect(plan.mon_free).toBe(false)
      expect(plan.tue_free).toBe(false)
      expect(plan.wed_free).toBe(false)
      expect(plan.thu_free).toBe(false)
      expect(plan.fri_free).toBe(false)
    })
  })

  describe('saveWeeklyPlan + getWeeklyPlan roundtrip', () => {
    it('saves and retrieves plan correctly', () => {
      const plan = createDefaultPlan()
      const mockMeal = {
        id: '1',
        nazwa: 'Test',
        opis: '',
        photo_url: 'https://example.com/img.jpg',
        prep_time: 30,
        kcal_baza: 400,
        kcal_z_miesem: 500,
        bialko_baza: 15,
        bialko_z_miesem: 25,
        trudnosc: 'łatwe' as const,
        kuchnia: 'polska',
        skladniki_baza: '[]',
        skladniki_mieso: '[]',
        przepis: '{}',
        tags: [],
      }
      plan.mon = mockMeal
      plan.wed_free = true

      saveWeeklyPlan('2024-03-04', plan)
      const loaded = getWeeklyPlan('2024-03-04')

      expect(loaded.mon).toEqual(mockMeal)
      expect(loaded.tue).toBeNull()
      expect(loaded.wed_free).toBe(true)
    })
  })

  describe('getCheckedItems', () => {
    it('returns empty object when nothing saved', () => {
      const items = getCheckedItems('2024-03-04')
      expect(items).toEqual({})
    })

    it('roundtrips save and get', () => {
      const items = { 'mięso-0': true, 'warzywa-1': false }
      saveCheckedItems('2024-03-04', items)
      const loaded = getCheckedItems('2024-03-04')
      expect(loaded).toEqual(items)
    })
  })

  describe('removeCheckedItems', () => {
    it('removes saved checked items', () => {
      saveCheckedItems('2024-03-04', { 'mięso-0': true })
      removeCheckedItems('2024-03-04')
      expect(getCheckedItems('2024-03-04')).toEqual({})
    })
  })
})
