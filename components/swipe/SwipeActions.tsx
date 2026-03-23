'use client'

import IconButton from '@/components/ui/IconButton'

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
      <IconButton
        onClick={onLeft}
        disabled={disabled}
        title="Pomiń tę propozycję"
        className="text-error"
      >
        <span className="material-symbols-outlined !text-xl">close</span>
      </IconButton>

      {/* Like Button - Heart (Primary Action - 60px) */}
      <IconButton
        variant="primary"
        size="lg"
        onClick={onRight}
        disabled={disabled}
        title="Dodaj do planu"
      >
        <span
          className="material-symbols-outlined !text-3xl"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          favorite
        </span>
      </IconButton>

      {/* Star Button - Save as Favorite (44px) */}
      <IconButton
        onClick={onSkipDay}
        disabled={disabled}
        title="Zapisz jako ulubione"
        className="text-[#FACC15]"
      >
        <span
          className="material-symbols-outlined !text-xl"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          star
        </span>
      </IconButton>
    </div>
  )
}
