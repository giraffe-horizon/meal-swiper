'use client'

interface MealImagePlaceholderProps {
  category?: string | null
  className?: string
  iconSize?: string
}

/**
 * Visually appealing placeholder shown when a meal image is missing or fails to load.
 */
export default function MealImagePlaceholder({
  category,
  className = '',
  iconSize = 'text-4xl'
}: MealImagePlaceholderProps) {
  return (
    <div
      className={`bg-gradient-to-br from-emerald-900 to-emerald-950 flex flex-col items-center justify-center ${className}`}
      aria-hidden="true"
    >
      <span className={`material-symbols-outlined ${iconSize} text-emerald-300 mb-2`}>
        restaurant
      </span>
      {category && (
        <span className="text-emerald-200/80 text-xs font-semibold uppercase tracking-wider text-center px-3">
          {category}
        </span>
      )}
    </div>
  )
}
