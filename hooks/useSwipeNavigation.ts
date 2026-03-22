'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Meal, MealWithVariants, WeeklyPlan } from '@/types'
import { DAY_KEYS, getWeekDates } from '@/lib/utils'
import { useAppContext } from '@/lib/context'
import { filterMealsByPreferences, type HouseholdConfig } from '@/lib/meal-filter'

interface UseSwipeNavigationOptions {
  meals: (Meal | MealWithVariants)[]
  weeklyPlan: WeeklyPlan
  weekOffset: number
  weekDatesProp?: Date[]
  allDaysFilled: boolean
  shuffledMealsFromContext: (Meal | MealWithVariants)[]
  currentSwipeIndexFromContext: number
  seenIdsFromContext: string[]
  setCurrentSwipeIndexInContext?: (index: number) => void
  setShuffledMealsInContext?: (meals: (Meal | MealWithVariants)[]) => void
  setSeenIdsInContext?: (ids: string[]) => void
  onComplete: () => void
  onSkipDay?: () => void
}

export interface NextCardCallbacks {
  onSuccess: () => void
  onReshuffle: () => void
  resetX: () => void
  setAnimating: (v: boolean) => void
}

export function useSwipeNavigation({
  meals,
  weeklyPlan,
  weekOffset,
  weekDatesProp,
  allDaysFilled,
  shuffledMealsFromContext,
  currentSwipeIndexFromContext,
  seenIdsFromContext,
  setCurrentSwipeIndexInContext,
  setShuffledMealsInContext,
  setSeenIdsInContext,
  onComplete,
  onSkipDay,
}: UseSwipeNavigationOptions) {
  const { settings } = useAppContext()

  // Compatibility stats
  const [mealsWithVariants, setMealsWithVariants] = useState<MealWithVariants[]>([])

  useEffect(() => {
    fetch('/api/meals?format=variants')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => (Array.isArray(data) ? setMealsWithVariants(data) : []))
      .catch(() => {})
  }, [])

  const compatibilityStats = useMemo(() => {
    if (mealsWithVariants.length === 0) return { compatible: 0, total: 0, warning: null }
    const householdConfig: HouseholdConfig = { persons: settings.persons.slice(0, settings.people) }
    const filterResult = filterMealsByPreferences(mealsWithVariants, householdConfig)
    return {
      compatible: filterResult.total,
      total: mealsWithVariants.length,
      warning: filterResult.warning,
    }
  }, [mealsWithVariants, settings.persons, settings.people])

  // Derived state
  const seenIds = seenIdsFromContext
  const shuffledMeals = useMemo(
    () => (shuffledMealsFromContext.length > 0 ? shuffledMealsFromContext : []),
    [shuffledMealsFromContext]
  )
  const activeMeals = shuffledMeals
  const currentIndex = currentSwipeIndexFromContext
  const weekDatesComputed = useMemo(() => getWeekDates(weekOffset), [weekOffset])
  const weekDates = weekDatesProp ?? weekDatesComputed
  const currentMeal = activeMeals[currentIndex]
  const usedMealIds = useMemo(
    () => DAY_KEYS.map((d) => weeklyPlan[d]?.id).filter(Boolean) as string[],
    [weeklyPlan]
  )

  const shuffleArray = useCallback(<T>(array: T[]): T[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }, [])

  const trackSeen = useCallback(
    (mealId: string) => {
      const maxSeen = Math.max(0, meals.length - 3)
      setSeenIdsInContext?.([...seenIds, mealId].slice(-maxSeen))
    },
    [meals.length, seenIds, setSeenIdsInContext]
  )

  const nextCard = useCallback(
    (cb: NextCardCallbacks) => {
      if (currentIndex >= shuffledMeals.length - 1) {
        if (allDaysFilled) {
          cb.onSuccess()
          setTimeout(() => onComplete?.(), 2000)
        } else {
          const currentMealId = shuffledMeals[currentIndex]?.id
          const maxSeen = Math.max(0, meals.length - 3)
          const updatedSeen = currentMealId ? [...seenIds, currentMealId].slice(-maxSeen) : seenIds
          setSeenIdsInContext?.(updatedSeen)
          const fresh = meals.filter(
            (m) => !updatedSeen.includes(m.id) && !usedMealIds.includes(m.id)
          )
          const old = meals.filter((m) => updatedSeen.includes(m.id) && !usedMealIds.includes(m.id))
          cb.resetX()
          setShuffledMealsInContext?.([
            ...shuffledMeals,
            ...shuffleArray(fresh),
            ...shuffleArray(old),
          ])
          setCurrentSwipeIndexInContext?.(currentIndex + 1)
          cb.onReshuffle()
        }
      } else {
        cb.resetX()
        setCurrentSwipeIndexInContext?.(currentIndex + 1)
      }
      cb.setAnimating(false)
    },
    [
      currentIndex,
      shuffledMeals,
      allDaysFilled,
      onComplete,
      meals,
      seenIds,
      usedMealIds,
      setSeenIdsInContext,
      setShuffledMealsInContext,
      setCurrentSwipeIndexInContext,
      shuffleArray,
    ]
  )

  const handleSkipDay = useCallback(() => {
    if (onSkipDay) onSkipDay()
    else onComplete()
  }, [onSkipDay, onComplete])

  return {
    compatibilityStats,
    activeMeals,
    currentMeal,
    currentIndex,
    weekDates,
    shuffledMeals,
    trackSeen,
    nextCard,
    handleSkipDay,
  }
}
