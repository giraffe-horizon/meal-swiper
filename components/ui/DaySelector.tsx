'use client'

import type { WeeklyPlan, DayKey } from '@/types'
import { DAY_KEYS } from '@/lib/utils'

interface DaySelectorProps {
  weeklyPlan: WeeklyPlan
  weekDates: Date[]
  selectedDay: DayKey | null
  onSelect: (day: DayKey) => void
}

export default function DaySelector({
  weeklyPlan,
  weekDates,
  selectedDay,
  onSelect,
}: DaySelectorProps) {
  const shortNames = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt']

  return (
    <div className="flex justify-between gap-2 overflow-x-auto pb-4 px-4 hide-scrollbar">
      {DAY_KEYS.map((day, idx) => {
        const isFree = weeklyPlan[`${day}_free`]
        const isActive = selectedDay === day
        const shortName = shortNames[idx].toUpperCase()

        return (
          <button
            key={day}
            onClick={() => !isFree && onSelect(day)}
            disabled={isFree}
            className={`flex flex-col items-center justify-center min-w-[44px] w-[44px] h-[44px] rounded-xl transition-all ${
              isActive
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
            } ${isFree ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span className="text-[9px] font-bold uppercase leading-none">
              {shortName}
            </span>
            {weekDates[idx] && (
              <span className="text-[15px] font-bold leading-none mt-0.5">
                {weekDates[idx].getDate()}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
