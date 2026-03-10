import type { Ingredient } from '@/types'
import { parseAmount, formatAmount } from '@/lib/amounts'

export function scaleIngredient(ing: Ingredient, people: number, basePeople = 2): Ingredient {
  const parsed = parseAmount(ing.amount)
  if (!parsed) return ing

  const scaled = parsed.value * (people / basePeople)

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
    if (people === basePeople) {
      // No scaling - preserve original gramsHint
      scaledGramsHint = parsed.gramsHint
    } else {
      // Scaling - round to nearest 5g
      const rawGrams = parsed.gramsHint * (people / basePeople)
      scaledGramsHint = Math.round(rawGrams / 5) * 5
    }
  }

  return {
    ...ing,
    amount: formatAmount(rounded, parsed.unit, scaledGramsHint),
  }
}
