'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { Meal, MealWithVariants } from '@/types'
import { useMeals, useMealsWithVariants } from '@/hooks/useMeals'
import { useAuth } from './AuthProvider'

export interface MealContextType {
  meals: Meal[]
  mealsWithVariants: MealWithVariants[]
  mealsLoading: boolean
}

const MealContext = createContext<MealContextType | null>(null)

export function MealProvider({ children }: { children: ReactNode }) {
  const { isReady } = useAuth()
  const { meals, loading: mealsLoading } = useMeals()
  const { meals: mealsWithVariants, loading: variantsLoading } = useMealsWithVariants()

  return (
    <MealContext.Provider
      value={{
        meals,
        mealsWithVariants,
        mealsLoading: mealsLoading || variantsLoading || !isReady,
      }}
    >
      {children}
    </MealContext.Provider>
  )
}

export function useMealContext() {
  const ctx = useContext(MealContext)
  if (!ctx) throw new Error('useMealContext must be used within MealProvider')
  return ctx
}
