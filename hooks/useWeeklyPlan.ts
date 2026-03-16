'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Meal, DayKey, WeeklyPlan } from '@/types'
import { getWeeklyPlan, saveWeeklyPlan, createDefaultPlan } from '@/lib/storage'
import { getWeekKey } from '@/lib/utils'

function tenantHeaders(token: string | null): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['X-Tenant-Token'] = token
  return headers
}

function syncPlanToServer(weekKey: string, plan: WeeklyPlan, token: string | null): void {
  fetch('/api/plan', {
    method: 'POST',
    headers: tenantHeaders(token),
    body: JSON.stringify({ week: weekKey, plan }),
  }).catch(() => {})
}

export function useWeeklyPlan(tenantToken: string | null = null) {
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
    const headers: Record<string, string> = {}
    if (tenantToken) headers['X-Tenant-Token'] = tenantToken

    fetch(`/api/plan?week=${encodeURIComponent(weekKey)}`, { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((serverPlan: WeeklyPlan | null) => {
        if (serverPlan) {
          setWeeklyPlan(serverPlan)
          saveWeeklyPlan(weekKey, serverPlan)
        }
      })
      .catch(() => {}) // graceful degradation — zostaw lokalny plan
  }, [weekKey, tenantToken])

  const updatePlan = useCallback(
    (newPlan: WeeklyPlan) => {
      setWeeklyPlan(newPlan)
      saveWeeklyPlan(weekKey, newPlan)
      syncPlanToServer(weekKey, newPlan, tenantToken)
    },
    [weekKey, tenantToken]
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
