'use client'

import type { WeeklyPlan, DayKey } from '@/types'
import { DAY_KEYS, formatDateShort } from '@/lib/utils'

interface DaySelectorProps {
  weeklyPlan: WeeklyPlan
  weekDates: Date[]
  selectedDay: DayKey | null
  onSelect: (day: DayKey) => void
  showThumbnails?: boolean
}

export default function DaySelector({
  weeklyPlan,
  weekDates,
  selectedDay,
  onSelect,
  showThumbnails = false,
}: DaySelectorProps) {
  const shortNames = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt']

  return (
    <div className="flex gap-2 px-4 py-1 sm:py-2 overflow-x-auto scrollbar-none justify-center">
      {DAY_KEYS.map((day, idx) => {
        const meal = weeklyPlan[day]
        const isFree = weeklyPlan[`${day}_free`]
        const isActive = selectedDay === day
        const shortName = shortNames[idx]
        const dateLabel = weekDates[idx] ? formatDateShort(weekDates[idx]) : ''

        return (
          <button
            key={day}
            onClick={() => !isFree && onSelect(day)}
            disabled={isFree}
            className={`flex flex-col items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl transition-all ${
              isActive
                ? 'bg-primary/20 ring-2 ring-primary shadow-sm'
                : 'hover:bg-surface-container-low'
            } ${isFree ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {showThumbnails && (
              <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden flex items-center justify-center bg-surface-container-low shrink-0">
                {meal ? (
                  <div className="absolute inset-0 bg-surface-container flex items-center justify-center">
                    {meal.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={meal.photo_url}
                        alt={meal.nazwa}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    ) : (
                      <span className="material-symbols-outlined text-on-surface-variant text-sm">
                        restaurant
                      </span>
                    )}
                  </div>
                ) : isFree ? (
                  <span className="text-lg">✈️</span>
                ) : (
                  <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
                    restaurant_menu
                  </span>
                )}
              </div>
            )}
            <span
              className={`text-xs font-semibold ${
                isActive ? 'text-primary' : 'text-on-surface-variant'
              }`}
            >
              {shortName}
            </span>
            {dateLabel && (
              <span className="text-[10px] text-on-surface-variant/60 hidden sm:block">
                {dateLabel}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
