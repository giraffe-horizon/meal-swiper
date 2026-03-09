'use client'

import { useState, useEffect } from 'react'
import type { Meal, DayKey, WeeklyPlan } from '@/types'
import { useWeekDates } from '@/hooks/useWeekDates'
import { DAY_KEYS, DAY_NAMES, formatDateShort } from '@/lib/utils'
import MealModal from '@/components/MealModal'

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
  const [activeMenu, setActiveMenu] = useState<DayKey | null>(null)
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null)
  const { weekDates } = useWeekDates(weekOffset)

  const handleContextMenu = (e: React.MouseEvent, day: DayKey) => {
    e.preventDefault()
    const isFree = weeklyPlan[`${day}_free`]
    const hasMeal = weeklyPlan[day]

    const action = window.confirm(
      isFree
        ? 'Usuń oznaczenie wolnego dnia?'
        : hasMeal
          ? 'Co chcesz zrobić?\nOK = Usuń danie\nCancel = Oznacz jako wolny'
          : 'Oznaczyć jako wolny dzień?'
    )

    if (isFree) {
      if (action) onToggleVacation(day)
    } else if (hasMeal) {
      if (action) {
        onRemoveMeal(day)
      } else {
        onToggleVacation(day)
      }
    } else {
      if (action) onToggleVacation(day)
    }
  }

  useEffect(() => {
    const handleClickOutside = () => setActiveMenu(null)
    if (activeMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [activeMenu])

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-background-light dark:bg-background-dark">
      {/* Daily Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 px-4 flex-1 min-h-0 pb-4 pt-4">
        {DAY_KEYS.map((day, index) => {
          const meal = weeklyPlan[day]
          const isFree = weeklyPlan[`${day}_free`]
          const dateStr = formatDateShort(weekDates[index])

          if (isFree) {
            return (
              <div
                key={day}
                data-testid={`day-card-${day}`}
                onContextMenu={(e) => handleContextMenu(e, day)}
                className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-3 sm:p-4 flex items-center justify-between opacity-70 group relative"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-slate-500">flight_takeoff</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">
                      {DAY_NAMES[index]}, {dateStr}
                    </p>
                    <p className="text-base font-bold text-slate-600 dark:text-slate-300">Urlop</p>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveMenu(activeMenu === day ? null : day)
                    }}
                    className="p-2 shrink-0 opacity-100 transition-opacity hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
                  >
                    <span className="material-symbols-outlined text-slate-500">more_vert</span>
                  </button>
                  {activeMenu === day && (
                    <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-50 min-w-[180px]">
                      <button
                        onClick={() => {
                          setActiveMenu(null)
                          onToggleVacation(day)
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-300"
                      >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                        Anuluj urlop
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          }

          if (meal) {
            return (
              <div
                key={day}
                data-testid={`day-card-${day}`}
                onContextMenu={(e) => handleContextMenu(e, day)}
                className="bg-white dark:bg-slate-900 rounded-xl p-3 sm:p-4 shadow-sm flex items-center justify-between border border-slate-100 dark:border-slate-800 group relative"
              >
                <button
                  type="button"
                  onClick={() => setSelectedMeal(meal)}
                  className="flex items-center gap-4 min-w-0 flex-1 text-left cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <div
                    className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-cover bg-center shadow-sm shrink-0"
                    style={{ backgroundImage: `url(${meal.photo_url})` }}
                  />
                  <div className="flex flex-col min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">
                      {DAY_NAMES[index]}, {dateStr}
                    </p>
                    <p className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                      {meal.nazwa}
                    </p>
                    {meal.nazwa && meal.prep_time && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {meal.prep_time} min &bull; {meal.kcal_baza} kcal
                      </p>
                    )}
                  </div>
                </button>
                <div className="relative">
                  <button
                    onClick={() => setActiveMenu(activeMenu === day ? null : day)}
                    className="p-2 shrink-0 opacity-100 transition-opacity hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                  >
                    <span className="material-symbols-outlined text-slate-400">more_vert</span>
                  </button>
                  {activeMenu === day && (
                    <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-50 min-w-[180px]">
                      <button
                        onClick={() => {
                          setActiveMenu(null)
                          onDayClick(day)
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-300"
                      >
                        <span className="material-symbols-outlined text-[18px]">sync_alt</span>
                        Zmień danie
                      </button>
                      <button
                        onClick={() => {
                          setActiveMenu(null)
                          onRemoveMeal(day)
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-red-600 dark:text-red-400"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                        Usuń danie
                      </button>
                      <button
                        onClick={() => {
                          setActiveMenu(null)
                          onToggleVacation(day)
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-300"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          flight_takeoff
                        </span>
                        Oznacz jako wolny
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          }

          return (
            <div
              key={day}
              data-testid={`day-card-${day}`}
              onClick={() => onDayClick(day)}
              onContextMenu={(e) => handleContextMenu(e, day)}
              className="bg-white dark:bg-slate-900 rounded-xl p-3 sm:p-4 shadow-sm flex items-center justify-between border border-slate-100 dark:border-slate-800 border-dashed cursor-pointer hover:border-primary/50 transition-colors group"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-slate-400">restaurant_menu</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">
                    {DAY_NAMES[index]}, {dateStr}
                  </p>
                  <p className="text-base font-medium text-slate-400 dark:text-slate-500 italic">
                    Brak planu
                  </p>
                </div>
              </div>
              <button className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors shrink-0">
                <span className="material-symbols-outlined text-primary">add</span>
              </button>
              <div className="relative ml-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveMenu(activeMenu === day ? null : day)
                  }}
                  className="p-2 shrink-0 opacity-100 transition-opacity hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  <span className="material-symbols-outlined text-slate-400">more_vert</span>
                </button>
                {activeMenu === day && (
                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-50 min-w-[180px]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setActiveMenu(null)
                        onDayClick(day)
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-300"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                      Dodaj danie
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setActiveMenu(null)
                        onToggleVacation(day)
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-300"
                    >
                      <span className="material-symbols-outlined text-[18px]">flight_takeoff</span>
                      Oznacz jako wolny
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Meal Detail Modal */}
      <MealModal meal={selectedMeal} onClose={() => setSelectedMeal(null)} />
    </div>
  )
}
