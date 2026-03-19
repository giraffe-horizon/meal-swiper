'use client'

import { useState } from 'react'
import type { Meal, DayKey } from '@/types'
import MealImagePlaceholder from '@/components/ui/MealImagePlaceholder'

interface DayCardProps {
  day: DayKey
  meal: Meal | null
  isFree: boolean
  _dateStr: string
  _dayName: string
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
  _dateStr,
  _dayName,
  people,
  onDayClick,
  onRemoveMeal,
  onToggleVacation,
  onMealClick,
}: DayCardProps) {
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

  if (meal) {
    return (
      <div
        data-testid={`day-card-${day}`}
        onContextMenu={handleContextMenu}
        className="bg-surface-container rounded-lg overflow-hidden flex h-40 shadow-lg"
      >
        <div className="w-1/3 relative overflow-hidden">
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
              iconSize="text-4xl"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-surface-container/20"></div>
        </div>
        <div className="w-2/3 p-5 flex flex-col justify-between">
          <div>
            <span className="font-label text-[10px] uppercase tracking-widest text-primary font-bold mb-1 block">
              {meal.category || 'Posiłek'}
            </span>
            <h3 className="font-headline text-xl font-bold leading-tight text-on-surface mb-2">
              {meal.nazwa}
            </h3>
            <button
              type="button"
              onClick={() => onMealClick(meal)}
              className="text-primary hover:text-primary-container text-sm font-semibold transition-colors"
            >
              Zobacz przepis →
            </button>
          </div>
          <div className="flex gap-3">
            <div className="bg-surface-container-highest px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-tertiary/10">
              <span
                className="material-symbols-outlined text-tertiary text-sm"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                bolt
              </span>
              <span className="font-label text-xs text-on-surface font-bold">
                {Math.round((meal.kcal_baza * people) / 2)} kcal
              </span>
            </div>
            <div className="bg-surface-container-highest px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-tertiary/10">
              <span
                className="material-symbols-outlined text-tertiary text-sm"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                fitness_center
              </span>
              <span className="font-label text-xs text-on-surface font-bold">
                {Math.round((meal.bialko_baza * people) / 2)}g protein
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <button
      data-testid={`day-card-${day}`}
      onClick={() => onDayClick(day)}
      onContextMenu={handleContextMenu}
      className="w-full h-32 border-2 border-dashed border-outline-variant/40 rounded-lg flex flex-col items-center justify-center gap-2 text-on-surface-variant hover:border-primary/50 hover:bg-surface-container-low transition-all group"
    >
      <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary transition-colors">
        <span className="material-symbols-outlined">add</span>
      </div>
      <span className="font-body text-sm font-medium">Dodaj posiłek</span>
    </button>
  )
}
