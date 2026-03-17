'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useMotionValue, useTransform, animate, type PanInfo } from 'framer-motion'
import type { Meal, DayKey, WeeklyPlan, MealWithVariants } from '@/types'
import { DAY_KEYS, DAY_NAMES_MAP, getWeekDates } from '@/lib/utils'
import MealModal from '@/components/MealModal'
import DaySelector from '@/components/ui/DaySelector'
import SwipeStack from '@/components/swipe/SwipeStack'
import SwipeActions from '@/components/swipe/SwipeActions'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import CategoryFilter from '@/components/swipe/CategoryFilter' // kept for future UX redesign
import FridgeModeFilter from '@/components/swipe/FridgeModeFilter'
import type { IngredientWithCategory } from '@/lib/fridge'
import { useAppContext } from '@/lib/context'
import { filterMealsByPreferences, type HouseholdConfig } from '@/lib/meal-filter'

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
  // Fridge mode props
  fridgeModeEnabled?: boolean
  fridgeAllIngredients?: IngredientWithCategory[]
  fridgeSelectedIngredients?: string[]
  fridgeMatchingMealsCount?: number
  onToggleFridgeMode?: () => void
  onToggleFridgeIngredient?: (name: string) => void
  onClearFridgeIngredients?: () => void
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
  fridgeModeEnabled = false,
  fridgeAllIngredients = [],
  fridgeSelectedIngredients = [],
  fridgeMatchingMealsCount = 0,
  onToggleFridgeMode,
  onToggleFridgeIngredient,
  onClearFridgeIngredients,
}: SwipeViewProps) {
  const { settings } = useAppContext()

  // State for meals with variants (for compatibility calculation)
  const [mealsWithVariants, setMealsWithVariants] = useState<MealWithVariants[]>([])

  // Fetch meals with variants for compatibility calculation
  useEffect(() => {
    fetch('/api/meals?format=variants')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => (Array.isArray(data) ? setMealsWithVariants(data) : []))
      .catch(() => {})
  }, [])

  // Compatibility stats calculation
  const compatibilityStats = useMemo(() => {
    if (mealsWithVariants.length === 0) {
      return { compatible: 0, total: 0, warning: null }
    }

    const householdConfig: HouseholdConfig = {
      persons: settings.persons.slice(0, settings.people),
    }

    const filterResult = filterMealsByPreferences(mealsWithVariants, householdConfig)

    return {
      compatible: filterResult.total,
      total: mealsWithVariants.length,
      warning: filterResult.warning,
    }
  }, [mealsWithVariants, settings.persons, settings.people])

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

        {/* Fridge Mode Filter */}
        {onToggleFridgeMode && (
          <FridgeModeFilter
            enabled={fridgeModeEnabled}
            allIngredients={fridgeAllIngredients}
            selectedIngredients={fridgeSelectedIngredients}
            matchingMealsCount={fridgeMatchingMealsCount}
            onToggle={onToggleFridgeMode}
            onToggleIngredient={onToggleFridgeIngredient ?? (() => {})}
            onClear={onClearFridgeIngredients ?? (() => {})}
          />
        )}

        {/* Compatibility Indicator */}
        {compatibilityStats.total > 0 && (
          <div className="mx-4 mb-3">
            {compatibilityStats.warning === 'none' ? (
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-800/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-red-600 dark:text-red-400">
                    warning
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                      Brak pasujących posiłków
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400">
                      Sprawdź swoje preferencje żywieniowe
                    </p>
                  </div>
                </div>
                <a
                  href="/settings"
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-500/30 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">settings</span>
                  <span className="hidden sm:inline">Ustawienia</span>
                </a>
              </div>
            ) : (
              <div className="flex items-center justify-center p-2 bg-slate-50 dark:bg-surface-dark/30 rounded-lg">
                <span className="text-xs text-slate-600 dark:text-text-secondary-dark">
                  <span className="font-semibold text-primary">
                    {compatibilityStats.compatible}
                  </span>
                  {' z '}
                  <span className="font-medium">{compatibilityStats.total}</span>
                  {' posiłków pasuje do preferencji'}
                  {compatibilityStats.warning === 'too_few' && (
                    <span className="text-amber-600 dark:text-amber-400"> • Mało opcji</span>
                  )}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex-1 flex items-center justify-center">
          <div
            className="text-center text-slate-500 dark:text-text-secondary-dark px-6"
            data-testid="empty-state"
          >
            <p className="text-lg">Brak więcej posiłków</p>
            {fridgeModeEnabled && fridgeSelectedIngredients.length > 0 && (
              <p className="text-sm mt-2">
                Żadne danie nie pasuje do wybranych składników.
                <br />
                Spróbuj dodać więcej składników lub wyczyść filtr.
              </p>
            )}
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

      {/* Fridge Mode Filter */}
      {onToggleFridgeMode && (
        <FridgeModeFilter
          enabled={fridgeModeEnabled}
          allIngredients={fridgeAllIngredients}
          selectedIngredients={fridgeSelectedIngredients}
          matchingMealsCount={fridgeMatchingMealsCount}
          onToggle={onToggleFridgeMode}
          onToggleIngredient={onToggleFridgeIngredient ?? (() => {})}
          onClear={onClearFridgeIngredients ?? (() => {})}
        />
      )}

      {/* Compatibility Indicator */}
      {compatibilityStats.total > 0 && (
        <div className="mx-4 mb-3">
          {compatibilityStats.warning === 'none' ? (
            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-800/30 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-red-600 dark:text-red-400">
                  warning
                </span>
                <div>
                  <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                    Brak pasujących posiłków
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    Sprawdź swoje preferencje żywieniowe
                  </p>
                </div>
              </div>
              <a
                href="/settings"
                className="flex items-center gap-1 px-3 py-1.5 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-500/30 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">settings</span>
                <span className="hidden sm:inline">Ustawienia</span>
              </a>
            </div>
          ) : (
            <div className="flex items-center justify-center p-2 bg-slate-50 dark:bg-surface-dark/30 rounded-lg">
              <span className="text-xs text-slate-600 dark:text-text-secondary-dark">
                <span className="font-semibold text-primary">{compatibilityStats.compatible}</span>
                {' z '}
                <span className="font-medium">{compatibilityStats.total}</span>
                {' posiłków pasuje do preferencji'}
                {compatibilityStats.warning === 'too_few' && (
                  <span className="text-amber-600 dark:text-amber-400"> • Mało opcji</span>
                )}
              </span>
            </div>
          )}
        </div>
      )}

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
