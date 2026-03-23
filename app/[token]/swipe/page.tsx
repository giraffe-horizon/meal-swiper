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
    shuffledMeals,
    currentSwipeIndex,
    seenIds,
    setCurrentSwipeIndex,
    setShuffledMeals,
    setSeenIds,
    tenantToken,
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
    router.push(`/${tenantToken}/plan`)
  }, [setCurrentSwipeDay, router, tenantToken])

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

  // Jeśli wszystkie dni wypełnione/wolne, pokazujemy komunikat zamiast SwipeView
  if (allDaysFilled) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background p-6">
        <div className="text-center max-w-md">
          <span className="material-symbols-outlined text-primary text-7xl mb-4 inline-block">
            check_circle
          </span>
          <h2 className="text-2xl font-bold text-on-surface font-headline mb-2">
            Tydzień wypełniony!
          </h2>
          <p className="text-on-surface-variant font-body mb-6">
            Wszystkie dni mają przypisane posiłki lub są oznaczone jako wolne. Możesz wrócić do
            planu lub przejść do listy zakupów.
          </p>
          <button
            onClick={() => router.push(`/${tenantToken}/plan`)}
            className="px-6 py-3 bg-primary text-on-primary rounded-full font-bold shadow-[0_0_30px_rgba(105,221,150,0.3)] hover:bg-primary/90 transition-colors"
          >
            Wróć do planu
          </button>
        </div>
      </div>
    )
  }

  return (
    <SwipeView
      meals={meals}
      onSwipeRight={(meal) => {
        handleSwipeRight(meal)
      }}
      currentDay={effectiveDay}
      onComplete={handleComplete}
      weeklyPlan={weeklyPlan}
      onSkipDay={handleSkipDay}
      weekOffset={weekOffset}
      weekDates={weekDates}
      onDaySelect={setCurrentSwipeDay}
      allDaysFilled={allDaysFilled}
      shuffledMealsFromContext={shuffledMeals}
      currentSwipeIndexFromContext={currentSwipeIndex}
      seenIdsFromContext={seenIds}
      setCurrentSwipeIndexInContext={setCurrentSwipeIndex}
      setShuffledMealsInContext={setShuffledMeals}
      setSeenIdsInContext={setSeenIds}
    />
  )
}
