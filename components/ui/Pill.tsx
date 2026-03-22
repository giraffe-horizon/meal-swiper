'use client'

import type { ReactNode } from 'react'

const variantStyles = {
  primary: 'bg-primary/10 text-primary',
  outline: 'bg-surface-container border border-outline-variant/30 text-on-surface-variant',
  muted: 'bg-surface-container-highest text-on-surface-variant',
} as const

const sizeStyles = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-3 py-1.5 text-xs',
} as const

interface PillProps {
  variant?: keyof typeof variantStyles
  size?: keyof typeof sizeStyles
  icon?: ReactNode
  className?: string
  children: ReactNode
}

export default function Pill({
  variant = 'primary',
  size = 'sm',
  icon,
  className = '',
  children,
}: PillProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-widest ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {icon}
      {children}
    </span>
  )
}
