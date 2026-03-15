'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useMotionValue, useTransform, animate, type PanInfo } from 'framer-motion'
import type { Meal, DayKey, WeeklyPlan } from '@/types'
import { DAY_KEYS, DAY_NAMES_MAP, getWeekDates } from '@/lib/utils'
import MealModal from '@/components/MealModal'
import DaySelector from '@/components/ui/DaySelector'
import SwipeStack from '@/components/swipe/SwipeStack'
import SwipeActions from '@/components/swipe/SwipeActions'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import CategoryFilter from '@/components/swipe/CategoryFilter' // kept for future UX redesign
import { useAppContext } from '@/lib/context'

interface SwipeViewProps {
  meals: Meal[]
  onSwipeRight: (meal: Meal) => void
  currentDay: DayKey | null
  onComplete: () => void
  weeklyPlan: WeeklyPlan
  onSkipAll: () => void
  onSkipDay?: () => void
  weekOffset?: number
  weekDates?: Date[]
  onDaySelect?: (day: DayKey) => void
  allDaysFilled?: boolean
  shuffledMealsFromContext?: Meal[]
  currentSwipeIndexFromContext?: number
  seenIdsFromContext?: string[]
  setCurrentSwipeIndexInContext?: (index: number) => void
  setShuffledMealsInContext?: (meals: Meal[]) => void
  setSeenIdsInContext?: (ids: string[]) => void
}

