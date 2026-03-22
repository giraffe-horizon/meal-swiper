'use client'

interface CompatibilityIndicatorProps {
  compatible: number
  total: number
  warning: string | null | undefined
}

export default function CompatibilityIndicator({
  compatible,
  total,
  warning,
}: CompatibilityIndicatorProps) {
  if (total === 0) return null

  if (warning === 'none') {
    return (
      <div className="mx-4 mb-3">
        <div className="flex items-center justify-between p-3 bg-error/10 border border-error/20 rounded-xl">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-error">warning</span>
            <div>
              <p className="text-sm font-semibold text-error">Brak pasujących posiłków</p>
              <p className="text-xs text-on-surface-variant">
                Sprawdź swoje preferencje żywieniowe
              </p>
            </div>
          </div>
          <a
            href="/settings"
            className="flex items-center gap-1 px-3 py-1.5 bg-error/20 text-error rounded-lg text-sm font-medium hover:bg-error/30 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">settings</span>
            <span className="hidden sm:inline">Ustawienia</span>
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-4 mb-3">
      <div className="flex items-center justify-center p-2 bg-surface-container-low rounded-lg">
        <span className="text-xs text-on-surface-variant">
          <span className="font-semibold text-primary">{compatible}</span>
          {' z '}
          <span className="font-medium">{total}</span>
          {' posiłków pasuje do preferencji'}
          {warning === 'too_few' && <span className="text-tertiary"> • Mało opcji</span>}
        </span>
      </div>
    </div>
  )
}
