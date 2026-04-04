import { useMemo } from 'react'
import { getWeekKey, getWeekDates, formatWeekRange } from '@/lib/utils'

export function useWeekDates(weekOffset: number) {
  return useMemo(() => {
    const weekKey = getWeekKey(weekOffset)
    const dates = getWeekDates(weekOffset)
    const range = formatWeekRange(dates)
    return { weekKey, dates, range }
  }, [weekOffset])
}
