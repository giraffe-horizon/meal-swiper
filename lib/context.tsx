'use client'

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react'
import type { Meal, DayKey, WeeklyPlan } from '@/types'
import { useMeals } from '@/hooks/useMeals'
import { useWeeklyPlan } from '@/hooks/useWeeklyPlan'
import { DAY_KEYS } from '@/lib/utils'

interface AppContextValue {
  meals: Meal[]
  mealsLoading: boolean
  weeklyPlan: WeeklyPlan
  weekOffset: number
  weekKey: string
  allDaysFilled: boolean
  setWeekOffset: (offset: number) => void
  setMeal: (day: DayKey, meal: Meal) => void
  removeMeal: (day: DayKey) => void
  toggleVacation: (day: DayKey) => void
  currentSwipeDay: DayKey | null
  setCurrentSwipeDay: (day: DayKey | null) => void
  handleSwipeRight: (meal: Meal) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const { meals, loading: mealsLoading } = useMeals()
  const { weeklyPlan, weekOffset, weekKey, setWeekOffset, setMeal, removeMeal, toggleVacation } =
    useWeeklyPlan()

  const allDaysFilled = useMemo(
    () => DAY_KEYS.every((day) => weeklyPlan[day] || weeklyPlan[`${day}_free`]),
    [weeklyPlan]
  )

  const [currentSwipeDay, setCurrentSwipeDay] = useState<DayKey | null>(null)

  const handleSwipeRight = useCallback(
    (meal: Meal) => {
      // Jeśli wybrany dzień jest wolny lub już wypełniony → szukaj następnego
      const isDayValid = (d: DayKey) => !weeklyPlan[d] && !weeklyPlan[`${d}_free`]
      let targetDay: DayKey | null =
        currentSwipeDay && isDayValid(currentSwipeDay) ? currentSwipeDay : null

      if (!targetDay) {
        targetDay = DAY_KEYS.find(isDayValid) ?? null
      }

      if (targetDay) {
        setMeal(targetDay, meal)

        const nextEmptyDay =
          DAY_KEYS.find((d) => {
            if (d === targetDay) return false
            return !weeklyPlan[d] && !weeklyPlan[`${d}_free`]
          }) ?? null

        if (nextEmptyDay) {
          setCurrentSwipeDay(nextEmptyDay)
        } else {
          setCurrentSwipeDay(null)
        }
      }
    },
    [currentSwipeDay, weeklyPlan, setMeal]
  )

  return (
    <AppContext.Provider
      value={{
        meals,
        mealsLoading,
        weeklyPlan,
        weekOffset,
        weekKey,
        allDaysFilled,
        setWeekOffset,
        setMeal,
        removeMeal,
        toggleVacation,
        currentSwipeDay,
        setCurrentSwipeDay,
        handleSwipeRight,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within AppProvider')
  return ctx
}
