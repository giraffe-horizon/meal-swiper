'use client'

import { useState, useMemo } from 'react'
import type { Meal, DayKey, WeeklyPlan } from '@/types'
import { useWeekDates } from '@/hooks/useWeekDates'
import { DAY_KEYS, DAY_NAMES, formatDateShort, getWeekDates, formatWeekRange } from '@/lib/utils'
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
  const { settings, setWeekOffset } = useAppContext()
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null)
  const { weekDates } = useWeekDates(weekOffset)

  const allWeekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset])
  const weekRange = useMemo(() => formatWeekRange(allWeekDates), [allWeekDates])

  // Calculate week number
  const weekNumber = useMemo(() => {
    const d = new Date(allWeekDates[0])
    const startOfYear = new Date(d.getFullYear(), 0, 1)
    const diff = d.getTime() - startOfYear.getTime()
    return Math.ceil((diff / 86400000 + startOfYear.getDay() + 1) / 7)
  }, [allWeekDates])

  return (
    <main className="max-w-2xl mx-auto px-6 pb-40">
      {/* Week Navigation Header */}
      <header className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setWeekOffset(weekOffset - 1)}
            className="p-2 rounded-full bg-surface-container-low hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant">chevron_left</span>
          </button>
          <div className="text-center">
            <h2 className="font-headline font-extrabold text-lg tracking-tight text-on-surface">
              {weekRange}
            </h2>
            <p className="font-label text-xs uppercase text-primary font-bold tracking-wide">
              TYDZIEŃ {weekNumber}
            </p>
          </div>
          <button
            onClick={() => setWeekOffset(weekOffset + 1)}
            className="p-2 rounded-full bg-surface-container-low hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
          </button>
        </div>
      </header>

      {/* Horizontal Calendar Scroll */}
      <div className="flex justify-between gap-2 overflow-x-auto pb-4 mb-10 hide-scrollbar">
        {DAY_KEYS.map((day, index) => {
          const hasContent = weeklyPlan[day] !== null || weeklyPlan[`${day}_free`]
          const dayNames = ['PON', 'WT', 'ŚR', 'CZW', 'PT']
          return (
            <div
              key={day}
              className={`flex flex-col items-center justify-center min-w-[44px] w-[44px] h-[44px] rounded-xl cursor-pointer transition-colors ${
                hasContent
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
              }`}
              onClick={() => onDayClick(day)}
            >
              <span className="font-label text-[9px] font-bold uppercase leading-none">
                {dayNames[index]}
              </span>
              <span className="font-headline text-[15px] font-bold leading-none mt-0.5">
                {weekDates[index]?.getDate()}
              </span>
            </div>
          )
        })}
      </div>

      {/* Meal Grid */}
      <div className="space-y-5">
        {DAY_KEYS.map((day, index) => (
          <section key={day}>
            <div className="flex items-center gap-3 mb-4">
              <span className="font-headline text-sm font-semibold text-on-surface">
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
