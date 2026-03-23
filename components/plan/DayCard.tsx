'use client'

import { useState, useEffect } from 'react'
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
  dateStr: _dateStr,
  dayName: _dayName,
  people: _people,
  onDayClick,
  onRemoveMeal,
  onToggleVacation,
  onMealClick,
}: DayCardProps) {
  const [imgError, setImgError] = useState(false)
  const [activeMenu, setActiveMenu] = useState(false)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveMenu(false)
    }

    if (activeMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [activeMenu])

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

  if (meal) {
    return (
      <div
        data-testid={`day-card-${day}`}
        onContextMenu={handleContextMenu}
        onClick={() => onMealClick(meal)}
        className="bg-surface-container rounded-xl flex items-center h-16 relative cursor-pointer group"
      >
        {/* Thumbnail */}
        <div className="w-12 h-12 min-w-[48px] rounded-lg overflow-hidden ml-2 shrink-0">
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
              iconSize="text-xl"
            />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 px-3">
          <h3 className="font-headline text-sm font-bold leading-tight text-on-surface truncate">
            {meal.nazwa}
          </h3>
          <span className="font-label text-[10px] uppercase tracking-widest text-primary font-bold">
            {meal.category || meal.kuchnia || 'Posiłek'}
          </span>
        </div>

        {/* Context menu */}
        <div className="pr-2 z-10">
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setActiveMenu(!activeMenu)
              }}
              className="p-1.5 hover:bg-surface-container-high rounded-full transition-colors"
            >
              <span className="material-symbols-outlined text-on-surface-variant text-lg">
                more_vert
              </span>
            </button>
            {activeMenu && (
              <div className="absolute right-0 top-8 bg-surface-container-highest border border-outline-variant/20 rounded-lg shadow-lg py-1 min-w-[140px] z-50">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDayClick(day)
                    setActiveMenu(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-surface-container-high transition-colors"
                >
                  Zmień danie
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemoveMeal(day)
                    setActiveMenu(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-surface-container-high transition-colors"
                >
                  Usuń danie
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleVacation(day)
                    setActiveMenu(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-surface-container-high transition-colors"
                >
                  Oznacz jako wolny
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Vacation view
  if (isFree) {
    return (
      <div
        data-testid={`day-card-${day}`}
        className="w-full h-32 bg-surface-container rounded-lg flex items-center justify-center gap-2 text-on-surface relative overflow-hidden"
      >
        <div className="absolute top-2 right-3 z-10">
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setActiveMenu(!activeMenu)
              }}
              className="p-1.5 hover:bg-surface-container-high rounded-full transition-colors"
            >
              <span className="material-symbols-outlined text-on-surface-variant text-lg">
                more_vert
              </span>
            </button>
            {activeMenu && (
              <div className="absolute right-0 top-8 bg-surface-container-highest border border-outline-variant/20 rounded-lg shadow-lg py-1 min-w-[140px] z-50">
                <button
                  onClick={() => {
                    onToggleVacation(day)
                    setActiveMenu(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-surface-container-high transition-colors"
                >
                  Anuluj urlop
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-tertiary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl text-tertiary">flight</span>
          </div>
          <span className="font-headline text-lg font-bold text-tertiary">Urlop</span>
        </div>
      </div>
    )
  }

  // Empty day view
  return (
    <div data-testid={`day-card-${day}`} className="flex gap-2" onContextMenu={handleContextMenu}>
      <button
        onClick={() => onDayClick(day)}
        className="flex-1 h-14 border border-dashed border-outline-variant/30 rounded-xl flex items-center justify-center gap-1.5 text-on-surface-variant hover:border-primary/50 hover:bg-surface-container-low transition-all"
      >
        <span className="material-symbols-outlined text-base">add</span>
        <span className="font-body text-xs font-medium">Dodaj posiłek</span>
      </button>
      <button
        onClick={() => onToggleVacation(day)}
        className="h-14 px-3 border border-dashed border-outline-variant/30 rounded-xl flex items-center justify-center text-on-surface-variant hover:border-tertiary/50 transition-all"
        title="Oznacz jako wolny dzień"
      >
        <span className="material-symbols-outlined text-base">flight</span>
      </button>
    </div>
  )
}
