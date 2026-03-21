'use client'

interface SwipeActionsProps {
  onLeft: () => void
  onRight: () => void
  disabled: boolean
  _currentDay: string | null
  onSkipDay: () => void
}

export default function SwipeActions({
  onLeft,
  onRight,
  disabled,
  _currentDay,
  onSkipDay,
}: SwipeActionsProps) {
  return (
    <div className="flex items-center justify-center gap-6">
      {/* Reject Button - X */}
      <button
        onClick={onLeft}
        disabled={disabled}
        title="Pomiń tę propozycję"
        className="w-14 h-14 rounded-full bg-surface-container-highest flex items-center justify-center text-error border border-error/20 hover:bg-error/10 transition-colors active:scale-90 duration-200 shadow-xl disabled:opacity-50"
      >
        <span className="material-symbols-outlined !text-2xl">close</span>
      </button>

      {/* Like Button - Heart (Primary Action - 72px) */}
      <button
        onClick={onRight}
        disabled={disabled}
        title="Dodaj do planu"
        className="w-18 h-18 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-[0_0_30px_rgba(105,221,150,0.3)] hover:scale-105 transition-transform active:scale-90 duration-200 disabled:opacity-50"
      >
        <span
          className="material-symbols-outlined !text-4xl"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          favorite
        </span>
      </button>

      {/* Skip Day Button */}
      <button
        onClick={onSkipDay}
        disabled={disabled}
        title="Pomiń ten dzień"
        className="px-4 py-2 bg-surface-container-highest flex items-center justify-center gap-2 text-on-surface border border-outline-variant hover:bg-surface-container transition-colors active:scale-90 duration-200 shadow-xl disabled:opacity-50 rounded-full"
      >
        <span className="material-symbols-outlined !text-lg">skip_next</span>
        <span className="text-sm font-medium">Pomiń ten dzień</span>
      </button>
    </div>
  )
}
