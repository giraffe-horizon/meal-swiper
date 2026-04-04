'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchIngredients } from '@/lib/api'

export const INGREDIENTS_QUERY_KEY = ['ingredients'] as const

export function useIngredientsQuery() {
  return useQuery({
    queryKey: INGREDIENTS_QUERY_KEY,
    queryFn: fetchIngredients,
    staleTime: 5 * 60 * 1000, // 5 minutes — ingredients catalog changes rarely
  })
}
