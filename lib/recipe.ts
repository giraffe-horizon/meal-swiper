import type { Meal, Ingredient } from '@/types'
import { scaleIngredient } from '@/lib/scaling'

// ─── StepSegment ────────────────────────────────────────────────────────────

export type StepSegment =
  | { type: 'text'; content: string }
  | { type: 'amount'; ingredient: string; amount: string; originalAmount: string }

// ─── Polish stem matching ────────────────────────────────────────────────────

function getStem(word: string): string {
  const cleaned = word.toLowerCase().trim()
  const suffixes = [
    'ów',
    'ami',
    'ach',
    'om',
    'iem',
    'em',
    'ię',
    'ią',
    'ii',
    'ie',
    'ek',
    'ki',
    'kę',
    'ką',
    'ce',
    'ę',
    'ą',
    'i',
    'y',
    'a',
    'u',
    'e',
  ]
  for (const suf of suffixes) {
    if (cleaned.endsWith(suf) && cleaned.length - suf.length >= 4) {
      return cleaned.slice(0, cleaned.length - suf.length)
    }
  }
  return cleaned
}

function getIngredientStem(ingName: string): string {
  // For multi-word names take the longest word (>= 4 chars)
  const words = ingName.trim().split(/\s+/)
  const longest = words.reduce((best, w) => (w.length >= best.length ? w : best), '')
  return getStem(longest)
}

function isWordBoundaryBefore(text: string, idx: number): boolean {
  if (idx === 0) return true
  return !/[\p{L}\d]/u.test(text[idx - 1])
}

// ─── Core step enrichment ────────────────────────────────────────────────────

// Matches: "300g", "1.5 kg", "2 szt", "3 łyżki", "2 szklanki" etc.
const AMOUNT_REGEX =
  /(\d+(?:[,.]\d+)?)\s*(g|kg|ml|l|szt|łyżk(?:a|i|ę|ą|eczka|eczki|eczką)?|szklan(?:ka|ki|kę|ką|ek|ce)?)/gi

