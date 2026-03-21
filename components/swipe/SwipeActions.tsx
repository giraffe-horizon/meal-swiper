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
      {/* Reject Button - X (44px) */}
      <button
        onClick={onLeft}
        disabled={disabled}
        title="Pomiń tę propozycję"
        className="w-11 h-11 rounded-full bg-[#2A3D2C] flex items-center justify-center text-error shadow-xl hover:scale-105 transition-transform active:scale-90 duration-200 disabled:opacity-50"
      >
        <span className="material-symbols-outlined !text-xl">close</span>
      </button>

      {/* Like Button - Heart (Primary Action - 60px) */}
      <button
        onClick={onRight}
        disabled={disabled}
        title="Dodaj do planu"
        className="w-[60px] h-[60px] rounded-full bg-primary flex items-center justify-center text-[#2A3D2C] shadow-[0_0_30px_rgba(105,221,150,0.3)] hover:scale-105 transition-transform active:scale-90 duration-200 disabled:opacity-50"
      >
        <span
          className="material-symbols-outlined !text-3xl"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          favorite
        </span>
      </button>

      {/* Star Button - Save as Favorite (44px) */}
      <button
        onClick={onSkipDay}
        disabled={disabled}
        title="Zapisz jako ulubione"
        className="w-11 h-11 rounded-full bg-[#2A3D2C] flex items-center justify-center text-[#FACC15] shadow-xl hover:scale-105 transition-transform active:scale-90 duration-200 disabled:opacity-50"
      >
        <span
          className="material-symbols-outlined !text-xl"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          star
        </span>
      </button>
    </div>
  )
}
