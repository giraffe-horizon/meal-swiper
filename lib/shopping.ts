import type { Ingredient, WeeklyPlan } from '@/types'

interface ParsedAmount {
  value: number
  unit: string
}

const UNIT_ALIASES: Record<string, string> = {
  g: 'g',
  gram: 'g',
  gramów: 'g',
  gramy: 'g',
  kg: 'kg',
  ml: 'ml',
  l: 'l',
  litr: 'l',
  litry: 'l',
  litrów: 'l',
  szt: 'szt',
  'szt.': 'szt',
  sztuka: 'szt',
  sztuki: 'szt',
  sztuk: 'szt',
  łyżka: 'łyżki',
  łyżki: 'łyżki',
  łyżek: 'łyżki',
  łyżeczka: 'łyżeczki',
  łyżeczki: 'łyżeczki',
  łyżeczek: 'łyżeczki',
  opakowanie: 'opakowania',
  opakowania: 'opakowania',
  opakowań: 'opakowania',
  puszka: 'puszki',
  puszki: 'puszki',
  puszek: 'puszki',
  szklanka: 'szklanki',
  szklanki: 'szklanki',
  szklankę: 'szklanki',
  szczypta: 'szczypty',
  szczypty: 'szczypty',
  szczypt: 'szczypty',
  ząbek: 'ząbki',
  ząbki: 'ząbki',
  ząbków: 'ząbki',
  plaster: 'plastry',
  plastry: 'plastry',
  plastrów: 'plastry',
}

const DIACRITICS_MAP: Record<string, string> = {
  ą: 'a',
  ć: 'c',
  ę: 'e',
  ł: 'l',
  ń: 'n',
  ó: 'o',
  ś: 's',
  ź: 'z',
  ż: 'z',
}

// Synonyms: map variant names to canonical name
const NAME_SYNONYMS: Record<string, string> = {
  'czosnek swiezy': 'czosnek',
  'czosnek (zabki)': 'czosnek',
  'sos sojowy jasny': 'sos sojowy',
  'sos sojowy ciemny': 'sos sojowy',
  'cebula biala': 'cebula',
  'cebula zolta': 'cebula',
  'ryz jasminowy': 'ryz',
  'ryz basmati': 'ryz',
  'ser zolty': 'ser zolty',
  'ser tarty': 'ser tarty',
}

export function normalizeIngredientName(name: string): string {
  const lower = name
    .toLowerCase()
    .trim()
    .replace(/[ąćęłńóśźż]/g, (ch) => DIACRITICS_MAP[ch] || ch)
  return NAME_SYNONYMS[lower] || lower
}

// Convert units to a common base for summation: g, ml
function toBaseUnit(value: number, unit: string): { value: number; unit: string } | null {
  if (unit === 'kg') return { value: value * 1000, unit: 'g' }
  if (unit === 'l') return { value: value * 1000, unit: 'ml' }
  return null
}

// Format result: if >= 1000g -> kg, >= 1000ml -> l
function formatAmount(value: number, unit: string): string {
  if (unit === 'g' && value >= 1000) {
    const kg = value / 1000
    return `${formatNumber(kg)} kg`
  }
  if (unit === 'ml' && value >= 1000) {
    const l = value / 1000
    return `${formatNumber(l)} l`
  }
  return unit ? `${formatNumber(value)} ${unit}` : formatNumber(value)
}

function formatNumber(n: number): string {
  if (Number.isInteger(n)) return n.toString()
  // Round to 1 decimal, remove trailing zero
  return n.toFixed(1).replace(/\.0$/, '')
}

export function parseAmount(amount: string): ParsedAmount | null {
  const trimmed = amount.trim()
  // Match patterns like "200g", "200 g", "2 łyżki", "1.5 kg", "½ szklanki"
  const match = trimmed.match(/^([\d.,½¼¾⅓⅔]+)\s*(.*)$/)
  if (!match) return null

  const valueStr = match[1]
  let unit = match[2].trim().toLowerCase()

  // Handle fractions
  const fractions: Record<string, number> = {
    '½': 0.5,
    '¼': 0.25,
    '¾': 0.75,
    '⅓': 0.333,
    '⅔': 0.667,
  }
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

  if (!parsedA || !parsedB) {
    return `${a} + ${b}`
  }

  // Same unit: simple add
  if (parsedA.unit === parsedB.unit) {
    const sum = parsedA.value + parsedB.value
    return formatAmount(sum, parsedA.unit)
  }

  // Cross-unit conversion: g+kg, ml+l
  const baseA = toBaseUnit(parsedA.value, parsedA.unit)
  const baseB = toBaseUnit(parsedB.value, parsedB.unit)

  // Both convertible to same base
  const unitA = baseA?.unit ?? parsedA.unit
  const valA = baseA?.value ?? parsedA.value
  const unitB = baseB?.unit ?? parsedB.unit
  const valB = baseB?.value ?? parsedB.value

  if (unitA === unitB) {
    const sum = valA + valB
    return formatAmount(sum, unitA)
  }

  // Incompatible units - concatenate
  return `${a} + ${b}`
}

