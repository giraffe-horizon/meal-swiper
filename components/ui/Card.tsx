'use client'

import type { ReactNode } from 'react'

const variantStyles = {
  surface: 'bg-surface-container rounded-[20px]',
  elevated: 'bg-surface-container rounded-[20px] shadow-2xl',
  outline: 'bg-surface-container-highest rounded-lg border border-outline-variant/30',
} as const

interface CardProps {
  variant?: keyof typeof variantStyles
  className?: string
  children: ReactNode
}

export default function Card({ variant = 'surface', className = '', children }: CardProps) {
  return <div className={`${variantStyles[variant]} ${className}`}>{children}</div>
}
