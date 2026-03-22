'use client'

import type { ReactNode } from 'react'
import { AuthProvider, useAuth } from './AuthProvider'
import { MealProvider, useMealContext } from './MealProvider'
import { SettingsProvider, useSettingsContext } from './SettingsProvider'
import { PlanProvider, usePlanContext } from './PlanProvider'
import { SwipeProvider, useSwipeContext } from './SwipeProvider'

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <MealProvider>
        <SettingsProvider>
          <PlanProvider>
            <SwipeProvider>{children}</SwipeProvider>
          </PlanProvider>
        </SettingsProvider>
      </MealProvider>
    </AuthProvider>
  )
}

/**
 * Backward-compatible hook — spreads all provider values into one object.
 * Prefer using specific hooks (useAuth, usePlanContext, etc.) in new code.
 */
export function useAppContext() {
  const { tenantToken } = useAuth()
  const { meals, mealsLoading } = useMealContext()
  const { settings, updateSettings, scaleFactor } = useSettingsContext()
  const {
    weeklyPlan,
    weekOffset,
    weekKey,
    allDaysFilled,
    setWeekOffset,
    setMeal,
    removeMeal,
    toggleVacation,
  } = usePlanContext()
  const {
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
  } = useSwipeContext()

  return {
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
    scaleFactor,
    tenantToken,
    getVariantAssignment,
  }
}
