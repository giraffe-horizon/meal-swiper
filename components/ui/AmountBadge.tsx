'use client'

interface AmountBadgeProps {
  amount: string
  className?: string
}

export default function AmountBadge({ amount, className = '' }: AmountBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded bg-primary/15 text-primary font-semibold text-[0.85em] whitespace-nowrap ${className}`}
    >
      {amount}
    </span>
  )
}
