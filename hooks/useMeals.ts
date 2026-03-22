'use client'

import { useMealsQuery } from '@/hooks/queries/useMealsQuery'
import { useMealsWithVariantsQuery } from '@/hooks/queries/useMealsWithVariantsQuery'

export function useMeals() {
  const { data, isPending, error, refetch } = useMealsQuery()
  return {
    meals: data ?? [],
    loading: isPending,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    refetch,
  }
}

export function useMealsWithVariants() {
  const { data, isPending, error, refetch } = useMealsWithVariantsQuery()
  return {
    meals: data ?? [],
    loading: isPending,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    refetch,
  }
}
