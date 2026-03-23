'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { Meal, DayKey, WeeklyPlan } from '@/types'
import { useWeeklyPlan } from '@/hooks/useWeeklyPlan'
import { useAuth } from './AuthProvider'
import { DAY_KEYS } from '@/lib/utils'

export interface PlanContextType {
  weeklyPlan: WeeklyPlan
  weekOffset: number
  weekKey: string
  allDaysFilled: boolean
  setWeekOffset: (offset: number) => void
  setMeal: (day: DayKey, meal: Meal) => void
  removeMeal: (day: DayKey) => void
  toggleVacation: (day: DayKey) => void
}

const PlanContext = createContext<PlanContextType | null>(null)

export function PlanProvider({ children }: { children: ReactNode }) {
  const { tenantToken } = useAuth()
  const { weeklyPlan, weekOffset, weekKey, setWeekOffset, setMeal, removeMeal, toggleVacation } =
    useWeeklyPlan(tenantToken)

  const allDaysFilled = useMemo(
    () => DAY_KEYS.every((day) => weeklyPlan[day] || weeklyPlan[`${day}_free`]),
    [weeklyPlan]
  )

  return (
    <PlanContext.Provider
      value={{
        weeklyPlan,
        weekOffset,
        weekKey,
        allDaysFilled,
        setWeekOffset,
        setMeal,
        removeMeal,
        toggleVacation,
      }}
    >
      {children}
    </PlanContext.Provider>
  )
}

export function usePlanContext() {
  const ctx = useContext(PlanContext)
  if (!ctx) throw new Error('usePlanContext must be used within PlanProvider')
  return ctx
}
