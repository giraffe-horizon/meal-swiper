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
import { useTenant } from '@/hooks/useTenant'
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
  scaleFactor: number
  tenantToken: string | null
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const { token: tenantToken, isReady: tenantReady } = useTenant()
  const { meals, loading: mealsLoading } = useMeals()
  const { weeklyPlan, weekOffset, weekKey, setWeekOffset, setMeal, removeMeal, toggleVacation } =
    useWeeklyPlan(tenantToken)
  const { settings, updateSettings, scaleFactor } = useSettings(tenantToken)

  useEffect(() => {
    const root = window.document.documentElement
    const theme = settings.theme

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const applyTheme = (isDark: boolean) => {
        if (isDark) {
          root.classList.add('dark')
        } else {
          root.classList.remove('dark')
        }
      }

      applyTheme(mediaQuery.matches)

      const listener = (e: MediaQueryListEvent) => applyTheme(e.matches)
      mediaQuery.addEventListener('change', listener)
      return () => mediaQuery.removeEventListener('change', listener)
    } else {
      if (theme === 'dark') {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }
  }, [settings.theme])

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
  const [lastInitWeekOffset, setLastInitWeekOffset] = useState<number | null>(null)

  // Initialize shuffledMeals when meals first load OR when week changes
  // IMPORTANT: Do NOT depend on usedMealIds here — that changes every swipe
  // and would cause a full reshuffle, making cards jump around
  useEffect(() => {
    if (meals.length === 0) return

    const isFirstInit = shuffledMeals.length === 0 && lastInitWeekOffset === null
    const isWeekChange = lastInitWeekOffset !== null && lastInitWeekOffset !== weekOffset

    if (isFirstInit || isWeekChange) {
      // Get currently used meal IDs directly from weeklyPlan (not via usedMealIds memo)
      const currentUsedIds = DAY_KEYS.map((d) => weeklyPlan[d]?.id).filter(Boolean) as string[]
      const available = meals.filter((m) => !currentUsedIds.includes(m.id))
      queueMicrotask(() => {
        shuffleMeals(available)
        if (isWeekChange) setCurrentSwipeDay(null)
      })
      setLastInitWeekOffset(weekOffset)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meals, weekOffset, shuffledMeals.length, lastInitWeekOffset])

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
        mealsLoading: mealsLoading || !tenantReady,
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
        scaleFactor,
        tenantToken,
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
