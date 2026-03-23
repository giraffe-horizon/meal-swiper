'use client'

interface IngredientRowProps {
  name: string
  amount: string
  checked: boolean
  onToggle: () => void
  accentColor?: 'primary' | 'secondary'
}

export default function IngredientRow({
  name,
  amount,
  checked,
  onToggle,
  accentColor = 'primary',
}: IngredientRowProps) {
  const bgClass = checked ? `bg-${accentColor}` : ''
  const borderClass = checked ? '' : `border-2 border-outline-variant hover:border-${accentColor}`
  const checkTextClass = accentColor === 'primary' ? 'text-on-primary' : 'text-on-secondary'

  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={onToggle}>
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform active:scale-90 ${bgClass} ${borderClass} transition-colors`}
        >
          {checked && (
            <span
              className={`material-symbols-outlined text-[16px] ${checkTextClass} font-bold`}
              style={{ fontVariationSettings: '"wght" 700' }}
            >
              check
            </span>
          )}
        </div>
        <div className="flex-1">
          <span
            className={`text-sm text-on-surface font-semibold ${checked ? 'line-through opacity-60' : ''}`}
          >
            {name}
          </span>
          <span className="mx-2 text-outline-variant text-xs">•</span>
          <span
            className={`font-label text-xs font-bold uppercase tracking-tighter ${
              checked ? 'text-outline-variant line-through' : 'text-tertiary'
            }`}
          >
            {amount}
          </span>
        </div>
      </div>
    </div>
  )
}
