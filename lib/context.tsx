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
import type { Meal, DayKey, WeeklyPlan, AppSettings, MealWithVariants, MealVariant } from '@/types'
import { useMeals, useMealsWithVariants } from '@/hooks/useMeals'
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
  handleSwipeRight: (meal: Meal | MealWithVariants) => void
  shuffledMeals: (Meal | MealWithVariants)[]
  currentSwipeIndex: number
  seenIds: string[]
  setCurrentSwipeIndex: (index: number) => void
  setShuffledMeals: (meals: (Meal | MealWithVariants)[]) => void
  setSeenIds: (ids: string[]) => void
  settings: AppSettings
  updateSettings: (settings: AppSettings) => void
  scaleFactor: number
  tenantToken: string | null
  getVariantAssignment: (mealId: string) => Record<string, MealVariant> | null
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const { token: tenantToken, isReady: tenantReady } = useTenant()
  const { meals, loading: mealsLoading } = useMeals()
  const { meals: mealsWithVariants, loading: variantsLoading } = useMealsWithVariants()
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
    shuffleFilteredMeals,
    getVariantAssignment,
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
    // Check if we have data to work with
    const hasLegacyMeals = meals.length > 0
    const hasVariantMeals = mealsWithVariants.length > 0

    if (!hasLegacyMeals && !hasVariantMeals) return

    const isFirstInit = shuffledMeals.length === 0 && lastInitWeekOffset === null
    const isWeekChange = lastInitWeekOffset !== null && lastInitWeekOffset !== weekOffset

    if (isFirstInit || isWeekChange) {
      // Get currently used meal IDs directly from weeklyPlan
      const currentUsedIds = DAY_KEYS.map((d) => weeklyPlan[d]?.id).filter(Boolean) as string[]

      queueMicrotask(() => {
        // Check if we can use variant-based filtering
        const hasNewPreferences = settings.persons.some(
          (p) =>
            p.dailyKcal ||
            p.dailyProtein ||
            p.diet?.length ||
            p.cuisinePreferences?.length ||
            p.excludedIngredients?.length
        )

        if (hasVariantMeals && hasNewPreferences) {
          // Use variant-based filtering
          const availableVariantMeals = mealsWithVariants.filter(
            (m) => !currentUsedIds.includes(m.id)
          )
          shuffleFilteredMeals(availableVariantMeals, settings.persons)
        } else if (hasLegacyMeals) {
          // Fallback to legacy behavior
          const available = meals.filter((m) => !currentUsedIds.includes(m.id))
          shuffleMeals(available)
        }

        if (isWeekChange) setCurrentSwipeDay(null)
      })
      setLastInitWeekOffset(weekOffset)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    meals,
    mealsWithVariants,
    weekOffset,
    shuffledMeals.length,
    lastInitWeekOffset,
    settings.persons,
  ])

  const handleSwipeRight = useCallback(
    (meal: Meal | MealWithVariants) => {
      const isDayValid = (d: DayKey) => !weeklyPlan[d] && !weeklyPlan[`${d}_free`]
      let targetDay: DayKey | null =
        currentSwipeDay && isDayValid(currentSwipeDay) ? currentSwipeDay : null

      if (!targetDay) {
        targetDay = DAY_KEYS.find(isDayValid) ?? null
      }

      if (targetDay) {
        // Convert variant meal to legacy meal format for storage compatibility
        const legacyMeal: Meal =
          'variants' in meal
            ? {
                id: meal.id,
                nazwa: meal.nazwa,
                opis: meal.opis,
                photo_url: meal.photo_url,
                prep_time: meal.prep_time,
                kcal_baza: meal.variants.find((v) => v.is_default)?.kcal || 0,
                kcal_z_miesem: meal.variants.find((v) => v.is_default)?.kcal || 0,
                bialko_baza: meal.variants.find((v) => v.is_default)?.protein || 0,
                bialko_z_miesem: meal.variants.find((v) => v.is_default)?.protein || 0,
                trudnosc: meal.trudnosc,
                kuchnia: meal.kuchnia,
                category: meal.category,
                skladniki_baza: meal.przepis, // Fallback
                skladniki_mieso: '[]',
                przepis: meal.przepis,
                tags: meal.tags,
              }
            : meal

        setMeal(targetDay, legacyMeal)
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
        mealsLoading: mealsLoading || variantsLoading || !tenantReady,
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
        getVariantAssignment,
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
