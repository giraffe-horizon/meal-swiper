'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ViewId } from '@/types'
import { AppProvider, useAppContext } from '@/lib/context'
import Navigation from '@/components/Navigation'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

function pathToViewId(pathname: string): ViewId {
  const parts = pathname.split('/').filter(Boolean)
  const last = parts[parts.length - 1]
  if (last === 'swipe') return 'swipe'
  if (last === 'shopping') return 'shopping'
  if (last === 'cooking') return 'cooking'
  if (last === 'settings') return 'settings'
  return 'plan'
}

function AppShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { mealsLoading, tenantToken } = useAppContext()
  const activeView = pathToViewId(pathname)

  return (
    <div className="h-dvh bg-background flex text-on-background">
      <div className="flex-1 lg:ml-20 w-full flex flex-col h-dvh">
        {/* Global Header — Emerald Hearth */}
        <header className="shrink-0 flex items-center px-4 py-3 bg-surface z-10">
          <div className="flex items-center gap-3">
            <span
              className="material-symbols-outlined text-[#3cb371] text-2xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              menu_book
            </span>
            <h1 className="font-headline font-bold text-sm uppercase tracking-wider text-primary">
              Culinary Alchemist
            </h1>
          </div>
          {/* Icons removed — too cramped on mobile */}
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto min-h-0">
          {mealsLoading ? <LoadingSpinner /> : children}
        </main>

        {/* Navigation */}
        <div className="shrink-0">
          <Navigation activeView={activeView} token={tenantToken ?? undefined} />
        </div>
      </div>
    </div>
  )
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <AppShellInner>{children}</AppShellInner>
      </AppProvider>
    </QueryClientProvider>
  )
}
