'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchMealsWithVariants } from '@/lib/api'

export const MEALS_WITH_VARIANTS_QUERY_KEY = ['meals', 'variants'] as const

export function useMealsWithVariantsQuery() {
  return useQuery({
    queryKey: MEALS_WITH_VARIANTS_QUERY_KEY,
    queryFn: fetchMealsWithVariants,
    staleTime: 5 * 60 * 1000, // 5 minutes — meals change rarely
  })
}
