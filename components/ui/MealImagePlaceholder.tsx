'use client'

import { getCategoryStyle } from '@/lib/meal-placeholder'

interface MealImagePlaceholderProps {
  category?: string | null
  className?: string
  /** Size of the emoji icon. Defaults to "text-5xl". */
  iconSize?: string
}

/**
 * Gradient placeholder shown when a meal image is missing or fails to load.
 * Uses category-aware colours and an emoji icon (Emerald-style).
 */
export default function MealImagePlaceholder({
  category,
  className = '',
  iconSize = 'text-5xl',
}: MealImagePlaceholderProps) {
  const style = getCategoryStyle(category)

  return (
    <div
      className={`flex flex-col items-center justify-center bg-gradient-to-br ${style.gradient} ${className}`}
      aria-hidden="true"
    >
      <span
        className={`${iconSize} drop-shadow-sm select-none`}
        role="img"
        aria-label={style.label}
      >
        {style.emoji}
      </span>
    </div>
  )
}