export interface MergedIngredient {
  name: string
  amount: string
  normalizedName: string
}

// Składniki które zawsze są w domu — nie dodawaj do listy zakupów
const PANTRY_STAPLES = new Set([
  'sól',
  'sol',
  'sól morska',
  'sól kuchenna',
  'pieprz',
  'pieprzu',
  'czarny pieprz',
  'pieprz czarny',
  'pieprz biały',
  'oliwa',
  'oliwa z oliwek',
  'olej',
  'olej roślinny',
  'olej rzepakowy',
  'olej słonecznikowy',
  'olej kokosowy',
  'masło',
  'cukier',
  'cukier biały',
  'cukier brązowy',
  'cukier puder',
  'mąka',
  'maka',
  'mąka pszenna',
  'maka pszenna',
  'woda',
  'ocet',
  'ocet winny',
  'ocet balsamiczny',
  'ocet ryżowy',
  'ocet jabłkowy',
  'oregano',
  'bazylia',
  'tymianek',
  'rozmaryn',
  'majeranek',
  'papryka słodka',
  'papryka ostra',
  'papryka wędzona',
  'kumin',
  'kminek',
  'kmin',
  'kolendra mielona',
  'czosnek w proszku',
  'cebula w proszku',
  'liść laurowy',
  'liście laurowe',
  'liscie laurowe',
  'vegeta',
  'przyprawa warzywna',
  'bulion',
  'kostka bulionowa',
  'proszek do pieczenia',
  'soda oczyszczona',
  'cynamon',
  'gałka muszkatołowa',
  'imbir mielony',
  'kurkuma',
  'chili',
  'papryczka chili',
  'płatki chili',
  'sezam',
  'ziarna sezamu',
])

export function isPantryStaple(name: string): boolean {
  const normalized = normalizeIngredientName(name)
  return PANTRY_STAPLES.has(normalized)
}

// Capitalize first letter, rest lowercase
function capitalizeFirst(s: string): string {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

export function generateShoppingList(weeklyPlan: WeeklyPlan): MergedIngredient[] {
  const ingredientMap = new Map<string, { name: string; amount: string }>()

  const addIngredients = (ingredients: Ingredient[]) => {
    for (const ing of ingredients) {
      if (isPantryStaple(ing.name)) continue
      const normalized = normalizeIngredientName(ing.name)
      const existing = ingredientMap.get(normalized)
      if (existing) {
        existing.amount = mergeAmounts(existing.amount, ing.amount)
      } else {
        ingredientMap.set(normalized, {
          name: capitalizeFirst(ing.name.trim()),
          amount: ing.amount,
        })
      }
    }
  }

  for (const value of Object.values(weeklyPlan)) {
    if (!value || typeof value !== 'object' || !('skladniki_baza' in value)) continue
    const meal = value

    // Base ingredients
    try {
      const base =
        typeof meal.skladniki_baza === 'string'
          ? JSON.parse(meal.skladniki_baza)
          : meal.skladniki_baza
      if (Array.isArray(base)) addIngredients(base)
    } catch {
      /* skip */
    }

    // Meat ingredients
    if (meal.skladniki_mieso) {
      try {
        const meat =
          typeof meal.skladniki_mieso === 'string'
            ? JSON.parse(meal.skladniki_mieso)
            : meal.skladniki_mieso
        if (Array.isArray(meat)) addIngredients(meat)
      } catch {
        /* skip */
      }
    }
  }

  // Convert to array and sort alphabetically
  return Array.from(ingredientMap.entries())
    .map(([normalizedName, { name, amount }]) => ({ name, amount, normalizedName }))
    .sort((a, b) => a.normalizedName.localeCompare(b.normalizedName, 'pl'))
}
