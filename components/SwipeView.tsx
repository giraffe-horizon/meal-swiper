'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import type { Meal, DayKey, WeeklyPlan, MealWithVariants } from '@/types'
import { DAY_NAMES_MAP } from '@/lib/utils'
import { toMealForModal } from '@/lib/meal-convert'
import MealModal from '@/components/MealModal'
import DaySelector from '@/components/ui/DaySelector'
import SwipeStack from '@/components/swipe/SwipeStack'
import SwipeActions from '@/components/swipe/SwipeActions'
import CompatibilityIndicator from '@/components/swipe/CompatibilityIndicator'
import { useAppContext } from '@/lib/context'
import { useSwipeGestures } from '@/hooks/useSwipeGestures'
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation'
import { useSwipeToast } from '@/hooks/useSwipeToast'

export interface SwipeViewProps {
  meals: (Meal | MealWithVariants)[]
  onSwipeRight: (meal: Meal | MealWithVariants) => void
  currentDay: DayKey | null
  onComplete: () => void
  weeklyPlan: WeeklyPlan
  onSkipDay?: () => void
  weekOffset?: number
  weekDates?: Date[]
  onDaySelect?: (day: DayKey) => void
  allDaysFilled?: boolean
  shuffledMealsFromContext?: (Meal | MealWithVariants)[]
  currentSwipeIndexFromContext?: number
  seenIdsFromContext?: string[]
  setCurrentSwipeIndexInContext?: (index: number) => void
  setShuffledMealsInContext?: (meals: (Meal | MealWithVariants)[]) => void
  setSeenIdsInContext?: (ids: string[]) => void
}

