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

const mobileNavItems = [
  { id: 'plan' as ViewId, view: 'plan', icon: 'calendar_month', label: 'Plan' },
  { id: 'swipe' as ViewId, view: 'swipe', icon: 'view_carousel', label: 'Swipe' },
  { id: 'shopping' as ViewId, view: 'shopping', icon: 'list_alt', label: 'Lista' },
  { id: 'cooking' as ViewId, view: 'cooking', icon: 'skillet', label: 'Gotuj' },
]

const desktopNavItems = [
  { id: 'plan' as ViewId, view: 'plan', icon: 'calendar_month', label: 'Plan' },
  { id: 'swipe' as ViewId, view: 'swipe', icon: 'view_carousel', label: 'Propozycje' },
  { id: 'shopping' as ViewId, view: 'shopping', icon: 'list_alt', label: 'Lista' },
  { id: 'cooking' as ViewId, view: 'cooking', icon: 'skillet', label: 'Gotowanie' },
]

export default function Navigation({ activeView, token }: NavigationProps) {
  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="bg-surface-light dark:bg-surface-dark border-t border-border-light dark:border-border-dark px-4 pb-safe pt-1 sm:pt-2 flex justify-center pb-3 sm:pb-4 lg:hidden">
        {mobileNavItems.map(({ id, view, icon, label }) => {
          const isActive = activeView === id
          return (
            <Link
              key={id}
              href={navHref(view, token)}
              className={`flex w-1/4 flex-col items-center justify-center gap-0.5 sm:gap-1 transition-colors py-0.5 sm:py-1 relative ${
                isActive
                  ? 'text-primary'
                  : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-primary'
              }`}
            >
              <span
                className="material-symbols-outlined text-xl sm:text-2xl"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {icon}
              </span>
              <span
                className={`text-[9px] sm:text-[10px] tracking-wide ${isActive ? 'font-bold' : 'font-medium'}`}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Desktop Sidebar Navigation */}
      <nav className="hidden lg:flex fixed left-0 top-0 bottom-0 w-20 bg-surface-light dark:bg-surface-dark flex-col items-center py-6 gap-1 z-30 px-2 border-r border-border-light dark:border-border-dark">
        <div className="mb-4">
          <span className="material-symbols-outlined text-primary text-3xl">restaurant</span>
        </div>
        {desktopNavItems.map(({ id, view, icon, label }) => {
          const isActive = activeView === id
          return (
            <Link
              key={id}
              href={navHref(view, token)}
              className={`flex w-full flex-col items-center justify-center gap-1 transition-colors py-3 rounded-xl relative ${
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-primary hover:bg-slate-100 dark:hover:bg-surface-dark'
              }`}
            >
              <span
                className="material-symbols-outlined text-2xl"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {icon}
              </span>
              <span
                className={`text-[9px] tracking-wide text-center ${
                  isActive ? 'font-bold' : 'font-medium'
                }`}
              >
                {label}
              </span>
            </Link>
          )
        })}

        {/* Settings at bottom of sidebar */}
        <div className="mt-auto">
          <Link
            href={navHref('settings', token)}
            className={`flex w-full flex-col items-center justify-center gap-1 transition-colors py-3 rounded-xl relative ${
              activeView === 'settings'
                ? 'text-primary bg-primary/10'
                : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-primary hover:bg-slate-100 dark:hover:bg-surface-dark'
            }`}
          >
            <span
              className="material-symbols-outlined text-2xl"
              style={activeView === 'settings' ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              settings
            </span>
            <span
              className={`text-[9px] tracking-wide text-center ${
                activeView === 'settings' ? 'font-bold' : 'font-medium'
              }`}
            >
              Ustawienia
            </span>
          </Link>
        </div>
      </nav>
    </>
  )
}
