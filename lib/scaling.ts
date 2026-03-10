import type { Ingredient, PersonSettings } from '@/types'
import { parseAmount, formatAmount } from '@/lib/amounts'

// Przepisy bazowe są kalibrowane na 2 osoby × 2000 kcal = 4000 kcal łącznie
export const BASE_KCAL_PER_PERSON = 2000

/**
 * Oblicza scaleFactor na podstawie listy osób.
 * scaleFactor = totalKcal / (basePeople * BASE_KCAL_PER_PERSON)
 */
export function computeScaleFactor(persons: PersonSettings[], basePeople = 2): number {
  if (!persons || persons.length === 0) {
    // Fallback: jeśli brak osób, zakładamy 2 osoby × 2000 kcal = brak skalowania
    return 1
  }
  const totalKcal = persons.reduce((sum, p) => sum + p.kcal, 0)
  return totalKcal / (basePeople * BASE_KCAL_PER_PERSON)
}

/**
 * Oblicza ratio danej osoby względem BASE_KCAL_PER_PERSON.
 * Używane do wyświetlania makro per osoba.
 */
export function computePersonRatio(personKcal: number): number {
  return personKcal / BASE_KCAL_PER_PERSON
}

/**
 * Zaokrągla wartość do najbliższego "ładnego" ułamka: 1/4, 1/3, 1/2, 2/3, 3/4 lub całości.
 * Używane dla jednostek miarowych (łyżki, łyżeczki) gdzie precyzja jest ważna.
 */
export function snapToNiceFraction(value: number): number {
  // Minimum 1/4 (mniej niż 1/4 to tyle co nic)
  if (value < 0.15) return 0.25

  const candidates: number[] = [0.25, 1 / 3, 0.5, 2 / 3, 0.75, 1, 1.25, 1 + 1 / 3, 1.5, 1 + 2 / 3, 1.75, 2]

  if (value > 2) {
    // Dla większych wartości zaokrąglaj do 0.5
    return Math.round(value * 2) / 2
  }

  let best = candidates[0]
  let bestDiff = Math.abs(value - candidates[0])
  for (const c of candidates) {
    const diff = Math.abs(value - c)
    if (diff < bestDiff) {
      bestDiff = diff
      best = c
    }
  }
  return best
}

export function scaleIngredient(ing: Ingredient, scaleFactor: number): Ingredient {
  const parsed = parseAmount(ing.amount)
  if (!parsed) return ing

  const scaled = parsed.value * scaleFactor

  // zaokrąglenie: dla g/ml do 5, dla reszty 1 miejsce po przecinku lub pełne
  let rounded: number
  const unit = parsed.unit.toLowerCase()

  // Jednostki, które mogą być wyrażane ułamkami (1/4, 1/3, 1/2, 2/3, 3/4)
  const isSpoon = unit === 'łyżka' || unit === 'łyżki' || unit === 'łyżeczka' || unit === 'łyżeczki'

  const isDiscrete =
    ['ząbek', 'ząbki', 'puszka', 'puszki', 'szt', 'opakowanie', 'opakowania'].some((u) =>
      unit.includes(u)
    ) || isSpoon

  if (unit === 'g' || unit === 'ml') {
    rounded = Math.round(scaled / 5) * 5
  } else if (isSpoon) {
    // Dla łyżek i łyżeczek zaokrąglamy do ładnych ułamków: 1/4, 1/3, 1/2, 2/3, 3/4
    rounded = snapToNiceFraction(scaled)
  } else if (isDiscrete) {
    // Dla jednostek "dyskretnych" (ząbki, puszki, sztuki) zaokrąglamy do 0.5 lub całości
    if (scaled < 1) {
      rounded = Math.max(0.5, Math.round(scaled))
    } else {
      rounded = Math.round(scaled * 2) / 2
    }
  } else if (scaled < 10) {
    rounded = Math.round(scaled * 10) / 10
  } else {
    rounded = Math.round(scaled)
  }

  // Scale gramsHint proportionally if present
  let scaledGramsHint: number | undefined
  if (parsed.gramsHint !== undefined) {
    if (scaleFactor === 1) {
      // No scaling - preserve original gramsHint
      scaledGramsHint = parsed.gramsHint
    } else {
      // Scaling - round to nearest 5g
      const rawGrams = parsed.gramsHint * scaleFactor
      scaledGramsHint = Math.round(rawGrams / 5) * 5
    }
  }

  return {
    ...ing,
    amount: formatAmount(rounded, parsed.unit, scaledGramsHint, parsed.hintUnit),
  }
}

export function scaleNutrition(value: number, scaleFactor: number): number {
  return Math.round(value * scaleFactor)
}
