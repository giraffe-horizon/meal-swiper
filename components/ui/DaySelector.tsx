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
    <div className="flex justify-between gap-2 overflow-x-auto pb-4 hide-scrollbar">
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
            className={`flex flex-col items-center min-w-[56px] py-4 rounded-xl transition-all ${
              isActive
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
            } ${isFree ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {showThumbnails && (
              <div
                className={`relative w-10 h-10 rounded-full overflow-hidden flex items-center justify-center shrink-0 mb-1 ${
                  meal ? 'border-2 border-primary' : ''
                }`}
              >
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
              className={`font-label text-[10px] font-bold uppercase ${
                isActive ? 'opacity-80' : ''
              }`}
            >
              {shortName}
            </span>
            {dateLabel && (
              <span className="font-headline text-lg font-black">{dateLabel.split('.')[0]}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
