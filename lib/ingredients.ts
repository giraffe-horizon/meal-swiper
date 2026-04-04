import type { CatalogIngredient } from '@/types'

/**
 * Normalizes an ingredient name for matching purposes
 * - Converts to lowercase
 * - Trims whitespace
 * - Removes parentheses and their contents
 * - Collapses multiple spaces to single space
 */
export function normalizeIngredient(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\([^)]*\)/g, '') // Remove parentheses and contents
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim()
}

/**
 * Builds an index of ingredients by normalized name for fast lookup
 */
export function buildIngredientIndex(
  ingredients: CatalogIngredient[]
): Map<string, CatalogIngredient> {
  const index = new Map<string, CatalogIngredient>()

  for (const ingredient of ingredients) {
    const normalizedName = normalizeIngredient(ingredient.name)
    index.set(normalizedName, ingredient)
  }

  return index
}
