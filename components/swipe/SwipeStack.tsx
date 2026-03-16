'use client'

import type { MotionValue, PanInfo } from 'framer-motion'
import type { Meal } from '@/types'
import SwipeCard from './SwipeCard'

interface SwipeStackProps {
  stackCards: Meal[]
  currentIndex: number
  totalCards: number
  x: MotionValue<number>
  rotate: MotionValue<number>
  likeOpacity: MotionValue<number>
  nopeOpacity: MotionValue<number>
  onDragEnd: (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void
  onPointerDown: (e: React.PointerEvent) => void
  onPointerUp: (e: React.PointerEvent) => void
  people: number
}

export default function SwipeStack({
  stackCards,
  currentIndex,
  totalCards,
  x,
  rotate,
  likeOpacity,
  nopeOpacity,
  onDragEnd,
  onPointerDown,
  onPointerUp,
  people,
}: SwipeStackProps) {
  return (
    <div
      className="relative w-full max-w-sm flex-1 min-h-0"
      style={{ minHeight: '420px', maxHeight: 'calc(100vh - 320px)' }}
    >
      {stackCards
        .slice()
        .reverse()
        .map((meal, reverseIdx) => {
          const stackIdx = stackCards.length - 1 - reverseIdx
          const isTop = stackIdx === 0
          const actualIndex = currentIndex + stackIdx

          // Only render top card + 2 background cards for performance and to avoid bleed-through
          if (stackIdx > 2) return null

          if (isTop) {
            return (
              <SwipeCard
                key={`card-${currentIndex}`}
                meal={meal}
                x={x}
                rotate={rotate}
                likeOpacity={likeOpacity}
                nopeOpacity={nopeOpacity}
                onDragEnd={onDragEnd}
                onPointerDown={onPointerDown}
                onPointerUp={onPointerUp}
                people={people}
                currentIndex={currentIndex}
                totalCards={totalCards}
              />
            )
          }

          // Background stack cards
          const scale = 1 - stackIdx * 0.05
          const translateY = stackIdx * 8
          const cardOpacity = stackIdx === 1 ? 0.7 : 0.4

          return (
            <div
              key={`stack-${actualIndex}`}
              className="absolute inset-0 rounded-2xl shadow-xl overflow-hidden pointer-events-none bg-slate-200 dark:bg-surface-dark"
              style={{
                transform: `scale(${scale}) translateY(${translateY}px)`,
                opacity: cardOpacity,
                zIndex: 10 - stackIdx,
              }}
            >
              {/* Full image background */}
              {meal.photo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt={meal.nazwa}
                  className="absolute inset-0 w-full h-full object-cover"
                  src={meal.photo_url}
                  draggable="false"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              )}

              {/* Gradient overlay at bottom */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

              {/* Content at bottom — matching SwipeCard layout */}
              <div className="absolute bottom-0 left-0 right-0 p-5 pb-6 text-white">
                <div className="flex justify-between items-end">
                  <div className="flex-1 min-w-0 mr-3">
                    <h2 className="text-2xl font-bold leading-tight drop-shadow-lg">
                      {meal.nazwa}
                    </h2>
                    <p className="text-slate-200 text-sm mt-1 line-clamp-2 drop-shadow">
                      {meal.opis}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-sm font-medium text-slate-100">
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[18px]">schedule</span>
                        <span>{meal.prep_time} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[18px]">
                          local_fire_department
                        </span>
                        <span>{Math.round((meal.kcal_baza * people) / 2)} kcal</span>
                        <span className="text-slate-300 text-xs">dla {people} os.</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-800 rounded-full px-3 py-1 text-xs font-bold shrink-0">
                    {actualIndex + 1}/{totalCards}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
    </div>
  )
}
