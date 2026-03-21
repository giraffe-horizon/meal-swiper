'use client'

import Link from 'next/link'
import type { ViewId } from '@/types'

interface NavigationProps {
  activeView: ViewId
  token?: string
}

function navHref(view: string, token?: string): string {
  return token ? `/${token}/${view}` : `/${view}`
}

const navItems = [
  { id: 'plan' as ViewId, view: 'plan', icon: 'calendar_today', label: 'Plan' },
  { id: 'swipe' as ViewId, view: 'swipe', icon: 'swipe_vertical', label: 'Swipe' },
  { id: 'shopping' as ViewId, view: 'shopping', icon: 'shopping_cart', label: 'Lista' },
  { id: 'cooking' as ViewId, view: 'cooking', icon: 'restaurant', label: 'Gotowanie' },
  { id: 'settings' as ViewId, view: 'settings', icon: 'settings', label: 'Ustawienia' },
]

export default function Navigation({ activeView, token }: NavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-3 pb-8">
      <div className="fixed bottom-6 left-3 right-3 h-16 rounded-full bg-[#1a211e]/80 backdrop-blur-xl border border-white/5 flex items-center justify-around shadow-[0px_40px_40px_rgba(0,0,0,0.4)]">
        {navItems.map(({ id, view, icon, label }) => {
          const isActive = activeView === id
          return (
            <Link
              key={id}
              href={navHref(view, token)}
              className={`flex flex-col items-center justify-center gap-1 px-2 py-2 transition-colors active:scale-90 duration-200 ease-out ${
                isActive
                  ? "text-primary relative after:content-[''] after:w-1 after:h-1 after:bg-primary after:rounded-full after:absolute after:bottom-0"
                  : 'text-emerald-100/40 hover:text-emerald-200'
              }`}
            >
              <span
                className="material-symbols-outlined text-xl"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {icon}
              </span>
              <span className="font-body font-semibold text-[9px] tracking-wide leading-tight">
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
