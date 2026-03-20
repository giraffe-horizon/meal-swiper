'use client'

interface MealImagePlaceholderProps {
  category?: string | null
  className?: string
  iconSize?: string
}

/**
 * Simple placeholder shown when a meal image is missing or fails to load.
 */
export default function MealImagePlaceholder({ className = '' }: MealImagePlaceholderProps) {
  return <div className={`bg-surface-container-high ${className}`} aria-hidden="true" />
}
