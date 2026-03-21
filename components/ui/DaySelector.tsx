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
    <div className="flex justify-between gap-2 overflow-x-auto pb-4 hide-scrollbar">
      {DAY_KEYS.map((day, idx) => {
        const isFree = weeklyPlan[`${day}_free`]
        const isActive = selectedDay === day
        const shortName = shortNames[idx]

        return (
          <button
            key={day}
            onClick={() => !isFree && onSelect(day)}
            disabled={isFree}
            className={`flex flex-col items-center justify-center min-w-[56px] py-3 px-3 rounded-2xl transition-all ${
              isActive
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
            } ${isFree ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span
              className={`font-label text-[10px] font-bold uppercase ${
                isActive ? 'opacity-80' : ''
              }`}
            >
              {shortName}
            </span>
            {weekDates[idx] && (
              <span className="font-headline text-lg font-black">{weekDates[idx].getDate()}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
