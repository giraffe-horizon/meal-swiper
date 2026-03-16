'use client'

interface MealImagePlaceholderProps {
  category?: string | null
  className?: string
  iconSize?: string
}

interface CategoryConfig {
  emoji: string
  label: string
  gradient: string
}

const CATEGORY_MAP: Record<string, CategoryConfig> = {
  pizza: { emoji: '🍕', label: 'Pizza', gradient: 'from-red-400 to-orange-300' },
  pasta: { emoji: '🍝', label: 'Makaron', gradient: 'from-amber-400 to-yellow-300' },
  makaron: { emoji: '🍝', label: 'Makaron', gradient: 'from-amber-400 to-yellow-300' },
  makarony: { emoji: '🍝', label: 'Makaron', gradient: 'from-amber-400 to-yellow-300' },
  zupa: { emoji: '🥣', label: 'Zupa', gradient: 'from-blue-400 to-cyan-300' },
  kurczak: { emoji: '🍗', label: 'Kurczak', gradient: 'from-yellow-400 to-amber-300' },
  ryba: { emoji: '🐟', label: 'Ryba', gradient: 'from-blue-500 to-teal-400' },
  burger: { emoji: '🍔', label: 'Burger', gradient: 'from-orange-500 to-red-400' },
  sałatka: { emoji: '🥗', label: 'Sałatka', gradient: 'from-green-400 to-emerald-300' },
  ryż: { emoji: '🍚', label: 'Ryż', gradient: 'from-amber-300 to-yellow-200' },
}

/**
 * Placeholder shown when a meal image is missing or fails to load.
 * Shows a category-based emoji and gradient background.
 */
export default function MealImagePlaceholder({
  category,
  className = '',
  iconSize = 'text-5xl',
}: MealImagePlaceholderProps) {
  const key = (category || '').toLowerCase()
  const config = CATEGORY_MAP[key]
  const emoji = config?.emoji ?? '🍽️'
  const label = config?.label ?? 'Posiłek'

  const bgClass = config ? `bg-gradient-to-br ${config.gradient}` : 'bg-slate-200 dark:bg-slate-700'

  return (
    <div className={`${bgClass} flex items-center justify-center ${className}`} aria-hidden="true">
      <span aria-label={label} className={iconSize}>
        {emoji}
      </span>
    </div>
  )
}
