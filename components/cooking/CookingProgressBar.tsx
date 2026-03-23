'use client'

interface CookingProgressBarProps {
  total: number
  done: number
}

export default function CookingProgressBar({ total, done }: CookingProgressBarProps) {
  const percent = total > 0 ? Math.round((done / total) * 100) : 0
  const isComplete = percent === 100

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-label text-xs font-bold text-primary uppercase">
          Postęp gotowania
        </span>
        <span className="font-label text-xs text-on-surface-variant">{percent}%</span>
      </div>

      <div className="h-1.5 w-full rounded-full bg-surface-container-highest overflow-hidden">
        <div
          className="h-full bg-primary rounded-full shadow-[0_0_12px_rgba(105,221,150,0.4)] transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      {isComplete && (
        <div className="mt-2 flex items-center gap-1.5 text-primary animate-pulse">
          <span className="material-symbols-outlined text-[16px]">celebration</span>
          <span className="text-xs font-medium">Danie gotowe! Smacznego</span>
        </div>
      )}
    </div>
  )
}
