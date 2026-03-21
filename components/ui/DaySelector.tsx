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
        const shortName = shortNames[idx].toUpperCase()

        return (
          <button
            key={day}
            onClick={() => !isFree && onSelect(day)}
            disabled={isFree}
            className={`flex flex-col items-center justify-center min-w-[56px] w-[56px] h-[56px] rounded-2xl transition-all ${
              isActive
                ? 'bg-primary text-[#2A3D2C]'
                : 'bg-[#1C2E1F] text-white hover:bg-surface-container-high'
            } ${isFree ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span className="font-label text-[10px] font-bold uppercase leading-none">
              {shortName}
            </span>
            {weekDates[idx] && (
              <span className="font-headline text-[18px] font-black leading-none mt-1">
                {weekDates[idx].getDate()}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
