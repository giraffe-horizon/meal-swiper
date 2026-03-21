'use client'

import type { MotionValue, PanInfo } from 'framer-motion'
import type { Meal, MealWithVariants } from '@/types'
import SwipeCard from './SwipeCard'
import MealImagePlaceholder from '@/components/ui/MealImagePlaceholder'

interface SwipeStackProps {
  stackCards: (Meal | MealWithVariants)[]
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
    <div className="relative w-full max-w-sm h-[340px]">
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

          // Background stack cards with stacking effect
          return (
            <div
              key={`stack-${actualIndex}`}
              className={`absolute inset-x-0 top-0 h-full bg-surface-container rounded-lg overflow-hidden pointer-events-none ${
                stackIdx === 1
                  ? 'translate-y-2 scale-[0.96] opacity-70 blur-[0.5px]'
                  : 'translate-y-4 scale-[0.92] opacity-40 blur-[1px]'
              }`}
              style={{
                zIndex: 10 - stackIdx,
              }}
            >
              {/* Full image background or placeholder */}
              {meal.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt={meal.nazwa}
                  className="w-full h-full object-cover"
                  src={meal.photo_url}
                  draggable="false"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              ) : (
                <MealImagePlaceholder className="w-full h-full" />
              )}
            </div>
          )
        })}
    </div>
  )
}
