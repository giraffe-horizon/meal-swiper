'use client'

import type { ButtonHTMLAttributes, ReactNode } from 'react'

const variantStyles = {
  primary: 'bg-primary text-[#2A3D2C] shadow-[0_0_30px_rgba(105,221,150,0.3)]',
  secondary: 'bg-[#2A3D2C] shadow-xl',
  danger: 'bg-error-container text-on-error-container',
} as const

const sizeStyles = {
  sm: 'w-9 h-9',
  md: 'w-11 h-11',
  lg: 'w-[60px] h-[60px]',
} as const

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantStyles
  size?: keyof typeof sizeStyles
  children: ReactNode
}

export default function IconButton({
  variant = 'secondary',
  size = 'md',
  className = '',
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      className={`rounded-full flex items-center justify-center hover:scale-105 transition-transform active:scale-90 duration-200 disabled:opacity-50 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