const SWIPE_THRESHOLD = 120

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

  const seenIds = seenIdsFromContext
  const shuffledMeals = useMemo(
    () => (shuffledMealsFromContext.length > 0 ? shuffledMealsFromContext : []),
    [shuffledMealsFromContext]
  )

  const activeMeals = shuffledMeals
  const currentIndex = currentSwipeIndexFromContext

  const [reshuffleToast, setReshuffleToast] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [confettiItems] = useState(() =>
    [...Array(50)].map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2,
      size: 20 + Math.random() * 20,
      emoji: ['🎉', '🎊', '✨', '🌟', '💫'][Math.floor(Math.random() * 5)],
    }))
  )
  const [showToast, setShowToast] = useState(false)
  const [toastText, setToastText] = useState('')
  const [isAnimating, setIsAnimating] = useState(false)
  const [modalMeal, setModalMeal] = useState<Meal | null>(null)

  const x = useMotionValue(0)
  const rotate = useTransform(x, [-300, 0, 300], [-18, 0, 18])
  const likeOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1])
  const nopeOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0])

  const weekDatesComputed = useMemo(() => getWeekDates(weekOffset), [weekOffset])
  const weekDates = weekDatesProp ?? weekDatesComputed
  const currentMeal = activeMeals[currentIndex]

  const usedMealIds = useMemo(
    () => DAY_KEYS.map((d) => weeklyPlan[d]?.id).filter(Boolean) as string[],
    [weeklyPlan]
  )

  const shuffleArray = useCallback(<T,>(array: T[]): T[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }, [])

  const nextCard = useCallback(() => {
    if (currentIndex >= shuffledMeals.length - 1) {
      if (allDaysFilled) {
        setShowConfetti(true)
        setShowSuccess(true)
        setTimeout(() => onComplete?.(), 2000)
      } else {
        const maxSeen = Math.max(0, meals.length - 3)
        const currentMealId = shuffledMeals[currentIndex]?.id
        const updatedSeen = currentMealId ? [...seenIds, currentMealId].slice(-maxSeen) : seenIds
        setSeenIdsInContext?.(updatedSeen)
        const fresh = meals.filter(
          (m) => !updatedSeen.includes(m.id) && !usedMealIds.includes(m.id)
        )
        const old = meals.filter((m) => updatedSeen.includes(m.id) && !usedMealIds.includes(m.id))
        x.set(0)
        setShuffledMealsInContext?.([
          ...shuffledMeals,
          ...shuffleArray(fresh),
          ...shuffleArray(old),
        ])
        setCurrentSwipeIndexInContext?.(currentIndex + 1)
        setReshuffleToast(true)
        setTimeout(() => setReshuffleToast(false), 2000)
      }
    } else {
      x.set(0)
      setCurrentSwipeIndexInContext?.(currentIndex + 1)
    }
    setIsAnimating(false)
  }, [
    currentIndex,
    shuffledMeals,
    allDaysFilled,
    onComplete,
    x,
    meals,
    seenIds,
    usedMealIds,
    setSeenIdsInContext,
    setShuffledMealsInContext,
    setCurrentSwipeIndexInContext,
    shuffleArray,
  ])

  const trackSeen = useCallback(
    (mealId: string) => {
      const maxSeen = Math.max(0, meals.length - 3)
      setSeenIdsInContext?.([...seenIds, mealId].slice(-maxSeen))
    },
    [meals.length, seenIds, setSeenIdsInContext]
  )

  const handleSwipeRight = useCallback(() => {
    if (!currentMeal || isAnimating) return
    setIsAnimating(true)
    trackSeen(currentMeal.id)
    const day = currentDay ? DAY_NAMES_MAP[currentDay] : 'Wybierz dzień'
    setToastText(`Dodano: ${currentMeal.nazwa} do: ${day}`)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
    animate(x, 600, { duration: 0.3 }).then(() => {
      onSwipeRight(currentMeal)
      nextCard()
    })
  }, [currentMeal, currentDay, isAnimating, x, onSwipeRight, nextCard, trackSeen])

  const handleSwipeLeft = useCallback(() => {
    if (isAnimating || !currentMeal) return
    setIsAnimating(true)
    trackSeen(currentMeal.id)
    animate(x, -600, { duration: 0.3 }).then(() => nextCard())
  }, [isAnimating, x, nextCard, currentMeal, trackSeen])

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (isAnimating) return
      const offset = info.offset.x
      if (Math.abs(offset) > SWIPE_THRESHOLD) {
        if (offset > 0) handleSwipeRight()
        else handleSwipeLeft()
      } else {
        animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 })
      }
    },
    [isAnimating, handleSwipeRight, handleSwipeLeft, x]
  )

  const [dragStartX, setDragStartX] = useState(0)
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setDragStartX(e.clientX)
  }, [])
  const handleCardTap = useCallback(
    (e: React.PointerEvent) => {
      if (Math.abs(e.clientX - dragStartX) < 10 && currentMeal) {
        setModalMeal(currentMeal)
      }
    },
    [dragStartX, currentMeal]
  )

  const handleSkipDay = useCallback(() => {
    if (onSkipDay) onSkipDay()
    else onComplete()
  }, [onSkipDay, onComplete])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (modalMeal) return
      if (e.key === 'ArrowLeft') handleSwipeLeft()
      if (e.key === 'ArrowRight') handleSwipeRight()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSwipeLeft, handleSwipeRight, modalMeal])

  const handleReshuffle = useCallback(() => {
    setShowSuccess(false)
    setShowConfetti(false)
    setCurrentSwipeIndexInContext?.(0)
    x.set(0)
    setIsAnimating(false)
  }, [x, setCurrentSwipeIndexInContext])

  if (showSuccess) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background-light dark:bg-background-dark relative overflow-hidden">
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none">
            {confettiItems.map((item) => (
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
          <h2 className="text-2xl font-bold text-slate-900 dark:text-text-primary-dark">
            Wszystkie propozycje przejrzane!
          </h2>
          <p className="text-slate-600 dark:text-text-secondary-dark mt-2">
            Nie ma więcej kart do przejrzenia
          </p>
          <button
            onClick={handleReshuffle}
            className="mt-6 px-6 py-3 bg-primary text-white rounded-full font-bold shadow-lg hover:bg-primary/90 transition-colors"
          >
            Losuj ponownie
          </button>
        </div>
      </div>
    )
  }

  if (!currentMeal) {
    return (
      <div className="flex-1 flex flex-col bg-background-light dark:bg-background-dark overflow-hidden">
        <DaySelector
          weeklyPlan={weeklyPlan}
          weekDates={weekDates}
          selectedDay={currentDay}
          onSelect={(day) => onDaySelect?.(day)}
          showThumbnails
        />
        {/* <CategoryFilter ... /> hidden for UX redesign */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-slate-500 dark:text-text-secondary-dark px-6" data-testid="empty-state">
            <p className="text-lg">Brak więcej posiłków</p>
          </div>
        </div>
      </div>
    )
  }

  const stackCards = activeMeals.slice(currentIndex, currentIndex + 3)

  return (
    <div className="flex-1 flex flex-col bg-background-light dark:bg-background-dark overflow-hidden relative">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-16 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-auto sm:max-w-sm bg-primary text-white px-4 py-2.5 rounded-xl shadow-lg z-50 flex items-center gap-2 text-sm">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span className="font-semibold truncate">{toastText}</span>
        </div>
      )}

      {/* Reshuffle Toast */}
      {reshuffleToast && (
        <div className="fixed top-16 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-auto sm:max-w-sm bg-slate-700 text-white px-4 py-2.5 rounded-xl shadow-lg z-50 flex items-center gap-2 text-sm">
          <span>🔄</span>
          <span className="font-semibold">Nowe propozycje!</span>
        </div>
      )}

      {/* Day Selector */}
      <DaySelector
        weeklyPlan={weeklyPlan}
        weekDates={weekDates}
        selectedDay={currentDay}
        onSelect={(day) => onDaySelect?.(day)}
        showThumbnails
      />

      {/* Category & Cuisine Filter — hidden for UX redesign */}
      {/* <CategoryFilter ... /> */}

      {/* Card Stack Area */}
      <div className="flex-1 flex flex-col items-center px-4 pb-2 relative min-h-0">
        <SwipeStack
          stackCards={stackCards}
          currentIndex={currentIndex}
          totalCards={activeMeals.length}
          x={x}
          rotate={rotate}
          likeOpacity={likeOpacity}
          nopeOpacity={nopeOpacity}
          onDragEnd={handleDragEnd}
          onPointerDown={handlePointerDown}
          onPointerUp={handleCardTap}
          people={settings.people}
        />

        <SwipeActions
          onLeft={handleSwipeLeft}
          onRight={handleSwipeRight}
          disabled={isAnimating}
          currentDay={currentDay}
          onSkipDay={handleSkipDay}
        />
      </div>

      {/* Meal Detail Modal */}
      <MealModal meal={modalMeal} onClose={() => setModalMeal(null)} />
    </div>
  )
}
