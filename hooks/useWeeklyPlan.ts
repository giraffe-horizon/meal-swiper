import { useCallback, useRef } from 'react'
import { usePlanQuery, usePlanMutation } from '@/hooks/queries/usePlanQuery'
import type { DayKey, Meal, WeeklyPlan } from '@/types'

function createDefaultPlan(): WeeklyPlan {
  return {
    mon: null,
    tue: null,
    wed: null,
    thu: null,
    fri: null,
    mon_free: false,
    tue_free: false,
    wed_free: false,
    thu_free: false,
    fri_free: false,
  }
}

export function useWeeklyPlan(weekKey: string, token: string | null) {
  const planQuery = usePlanQuery(weekKey, token)
  const planMutation = usePlanMutation(token)

  const plan: WeeklyPlan = planQuery.data ?? createDefaultPlan()

  // Use ref to always have latest plan for mutation callbacks (avoids stale closures)
  const planRef = useRef(plan)
  planRef.current = plan

  const setMeal = useCallback(
    (day: DayKey, meal: Meal) => {
      const current = planRef.current
      const updated: WeeklyPlan = { ...current, [day]: meal }
      planMutation.mutate({ weekKey, plan: updated })
    },
    [weekKey, planMutation]
  )

  const removeMeal = useCallback(
    (day: DayKey) => {
      const current = planRef.current
      const updated: WeeklyPlan = { ...current, [day]: null }
      planMutation.mutate({ weekKey, plan: updated })
    },
    [weekKey, planMutation]
  )

  const toggleVacation = useCallback(
    (day: DayKey) => {
      const current = planRef.current
      const freeKey = `${day}_free` as `${DayKey}_free`
      const updated: WeeklyPlan = { ...current, [freeKey]: !current[freeKey] }
      planMutation.mutate({ weekKey, plan: updated })
    },
    [weekKey, planMutation]
  )

  return {
    plan,
    isLoading: planQuery.isLoading,
    isError: planQuery.isError,
    refetch: planQuery.refetch,
    setMeal,
    removeMeal,
    toggleVacation,
    isSaving: planMutation.isPending,
  }
}
