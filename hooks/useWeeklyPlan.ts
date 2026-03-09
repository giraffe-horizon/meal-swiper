'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Meal, DayKey, WeeklyPlan } from '@/types'
import { getWeeklyPlan, saveWeeklyPlan, createDefaultPlan } from '@/lib/storage'
import { getWeekKey } from '@/lib/utils'

function syncPlanToServer(weekKey: string, plan: WeeklyPlan): void {
  fetch('/api/plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ week: weekKey, plan }),
  }).catch(() => {})
}

export function useWeeklyPlan() {
  const [weekOffset, setWeekOffset] = useState(0)
  const weekKey = useMemo(() => getWeekKey(weekOffset), [weekOffset])

  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan>(() =>
    typeof window !== 'undefined' ? getWeeklyPlan(weekKey) : createDefaultPlan()
  )

  // Gdy zmienia się tydzień: załaduj z localStorage, potem sync z serwera
  useEffect(() => {
    // Załaduj lokalny plan dla nowego tygodnia
    const localPlan = getWeeklyPlan(weekKey)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- celowy reset stanu przy zmianie tygodnia
    setWeeklyPlan(localPlan)

    // Sync z serwera (async, nadpisuje jeśli serwer ma nowsze dane)
    fetch(`/api/plan?week=${encodeURIComponent(weekKey)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((serverPlan: WeeklyPlan | null) => {
        if (serverPlan) {
          setWeeklyPlan(serverPlan)
          saveWeeklyPlan(weekKey, serverPlan)
        }
      })
      .catch(() => {}) // graceful degradation — zostaw lokalny plan
  }, [weekKey])

  const updatePlan = useCallback(
    (newPlan: WeeklyPlan) => {
      setWeeklyPlan(newPlan)
      saveWeeklyPlan(weekKey, newPlan)
      syncPlanToServer(weekKey, newPlan)
    },
    [weekKey]
  )

  const setMeal = useCallback(
    (day: DayKey, meal: Meal) => updatePlan({ ...weeklyPlan, [day]: meal }),
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

  return { weeklyPlan, weekOffset, setWeekOffset, setMeal, removeMeal, toggleVacation }
}
