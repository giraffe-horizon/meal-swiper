'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchCuisines } from '@/lib/api'

export const CUISINES_QUERY_KEY = ['cuisines'] as const

export function useCuisinesQuery() {
  return useQuery({
    queryKey: CUISINES_QUERY_KEY,
    queryFn: fetchCuisines,
    staleTime: 5 * 60 * 1000, // 5 minutes — cuisines list changes rarely
  })
}
