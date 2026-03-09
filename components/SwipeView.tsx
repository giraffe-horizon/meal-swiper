'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, useMotionValue, useTransform, animate, type PanInfo } from 'framer-motion'
import type { Meal, DayKey, WeeklyPlan } from '@/types'
import { DAY_KEYS, DAY_NAMES_MAP } from '@/lib/utils'

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

interface SwipeViewProps {
  meals: Meal[]
  onSwipeRight: (meal: Meal) => void
  currentDay: DayKey | null
  onComplete: () => void
  weeklyPlan: WeeklyPlan
  onSkipAll: () => void
}

const SWIPE_THRESHOLD = 120

export default function SwipeView({
  meals,
  onSwipeRight,
  currentDay,
  onComplete,
  weeklyPlan,
}: SwipeViewProps) {
  const [shuffledMeals] = useState<Meal[]>(() => shuffleArray(meals))
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastText, setToastText] = useState('')
  const [isAnimating, setIsAnimating] = useState(false)

  const x = useMotionValue(0)
  const rotate = useTransform(x, [-300, 0, 300], [-18, 0, 18])
  const likeOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1])
  const nopeOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0])

  const emptyDays = weeklyPlan
    ? DAY_KEYS.filter((d) => !weeklyPlan[d] && !weeklyPlan[`${d}_free`])
    : []
  const currentDayIndex = currentDay ? emptyDays.indexOf(currentDay) + 1 : 0
  const totalDays = emptyDays.length

  const currentMeal = shuffledMeals[currentIndex]

  const nextCard = useCallback(() => {
    if (currentIndex >= shuffledMeals.length - 1) {
      setShowConfetti(true)
      setShowSuccess(true)
      setTimeout(() => {
        onComplete?.()
      }, 2000)
    } else {
      setCurrentIndex((prev) => prev + 1)
      x.set(0)
    }
    setIsAnimating(false)
  }, [currentIndex, shuffledMeals.length, onComplete, x])

  const handleSwipeRight = useCallback(() => {
    if (!currentMeal || isAnimating) return
    setIsAnimating(true)
    const day = currentDay ? DAY_NAMES_MAP[currentDay] : 'Wybierz dzień'
    setToastText(`Dodano: ${currentMeal.nazwa} do: ${day}`)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)

    animate(x, 600, { duration: 0.3 }).then(() => {
      onSwipeRight(currentMeal)
      nextCard()
    })
  }, [currentMeal, currentDay, isAnimating, x, onSwipeRight, nextCard])

  const handleSwipeLeft = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    animate(x, -600, { duration: 0.3 }).then(() => {
      nextCard()
    })
  }, [isAnimating, x, nextCard])

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (isAnimating) return
      const offset = info.offset.x
      if (Math.abs(offset) > SWIPE_THRESHOLD) {
        if (offset > 0) {
          handleSwipeRight()
        } else {
          handleSwipeLeft()
        }
      } else {
        animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 })
      }
    },
    [isAnimating, handleSwipeRight, handleSwipeLeft, x]
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handleSwipeLeft()
      if (e.key === 'ArrowRight') handleSwipeRight()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSwipeLeft, handleSwipeRight])

  const handleReshuffle = useCallback(() => {
    setShowSuccess(false)
    setShowConfetti(false)
    setCurrentIndex(0)
    x.set(0)
    setIsAnimating(false)
  }, [x])

  if (showSuccess) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background-light dark:bg-background-dark relative overflow-hidden">
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: '-10%',
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                  fontSize: `${20 + Math.random() * 20}px`,
                }}
              >
                {['🎉', '🎊', '✨', '🌟', '💫'][Math.floor(Math.random() * 5)]}
              </div>
            ))}
          </div>
        )}
        <div className="text-center z-10">
          <div className="text-6xl mb-4 animate-bounce">🎉</div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Wszystkie propozycje przejrzane!
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
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
      <div className="flex-1 flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-center text-slate-500">
          <p className="text-lg">Brak więcej posiłków</p>
        </div>
      </div>
    )
  }

  // Cards to show in stack (current + up to 2 behind)
  const stackCards = shuffledMeals.slice(currentIndex, currentIndex + 3)

  return (
    <div className="flex-1 flex flex-col bg-background-light dark:bg-background-dark overflow-hidden relative">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-[#2D6A4F] text-white px-6 py-3 rounded-full shadow-2xl z-50 animate-bounce flex items-center gap-2">
          <span className="material-symbols-outlined">check_circle</span>
          <span className="font-bold">{toastText}</span>
        </div>
      )}

      {/* Date Pill with Progress */}
      <div className="px-4 pb-2 flex justify-center gap-2 z-10 flex-wrap">
        {totalDays > 0 && (
          <div className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1.5 rounded-full text-xs font-medium">
            Dzień {currentDayIndex || 1} z {totalDays}
          </div>
        )}
        <div className="bg-primary/10 dark:bg-primary/20 text-primary px-4 py-1.5 rounded-full text-sm font-medium">
          📅 {currentDay ? DAY_NAMES_MAP[currentDay] : 'Wybierz posiłek'}
        </div>
      </div>

      {/* Card Stack Area */}
      <div className="flex-1 flex flex-col items-center px-4 pb-2 relative min-h-0">
        <div
          className="relative w-full max-w-sm flex-1 min-h-0"
          style={{ minHeight: '420px', maxHeight: 'calc(100vh - 280px)' }}
        >
          {/* Stack cards (rendered bottom-to-top) */}
          {stackCards
            .slice()
            .reverse()
            .map((meal, reverseIdx) => {
              const stackIdx = stackCards.length - 1 - reverseIdx
              const isTop = stackIdx === 0

              if (isTop) {
                return (
                  <motion.div
                    key={`card-${currentIndex}`}
                    className="absolute inset-0 rounded-2xl shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing select-none touch-none"
                    style={{
                      x,
                      rotate,
                      zIndex: 10,
                    }}
                    drag="x"
                    dragElastic={0.7}
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={handleDragEnd}
                  >
                    {/* Full image background */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={meal.nazwa}
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                      src={meal.photo_url}
                      draggable="false"
                    />

                    {/* Swipe overlays */}
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
                      style={{ opacity: likeOpacity }}
                    >
                      <div className="border-[6px] border-green-400 text-green-400 px-6 py-2 rounded-xl font-black text-4xl uppercase rotate-[-20deg] bg-black/20 backdrop-blur-sm">
                        WYBIERAM ❤️
                      </div>
                    </motion.div>
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
                      style={{ opacity: nopeOpacity }}
                    >
                      <div className="border-[6px] border-red-400 text-red-400 px-6 py-2 rounded-xl font-black text-4xl uppercase rotate-[20deg] bg-black/20 backdrop-blur-sm">
                        POMIJAM ✕
                      </div>
                    </motion.div>

                    {/* Gradient overlay at bottom */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                    {/* Content at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 p-5 pb-6 text-white pointer-events-none">
                      <div className="flex justify-between items-end">
                        <div className="flex-1 min-w-0 mr-3">
                          <h2 className="text-2xl font-bold leading-tight drop-shadow-lg">
                            {meal.nazwa}
                          </h2>
                          <p className="text-white/80 text-sm mt-1 line-clamp-2 drop-shadow">
                            {meal.opis}
                          </p>
                          <div className="flex items-center gap-4 mt-3 text-sm font-medium text-white/90">
                            <div className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[18px]">
                                schedule
                              </span>
                              <span>{meal.prep_time} min</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[18px]">
                                local_fire_department
                              </span>
                              <span>{meal.kcal_baza} kcal</span>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-bold shrink-0">
                          {currentIndex + 1}/{shuffledMeals.length}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              }

              // Background stack cards
              const scale = 1 - stackIdx * 0.05
              const translateY = stackIdx * 8
              const cardOpacity = stackIdx === 1 ? 0.7 : 0.4

              return (
                <div
                  key={`stack-${currentIndex + stackIdx}`}
                  className="absolute inset-0 rounded-2xl shadow-xl overflow-hidden pointer-events-none"
                  style={{
                    transform: `scale(${scale}) translateY(${translateY}px)`,
                    opacity: cardOpacity,
                    zIndex: 10 - stackIdx,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={meal.nazwa}
                    className="absolute inset-0 w-full h-full object-cover"
                    src={meal.photo_url}
                    draggable="false"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 pb-6 text-white">
                    <h2 className="text-2xl font-bold leading-tight drop-shadow-lg">
                      {meal.nazwa}
                    </h2>
                  </div>
                </div>
              )
            })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-8 h-20 shrink-0">
          <button
            onClick={handleSwipeLeft}
            disabled={isAnimating}
            className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full shadow-lg flex items-center justify-center text-red-500 border-2 border-red-100 dark:border-red-900/30 transition-transform active:scale-90 hover:scale-105 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-3xl font-bold">close</span>
          </button>
          <button
            onClick={handleSwipeRight}
            disabled={isAnimating}
            className="w-16 h-16 bg-primary rounded-full shadow-lg shadow-primary/30 flex items-center justify-center text-white transition-transform active:scale-90 hover:scale-105 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-3xl font-bold">favorite</span>
          </button>
        </div>
      </div>
    </div>
  )
}
