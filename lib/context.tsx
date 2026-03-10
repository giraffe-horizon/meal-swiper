'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from 'react'
import type { Meal, DayKey, WeeklyPlan, AppSettings } from '@/types'
import { useMeals } from '@/hooks/useMeals'
import { useWeeklyPlan } from '@/hooks/useWeeklyPlan'
import { useSettings } from '@/hooks/useSettings'
import { useSwipeState } from '@/hooks/useSwipeState'
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
  shuffledMeals: Meal[]
  currentSwipeIndex: number
  seenIds: string[]
  setCurrentSwipeIndex: (index: number) => void
  setShuffledMeals: (meals: Meal[]) => void
  setSeenIds: (ids: string[]) => void
  settings: AppSettings
  updateSettings: (settings: AppSettings) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const { meals, loading: mealsLoading } = useMeals()
  const { weeklyPlan, weekOffset, weekKey, setWeekOffset, setMeal, removeMeal, toggleVacation } =
    useWeeklyPlan()
  const { settings, updateSettings } = useSettings()
  const {
    shuffledMeals,
    currentSwipeIndex,
    seenIds,
    setShuffledMeals,
    setCurrentSwipeIndex,
    setSeenIds,
    shuffleMeals,
  } = useSwipeState()

  const allDaysFilled = useMemo(
    () => DAY_KEYS.every((day) => weeklyPlan[day] || weeklyPlan[`${day}_free`]),
    [weeklyPlan]
  )

  const [currentSwipeDay, setCurrentSwipeDay] = useState<DayKey | null>(null)

  // Initialize shuffledMeals when meals first load
  useEffect(() => {
    if (meals.length > 0 && shuffledMeals.length === 0) {
      queueMicrotask(() => shuffleMeals(meals))
    }
  }, [meals, shuffledMeals.length, shuffleMeals])

  // Reset swipe state on week change
  useEffect(() => {
    if (meals.length > 0) {
      queueMicrotask(() => {
        shuffleMeals(meals)
        setCurrentSwipeDay(null)
      })
    }
  }, [weekOffset, meals, shuffleMeals])

  const handleSwipeRight = useCallback(
    (meal: Meal) => {
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
        setCurrentSwipeDay(nextEmptyDay)
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
        shuffledMeals,
        currentSwipeIndex,
        seenIds,
        setCurrentSwipeIndex,
        setShuffledMeals,
        setSeenIds,
        settings,
        updateSettings,
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
