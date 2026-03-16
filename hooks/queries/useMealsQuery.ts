'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchMeals } from '@/lib/api'

export const MEALS_QUERY_KEY = ['meals'] as const

export function useMealsQuery() {
  return useQuery({
    queryKey: MEALS_QUERY_KEY,
    queryFn: fetchMeals,
    staleTime: 5 * 60 * 1000, // 5 minutes — meals change rarely
  })
}
