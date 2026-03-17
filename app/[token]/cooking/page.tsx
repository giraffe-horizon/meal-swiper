'use client'

import { useState, useMemo } from 'react'
import { useAppContext } from '@/lib/context'
import { DAY_KEYS } from '@/lib/utils'
import { useWeekDates } from '@/hooks/useWeekDates'
import type { DayKey } from '@/types'
import DaySelector from '@/components/ui/DaySelector'
import CookingView from '@/components/cooking/CookingView'

function getTodayDayKey(): DayKey | null {
  const today = new Date().getDay()
  const dayMap: Record<number, DayKey> = { 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri' }
  return dayMap[today] ?? null
}

function getDefaultDay(weeklyPlan: ReturnType<typeof useAppContext>['weeklyPlan']): DayKey | null {
  const todayKey = getTodayDayKey()
  if (todayKey && weeklyPlan[todayKey]) return todayKey
  for (const key of DAY_KEYS) {
    if (weeklyPlan[key]) return key
  }
  return null
}

export default function CookingPage() {
  const { weeklyPlan, weekOffset, settings, scaleFactor, getVariantAssignment } = useAppContext()
  const { weekDates } = useWeekDates(weekOffset)

  const defaultDay = useMemo(() => getDefaultDay(weeklyPlan), [weeklyPlan])
  const [selectedDay, setSelectedDay] = useState<DayKey | null>(null)

  const effectiveDay = selectedDay && weeklyPlan[selectedDay] ? selectedDay : defaultDay
  const meal = effectiveDay ? weeklyPlan[effectiveDay] : null
  const variantAssignment = meal ? getVariantAssignment(meal.id) : null

  const handleDaySelect = (day: DayKey) => setSelectedDay(day)

  return (
    <div className="flex-1 overflow-y-auto min-h-0">
      <DaySelector
        weeklyPlan={weeklyPlan}
        weekDates={weekDates}
        selectedDay={effectiveDay}
        onSelect={handleDaySelect}
      />

      {meal ? (
        <CookingView
          key={effectiveDay}
          meal={meal}
          people={settings.people}
          scaleFactor={scaleFactor}
          persons={settings.persons}
          variantAssignment={variantAssignment}
        />
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <div className="text-6xl mb-4">🍽️</div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            Brak zaplanowanego posiłku
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Zaplanuj posiłki w zakładce Plan, aby zobaczyć przepis.
          </p>
        </div>
      )}
    </div>
  )
}
