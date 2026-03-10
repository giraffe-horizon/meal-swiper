import type { Ingredient, WeeklyPlan } from '@/types'
import { scaleIngredient } from '@/lib/scaling'
import { parseAmount, formatAmount } from '@/lib/amounts'

// Re-export for backward compatibility
export { parseAmount, type ParsedAmount } from '@/lib/amounts'

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

// Polish lemmatization: map plural/genitive forms to base form
const INGREDIENT_LEMMAS: Record<string, string> = {
  // jajko
  jajka: 'jajko',
  jajek: 'jajko',
  // pomidor
  pomidory: 'pomidor',
  pomidorow: 'pomidor',
  pomidora: 'pomidor',
  // cebula
  cebule: 'cebula',
  cebuli: 'cebula',
  cebul: 'cebula',
  // papryka
  papryki: 'papryka',
  papryk: 'papryka',
  papryce: 'papryka',
  // pieczarka
  pieczarki: 'pieczarka',
  pieczarek: 'pieczarka',
  // ziemniak
  ziemniaki: 'ziemniak',
  ziemniakow: 'ziemniak',
  ziemniaka: 'ziemniak',
  // marchew/marchewka
  marchewka: 'marchew',
  marchewki: 'marchew',
  marchewek: 'marchew',
  // ogórek
  ogorek: 'ogorek',
  ogorki: 'ogorek',
  ogorkow: 'ogorek',
  // por
  pory: 'por',
  porow: 'por',
  // baklazan
  baklazan: 'baklazan',
  baklazany: 'baklazan',
  baklazanow: 'baklazan',
  // cukinia
  cukinie: 'cukinia',
  cukinii: 'cukinia',
  // kalafior
  kalafiory: 'kalafior',
  kalafiorow: 'kalafior',
  // brokuł
  brokuly: 'brokul',
  brokulow: 'brokul',
  // seler
  selery: 'seler',
  selerow: 'seler',
  // szczypiorek
  szczypiorku: 'szczypiorek',
  szczypiorki: 'szczypiorek',
  // pietruszka
  pietruszki: 'pietruszka',
  // koperek
  koperku: 'koperek',
  // natka
  natki: 'natka',
  natek: 'natka',
  // lisc
  lisc: 'lisc',
  liscie: 'lisc',
  lisci: 'lisc',
  // ząbek (czosnek)
  zabek: 'zabek',
  zabki: 'zabek',
  zabkow: 'zabek',
  // plasterek
  plasterek: 'plasterek',
  plasterki: 'plasterek',
  plasterkow: 'plasterek',
}

// Synonyms: map variant names to canonical name
const NAME_SYNONYMS: Record<string, string> = {
  'czosnek swiezy': 'czosnek',
  'czosnek (zabki)': 'czosnek',
  zabek: 'czosnek',
  zabki: 'czosnek',
  zabkow: 'czosnek',
  'sos sojowy jasny': 'sos sojowy',
  'sos sojowy ciemny': 'sos sojowy',
  'cebula biala': 'cebula',
  'cebula zolta': 'cebula',
  'cebula czerwona': 'cebula',
  'ryz jasminowy': 'ryz',
  'ryz basmati': 'ryz',
  'ser zolty': 'ser zolty',
  'ser tarty': 'ser tarty',
  'pomidor koktajlowy': 'pomidor',
  'pomidor cherry': 'pomidor',
  'pomidory koktajlowe': 'pomidor',
  'pomidory cherry': 'pomidor',
  'papryka czerwona': 'papryka',
  'papryka zolta': 'papryka',
  'papryka zielona': 'papryka',
}

export function normalizeIngredientName(name: string): string {
  const lower = name
    .toLowerCase()
    .trim()
    .replace(/[ąćęłńóśźż]/g, (ch) => DIACRITICS_MAP[ch] || ch)

  // First try synonyms (more specific mapping)
  if (NAME_SYNONYMS[lower]) return NAME_SYNONYMS[lower]

  // Then try lemmatization (plural forms → singular)
  if (INGREDIENT_LEMMAS[lower]) return INGREDIENT_LEMMAS[lower]

  return lower
}

// Convert units to a common base for summation: g, ml
function toBaseUnit(value: number, unit: string): { value: number; unit: string } | null {
  if (unit === 'kg') return { value: value * 1000, unit: 'g' }
  if (unit === 'l') return { value: value * 1000, unit: 'ml' }
  return null
}