function enrichSingleStep(
  step: string,
  ingredients: Ingredient[],
  people: number,
  basePeople: number
): StepSegment[] {
  const stepLower = step.toLowerCase()

  interface Replacement {
    start: number
    end: number
    seg: StepSegment
  }

  const replacements: Replacement[] = []
  const coveredIngNames = new Set<string>()

  // ── Phase 1: find existing amounts in text, link to nearest ingredient ──
  AMOUNT_REGEX.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = AMOUNT_REGEX.exec(step)) !== null) {
    const amStart = m.index
    const amEnd = m.index + m[0].length

    let bestIng: Ingredient | null = null
    let bestDist = Infinity

    for (const ing of ingredients) {
      if (!ing.amount) continue
      const ingName = ing.name.split('(')[0].trim()
      const stem = getIngredientStem(ingName)
      if (stem.length < 4) continue

      const searchStart = Math.max(0, amStart - 30)
      const searchEnd = Math.min(stepLower.length, amEnd + 30)
      const searchText = stepLower.slice(searchStart, searchEnd)
      const stemLower = stem.toLowerCase()

      let idx = searchText.indexOf(stemLower)
      while (idx !== -1) {
        const absIdx = searchStart + idx
        if (isWordBoundaryBefore(stepLower, absIdx)) {
          const dist = Math.min(Math.abs(absIdx - amStart), Math.abs(absIdx - amEnd))
          if (dist < bestDist) {
            bestDist = dist
            bestIng = ing
          }
        }
        idx = searchText.indexOf(stemLower, idx + 1)
      }
    }

    if (bestIng) {
      const scaled = scaleIngredient(bestIng, people, basePeople)
      coveredIngNames.add(bestIng.name)
      replacements.push({
        start: amStart,
        end: amEnd,
        seg: {
          type: 'amount',
          ingredient: bestIng.name,
          amount: scaled.amount,
          originalAmount: step.slice(amStart, amEnd),
        },
      })
    }
  }

  // ── Phase 2: uncovered ingredients → insert badge after stem match ──
  for (const ing of ingredients) {
    if (!ing.amount) continue
    if (coveredIngNames.has(ing.name)) continue

    const ingName = ing.name.split('(')[0].trim()
    const stem = getIngredientStem(ingName)
    if (stem.length < 4) continue

    const stemLower = stem.toLowerCase()
    let idx = stepLower.indexOf(stemLower)

    while (idx !== -1) {
      if (isWordBoundaryBefore(stepLower, idx)) {
        // Find end of actual inflected word
        let wordEnd = idx + stemLower.length
        while (wordEnd < step.length && /\p{L}/u.test(step[wordEnd])) wordEnd++

        // Skip if another replacement already covers this area
        const overlaps = replacements.some((r) => r.start < wordEnd && r.end > idx)
        if (!overlaps) {
          const scaled = scaleIngredient(ing, people, basePeople)
          replacements.push({
            start: wordEnd,
            end: wordEnd, // zero-width insert
            seg: {
              type: 'amount',
              ingredient: ing.name,
              amount: scaled.amount,
              originalAmount: ing.amount,
            },
          })
        }
        break // only first occurrence per ingredient
      }
      idx = stepLower.indexOf(stemLower, idx + 1)
    }
  }

  // ── Phase 3: sort + build segments ──
  replacements.sort((a, b) => a.start - b.start || a.end - b.end)

  const raw: StepSegment[] = []
  let pos = 0

  for (const rep of replacements) {
    if (rep.start < pos) continue // skip overlapping
    if (rep.start > pos) {
      raw.push({ type: 'text', content: step.slice(pos, rep.start) })
    }
    raw.push(rep.seg)
    pos = rep.end
  }
  if (pos < step.length) {
    raw.push({ type: 'text', content: step.slice(pos) })
  }

  // Merge adjacent text segments
  const merged: StepSegment[] = []
  for (const seg of raw) {
    const last = merged[merged.length - 1]
    if (seg.type === 'text' && last?.type === 'text') {
      ;(last as { type: 'text'; content: string }).content += seg.content
    } else {
      merged.push({ ...seg })
    }
  }

  return merged.length > 0 ? merged : [{ type: 'text', content: step }]
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function enrichStepsStructured(
  steps: string[],
  ingredients: Ingredient[],
  people: number,
  basePeople = 2
): StepSegment[][] {
  return steps.map((step) => enrichSingleStep(step, ingredients, people, basePeople))
}

/** Backwards-compatible plain-string version (used in tests / legacy). */
export function enrichStepsWithAmounts(
  steps: string[],
  ingredients: Ingredient[],
  people = 2,
  basePeople = 2
): string[] {
  return enrichStepsStructured(steps, ingredients, people, basePeople).map((segs) =>
    segs.map((s) => (s.type === 'text' ? s.content : s.amount)).join('')
  )
}

// ─── ParsedRecipe ────────────────────────────────────────────────────────────

export interface ParsedRecipe {
  steps: string[]
  tips: string
  baseIngredients: Ingredient[]
  meatIngredients: Ingredient[]
}

export function parseRecipe(meal: Meal): ParsedRecipe {
  const recipe = (() => {
    try {
      return typeof meal.przepis === 'string' ? JSON.parse(meal.przepis) : meal.przepis
    } catch {
      return null
    }
  })()

  const baseIngredients: Ingredient[] = (() => {
    try {
      const raw =
        typeof meal.skladniki_baza === 'string'
          ? JSON.parse(meal.skladniki_baza)
          : meal.skladniki_baza
      return Array.isArray(raw) ? raw : []
    } catch {
      return []
    }
  })()

  const meatIngredients: Ingredient[] = (() => {
    try {
      const raw =
        typeof meal.skladniki_mieso === 'string'
          ? JSON.parse(meal.skladniki_mieso)
          : meal.skladniki_mieso
      return Array.isArray(raw) ? raw : []
    } catch {
      return []
    }
  })()

  return {
    steps: recipe?.kroki ?? [],
    tips: recipe?.wskazowki ?? '',
    baseIngredients,
    meatIngredients,
  }
}
