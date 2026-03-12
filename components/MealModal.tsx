'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Meal, Ingredient, RecipeStep } from '@/types'
import { scaleIngredient, scaleNutrition, computePersonRatio } from '@/lib/scaling'
import { enrichStepsStructured } from '@/lib/recipe'
import { useAppContext } from '@/lib/context'
import AmountBadge from '@/components/ui/AmountBadge'
import MealImagePlaceholder from '@/components/ui/MealImagePlaceholder'

interface MealModalProps {
  meal: Meal | null
  onClose: () => void
}

function parseJSON<T>(json: string, fallback: T): T {
  try {
    const parsed = typeof json === 'string' ? JSON.parse(json) : json
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

export default function MealModal({ meal, onClose }: MealModalProps) {
  const { settings, scaleFactor } = useAppContext()
  const people = settings.people
  const [isVisible, setIsVisible] = useState(false)
  const [showMeat, setShowMeat] = useState(false)
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    if (meal) {
      const raf = requestAnimationFrame(() => setIsVisible(true))
      document.body.style.overflow = 'hidden'
      return () => {
        cancelAnimationFrame(raf)
        document.body.style.overflow = ''
      }
    } else {
      const t = setTimeout(() => setIsVisible(false), 0)
      document.body.style.overflow = ''
      return () => clearTimeout(t)
    }
  }, [meal])

  const handleClose = useCallback(() => {
    setIsVisible(false)
    setTimeout(() => onClose(), 300)
  }, [onClose])

  useEffect(() => {
    if (!meal) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [meal, handleClose])

  if (!meal) return null

  const baseIngredients: Ingredient[] = parseJSON(meal.skladniki_baza, [])
  const meatIngredients: Ingredient[] = parseJSON(meal.skladniki_mieso, [])
  const recipe: RecipeStep = parseJSON(meal.przepis, { kroki: [] })
  const hasMeat = meatIngredients.length > 0

  const scaledBase = baseIngredients.map((ing) => scaleIngredient(ing, scaleFactor))
  const scaledMeat = meatIngredients.map((ing) => scaleIngredient(ing, scaleFactor))
  const structuredKroki = enrichStepsStructured(recipe.kroki ?? [], [...scaledBase, ...scaledMeat])

  const totalKcal = scaleNutrition(meal.kcal_baza, scaleFactor)
  const totalProtein = scaleNutrition(meal.bialko_baza, scaleFactor)

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="absolute inset-0 flex items-end lg:items-center justify-center">
        <div
          className={`relative w-full max-w-lg max-h-[92dvh] bg-surface-light dark:bg-surface-dark rounded-t-3xl lg:rounded-2xl overflow-hidden flex flex-col transition-transform duration-300 ease-out ${isVisible ? 'translate-y-0' : 'translate-y-full lg:translate-y-8'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>

          {/* Scrollable content */}
          <div className="overflow-y-auto flex-1">
            {/* Photo */}
            <div className="relative w-full aspect-[16/9] sm:aspect-[16/10]">
              {meal.photo_url && !imgError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={meal.photo_url}
                  alt={meal.nazwa}
                  className="w-full h-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <MealImagePlaceholder
                  category={meal.category}
                  className="w-full h-full"
                  iconSize="text-6xl"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
            </div>

            <div className="p-4 sm:p-5 space-y-4 sm:space-y-5">
              {/* Title + meta */}
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
                  {meal.nazwa}
                </h2>
                {meal.opis && (
                  <p className="text-xs sm:text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1 leading-relaxed">
                    {meal.opis}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  {meal.prep_time > 0 && (
                    <div className="flex items-center gap-1 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      <span className="material-symbols-outlined text-[18px]">schedule</span>
                      <span>{meal.prep_time} min</span>
                    </div>
                  )}
                  {meal.kcal_baza > 0 && (
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        <span className="material-symbols-outlined text-[18px]">
                          local_fire_department
                        </span>
                        <span>{totalKcal} kcal</span>
                      </div>
                      <div className="text-xs text-text-secondary-light/70 dark:text-text-secondary-dark/70 ml-6">
                        {settings.persons.slice(0, people).map((person, i) => {
                          const personKcal = Math.round(
                            meal.kcal_baza * computePersonRatio(person.kcal)
                          )
                          return (
                            <span key={i}>
                              Osoba {i + 1}: {personKcal} kcal
                              {i < people - 1 ? ' | ' : ''}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  {meal.bialko_baza > 0 && (
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        <span className="material-symbols-outlined text-[18px]">bolt</span>
                        <span>{totalProtein}g białka</span>
                      </div>
                      <div className="text-xs text-text-secondary-light/70 dark:text-text-secondary-dark/70 ml-6">
                        {settings.persons.slice(0, people).map((person, i) => {
                          const personProtein = Math.round(
                            meal.bialko_baza * computePersonRatio(person.kcal)
                          )
                          return (
                            <span key={i}>
                              Osoba {i + 1}: {personProtein}g{i < people - 1 ? ' | ' : ''}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  {meal.trudnosc && (
                    <div className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-surface-dark text-text-secondary-light dark:text-text-secondary-dark">
                      {meal.trudnosc}
                    </div>
                  )}
                </div>
              </div>

              {/* Base ingredients */}
              {baseIngredients.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark uppercase tracking-wide mb-2">
                    Składniki (baza)
                    <span className="text-xs font-normal text-text-secondary-light dark:text-text-secondary-dark ml-2 normal-case">
                      dla {people} {people === 1 ? 'osoby' : 'osób'}
                    </span>
                  </h3>
                  <ul className="space-y-1.5">
                    {scaledBase.map((ing, i) => (
                      <li
                        key={i}
                        className="flex items-baseline text-sm text-text-primary-light dark:text-text-primary-dark"
                      >
                        <span className="text-primary shrink-0 mr-1.5">•</span>
                        <span className="min-w-0 truncate">{ing.name}</span>
                        <span
                          aria-hidden
                          className="mx-1.5 flex-1 self-end mb-[3px] border-b border-dotted border-text-secondary-light/40 dark:border-text-secondary-dark/40"
                        />
                        <span className="text-text-secondary-light dark:text-text-secondary-dark font-bold shrink-0">
                          {ing.amount}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Meat add-on */}
              {hasMeat && (
                <div>
                  <button
                    onClick={() => setShowMeat(!showMeat)}
                    className="flex items-center gap-2 text-sm font-bold text-text-primary-light dark:text-text-primary-dark uppercase tracking-wide"
                  >
                    <span
                      className="material-symbols-outlined text-[18px] transition-transform"
                      style={{ transform: showMeat ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                    >
                      expand_more
                    </span>
                    Opcja mięsna (opcjonalnie)
                  </button>
                  {showMeat && (
                    <ul className="space-y-1.5 mt-2">
                      {scaledMeat.map((ing, i) => (
                        <li
                          key={i}
                          className="flex items-baseline text-sm text-text-primary-light dark:text-text-primary-dark"
                        >
                          <span className="text-orange-500 shrink-0 mr-1.5">•</span>
                          <span className="min-w-0 truncate">{ing.name}</span>
                          <span
                            aria-hidden
                            className="mx-1.5 flex-1 self-end mb-[3px] border-b border-dotted border-text-secondary-light/40 dark:border-text-secondary-dark/40"
                          />
                          <span className="text-text-secondary-light dark:text-text-secondary-dark font-bold shrink-0">
                            {ing.amount}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Recipe steps */}
              {structuredKroki.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark uppercase tracking-wide mb-2">
                    Przepis
                  </h3>
                  <ol className="space-y-2">
                    {structuredKroki.map((segments, i) => (
                      <li
                        key={i}
                        className="flex gap-3 text-sm text-text-primary-light dark:text-text-primary-dark"
                      >
                        <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <span className="flex-1 pt-0.5">
                          {segments.map((seg, j) =>
                            seg.type === 'text' ? (
                              <span key={j}>{seg.content}</span>
                            ) : (
                              <AmountBadge key={j} amount={seg.amount} />
                            )
                          )}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Tips */}
              {recipe.wskazowki && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <span className="font-bold">Wskazówka: </span>
                    {recipe.wskazowki}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
