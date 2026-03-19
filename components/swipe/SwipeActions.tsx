'use client'

interface SwipeActionsProps {
  onLeft: () => void
  onRight: () => void
  disabled: boolean
  currentDay: string | null
  onSkipDay: () => void
}

export default function SwipeActions({
  onLeft,
  onRight,
  disabled,
  currentDay,
  onSkipDay,
}: SwipeActionsProps) {
  return (
    <div className="flex items-center gap-8">
      <button
        onClick={onLeft}
        disabled={disabled}
        title="Pomiń tę propozycję"
        className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center text-error border border-error/20 hover:bg-error/10 transition-colors active:scale-90 duration-200 shadow-xl disabled:opacity-50"
      >
        <span className="material-symbols-outlined !text-3xl">close</span>
      </button>
      <button
        onClick={onRight}
        disabled={disabled}
        title="Dodaj do planu"
        className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-[0_0_30px_rgba(105,221,150,0.3)] hover:scale-105 transition-transform active:scale-90 duration-200 disabled:opacity-50"
      >
        <span
          className="material-symbols-outlined !text-4xl"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          favorite
        </span>
      </button>
      <button
        onClick={onSkipDay}
        disabled={disabled}
        title="Oznacz jako ulubione"
        className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center text-tertiary border border-tertiary/20 hover:bg-tertiary/10 transition-colors active:scale-90 duration-200 shadow-xl disabled:opacity-50"
      >
        <span className="material-symbols-outlined !text-3xl">star</span>
      </button>
    </div>
  )
}
