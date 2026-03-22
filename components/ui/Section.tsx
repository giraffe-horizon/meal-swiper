'use client'

import type { ReactNode } from 'react'

interface SectionProps {
  title: string
  subtitle?: string
  icon?: ReactNode
  children: ReactNode
}

export default function Section({ title, subtitle, icon, children }: SectionProps) {
  return (
    <section>
      <div className="flex items-center gap-4 mb-6">
        <h2 className="font-headline text-base font-bold text-on-surface-variant flex items-center gap-3 flex-shrink-0">
          {icon}
          {title}
        </h2>
        <div className="h-[1px] w-full bg-outline-variant/30" />
      </div>
      {subtitle && <p className="text-on-surface-variant text-sm -mt-4 mb-4">{subtitle}</p>}
      {children}
    </section>
  )
}
