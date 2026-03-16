'use client'

interface MealImagePlaceholderProps {
  category?: string | null
  className?: string
  iconSize?: string
}

/**
 * Simple grey placeholder shown when a meal image is missing or fails to load.
 */
export default function MealImagePlaceholder({
  className = '',
}: MealImagePlaceholderProps) {
  return (
    <div
      className={`bg-slate-200 dark:bg-slate-700 ${className}`}
      aria-hidden="true"
    />
  )
}
