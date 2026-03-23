'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { Meal, DayKey, MealWithVariants, MealVariant } from '@/types'
import { useSwipeState } from '@/hooks/useSwipeState'
import { useMealContext } from './MealProvider'
import { usePlanContext } from './PlanProvider'
import { useSettingsContext } from './SettingsProvider'
import { DAY_KEYS } from '@/lib/utils'

export interface SwipeContextType {
  currentSwipeDay: DayKey | null
  setCurrentSwipeDay: (day: DayKey | null) => void
  handleSwipeRight: (meal: Meal | MealWithVariants) => void
  shuffledMeals: (Meal | MealWithVariants)[]
  currentSwipeIndex: number
  seenIds: string[]
  setCurrentSwipeIndex: (index: number) => void
  setShuffledMeals: (meals: (Meal | MealWithVariants)[]) => void
  setSeenIds: (ids: string[]) => void
  getVariantAssignment: (mealId: string) => Record<string, MealVariant> | null
}

const SwipeContext = createContext<SwipeContextType | null>(null)

export function SwipeProvider({ children }: { children: ReactNode }) {
  const { meals, mealsWithVariants } = useMealContext()
  const { weeklyPlan, weekOffset, setMeal } = usePlanContext()
  const { settings } = useSettingsContext()

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

  const [currentSwipeDay, setCurrentSwipeDay] = useState<DayKey | null>(null)
  const [lastInitWeekOffset, setLastInitWeekOffset] = useState<number | null>(null)

  // Initialize shuffledMeals when meals first load OR when week changes
  useEffect(() => {
    const hasLegacyMeals = meals.length > 0
    const hasVariantMeals = mealsWithVariants.length > 0

    if (!hasLegacyMeals && !hasVariantMeals) return

    const isFirstInit = shuffledMeals.length === 0 && lastInitWeekOffset === null
    const isWeekChange = lastInitWeekOffset !== null && lastInitWeekOffset !== weekOffset

    if (isFirstInit || isWeekChange) {
      const currentUsedIds = DAY_KEYS.map((d) => weeklyPlan[d]?.id).filter(Boolean) as string[]

      const hasNewPreferences = settings.persons.some(
        (p) =>
          p.dailyKcal ||
          p.dailyProtein ||
          p.diet?.length ||
          p.cuisinePreferences?.length ||
          p.excludedIngredients?.length
      )

      let shuffled = false

      if (hasVariantMeals) {
        const availableVariantMeals = mealsWithVariants.filter(
          (m) => !currentUsedIds.includes(m.id)
        )
        if (availableVariantMeals.length > 0) {
          if (hasNewPreferences) {
            shuffleFilteredMeals(availableVariantMeals, settings.persons)
          } else {
            shuffleFilteredMeals(availableVariantMeals, [])
          }
          shuffled = true
        }
      }

      if (!shuffled && hasLegacyMeals) {
        const available = meals.filter((m) => !currentUsedIds.includes(m.id))
        if (available.length > 0) {
          shuffleMeals(available)
          shuffled = true
        }
      }

      if (isWeekChange) setCurrentSwipeDay(null)
      if (shuffled) setLastInitWeekOffset(weekOffset)
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
                skladniki_baza: meal.przepis,
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
    <SwipeContext.Provider
      value={{
        currentSwipeDay,
        setCurrentSwipeDay,
        handleSwipeRight,
        shuffledMeals,
        currentSwipeIndex,
        seenIds,
        setCurrentSwipeIndex,
        setShuffledMeals,
        setSeenIds,
        getVariantAssignment,
      }}
    >
      {children}
    </SwipeContext.Provider>
  )
}

export function useSwipeContext() {
  const ctx = useContext(SwipeContext)
  if (!ctx) throw new Error('useSwipeContext must be used within SwipeProvider')
  return ctx
}
