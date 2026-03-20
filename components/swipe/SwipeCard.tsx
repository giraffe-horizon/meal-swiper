'use client'

import { useState } from 'react'
import { motion, type MotionValue, type PanInfo } from 'framer-motion'
import type { Meal, MealWithVariants } from '@/types'
import MealImagePlaceholder from '@/components/ui/MealImagePlaceholder'

interface SwipeCardProps {
  meal: Meal | MealWithVariants
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
      className="absolute inset-0 bg-surface-container rounded-lg overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing select-none touch-none transition-transform duration-300 hover:rotate-1"
      style={{ x, rotate, zIndex: 10 }}
      drag="x"
      dragElastic={0.7}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={onDragEnd}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      {/* Meal Photo */}
      <div className="w-full h-full relative">
        {showPlaceholder ? (
          <MealImagePlaceholder
            category={meal.category}
            className="w-full h-full"
            iconSize="text-7xl"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={meal.nazwa}
            className="w-full h-full object-cover pointer-events-none"
            src={meal.photo_url}
            draggable="false"
            onError={() => setImgError(true)}
          />
        )}
      </div>

      {/* LIKE/NOPE Overlays */}
      <motion.div
        className="absolute top-8 left-8 border-4 border-primary text-primary font-headline font-black text-4xl px-4 py-1 rounded-lg uppercase -rotate-12 pointer-events-none z-20"
        style={{ opacity: likeOpacity }}
      >
        LIKE
      </motion.div>
      <motion.div
        className="absolute top-8 right-8 border-4 border-error text-error font-headline font-black text-4xl px-4 py-1 rounded-lg uppercase rotate-12 pointer-events-none z-20"
        style={{ opacity: nopeOpacity }}
      >
        NOPE
      </motion.div>

      {/* Progress Counter */}
      <div className="absolute top-4 left-4 bg-surface-container/80 backdrop-blur px-3 py-1.5 rounded-full pointer-events-none z-20">
        <span className="font-label text-sm font-bold text-on-surface">
          {currentIndex + 1}/{totalCards}
        </span>
      </div>

      {/* Glassmorphism Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6 glass-card border-t border-white/5">
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="text-primary text-[10px] font-bold uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded">
              {meal.kuchnia || 'Międzynarodowa'}
            </span>
            <h2 className="font-headline text-2xl font-bold text-on-surface mt-1">{meal.nazwa}</h2>
          </div>
          <div className="flex items-center gap-1 text-on-surface-variant bg-black/20 px-2 py-1 rounded-md backdrop-blur-md">
            <span className="material-symbols-outlined text-sm">schedule</span>
            <span className="font-label text-xs font-bold">{meal.prep_time} min</span>
          </div>
        </div>

        {/* Nutritional Highlights */}
        <div className="flex gap-4 mt-4">
          <div className="flex flex-col">
            <span className="text-on-surface-variant text-[10px] uppercase font-semibold tracking-tighter">
              Kcal
            </span>
            <span className="font-label text-tertiary font-bold text-lg leading-tight">
              {Math.round(
                (('kcal_baza' in meal
                  ? meal.kcal_baza
                  : meal.variants.find((v) => v.is_default)?.kcal || 0) *
                  people) /
                  2
              )}
            </span>
          </div>
          <div className="w-px h-8 bg-outline-variant/30"></div>
          <div className="flex flex-col">
            <span className="text-on-surface-variant text-[10px] uppercase font-semibold tracking-tighter">
              Białko
            </span>
            <span className="font-label text-on-surface font-bold text-lg leading-tight">
              {Math.round(
                (('bialko_baza' in meal
                  ? meal.bialko_baza
                  : meal.variants.find((v) => v.is_default)?.protein || 0) *
                  people) /
                  2
              )}
              g
            </span>
          </div>
          <div className="w-px h-8 bg-outline-variant/30"></div>
          <div className="flex flex-col">
            <span className="text-on-surface-variant text-[10px] uppercase font-semibold tracking-tighter">
              Tłuszcze
            </span>
            <span className="font-label text-on-surface font-bold text-lg leading-tight">
              {Math.round(
                (('bialko_baza' in meal
                  ? meal.bialko_baza * 0.6 // Rough estimate
                  : meal.variants.find((v) => v.is_default)?.fat ||
                    (meal.variants.find((v) => v.is_default)?.protein || 0) * 0.6 ||
                    0) *
                  people) /
                  2
              )}
              g
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
