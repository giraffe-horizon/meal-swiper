'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ViewId } from '@/types'
import { AppProvider, useAppContext } from '@/lib/context'
import Navigation from '@/components/Navigation'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { getWeekDates, formatWeekRangeShort } from '@/lib/utils'

function pathToViewId(pathname: string): ViewId {
  if (pathname.startsWith('/swipe')) return 'swipe'
  if (pathname.startsWith('/shopping')) return 'shopping'
  if (pathname.startsWith('/cooking')) return 'cooking'
  if (pathname.startsWith('/settings')) return 'settings'
  return 'plan'
}

function AppShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { mealsLoading, weekOffset, setWeekOffset } = useAppContext()
  const activeView = pathToViewId(pathname)

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset])
  const weekRangeShort = useMemo(() => formatWeekRangeShort(weekDates), [weekDates])

  return (
    <div className="h-dvh bg-background-light dark:bg-background-dark flex text-text-primary-light dark:text-text-primary-dark transition-colors duration-300">
      <div className="flex-1 lg:ml-20 w-full flex flex-col h-dvh">
        {/* Global Header */}
        <header className="shrink-0 flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-border-light dark:border-border-dark z-10">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">restaurant</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setWeekOffset(weekOffset - 1)}
              className="p-1 sm:p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-surface-dark transition-colors"
            >
              <span className="material-symbols-outlined text-sm text-slate-600 dark:text-text-secondary-dark">
                chevron_left
              </span>
            </button>
            <span className="text-sm font-semibold text-slate-700 dark:text-text-secondary-dark min-w-[90px] text-center">
              {weekRangeShort}
            </span>
            <button
              onClick={() => setWeekOffset(weekOffset + 1)}
              className="p-1 sm:p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-surface-dark transition-colors"
            >
              <span className="material-symbols-outlined text-sm text-slate-600 dark:text-text-secondary-dark">
                chevron_right
              </span>
            </button>
            <Link
              href="/settings"
              className="ml-1 p-1 sm:p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-surface-dark transition-colors lg:hidden"
              title="Ustawienia"
            >
              <span
                className={`material-symbols-outlined text-sm ${activeView === 'settings' ? 'text-primary' : 'text-slate-600 dark:text-text-secondary-dark'}`}
                style={activeView === 'settings' ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                settings
              </span>
            </Link>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto min-h-0">
          {mealsLoading ? <LoadingSpinner /> : children}
        </main>

        {/* Navigation */}
        <div className="shrink-0">
          <Navigation activeView={activeView} />
        </div>
      </div>
    </div>
  )
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <AppShellInner>{children}</AppShellInner>
    </AppProvider>
  )
}
