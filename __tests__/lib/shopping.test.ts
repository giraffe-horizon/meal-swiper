import { describe, it, expect } from 'vitest'
import {
  normalizeIngredientName,
  parseAmount,
  mergeAmounts,
  isPantryStaple,
  generateShoppingList,
  type MergedIngredient,
} from '@/lib/shopping'
import type { WeeklyPlan, Ingredient } from '@/types'

describe('shopping', () => {
  describe('normalizeIngredientName', () => {
    it('normalizes diacritics', () => {
      expect(normalizeIngredientName('Ząbek czosnku')).toBe('zabek czosnku')
      expect(normalizeIngredientName('Świeża papryka')).toBe('swieza papryka')
    })

    it('applies synonyms', () => {
      expect(normalizeIngredientName('czosnek świeży')).toBe('czosnek')
      expect(normalizeIngredientName('sos sojowy jasny')).toBe('sos sojowy')
      expect(normalizeIngredientName('cebula biała')).toBe('cebula')
      expect(normalizeIngredientName('pomidor cherry')).toBe('pomidor')
    })

    it('lemmatizes plural forms to singular', () => {
      expect(normalizeIngredientName('jajka')).toBe('jajko')
      expect(normalizeIngredientName('jajek')).toBe('jajko')
      expect(normalizeIngredientName('jajko')).toBe('jajko')

      expect(normalizeIngredientName('pomidory')).toBe('pomidor')
      expect(normalizeIngredientName('pomidorów')).toBe('pomidor')
      expect(normalizeIngredientName('pomidor')).toBe('pomidor')

      expect(normalizeIngredientName('cebule')).toBe('cebula')
      expect(normalizeIngredientName('cebuli')).toBe('cebula')
      expect(normalizeIngredientName('cebula')).toBe('cebula')

      expect(normalizeIngredientName('papryki')).toBe('papryka')
      expect(normalizeIngredientName('papryka')).toBe('papryka')

      expect(normalizeIngredientName('pieczarki')).toBe('pieczarka')
      expect(normalizeIngredientName('pieczarek')).toBe('pieczarka')

      expect(normalizeIngredientName('ziemniaki')).toBe('ziemniak')
      expect(normalizeIngredientName('ziemniaków')).toBe('ziemniak')

      expect(normalizeIngredientName('marchewka')).toBe('marchew')
      expect(normalizeIngredientName('marchewki')).toBe('marchew')
      expect(normalizeIngredientName('marchewek')).toBe('marchew')
    })

    it('combines synonyms with lemmatization', () => {
      // ząbki maps to czosnek via synonym
      expect(normalizeIngredientName('ząbki')).toBe('czosnek')
      expect(normalizeIngredientName('ząbków')).toBe('czosnek')
    })
  })

  describe('parseAmount', () => {
    it('parses simple amounts', () => {
      expect(parseAmount('200g')).toEqual({ value: 200, unit: 'g' })
      expect(parseAmount('200 g')).toEqual({ value: 200, unit: 'g' })
      expect(parseAmount('2 łyżki')).toEqual({ value: 2, unit: 'łyżki' })
      expect(parseAmount('1.5 kg')).toEqual({ value: 1.5, unit: 'kg' })
    })

    it('parses amounts with grams hint in parentheses', () => {
      const result1 = parseAmount('2 ząbki (16g)')
      expect(result1).toEqual({ value: 2, unit: 'ząbki', gramsHint: 16, hintUnit: 'g' })

      const result2 = parseAmount('4 ząbki (16g)')
      expect(result2).toEqual({ value: 4, unit: 'ząbki', gramsHint: 16, hintUnit: 'g' })

      const result3 = parseAmount('3 ząbki (12g)')
      expect(result3).toEqual({ value: 3, unit: 'ząbki', gramsHint: 12, hintUnit: 'g' })
    })

    it('parses fractions', () => {
      expect(parseAmount('½ szklanki')).toEqual({ value: 0.5, unit: 'szklanki' })
      expect(parseAmount('¼ łyżeczki')).toEqual({ value: 0.25, unit: 'łyżeczki' })
    })

    it('normalizes unit aliases', () => {
      expect(parseAmount('200 gramów')).toEqual({ value: 200, unit: 'g' })
      expect(parseAmount('2 sztuki')).toEqual({ value: 2, unit: 'szt' })
      expect(parseAmount('1 łyżka')).toEqual({ value: 1, unit: 'łyżki' })
    })

    it('returns null for invalid input', () => {
      expect(parseAmount('invalid')).toBeNull()
      expect(parseAmount('abc g')).toBeNull()
      expect(parseAmount('')).toBeNull()
    })

    it('parses amounts with ml hint in parentheses', () => {
      const result1 = parseAmount('6 łyżki (60ml)')
      expect(result1).toEqual({ value: 6, unit: 'łyżki', gramsHint: 60, hintUnit: 'ml' })

      const result2 = parseAmount('1.5 łyżki (15ml)')
      expect(result2).toEqual({ value: 1.5, unit: 'łyżki', gramsHint: 15, hintUnit: 'ml' })

      const result3 = parseAmount('2 łyżki (ok. 20ml)')
      expect(result3).toEqual({ value: 2, unit: 'łyżki', gramsHint: 20, hintUnit: 'ml' })
    })
  })

  describe('mergeAmounts', () => {
    it('merges same units', () => {
      expect(mergeAmounts('200g', '300g')).toBe('500 g')
      expect(mergeAmounts('2 łyżki', '3 łyżki')).toBe('5 łyżki')
    })

    it('merges amounts with grams hints', () => {
      const result = mergeAmounts('2 ząbki (16g)', '4 ząbki (16g)')
      expect(result).toBe('6 ząbki (ok. 32g)')
    })

    it('merges multiple amounts with grams hints (full scenario)', () => {
      // Start with first amount
      let merged = '2 ząbki (16g)'
      // Add second
      merged = mergeAmounts(merged, '4 ząbki (16g)')
      expect(merged).toBe('6 ząbki (ok. 32g)')
      // Add third
      merged = mergeAmounts(merged, '3 ząbki (12g)')
      expect(merged).toBe('9 ząbki (ok. 44g)')
    })

    it('converts kg to g and merges', () => {
      expect(mergeAmounts('200g', '1 kg')).toBe('1.2 kg')
      expect(mergeAmounts('500g', '500g')).toBe('1 kg')
    })

    it('converts l to ml and merges', () => {
      expect(mergeAmounts('500ml', '1 l')).toBe('1.5 l')
    })

    it('concatenates incompatible units', () => {
      expect(mergeAmounts('200g', '2 łyżki')).toBe('200g + 2 łyżki')
    })

    it('handles invalid amounts', () => {
      expect(mergeAmounts('invalid', '200g')).toBe('invalid + 200g')
      expect(mergeAmounts('200g', 'invalid')).toBe('200g + invalid')
    })

    it('merges amounts with ml hints (sos sojowy scenario)', () => {
      const result = mergeAmounts('1.5 łyżki', '6 łyżki (60ml)')
      expect(result).toBe('7.5 łyżki (ok. 60ml)')
    })

    it('merges same unit with ml hints (both have hints)', () => {
      const result = mergeAmounts('2 łyżki (20ml)', '4 łyżki (40ml)')
      expect(result).toBe('6 łyżki (ok. 60ml)')
    })

    it('merges different units via gramsHint (puszki + g)', () => {
      const result = mergeAmounts('1.5 puszki (600g)', '600 g')
      expect(result).toBe('1.2 kg')
    })

    it('merges different units via gramsHint (both have hints)', () => {
      const result = mergeAmounts('2 puszki (800g)', '1 opakowania (400g)')
      expect(result).toBe('1.2 kg')
    })

    it('merges g + puszki with gramsHint (reversed order)', () => {
      const result = mergeAmounts('600 g', '1.5 puszki (600g)')
      expect(result).toBe('1.2 kg')
    })

    it('merges ml + łyżki with mlHint', () => {
      const result = mergeAmounts('30 ml', '2 łyżki (20ml)')
      expect(result).toBe('50 ml')
    })

    it('does not merge different hint units (g vs ml)', () => {
      const result = mergeAmounts('2 łyżki (20g)', '2 łyżki (20ml)')
      // Same unit but different hint units - sums values, keeps first hint
      expect(result).toBe('4 łyżki (ok. 20g)')
    })
  })

  describe('isPantryStaple', () => {
    it('identifies pantry staples', () => {
      expect(isPantryStaple('sól')).toBe(true)
      expect(isPantryStaple('Sól morska')).toBe(true)
      expect(isPantryStaple('Pieprz')).toBe(true)
      expect(isPantryStaple('Oliwa z oliwek')).toBe(true)
      expect(isPantryStaple('Mąka')).toBe(true)
    })

    it('returns false for non-staples', () => {
      expect(isPantryStaple('kurczak')).toBe(false)
      expect(isPantryStaple('pomidor')).toBe(false)
      expect(isPantryStaple('ser')).toBe(false)
    })
  })

  describe('generateShoppingList', () => {
    it('merges ingredients from multiple meals', () => {
      const weeklyPlan: WeeklyPlan = {
        weekKey: '2024-03-01',
        mon: {
          id: 1,
          nazwa: 'Meal 1',
          skladniki_baza: JSON.stringify([
            { name: 'Pomidor', amount: '200g' },
            { name: 'Cebula', amount: '1 szt' },
          ] as Ingredient[]),
          skladniki_mieso: null,
          przepis: 'test',
          osoby_bazowe: 2,
          kcal_na_osobe: 500,
          bialko_na_osobe: 30,
        },
        tue: {
          id: 2,
          nazwa: 'Meal 2',
          skladniki_baza: JSON.stringify([
            { name: 'Pomidory', amount: '300g' },
            { name: 'Czosnek', amount: '2 ząbki (8g)' },
          ] as Ingredient[]),
          skladniki_mieso: null,
          przepis: 'test',
          osoby_bazowe: 2,
          kcal_na_osobe: 500,
          bialko_na_osobe: 30,
        },
        wed: null,
        thu: null,
        fri: null,
      }

      const list = generateShoppingList(weeklyPlan, 2)

      // Find merged items
      const cebula = list.find((item) => item.normalizedName === 'cebula')
      const pomidor = list.find((item) => item.normalizedName === 'pomidor')
      const czosnek = list.find((item) => item.normalizedName === 'czosnek')

      expect(cebula).toBeDefined()
      expect(cebula?.amount).toBe('1 szt')

      expect(pomidor).toBeDefined()
      expect(pomidor?.amount).toBe('500 g') // 200g + 300g

      expect(czosnek).toBeDefined()
      expect(czosnek?.amount).toBe('2 ząbki (ok. 8g)')
    })

    it('filters out pantry staples', () => {
      const weeklyPlan: WeeklyPlan = {
        weekKey: '2024-03-01',
        mon: {
          id: 1,
          nazwa: 'Meal 1',
          skladniki_baza: JSON.stringify([
            { name: 'Pomidor', amount: '200g' },
            { name: 'Sól', amount: '1 szczypta' },
            { name: 'Pieprz', amount: '1 szczypta' },
          ] as Ingredient[]),
          skladniki_mieso: null,
          przepis: 'test',
          osoby_bazowe: 2,
          kcal_na_osobe: 500,
          bialko_na_osobe: 30,
        },
        tue: null,
        wed: null,
        thu: null,
        fri: null,
      }

      const list = generateShoppingList(weeklyPlan, 2)

      expect(list.find((item) => item.normalizedName === 'sol')).toBeUndefined()
      expect(list.find((item) => item.normalizedName === 'pieprz')).toBeUndefined()
      expect(list.find((item) => item.normalizedName === 'pomidor')).toBeDefined()
    })

    it('merges different plural forms (jajko/jajka/jajek)', () => {
      const weeklyPlan: WeeklyPlan = {
        weekKey: '2024-03-01',
        mon: {
          id: 1,
          nazwa: 'Meal 1',
          skladniki_baza: JSON.stringify([{ name: 'jajko', amount: '2 szt' }] as Ingredient[]),
          skladniki_mieso: null,
          przepis: 'test',
          osoby_bazowe: 2,
          kcal_na_osobe: 500,
          bialko_na_osobe: 30,
        },
        tue: {
          id: 2,
          nazwa: 'Meal 2',
          skladniki_baza: JSON.stringify([{ name: 'jajka', amount: '3 szt' }] as Ingredient[]),
          skladniki_mieso: null,
          przepis: 'test',
          osoby_bazowe: 2,
          kcal_na_osobe: 500,
          bialko_na_osobe: 30,
        },
        wed: {
          id: 3,
          nazwa: 'Meal 3',
          skladniki_baza: JSON.stringify([{ name: 'jajek', amount: '1 szt' }] as Ingredient[]),
          skladniki_mieso: null,
          przepis: 'test',
          osoby_bazowe: 2,
          kcal_na_osobe: 500,
          bialko_na_osobe: 30,
        },
        thu: null,
        fri: null,
      }

      const list = generateShoppingList(weeklyPlan, 2)
      const jajko = list.find((item) => item.normalizedName === 'jajko')

      expect(jajko).toBeDefined()
      expect(jajko?.amount).toBe('6 szt') // 2 + 3 + 1
    })

    it('scales ingredients by people count', () => {
      const weeklyPlan: WeeklyPlan = {
        weekKey: '2024-03-01',
        mon: {
          id: 1,
          nazwa: 'Meal 1',
          skladniki_baza: JSON.stringify([
            { name: 'Pomidor', amount: '200g' }, // Base is for 2 people
          ] as Ingredient[]),
          skladniki_mieso: null,
          przepis: 'test',
          osoby_bazowe: 2,
          kcal_na_osobe: 500,
          bialko_na_osobe: 30,
        },
        tue: null,
        wed: null,
        thu: null,
        fri: null,
      }

      // Test for 4 people (2x scaling)
      const list = generateShoppingList(weeklyPlan, 4)
      const pomidor = list.find((item) => item.normalizedName === 'pomidor')

      expect(pomidor).toBeDefined()
      expect(pomidor?.amount).toBe('400 g') // 200g * 2
    })

    it('sorts results alphabetically', () => {
      const weeklyPlan: WeeklyPlan = {
        weekKey: '2024-03-01',
        mon: {
          id: 1,
          nazwa: 'Meal 1',
          skladniki_baza: JSON.stringify([
            { name: 'Ziemniak', amount: '200g' },
            { name: 'Banan', amount: '100g' },
            { name: 'Marchewka', amount: '150g' },
          ] as Ingredient[]),
          skladniki_mieso: null,
          przepis: 'test',
          osoby_bazowe: 2,
          kcal_na_osobe: 500,
          bialko_na_osobe: 30,
        },
        tue: null,
        wed: null,
        thu: null,
        fri: null,
      }

      const list = generateShoppingList(weeklyPlan, 2)
      const names = list.map((item) => item.normalizedName)

      // Check if sorted
      const sorted = [...names].sort((a, b) => a.localeCompare(b, 'pl'))
      expect(names).toEqual(sorted)
    })
  })

  describe('edge cases - czosnek scenario', () => {
    it('merges czosnek with different amounts and grams hints', () => {
      const weeklyPlan: WeeklyPlan = {
        weekKey: '2024-03-01',
        mon: {
          id: 1,
          nazwa: 'Meal 1',
          skladniki_baza: JSON.stringify([
            { name: 'czosnek', amount: '2 ząbki (8g)' },
          ] as Ingredient[]),
          skladniki_mieso: null,
          przepis: 'test',
          osoby_bazowe: 2,
          kcal_na_osobe: 500,
          bialko_na_osobe: 30,
        },
        tue: {
          id: 2,
          nazwa: 'Meal 2',
          skladniki_baza: JSON.stringify([
            { name: 'czosnek', amount: '4 ząbki (16g)' },
          ] as Ingredient[]),
          skladniki_mieso: null,
          przepis: 'test',
          osoby_bazowe: 2,
          kcal_na_osobe: 500,
          bialko_na_osobe: 30,
        },
        wed: {
          id: 3,
          nazwa: 'Meal 3',
          skladniki_baza: JSON.stringify([
            { name: 'czosnek', amount: '3 ząbki (12g)' },
          ] as Ingredient[]),
          skladniki_mieso: null,
          przepis: 'test',
          osoby_bazowe: 2,
          kcal_na_osobe: 500,
          bialko_na_osobe: 30,
        },
        thu: null,
        fri: null,
      }

      const list = generateShoppingList(weeklyPlan, 2)
      const czosnek = list.find((item) => item.normalizedName === 'czosnek')

      expect(czosnek).toBeDefined()
      expect(czosnek?.amount).toBe('9 ząbki (ok. 36g)') // 2+4+3 ząbki, 8+16+12g
    })
  })

  describe('cross-unit merging via gramsHint', () => {
    it('merges pomidory pelati with different units (puszki + g)', () => {
      const weeklyPlan: WeeklyPlan = {
        weekKey: '2024-03-01',
        mon: {
          id: 1,
          nazwa: 'Meal 1',
          skladniki_baza: JSON.stringify([
            { name: 'Pomidory pelati', amount: '1.5 puszki (600g)' },
          ] as Ingredient[]),
          skladniki_mieso: null,
          przepis: 'test',
          osoby_bazowe: 2,
          kcal_na_osobe: 500,
          bialko_na_osobe: 30,
        },
        tue: {
          id: 2,
          nazwa: 'Meal 2',
          skladniki_baza: JSON.stringify([
            { name: 'Pomidory pelati', amount: '600 g' },
          ] as Ingredient[]),
          skladniki_mieso: null,
          przepis: 'test',
          osoby_bazowe: 2,
          kcal_na_osobe: 500,
          bialko_na_osobe: 30,
        },
        wed: null,
        thu: null,
        fri: null,
      }

      const list = generateShoppingList(weeklyPlan, 2)
      const pomidory = list.find((item) => item.normalizedName === 'pomidory pelati')

      expect(pomidory).toBeDefined()
      expect(pomidory?.amount).toBe('1.2 kg') // 900g (from 1.5 puszki hint) + 600g = 1500g = 1.5kg
      // Wait, 1.5 puszki with 600g hint means 1.5 * 400g per puszka = 600g total
      // So 600g + 600g = 1200g = 1.2kg
    })

    it('merges sos sojowy with ml hints (łyżki + łyżki)', () => {
      const weeklyPlan: WeeklyPlan = {
        weekKey: '2024-03-01',
        mon: {
          id: 1,
          nazwa: 'Meal 1',
          skladniki_baza: JSON.stringify([
            { name: 'Sos sojowy', amount: '1.5 łyżki' },
          ] as Ingredient[]),
          skladniki_mieso: null,
          przepis: 'test',
          osoby_bazowe: 2,
          kcal_na_osobe: 500,
          bialko_na_osobe: 30,
        },
        tue: {
          id: 2,
          nazwa: 'Meal 2',
          skladniki_baza: JSON.stringify([
            { name: 'Sos sojowy', amount: '6 łyżki (60ml)' },
          ] as Ingredient[]),
          skladniki_mieso: null,
          przepis: 'test',
          osoby_bazowe: 2,
          kcal_na_osobe: 500,
          bialko_na_osobe: 30,
        },
        wed: null,
        thu: null,
        fri: null,
      }

      const list = generateShoppingList(weeklyPlan, 2)
      const sos = list.find((item) => item.normalizedName === 'sos sojowy')

      expect(sos).toBeDefined()
      expect(sos?.amount).toBe('7.5 łyżki (ok. 60ml)') // 1.5 + 6 łyżki, keep the ml hint
    })
  })
})
