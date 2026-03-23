'use client'

import IngredientRow from './IngredientRow'
import Section from '@/components/ui/Section'

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
    <Section
      title={title}
      icon={<span className={`material-symbols-outlined ${iconColor} text-[24px]`}>{icon}</span>}
    >
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
    </Section>
  )
}
