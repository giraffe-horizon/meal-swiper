'use client'

import { useState, useCallback } from 'react'
import type { Meal, MealWithVariants, PersonSettings } from '@/types'
import { filterMealsByPreferences, type FilteredMeal } from '@/lib/meal-filter'

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function useSwipeState() {
  const [shuffledMeals, setShuffledMeals] = useState<(Meal | MealWithVariants)[]>([])
  const [currentSwipeIndex, setCurrentSwipeIndex] = useState(0)
  const [seenIds, setSeenIds] = useState<string[]>([])

  // Variant architecture support
  const [filteredMeals, setFilteredMeals] = useState<FilteredMeal[]>([])
  const [preferencesSnapshot, setPreferencesSnapshot] = useState<PersonSettings[] | null>(null)

  const shuffleMeals = useCallback((meals: Meal[]) => {
    setShuffledMeals(shuffleArray(meals))
    setCurrentSwipeIndex(0)
    setSeenIds([])
    // Clear variant state when using legacy meals
    setFilteredMeals([])
    setPreferencesSnapshot(null)
  }, [])

  // New method for variant-based shuffling with filtering
  const shuffleFilteredMeals = useCallback(
    (mealsWithVariants: MealWithVariants[], persons: PersonSettings[]) => {
      // Create snapshot of preferences to preserve filtering during swipe session
      const currentSnapshot = JSON.stringify(persons)

      // Only apply new filtering if preferences have changed significantly
      if (preferencesSnapshot && JSON.stringify(preferencesSnapshot) === currentSnapshot) {
        // Preferences unchanged - keep current filtered meals but reshuffle
        const availableFilteredMeals = filteredMeals.map((fm) => fm.meal)
        setShuffledMeals(shuffleArray(availableFilteredMeals))
        setCurrentSwipeIndex(0)
        setSeenIds([])
        return
      }

      // Apply filtering with new preferences
      const filterResult = filterMealsByPreferences(mealsWithVariants, { persons })
      const availableMeals =
        filterResult.results.length > 0
          ? filterResult.results.map((fm) => fm.meal)
          : mealsWithVariants // Fallback: use all meals unfiltered

      // Store the filtered meals and preferences snapshot
      setFilteredMeals(filterResult.results)
      setPreferencesSnapshot([...persons])

      // Shuffle and set up swipe state
      setShuffledMeals(shuffleArray(availableMeals))
      setCurrentSwipeIndex(0)
      setSeenIds([])
    },
    [filteredMeals, preferencesSnapshot]
  )

  // Get variant assignment for a specific meal (if available)
  const getVariantAssignment = useCallback(
    (mealId: string) => {
      const filteredMeal = filteredMeals.find((fm) => fm.meal.id === mealId)
      return filteredMeal?.variantAssignment || null
    },
    [filteredMeals]
  )

  const advanceIndex = useCallback(() => {
    setCurrentSwipeIndex((i) => i + 1)
  }, [])

  const resetSwipe = useCallback(() => {
    setCurrentSwipeIndex(0)
    setSeenIds([])
  }, [])

  return {
    shuffledMeals,
    currentSwipeIndex,
    seenIds,
    setShuffledMeals,
    setCurrentSwipeIndex,
    setSeenIds,
    shuffleMeals,
    shuffleFilteredMeals,
    getVariantAssignment,
    filteredMeals,
    advanceIndex,
    resetSwipe,
  }
}
