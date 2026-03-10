'use client'

import { useState } from 'react'
import type { Meal } from '@/types'
import { scaleIngredient, scaleNutrition } from '@/lib/scaling'
import { parseRecipe, enrichStepsStructured } from '@/lib/recipe'
import RecipeSteps from '@/components/cooking/RecipeSteps'

interface CookingViewProps {
  meal: Meal
  people: number
  scaleFactor: number
}

export default function CookingView({ meal, people, scaleFactor }: CookingViewProps) {
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({})
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({})

  const { steps, tips, baseIngredients, meatIngredients } = parseRecipe(meal)
  const scaledBase = baseIngredients.map((ing) => scaleIngredient(ing, scaleFactor))
  const scaledMeat = meatIngredients.map((ing) => scaleIngredient(ing, scaleFactor))
  const structuredSteps = enrichStepsStructured(steps, [...scaledBase, ...scaledMeat])

  const toggleStep = (i: number) => setCheckedSteps((prev) => ({ ...prev, [i]: !prev[i] }))
  const toggleIngredient = (key: string) =>
    setCheckedIngredients((prev) => ({ ...prev, [key]: !prev[key] }))

  return (
    <div>
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
              {scaleNutrition(meal.kcal_baza, scaleFactor)} kcal
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">fitness_center</span>
              {scaleNutrition(meal.bialko_baza, scaleFactor)}g białka
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6 pb-8">
        {/* Składniki baza */}
        {baseIngredients.length > 0 && (
          <section>
            <h2 className="text-base font-bold text-slate-800 dark:text-text-primary-dark mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">grocery</span>
              Składniki ({people} {people === 1 ? 'osoby' : 'osób'})
            </h2>
            <div className="space-y-2">
              {scaledBase.map((ing, i) => {
                const key = `base-${i}`
                const checked = checkedIngredients[key] ?? false
                return (
                  <label
                    key={key}
                    className={`flex items-center gap-3 py-2 px-3 rounded-lg cursor-pointer transition-colors ${
                      checked
                        ? 'opacity-50 bg-slate-50 dark:bg-surface-dark/50'
                        : 'hover:bg-slate-50 dark:hover:bg-surface-dark/30'
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
                    <div className="flex-1 min-w-0 flex items-baseline">
                      <span
                        className={`min-w-0 truncate text-sm text-slate-800 dark:text-text-primary-dark ${checked ? 'line-through' : ''}`}
                      >
                        {ing.name}
                      </span>
                      <span
                        aria-hidden
                        className="mx-1.5 flex-1 self-end mb-[3px] border-b border-dotted border-slate-300/70 dark:border-slate-600/70"
                      />
                      <span
                        className={`text-sm text-slate-500 dark:text-text-secondary-dark font-bold shrink-0 ${checked ? 'line-through' : ''}`}
                      >
                        {ing.amount}
                      </span>
                    </div>
                  </label>
                )
              })}
            </div>
          </section>
        )}

        {/* Dokładka mięsna */}
        {meatIngredients.length > 0 && (
          <section>
            <h2 className="text-base font-bold text-slate-800 dark:text-text-primary-dark mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-orange-500 text-[20px]">
                set_meal
              </span>
              Opcja mięsna
            </h2>
            <div className="space-y-2">
              {scaledMeat.map((ing, i) => {
                const key = `meat-${i}`
                const checked = checkedIngredients[key] ?? false
                return (
                  <label
                    key={key}
                    className={`flex items-center gap-3 py-2 px-3 rounded-lg cursor-pointer transition-colors ${
                      checked
                        ? 'opacity-50 bg-slate-50 dark:bg-surface-dark/50'
                        : 'hover:bg-slate-50 dark:hover:bg-surface-dark/30'
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
                    <div className="flex-1 min-w-0 flex items-baseline">
                      <span
                        className={`min-w-0 truncate text-sm text-slate-800 dark:text-text-primary-dark ${checked ? 'line-through' : ''}`}
                      >
                        {ing.name}
                      </span>
                      <span
                        aria-hidden
                        className="mx-1.5 flex-1 self-end mb-[3px] border-b border-dotted border-slate-300/70 dark:border-slate-600/70"
                      />
                      <span
                        className={`text-sm text-slate-500 dark:text-text-secondary-dark font-bold shrink-0 ${checked ? 'line-through' : ''}`}
                      >
                        {ing.amount}
                      </span>
                    </div>
                  </label>
                )
              })}
            </div>
          </section>
        )}

        {/* Przepis — kroki */}
        {steps.length > 0 && (
          <section>
            <h2 className="text-base font-bold text-slate-800 dark:text-text-primary-dark mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">
                format_list_numbered
              </span>
              Przepis
            </h2>
            <RecipeSteps
              steps={structuredSteps}
              checkedSteps={checkedSteps}
              onToggleStep={toggleStep}
            />
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
