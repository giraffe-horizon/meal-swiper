'use client'

import { useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useAppContext } from '@/lib/context'
import { DAY_KEYS, getWeekDates } from '@/lib/utils'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

const SwipeView = dynamic(() => import('@/components/SwipeView'), {
  ssr: false,
  loading: () => <LoadingSpinner />,
})

export default function SwipePage() {
  const router = useRouter()
  const {
    meals,
    weeklyPlan,
    weekOffset,
    currentSwipeDay,
    setCurrentSwipeDay,
    handleSwipeRight,
    allDaysFilled,
  } = useAppContext()
  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset])

  // Jeśli żaden dzień nie wybrany lub wybrany dzień jest wolny → pierwszy pusty dzień
  const effectiveDay = useMemo(() => {
    const isValidDay =
      currentSwipeDay && !weeklyPlan[currentSwipeDay] && !weeklyPlan[`${currentSwipeDay}_free`]
    if (isValidDay) return currentSwipeDay
    return DAY_KEYS.find((d) => !weeklyPlan[d] && !weeklyPlan[`${d}_free`]) ?? null
  }, [currentSwipeDay, weeklyPlan])

  const handleComplete = useCallback(() => {
    setCurrentSwipeDay(null)
    router.push('/plan')
  }, [setCurrentSwipeDay, router])

  const handleSkipDay = useCallback(() => {
    // Find the next empty day after the current one
    const currentIdx = currentSwipeDay ? DAY_KEYS.indexOf(currentSwipeDay) : -1
    const nextEmptyDay =
      DAY_KEYS.find((d, i) => {
        if (i <= currentIdx) return false
        return !weeklyPlan[d] && !weeklyPlan[`${d}_free`]
      }) ?? null

    if (nextEmptyDay) {
      setCurrentSwipeDay(nextEmptyDay)
    } else {
      handleComplete()
    }
  }, [currentSwipeDay, weeklyPlan, setCurrentSwipeDay, handleComplete])

  return (
    <SwipeView
      meals={meals}
      onSwipeRight={(meal) => {
        handleSwipeRight(meal)
      }}
      currentDay={effectiveDay}
      onComplete={handleComplete}
      weeklyPlan={weeklyPlan}
      onSkipAll={handleComplete}
      onSkipDay={handleSkipDay}
      weekOffset={weekOffset}
      weekDates={weekDates}
      onDaySelect={setCurrentSwipeDay}
      allDaysFilled={allDaysFilled}
    />
  )
}
