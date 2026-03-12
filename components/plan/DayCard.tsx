'use client'

import { useState } from 'react'
import type { Meal, DayKey } from '@/types'
import MealImagePlaceholder from '@/components/ui/MealImagePlaceholder'

interface DayCardProps {
  day: DayKey
  meal: Meal | null
  isFree: boolean
  dateStr: string
  dayName: string
  people: number
  onDayClick: (day: DayKey) => void
  onRemoveMeal: (day: DayKey) => void
  onToggleVacation: (day: DayKey) => void
  onMealClick: (meal: Meal) => void
}

export default function DayCard({
  day,
  meal,
  isFree,
  dateStr,
  dayName,
  people,
  onDayClick,
  onRemoveMeal,
  onToggleVacation,
  onMealClick,
}: DayCardProps) {
  const [activeMenu, setActiveMenu] = useState(false)
  const [imgError, setImgError] = useState(false)

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    const action = window.confirm(
      isFree
        ? 'Usuń oznaczenie wolnego dnia?'
        : meal
          ? 'Co chcesz zrobić?\nOK = Usuń danie\nCancel = Oznacz jako wolny'
          : 'Oznaczyć jako wolny dzień?'
    )
    if (isFree) {
      if (action) onToggleVacation(day)
    } else if (meal) {
      if (action) onRemoveMeal(day)
      else onToggleVacation(day)
    } else {
      if (action) onToggleVacation(day)
    }
  }

  if (isFree) {
    return (
      <div
        data-testid={`day-card-${day}`}
        onContextMenu={handleContextMenu}
        className="bg-slate-100 dark:bg-surface-dark/50 rounded-xl p-3 sm:p-4 flex items-center justify-between opacity-70 group relative"
      >
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-slate-500">flight_takeoff</span>
          </div>
          <div className="flex flex-col min-w-0">
            <p className="text-sm font-medium text-slate-500 dark:text-text-secondary-dark truncate">
              {dayName}, {dateStr}
            </p>
            <p className="text-base font-bold text-slate-600 dark:text-text-secondary-dark">
              Urlop
            </p>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setActiveMenu(!activeMenu)
            }}
            className="p-2 shrink-0 opacity-100 transition-opacity hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
          >
            <span className="material-symbols-outlined text-slate-500">more_vert</span>
          </button>
          {activeMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-surface-dark rounded-lg shadow-lg border border-slate-200 dark:border-border-dark py-2 z-50 min-w-[180px]">
              <button
                onClick={() => {
                  setActiveMenu(false)
                  onToggleVacation(day)
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-text-secondary-dark"
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
        data-testid={`day-card-${day}`}
        onContextMenu={handleContextMenu}
        className="bg-white dark:bg-surface-dark rounded-xl p-3 sm:p-4 shadow-sm flex items-center justify-between border border-slate-100 dark:border-border-dark group relative"
      >
        <button
          type="button"
          onClick={() => onMealClick(meal)}
          className="flex items-center gap-4 min-w-0 flex-1 text-left cursor-pointer hover:opacity-80 transition-opacity"
        >
          <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-sm shrink-0 overflow-hidden">
            {meal.photo_url && !imgError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={meal.photo_url}
                alt={meal.nazwa}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <MealImagePlaceholder
                category={meal.category}
                className="w-full h-full"
                iconSize="text-2xl"
              />
            )}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-500 dark:text-text-secondary-dark truncate">
              {dayName}, {dateStr}
            </p>
            <p className="text-base font-bold text-slate-900 dark:text-text-primary-dark truncate">
              {meal.nazwa}
            </p>
            {meal.nazwa && meal.prep_time && (
              <p className="text-xs text-slate-500 dark:text-text-secondary-dark mt-0.5">
                {meal.prep_time} min &bull; {Math.round((meal.kcal_baza * people) / 2)} kcal
              </p>
            )}
          </div>
        </button>
        <div className="relative">
          <button
            onClick={() => setActiveMenu(!activeMenu)}
            className="p-2 shrink-0 opacity-100 transition-opacity hover:bg-slate-100 dark:hover:bg-surface-dark rounded-lg"
          >
            <span className="material-symbols-outlined text-slate-400">more_vert</span>
          </button>
          {activeMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-surface-dark rounded-lg shadow-lg border border-slate-200 dark:border-border-dark py-2 z-50 min-w-[180px]">
              <button
                onClick={() => {
                  setActiveMenu(false)
                  onDayClick(day)
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-text-secondary-dark"
              >
                <span className="material-symbols-outlined text-[18px]">sync_alt</span>
                Zmień danie
              </button>
              <button
                onClick={() => {
                  setActiveMenu(false)
                  onRemoveMeal(day)
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-red-600 dark:text-red-400"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
                Usuń danie
              </button>
              <button
                onClick={() => {
                  setActiveMenu(false)
                  onToggleVacation(day)
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-text-secondary-dark"
              >
                <span className="material-symbols-outlined text-[18px]">flight_takeoff</span>
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
      data-testid={`day-card-${day}`}
      onClick={() => onDayClick(day)}
      onContextMenu={handleContextMenu}
      className="bg-white dark:bg-surface-dark rounded-xl p-3 sm:p-4 shadow-sm flex items-center justify-between border border-slate-100 dark:border-border-dark border-dashed cursor-pointer hover:border-primary/50 transition-colors group"
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-slate-50 dark:bg-surface-dark border-2 border-dashed border-slate-200 dark:border-border-dark flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-slate-400">restaurant_menu</span>
        </div>
        <div className="flex flex-col min-w-0">
          <p className="text-sm font-medium text-slate-500 dark:text-text-secondary-dark truncate">
            {dayName}, {dateStr}
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
            setActiveMenu(!activeMenu)
          }}
          className="p-2 shrink-0 opacity-100 transition-opacity hover:bg-slate-100 dark:hover:bg-surface-dark rounded-lg"
        >
          <span className="material-symbols-outlined text-slate-400">more_vert</span>
        </button>
        {activeMenu && (
          <div className="absolute right-0 top-full mt-1 bg-white dark:bg-surface-dark rounded-lg shadow-lg border border-slate-200 dark:border-border-dark py-2 z-50 min-w-[180px]">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setActiveMenu(false)
                onDayClick(day)
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-text-secondary-dark"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Dodaj danie
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setActiveMenu(false)
                onToggleVacation(day)
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-text-secondary-dark"
            >
              <span className="material-symbols-outlined text-[18px]">flight_takeoff</span>
              Oznacz jako wolny
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
