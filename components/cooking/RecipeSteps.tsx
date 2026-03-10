'use client'

import type { StepSegment } from '@/lib/recipe'
import AmountBadge from '@/components/ui/AmountBadge'

interface RecipeStepsProps {
  steps: StepSegment[][]
  checkedSteps?: Record<number, boolean>
  onToggleStep?: (index: number) => void
}

export default function RecipeSteps({ steps, checkedSteps = {}, onToggleStep }: RecipeStepsProps) {
  return (
    <div className="space-y-3">
      {steps.map((segments, i) => {
        const done = checkedSteps[i] ?? false
        return (
          <div
            key={i}
            onClick={() => onToggleStep?.(i)}
            className={`flex gap-3 p-3 rounded-xl cursor-pointer transition-all ${
              done
                ? 'bg-green-50 dark:bg-green-900/20 opacity-60'
                : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-sm font-bold transition-colors ${
                done ? 'bg-green-500 text-white' : 'bg-primary/10 text-primary'
              }`}
            >
              {done ? '✓' : i + 1}
            </div>
            <p
              className={`text-sm text-slate-700 dark:text-slate-300 leading-relaxed flex-1 ${done ? 'line-through' : ''}`}
            >
              {segments.map((seg, j) =>
                seg.type === 'text' ? (
                  <span key={j}>{seg.content}</span>
                ) : (
                  <AmountBadge key={j} amount={seg.amount} />
                )
              )}
            </p>
          </div>
        )
      })}
    </div>
  )
}
