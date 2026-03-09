'use client'

import { useState } from 'react'
import type { DayKey, Meal, ViewId } from '@/types'
import { useMeals } from '@/hooks/useMeals'
import { useWeeklyPlan } from '@/hooks/useWeeklyPlan'
import { DAY_KEYS } from '@/lib/utils'
import Navigation from '@/components/Navigation'
import CalendarView from '@/components/CalendarView'
import SwipeView from '@/components/SwipeView'
import ShoppingListView from '@/components/ShoppingListView'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewId>('plan')
  const [currentSwipeDay, setCurrentSwipeDay] = useState<DayKey | null>(null)
  const { meals, loading } = useMeals()
  const {
    weeklyPlan,
    weekOffset,
    setWeekOffset,
    setMeal,
    removeMeal,
    toggleVacation,
  } = useWeeklyPlan()

  const handleDayClick = (day: DayKey) => {
    if (weeklyPlan[`${day}_free`]) return
    setCurrentSwipeDay(day)
    setCurrentView('swipe')
  }

  const handleSwipeRight = (meal: Meal) => {
    let targetDay = currentSwipeDay

    if (!targetDay) {
      targetDay =
        DAY_KEYS.find(
          (d) => !weeklyPlan[d] && !weeklyPlan[`${d}_free`]
        ) ?? null
    }

    if (targetDay) {
      setMeal(targetDay, meal)

      const nextEmptyDay =
        DAY_KEYS.find((d) => {
          if (d === targetDay) return false
          return !weeklyPlan[d] && !weeklyPlan[`${d}_free`]
        }) ?? null

      if (nextEmptyDay) {
        setCurrentSwipeDay(nextEmptyDay)
      } else {
        setTimeout(() => {
          setCurrentView('plan')
          setCurrentSwipeDay(null)
        }, 1500)
      }
    }
  }

  const handleRemoveMeal = (day: DayKey) => {
    removeMeal(day)
  }

  const handleToggleVacation = (day: DayKey) => {
    toggleVacation(day)
  }

  if (loading) {
    return <LoadingSpinner />
  }

  const viewTitles: Record<ViewId, string> = {
    plan: 'Plan',
    swipe: 'Propozycje',
    shopping: 'Lista zakupów',
  }

  return (
    <div className="h-dvh bg-background-light dark:bg-background-dark flex text-text-primary-light dark:text-text-primary-dark">
      <div className="flex-1 lg:ml-20 w-full flex flex-col h-dvh">
        {/* Global Header */}
        <header className="shrink-0 flex items-center justify-between px-4 py-3 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-border-light dark:border-border-dark z-10">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">
              restaurant
            </span>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {viewTitles[currentView]}
            </h1>
          </div>
          {currentView === 'swipe' && (
            <button
              onClick={() => {
                setCurrentView('plan')
                setCurrentSwipeDay(null)
              }}
              className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-primary px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Pomiń wszystkie
            </button>
          )}
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto min-h-0">
          {currentView === 'plan' && (
            <CalendarView
              weeklyPlan={weeklyPlan}
              onDayClick={handleDayClick}
              onRemoveMeal={handleRemoveMeal}
              onToggleVacation={handleToggleVacation}
              onGenerateShoppingList={() => setCurrentView('shopping')}
              weekOffset={weekOffset}
              onWeekChange={setWeekOffset}
            />
          )}

          {currentView === 'swipe' && (
            <SwipeView
              meals={meals}
              onSwipeRight={handleSwipeRight}
              currentDay={currentSwipeDay}
              onComplete={() => {
                setCurrentView('plan')
                setCurrentSwipeDay(null)
              }}
              weeklyPlan={weeklyPlan}
              onSkipAll={() => {
                setCurrentView('plan')
                setCurrentSwipeDay(null)
              }}
            />
          )}

          {currentView === 'shopping' && (
            <ShoppingListView
              weeklyPlan={weeklyPlan}
              weekOffset={weekOffset}
              onWeekChange={setWeekOffset}
            />
          )}
        </main>

        {/* Navigation: Mobile bottom nav (flow) + Desktop sidebar (fixed) */}
        <div className="shrink-0">
          <Navigation activeView={currentView} onNavigate={setCurrentView} />
        </div>
      </div>
    </div>
  )
}
