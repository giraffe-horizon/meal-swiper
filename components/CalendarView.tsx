'use client'

import { useState } from 'react'
import type { Meal, DayKey, WeeklyPlan } from '@/types'
import { useWeekDates } from '@/hooks/useWeekDates'
import { DAY_KEYS, DAY_NAMES, formatDateShort } from '@/lib/utils'
import MealModal from '@/components/MealModal'
import DayCard from '@/components/plan/DayCard'
import { useAppContext } from '@/lib/context'

interface CalendarViewProps {
  weeklyPlan: WeeklyPlan
  weekOffset: number
  onDayClick: (day: DayKey) => void
  onRemoveMeal: (day: DayKey) => void
  onToggleVacation: (day: DayKey) => void
}

export default function CalendarView({
  weeklyPlan,
  weekOffset,
  onDayClick,
  onRemoveMeal,
  onToggleVacation,
}: CalendarViewProps) {
  const { settings } = useAppContext()
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null)
  const { weekDates } = useWeekDates(weekOffset)

  return (
    <main className="max-w-2xl mx-auto px-6 pb-6">
      {/* Horizontal Calendar Scroll */}
      <div className="flex justify-between gap-2 overflow-x-auto pb-4 mb-10 hide-scrollbar">
        {DAY_KEYS.map((day, index) => {
          const isActive = weeklyPlan[day] !== null || weeklyPlan[`${day}_free`]
          return (
            <div
              key={day}
              className={`flex flex-col items-center min-w-[56px] py-4 rounded-xl cursor-pointer transition-colors ${
                isActive
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
              }`}
              onClick={() => onDayClick(day)}
            >
              <span className="font-label text-[10px] font-bold uppercase opacity-80">
                {DAY_NAMES[index].substring(0, 3)}
              </span>
              <span className="font-headline text-lg font-black">
                {formatDateShort(weekDates[index]).split('.')[0]}
              </span>
            </div>
          )
        })}
      </div>

      {/* Meal Grid */}
      <div className="space-y-8">
        {DAY_KEYS.map((day, index) => (
          <section key={day}>
            <div className="flex items-center gap-3 mb-4">
              <span className="font-headline text-lg font-bold text-on-surface">
                {DAY_NAMES[index]}
              </span>
              <div className="h-[1px] flex-grow bg-outline-variant/30"></div>
            </div>
            <DayCard
              day={day}
              meal={weeklyPlan[day]}
              isFree={weeklyPlan[`${day}_free`]}
              dateStr={formatDateShort(weekDates[index])}
              dayName={DAY_NAMES[index]}
              people={settings.people}
              onDayClick={onDayClick}
              onRemoveMeal={onRemoveMeal}
              onToggleVacation={onToggleVacation}
              onMealClick={setSelectedMeal}
            />
          </section>
        ))}
      </div>

      <MealModal meal={selectedMeal} onClose={() => setSelectedMeal(null)} />
    </main>
  )
}