export default function SwipeView({
  meals,
  onSwipeRight,
  currentDay,
  onComplete,
  weeklyPlan,
  onSkipDay,
  weekOffset = 0,
  weekDates: weekDatesProp,
  onDaySelect,
  allDaysFilled = false,
  shuffledMealsFromContext = [],
  currentSwipeIndexFromContext = 0,
  seenIdsFromContext = [],
  setCurrentSwipeIndexInContext,
  setShuffledMealsInContext,
  setSeenIdsInContext,
}: SwipeViewProps) {
  const { settings } = useAppContext()
  const [modalMeal, setModalMeal] = useState<Meal | null>(null)
  const toast = useSwipeToast()
  const nav = useSwipeNavigation({
    meals,
    weeklyPlan,
    weekOffset,
    weekDatesProp,
    allDaysFilled,
    shuffledMealsFromContext,
    currentSwipeIndexFromContext,
    seenIdsFromContext,
    setCurrentSwipeIndexInContext,
    setShuffledMealsInContext,
    setSeenIdsInContext,
    onComplete,
    onSkipDay,
  })
  const { onSwipeRightRef, onSwipeLeftRef, ...gestures } = useSwipeGestures({
    modalOpen: !!modalMeal,
  })
  const ncb = useMemo(
    () => ({
      onSuccess: toast.triggerSuccess,
      onReshuffle: toast.showReshuffleToast,
      resetX: gestures.resetX,
      setAnimating: gestures.setIsAnimating,
    }),
    [toast.triggerSuccess, toast.showReshuffleToast, gestures.resetX, gestures.setIsAnimating]
  )

  const handleSwipeRight = useCallback(() => {
    if (!nav.currentMeal || gestures.isAnimating) return
    gestures.setIsAnimating(true)
    nav.trackSeen(nav.currentMeal.id)
    toast.showAddToast(
      `Dodano: ${nav.currentMeal.nazwa} do: ${currentDay ? DAY_NAMES_MAP[currentDay] : 'Wybierz dzień'}`
    )
    const meal = nav.currentMeal
    gestures.animateSwipe('right').then(() => {
      onSwipeRight(meal)
      nav.nextCard(ncb)
    })
  }, [nav, gestures, currentDay, toast, onSwipeRight, ncb])

  const handleSwipeLeft = useCallback(() => {
    if (gestures.isAnimating || !nav.currentMeal) return
    gestures.setIsAnimating(true)
    nav.trackSeen(nav.currentMeal.id)
    gestures.animateSwipe('left').then(() => nav.nextCard(ncb))
  }, [gestures, nav, ncb])

  useEffect(() => {
    onSwipeRightRef.current = handleSwipeRight
    onSwipeLeftRef.current = handleSwipeLeft
  }, [handleSwipeRight, handleSwipeLeft, onSwipeRightRef, onSwipeLeftRef])

  const handleCardTap = useCallback(
    (e: React.PointerEvent) => {
      if (Math.abs(e.clientX - gestures.dragStartX) < 10 && nav.currentMeal)
        setModalMeal(toMealForModal(nav.currentMeal))
    },
    [gestures.dragStartX, nav.currentMeal]
  )

  const handleReshuffle = useCallback(() => {
    toast.resetSuccess()
    setCurrentSwipeIndexInContext?.(0)
    gestures.resetX()
    gestures.setIsAnimating(false)
  }, [toast, setCurrentSwipeIndexInContext, gestures])

  if (toast.showSuccess) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background relative overflow-hidden">
        {toast.showConfetti && (
          <div className="absolute inset-0 pointer-events-none">
            {toast.confettiItems.map((item) => (
              <div
                key={item.id}
                className="absolute animate-bounce"
                style={{
                  left: `${item.left}%`,
                  top: '-10%',
                  animationDelay: `${item.delay}s`,
                  animationDuration: `${item.duration}s`,
                  fontSize: `${item.size}px`,
                }}
              >
                {item.emoji}
              </div>
            ))}
          </div>
        )}
        <div className="text-center z-10">
          <div className="text-6xl mb-4 animate-bounce">🎉</div>
          <h2 className="text-2xl font-bold text-on-surface">Wszystkie propozycje przejrzane!</h2>
          <p className="text-on-surface-variant mt-2">Nie ma więcej kart do przejrzenia</p>
          <button
            onClick={handleReshuffle}
            className="mt-6 px-6 py-3 bg-primary text-on-primary rounded-full font-bold shadow-[0_0_30px_rgba(105,221,150,0.3)] hover:bg-primary/90 transition-colors"
          >
            Losuj ponownie
          </button>
        </div>
      </div>
    )
  }

  if (!nav.currentMeal) {
    return (
      <div className="flex-1 flex flex-col bg-background overflow-hidden">
        <DaySelector
          weeklyPlan={weeklyPlan}
          weekDates={nav.weekDates}
          selectedDay={currentDay}
          onSelect={(day) => onDaySelect?.(day)}
        />
        <CompatibilityIndicator
          compatible={nav.compatibilityStats.compatible}
          total={nav.compatibilityStats.total}
          warning={nav.compatibilityStats.warning}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-on-surface-variant px-6" data-testid="empty-state">
            <p className="text-lg">Brak więcej posiłków</p>
          </div>
        </div>
      </div>
    )
  }

  const stackCards = nav.activeMeals.slice(nav.currentIndex, nav.currentIndex + 3)
  return (
    <main className="flex flex-col items-center justify-center gap-3 px-4 py-2 max-w-lg mx-auto w-full relative bg-background h-[calc(100dvh-theme(height.header))]">
      <div className="shrink-0 w-full pt-1">
        <DaySelector
          weeklyPlan={weeklyPlan}
          weekDates={nav.weekDates}
          selectedDay={currentDay}
          onSelect={(day) => onDaySelect?.(day)}
        />
      </div>
      {toast.showToast && (
        <div className="fixed top-16 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-auto sm:max-w-sm bg-primary text-on-primary px-4 py-2.5 rounded-xl shadow-lg z-50 flex items-center gap-2 text-sm">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span className="font-semibold truncate">{toast.toastText}</span>
        </div>
      )}
      {toast.reshuffleToast && (
        <div className="fixed top-16 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-auto sm:max-w-sm bg-surface-container text-on-surface px-4 py-2.5 rounded-xl shadow-lg z-50 flex items-center gap-2 text-sm">
          <span>🔄</span>
          <span className="font-semibold">Nowe propozycje!</span>
        </div>
      )}
      <div className="shrink-0 mb-2 self-start">
        <div className="inline-flex items-center gap-2 bg-primary text-on-primary px-3 py-1 rounded-[24px] h-7">
          <span className="w-2 h-2 rounded-full bg-on-primary animate-pulse"></span>
          <span className="font-label text-[11px] font-bold uppercase tracking-wide">
            {nav.compatibilityStats.compatible} POSIŁKI PASUJĄ
          </span>
        </div>
      </div>
      <div className="relative w-full flex justify-center">
        <SwipeStack
          stackCards={stackCards}
          currentIndex={nav.currentIndex}
          totalCards={nav.activeMeals.length}
          x={gestures.x}
          rotate={gestures.rotate}
          likeOpacity={gestures.likeOpacity}
          nopeOpacity={gestures.nopeOpacity}
          onDragEnd={gestures.handleDragEnd}
          onPointerDown={gestures.handlePointerDown}
          onPointerUp={handleCardTap}
          people={settings.people}
        />
      </div>
      <div className="flex items-center justify-center gap-6 py-4">
        <SwipeActions
          onLeft={handleSwipeLeft}
          onRight={handleSwipeRight}
          disabled={gestures.isAnimating}
          _currentDay={currentDay}
          onSkipDay={nav.handleSkipDay}
        />
      </div>
      <MealModal meal={modalMeal} onClose={() => setModalMeal(null)} />
    </main>
  )
}
