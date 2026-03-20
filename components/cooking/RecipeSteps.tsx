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
    <div className="space-y-4">
      {steps.map((segments, i) => {
        const done = checkedSteps[i] ?? false
        return (
          <div
            key={i}
            onClick={() => onToggleStep?.(i)}
            className={`p-6 rounded-lg cursor-pointer transition-all ${
              done
                ? 'bg-surface-container-low opacity-60'
                : 'bg-surface-container-highest border border-primary/20 relative overflow-hidden'
            }`}
          >
            <div className="flex gap-6">
              <span
                className={`font-headline font-black text-2xl ${
                  done ? 'text-on-surface-variant/30' : 'text-primary/20'
                }`}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <p
                className={`font-body text-on-surface leading-relaxed flex-1 ${done ? 'line-through text-on-surface-variant' : ''}`}
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
          </div>
        )
      })}
    </div>
  )
}
