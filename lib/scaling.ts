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

export function scaleIngredient(ing: Ingredient, scaleFactor: number): Ingredient {
  const parsed = parseAmount(ing.amount)
  if (!parsed) return ing

  const scaled = parsed.value * scaleFactor

  // zaokrąglenie: dla g/ml do 5, dla reszty 1 miejsce po przecinku jeśli <10
  let rounded: number
  const unit = parsed.unit.toLowerCase()
  if (unit === 'g' || unit === 'ml') {
    rounded = Math.round(scaled / 5) * 5
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
