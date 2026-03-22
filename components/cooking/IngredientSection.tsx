'use client'

import IngredientRow from './IngredientRow'

interface IngredientItem {
  name: string
  amount: string
}

interface IngredientSectionProps {
  icon: string
  title: string
  iconColor?: string
  accentColor?: 'primary' | 'secondary'
  items: IngredientItem[]
  keyPrefix: string
  checkedIngredients: Record<string, boolean>
  onToggle: (key: string) => void
}

export default function IngredientSection({
  icon,
  title,
  iconColor = 'text-primary',
  accentColor = 'primary',
  items,
  keyPrefix,
  checkedIngredients,
  onToggle,
}: IngredientSectionProps) {
  if (items.length === 0) return null

  return (
    <section>
      <div className="flex items-center gap-4 mb-6">
        <h2 className="font-headline text-base font-bold text-on-surface-variant flex items-center gap-3 flex-shrink-0">
          <span className={`material-symbols-outlined ${iconColor} text-[24px]`}>{icon}</span>
          {title}
        </h2>
        <div className="h-[1px] w-full bg-outline-variant/30"></div>
      </div>
      <div className="space-y-4">
        {items.map((ing, i) => {
          const key = `${keyPrefix}-${i}`
          return (
            <IngredientRow
              key={key}
              name={ing.name}
              amount={ing.amount}
              checked={checkedIngredients[key] ?? false}
              onToggle={() => onToggle(key)}
              accentColor={accentColor}
            />
          )
        })}
      </div>
    </section>
  )
}
