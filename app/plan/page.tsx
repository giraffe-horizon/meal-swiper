'use client'

import { useRouter } from 'next/navigation'
import type { DayKey } from '@/types'
import { useAppContext } from '@/lib/context'
import CalendarView from '@/components/CalendarView'

export default function PlanPage() {
  const router = useRouter()
  const { weeklyPlan, weekOffset, removeMeal, toggleVacation, setCurrentSwipeDay } = useAppContext()

  const handleDayClick = (day: DayKey) => {
    if (weeklyPlan[`${day}_free`]) return
    setCurrentSwipeDay(day)
    router.push('/swipe')
  }

  return (
    <CalendarView
      weeklyPlan={weeklyPlan}
      onDayClick={handleDayClick}
      onRemoveMeal={removeMeal}
      onToggleVacation={toggleVacation}
      weekOffset={weekOffset}
    />
  )
}
