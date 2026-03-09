import type { Ingredient, WeeklyPlan } from '@/types'

interface ParsedAmount {
  value: number
  unit: string
}

const UNIT_ALIASES: Record<string, string> = {
  'g': 'g',
  'gram': 'g',
  'gramów': 'g',
  'gramy': 'g',
  'kg': 'kg',
  'ml': 'ml',
  'l': 'l',
  'litr': 'l',
  'litry': 'l',
  'litrów': 'l',
  'szt': 'szt',
  'szt.': 'szt',
  'sztuka': 'szt',
  'sztuki': 'szt',
  'sztuk': 'szt',
  'łyżka': 'łyżki',
  'łyżki': 'łyżki',
  'łyżek': 'łyżki',
  'łyżeczka': 'łyżeczki',
  'łyżeczki': 'łyżeczki',
  'łyżeczek': 'łyżeczki',
  'opakowanie': 'opakowania',
  'opakowania': 'opakowania',
  'opakowań': 'opakowania',
  'puszka': 'puszki',
  'puszki': 'puszki',
  'puszek': 'puszki',
  'szklanka': 'szklanki',
  'szklanki': 'szklanki',
  'szklankę': 'szklanki',
  'szczypta': 'szczypty',
  'szczypty': 'szczypty',
  'szczypt': 'szczypty',
  'ząbek': 'ząbki',
  'ząbki': 'ząbki',
  'ząbków': 'ząbki',
  'plaster': 'plastry',
  'plastry': 'plastry',
  'plastrów': 'plastry',
}

const DIACRITICS_MAP: Record<string, string> = {
  'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n',
  'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
}

export function normalizeIngredientName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[ąćęłńóśźż]/g, (ch) => DIACRITICS_MAP[ch] || ch)
}

export function parseAmount(amount: string): ParsedAmount | null {
  const trimmed = amount.trim()
  // Match patterns like "200g", "200 g", "2 łyżki", "1.5 kg", "½ szklanki"
  const match = trimmed.match(/^([\d.,½¼¾⅓⅔]+)\s*(.*)$/)
  if (!match) return null

  let valueStr = match[1]
  let unit = match[2].trim().toLowerCase()

  // Handle fractions
  const fractions: Record<string, number> = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 0.333, '⅔': 0.667 }
  let value: number
  if (fractions[valueStr]) {
    value = fractions[valueStr]
  } else {
    value = parseFloat(valueStr.replace(',', '.'))
  }

  if (isNaN(value)) return null

  // Normalize unit
  unit = UNIT_ALIASES[unit] || unit

  return { value, unit }
}

export function mergeAmounts(a: string, b: string): string {
  const parsedA = parseAmount(a)
  const parsedB = parseAmount(b)

  if (parsedA && parsedB && parsedA.unit === parsedB.unit) {
    const sum = parsedA.value + parsedB.value
    const formatted = Number.isInteger(sum) ? sum.toString() : sum.toFixed(1).replace(/\.0$/, '')
    return parsedA.unit ? `${formatted} ${parsedA.unit}` : formatted
  }

  // Mixed units - concatenate
  return `${a} + ${b}`
}

export interface MergedIngredient {
  name: string
  amount: string
  normalizedName: string
}

export function generateShoppingList(weeklyPlan: WeeklyPlan): MergedIngredient[] {
  const ingredientMap = new Map<string, { name: string; amount: string }>()

  const addIngredients = (ingredients: Ingredient[]) => {
    for (const ing of ingredients) {
      const normalized = normalizeIngredientName(ing.name)
      const existing = ingredientMap.get(normalized)
      if (existing) {
        existing.amount = mergeAmounts(existing.amount, ing.amount)
      } else {
        ingredientMap.set(normalized, { name: ing.name, amount: ing.amount })
      }
    }
  }

  for (const value of Object.values(weeklyPlan)) {
    if (!value || typeof value !== 'object' || !('skladniki_baza' in value)) continue
    const meal = value

    // Base ingredients
    try {
      const base = typeof meal.skladniki_baza === 'string'
        ? JSON.parse(meal.skladniki_baza)
        : meal.skladniki_baza
      if (Array.isArray(base)) addIngredients(base)
    } catch { /* skip */ }

    // Meat ingredients
    if (meal.skladniki_mieso) {
      try {
        const meat = typeof meal.skladniki_mieso === 'string'
          ? JSON.parse(meal.skladniki_mieso)
          : meal.skladniki_mieso
        if (Array.isArray(meat)) addIngredients(meat)
      } catch { /* skip */ }
    }
  }

  // Convert to array and sort alphabetically
  return Array.from(ingredientMap.entries())
    .map(([normalizedName, { name, amount }]) => ({ name, amount, normalizedName }))
    .sort((a, b) => a.normalizedName.localeCompare(b.normalizedName, 'pl'))
}
