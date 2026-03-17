'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Meal, DayKey, WeeklyPlan } from '@/types'
import { getWeeklyPlan, saveWeeklyPlan, createDefaultPlan } from '@/lib/storage'
import { getWeekKey } from '@/lib/utils'
import { usePlanQuery, usePlanMutation } from '@/hooks/queries/usePlanQuery'

export function useWeeklyPlan(tenantToken: string | null = null) {
  const [weekOffset, setWeekOffset] = useState(0)
  const weekKey = useMemo(() => getWeekKey(weekOffset), [weekOffset])

  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan>(() =>
    typeof window !== 'undefined' ? getWeeklyPlan(weekKey) : createDefaultPlan()
  )

  // Server sync via react-query
  const { data: serverPlan } = usePlanQuery(weekKey, tenantToken)
  const { mutate: savePlanToServer } = usePlanMutation(tenantToken)

  // When week changes: reload from localStorage
  useEffect(() => {
    const localPlan = getWeeklyPlan(weekKey)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- celowy reset stanu przy zmianie tygodnia
    setWeeklyPlan(localPlan)
  }, [weekKey])

  // When server data arrives: sync to state + localStorage
  useEffect(() => {
    if (serverPlan) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync planu z serwera
      setWeeklyPlan(serverPlan)
      saveWeeklyPlan(weekKey, serverPlan)
    }
  }, [serverPlan, weekKey])

  const updatePlan = useCallback(
    (newPlan: WeeklyPlan) => {
      setWeeklyPlan(newPlan)
      saveWeeklyPlan(weekKey, newPlan)
      savePlanToServer({ weekKey, plan: newPlan })
    },
    [weekKey, savePlanToServer]
  )

  const setMeal = useCallback(
    (day: DayKey, meal: Meal) => {
      // Zawsze czyść flagę urlopu gdy przypisujesz danie
      const freeKey = `${day}_free` as `${DayKey}_free`
      updatePlan({ ...weeklyPlan, [day]: meal, [freeKey]: false })
    },
    [weeklyPlan, updatePlan]
  )

  const removeMeal = useCallback(
    (day: DayKey) => updatePlan({ ...weeklyPlan, [day]: null }),
    [weeklyPlan, updatePlan]
  )

  const toggleVacation = useCallback(
    (day: DayKey) => {
      const freeKey = `${day}_free` as `${DayKey}_free`
      const newPlan = { ...weeklyPlan, [freeKey]: !weeklyPlan[freeKey] }
      if (newPlan[freeKey]) newPlan[day] = null
      updatePlan(newPlan)
    },
    [weeklyPlan, updatePlan]
  )

  return { weeklyPlan, weekOffset, weekKey, setWeekOffset, setMeal, removeMeal, toggleVacation }
}
