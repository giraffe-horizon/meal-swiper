'use client'

import { useMealsQuery } from '@/hooks/queries/useMealsQuery'

export function useMeals() {
  const { data, isPending, error, refetch } = useMealsQuery()
  return {
    meals: data ?? [],
    loading: isPending,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    refetch,
  }
}
