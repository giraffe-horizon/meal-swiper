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
        const isEaten = weeklyPlan[`${day}_eaten`]
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
                : 'hover:bg-slate-100 dark:hover:bg-surface-dark'
            } ${isFree ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {showThumbnails && (
              <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-surface-dark shrink-0">
                {meal ? (
                  <div className="absolute inset-0 bg-slate-200 dark:bg-surface-dark flex items-center justify-center">
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
                      <span className="material-symbols-outlined text-slate-400 text-sm">
                        restaurant
                      </span>
                    )}
                    {isEaten && (
                      <div className="absolute inset-0 bg-green-500/40 flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-[20px] font-bold">
                          check
                        </span>
                      </div>
                    )}
                  </div>
                ) : isFree ? (
                  <span className="text-lg">✈️</span>
                ) : (
                  <span className="material-symbols-outlined text-slate-400 text-[20px]">
                    restaurant_menu
                  </span>
                )}
              </div>
            )}
            <span
              className={`text-xs font-semibold flex items-center gap-1 ${
                isActive ? 'text-primary' : 'text-slate-600 dark:text-text-secondary-dark'
              }`}
            >
              {shortName}
              {isEaten && !showThumbnails && (
                <span className="material-symbols-outlined text-[14px] text-green-500 font-bold">
                  check_circle
                </span>
              )}
            </span>
            {dateLabel && (
              <span className="text-[10px] text-slate-400 hidden sm:block">{dateLabel}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
