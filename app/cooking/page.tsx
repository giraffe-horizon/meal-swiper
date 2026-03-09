'use client'

import { useState, useMemo } from 'react'
import { useAppContext } from '@/lib/context'
import { DAY_KEYS } from '@/lib/utils'
import type { Meal } from '@/types'

function getTodayMeal(weeklyPlan: ReturnType<typeof useAppContext>['weeklyPlan']): Meal | null {
  const today = new Date().getDay() // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
  const dayMap: Record<number, (typeof DAY_KEYS)[number]> = {
    1: 'mon',
    2: 'tue',
    3: 'wed',
    4: 'thu',
    5: 'fri',
  }
  const todayKey = dayMap[today]
  if (todayKey && weeklyPlan[todayKey]) return weeklyPlan[todayKey]
  // Fallback: first planned meal this week
  for (const key of DAY_KEYS) {
    if (weeklyPlan[key]) return weeklyPlan[key]
  }
  return null
}

export default function CookingPage() {
  const { weeklyPlan } = useAppContext()
  const meal = useMemo(() => getTodayMeal(weeklyPlan), [weeklyPlan])

  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({})
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({})

  if (!meal) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="text-6xl mb-4">🍽️</div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
          Brak zaplanowanego posiłku
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          Zaplanuj posiłki w zakładce Plan, aby zobaczyć przepis.
        </p>
      </div>
    )
  }

  const recipe = (() => {
    try {
      return typeof meal.przepis === 'string' ? JSON.parse(meal.przepis) : meal.przepis
    } catch {
      return null
    }
  })()

  const baseIngredients: { name: string; amount: string }[] = (() => {
    try {
      const raw =
        typeof meal.skladniki_baza === 'string'
          ? JSON.parse(meal.skladniki_baza)
          : meal.skladniki_baza
      return Array.isArray(raw) ? raw : []
    } catch {
      return []
    }
  })()

  const meatIngredients: { name: string; amount: string }[] = (() => {
    try {
      const raw =
        typeof meal.skladniki_mieso === 'string'
          ? JSON.parse(meal.skladniki_mieso)
          : meal.skladniki_mieso
      return Array.isArray(raw) ? raw : []
    } catch {
      return []
    }
  })()

  const steps: string[] = recipe?.kroki ?? []
  const tips: string = recipe?.wskazowki ?? ''

  const toggleStep = (i: number) => setCheckedSteps((prev) => ({ ...prev, [i]: !prev[i] }))
  const toggleIngredient = (key: string) =>
    setCheckedIngredients((prev) => ({ ...prev, [key]: !prev[key] }))

  return (
    <div className="flex-1 overflow-y-auto min-h-0">
      {/* Hero image */}
      <div className="relative w-full" style={{ height: 'clamp(160px, 30vh, 280px)' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={meal.photo_url} alt={meal.nazwa} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
          <h1 className="text-2xl font-bold leading-tight">{meal.nazwa}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-white/80">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">schedule</span>
              {meal.prep_time} min
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">local_fire_department</span>
              {meal.kcal_baza} kcal
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">fitness_center</span>
              {meal.bialko_baza}g białka
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6 pb-8">
        {/* Składniki baza */}
        {baseIngredients.length > 0 && (
          <section>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">grocery</span>
              Składniki (2 osoby)
            </h2>
            <div className="space-y-2">
              {baseIngredients.map((ing, i) => {
                const key = `base-${i}`
                const checked = checkedIngredients[key] ?? false
                return (
                  <label
                    key={key}
                    className={`flex items-center gap-3 py-2 px-3 rounded-lg cursor-pointer transition-colors ${
                      checked
                        ? 'opacity-50 bg-slate-50 dark:bg-slate-800/50'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                    }`}
                    onClick={() => toggleIngredient(key)}
                  >
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                        checked
                          ? 'bg-primary border-primary'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {checked && (
                        <span className="material-symbols-outlined text-white text-[14px]">
                          check
                        </span>
                      )}
                    </div>
                    <span
                      className={`flex-1 text-sm text-slate-800 dark:text-slate-200 ${checked ? 'line-through' : ''}`}
                    >
                      {ing.name}
                    </span>
                    <span className="text-sm text-slate-500 dark:text-slate-400 shrink-0">
                      {ing.amount}
                    </span>
                  </label>
                )
              })}
            </div>
          </section>
        )}

        {/* Dokładka mięsna */}
        {meatIngredients.length > 0 && (
          <section>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-orange-500 text-[20px]">
                set_meal
              </span>
              Dokładka mięsna (Łukasz)
            </h2>
            <div className="space-y-2">
              {meatIngredients.map((ing, i) => {
                const key = `meat-${i}`
                const checked = checkedIngredients[key] ?? false
                return (
                  <label
                    key={key}
                    className={`flex items-center gap-3 py-2 px-3 rounded-lg cursor-pointer transition-colors ${
                      checked
                        ? 'opacity-50 bg-slate-50 dark:bg-slate-800/50'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                    }`}
                    onClick={() => toggleIngredient(key)}
                  >
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                        checked
                          ? 'bg-orange-500 border-orange-500'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {checked && (
                        <span className="material-symbols-outlined text-white text-[14px]">
                          check
                        </span>
                      )}
                    </div>
                    <span
                      className={`flex-1 text-sm text-slate-800 dark:text-slate-200 ${checked ? 'line-through' : ''}`}
                    >
                      {ing.name}
                    </span>
                    <span className="text-sm text-slate-500 dark:text-slate-400 shrink-0">
                      {ing.amount}
                    </span>
                  </label>
                )
              })}
            </div>
          </section>
        )}

        {/* Przepis — kroki */}
        {steps.length > 0 && (
          <section>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">
                format_list_numbered
              </span>
              Przepis
            </h2>
            <div className="space-y-3">
              {steps.map((step, i) => {
                const done = checkedSteps[i] ?? false
                return (
                  <div
                    key={i}
                    onClick={() => toggleStep(i)}
                    className={`flex gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                      done
                        ? 'bg-green-50 dark:bg-green-900/20 opacity-60'
                        : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-sm font-bold transition-colors ${
                        done ? 'bg-green-500 text-white' : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {done ? '✓' : i + 1}
                    </div>
                    <p
                      className={`text-sm text-slate-700 dark:text-slate-300 leading-relaxed ${done ? 'line-through' : ''}`}
                    >
                      {step}
                    </p>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Wskazówki */}
        {tips && (
          <section className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <h2 className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">lightbulb</span>
              Wskazówki szefa
            </h2>
            <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">{tips}</p>
          </section>
        )}
      </div>
    </div>
  )
}
