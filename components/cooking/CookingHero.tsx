'use client'

import { useState } from 'react'
import type { Meal, MealWithVariants } from '@/types'
import MealImagePlaceholder from '@/components/ui/MealImagePlaceholder'

interface CookingHeroProps {
  meal: Meal | MealWithVariants
  stats: Array<{ icon: string; label: string }>
}

export default function CookingHero({ meal, stats }: CookingHeroProps) {
  const [imgError, setImgError] = useState(false)

  return (
    <div className="relative w-full" style={{ height: 'clamp(200px, 35vh, 320px)' }}>
      {meal.photo_url && !imgError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={meal.photo_url}
          alt={meal.nazwa}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <MealImagePlaceholder
          category={meal.category}
          className="w-full h-full"
          iconSize="text-7xl"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 p-6 glass-card border-t border-white/5">
        <div className="flex justify-between items-start mb-3">
          <div>
            <span className="text-primary text-[10px] font-label font-bold uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded">
              {meal.kuchnia || 'Międzynarodowa'}
            </span>
            <h1 className="font-headline text-xl font-bold text-on-surface mt-1 leading-tight">
              {meal.nazwa}
            </h1>
          </div>
        </div>

        <div className="flex gap-4">
          {stats.map((stat) => (
            <div
              key={stat.icon + stat.label}
              className="flex items-center gap-2 text-on-surface-variant bg-black/20 px-3 py-2 rounded-lg backdrop-blur-md"
            >
              <span className="material-symbols-outlined text-sm">{stat.icon}</span>
              <span className="font-label text-sm font-bold">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
