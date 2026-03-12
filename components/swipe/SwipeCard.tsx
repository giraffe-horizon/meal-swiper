'use client'

import { useState } from 'react'
import { motion, type MotionValue, type PanInfo } from 'framer-motion'
import type { Meal } from '@/types'
import MealImagePlaceholder from '@/components/ui/MealImagePlaceholder'

interface SwipeCardProps {
  meal: Meal
  x: MotionValue<number>
  rotate: MotionValue<number>
  likeOpacity: MotionValue<number>
  nopeOpacity: MotionValue<number>
  onDragEnd: (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void
  onPointerDown: (e: React.PointerEvent) => void
  onPointerUp: (e: React.PointerEvent) => void
  people: number
  currentIndex: number
  totalCards: number
}

export default function SwipeCard({
  meal,
  x,
  rotate,
  likeOpacity,
  nopeOpacity,
  onDragEnd,
  onPointerDown,
  onPointerUp,
  people,
  currentIndex,
  totalCards,
}: SwipeCardProps) {
  const [imgError, setImgError] = useState(false)
  const showPlaceholder = !meal.photo_url || imgError

  return (
    <motion.div
      key={`card-${currentIndex}`}
      className="absolute inset-0 rounded-2xl shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing select-none touch-none"
      style={{ x, rotate, zIndex: 10 }}
      drag="x"
      dragElastic={0.7}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={onDragEnd}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      {/* Full image background */}
      <div className="absolute inset-0">
        {showPlaceholder ? (
          <MealImagePlaceholder
            category={meal.category}
            className="absolute inset-0 w-full h-full"
            iconSize="text-7xl"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={meal.nazwa}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            src={meal.photo_url}
            draggable="false"
            onError={() => setImgError(true)}
          />
        )}
      </div>

      {/* Swipe overlays */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
        style={{ opacity: likeOpacity }}
      >
        <div className="border-[6px] border-green-400 text-green-400 px-6 py-2 rounded-xl font-black text-4xl uppercase rotate-[-20deg] bg-black/20 backdrop-blur-sm">
          DODAJ DO PLANU
        </div>
      </motion.div>
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
        style={{ opacity: nopeOpacity }}
      >
        <div className="border-[6px] border-red-400 text-red-400 px-6 py-2 rounded-xl font-black text-4xl uppercase rotate-[20deg] bg-black/20 backdrop-blur-sm">
          POMIJAM
        </div>
      </motion.div>

      {/* Gradient overlay at bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

      {/* Content at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-5 pb-6 text-white pointer-events-none">
        <div className="flex justify-between items-end">
          <div className="flex-1 min-w-0 mr-3">
            <h2 className="text-2xl font-bold leading-tight drop-shadow-lg">{meal.nazwa}</h2>
            <p className="text-white/80 text-sm mt-1 line-clamp-2 drop-shadow">{meal.opis}</p>
            <div className="flex items-center gap-4 mt-3 text-sm font-medium text-white/90">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px]">schedule</span>
                <span>{meal.prep_time} min</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px]">local_fire_department</span>
                <span>{Math.round((meal.kcal_baza * people) / 2)} kcal</span>
                <span className="text-white/60 text-xs">dla {people} os.</span>
              </div>
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-bold shrink-0">
            {currentIndex + 1}/{totalCards}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