// Format result: if >= 1000g -> kg, >= 1000ml -> l
export function mergeAmounts(a: string, b: string): string {
  const parsedA = parseAmount(a)
  const parsedB = parseAmount(b)

  if (!parsedA || !parsedB) {
    return `${a} + ${b}`
  }

  // Same unit: simple add (also sum gramsHint if present and same hintUnit)
  if (parsedA.unit === parsedB.unit) {
    const sum = parsedA.value + parsedB.value
    let gramsSum: number | undefined
    let hintUnit: 'g' | 'ml' = 'g'

    if (parsedA.gramsHint !== undefined && parsedB.gramsHint !== undefined) {
      // Both have hints - sum if same hintUnit
      if ((parsedA.hintUnit || 'g') === (parsedB.hintUnit || 'g')) {
        gramsSum = parsedA.gramsHint + parsedB.gramsHint
        hintUnit = parsedA.hintUnit || 'g'
      } else {
        // Different hint units - can't sum, keep first
        gramsSum = parsedA.gramsHint
        hintUnit = parsedA.hintUnit || 'g'
      }
    } else {
      // One or neither has hint - keep whichever exists
      gramsSum = parsedA.gramsHint ?? parsedB.gramsHint
      hintUnit = parsedA.hintUnit ?? parsedB.hintUnit ?? 'g'
    }

    return formatAmount(sum, parsedA.unit, gramsSum, hintUnit)
  }

  // Try merging via gramsHint if different units but compatible via hint
  const hintUnitA = parsedA.hintUnit || 'g'
  const hintUnitB = parsedB.hintUnit || 'g'

  // Both have gramsHint in same base unit
  if (
    parsedA.gramsHint !== undefined &&
    parsedB.gramsHint !== undefined &&
    hintUnitA === hintUnitB
  ) {
    const sum = parsedA.gramsHint + parsedB.gramsHint
    return formatAmount(sum, hintUnitA, undefined)
  }

  // One has gramsHint, other is direct g/ml matching the hint unit
  if (parsedA.gramsHint !== undefined && parsedB.unit === hintUnitA) {
    const sum = parsedA.gramsHint + parsedB.value
    return formatAmount(sum, hintUnitA, undefined)
  }
  if (parsedB.gramsHint !== undefined && parsedA.unit === hintUnitB) {
    const sum = parsedB.gramsHint + parsedA.value
    return formatAmount(sum, hintUnitB, undefined)
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
    // For cross-unit conversion, don't preserve gramsHint (it's already in grams)
    return formatAmount(sum, unitA, undefined)
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
// All entries normalized (lowercase, no diacritics) to match normalizeIngredientName output
const PANTRY_STAPLES = new Set([
  'sol',
  'sol morska',
  'sol kuchenna',
  'pieprz',
  'pieprzu',
  'czarny pieprz',
  'pieprz czarny',
  'pieprz bialy',
  'oliwa',
  'oliwa z oliwek',
  'olej',
  'olej roslinny',
  'olej rzepakowy',
  'olej slonecznikowy',
  'olej kokosowy',
  'maslo',
  'cukier',
  'cukier bialy',
  'cukier brazowy',
  'cukier puder',
  'maka',
  'maka pszenna',
  'woda',
  'ocet',
  'ocet winny',
  'ocet balsamiczny',
  'ocet ryzowy',
  'ocet jablkowy',
  'oregano',
  'bazylia',
  'tymianek',
  'rozmaryn',
  'majeranek',
  'papryka slodka',
  'papryka ostra',
  'papryka wedzona',
  'kumin',
  'kminek',
  'kmin',
  'kolendra mielona',
  'czosnek w proszku',
  'cebula w proszku',
  'lisc laurowy',
  'liscie laurowe',
  'vegeta',
  'przyprawa warzywna',
  'bulion',
  'kostka bulionowa',
  'proszek do pieczenia',
  'soda oczyszczona',
  'cynamon',
  'galka muszkatołowa',
  'imbir mielony',
  'kurkuma',
  'chili',
  'papryczka chili',
  'platki chili',
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

export function generateShoppingList(weeklyPlan: WeeklyPlan, scaleFactor = 1): MergedIngredient[] {
  const ingredientMap = new Map<string, { name: string; amount: string }>()

  const addIngredients = (ingredients: Ingredient[]) => {
    for (const rawIng of ingredients) {
      if (isPantryStaple(rawIng.name)) continue
      const ing = scaleIngredient(rawIng, scaleFactor)
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
