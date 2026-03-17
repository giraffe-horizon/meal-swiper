'use client'

import { useState, useMemo } from 'react'
import type {
  Meal,
  MealWithVariants,
  MealVariant,
  PersonSettings,
  MealVariantIngredient,
} from '@/types'
import {
  scaleIngredient,
  scaleNutrition,
  calculatePersonScale,
  scaleIngredientAmount,
} from '@/lib/scaling'
import { parseRecipe, enrichStepsStructured } from '@/lib/recipe'
import RecipeSteps from '@/components/cooking/RecipeSteps'
import CookingProgressBar from '@/components/cooking/CookingProgressBar'
import MealImagePlaceholder from '@/components/ui/MealImagePlaceholder'

interface CookingViewProps {
  meal: Meal | MealWithVariants
  people: number
  scaleFactor: number
  persons?: PersonSettings[]
  variantAssignment?: Record<string, MealVariant> | null
}

export default function CookingView({
  meal,
  people,
  scaleFactor,
  persons = [],
  variantAssignment,
}: CookingViewProps) {
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({})
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({})
  const [imgError, setImgError] = useState(false)

  // Determine if we're using variant architecture
  const isVariantMeal = 'variants' in meal && variantAssignment

  // Legacy rendering data
  const legacyData = useMemo(() => {
    if (isVariantMeal) return null

    const legacyMeal = meal as Meal
    const { steps, tips, baseIngredients, meatIngredients } = parseRecipe(legacyMeal)
    const scaledBase = baseIngredients.map((ing) => scaleIngredient(ing, scaleFactor))
    const scaledMeat = meatIngredients.map((ing) => scaleIngredient(ing, scaleFactor))
    const structuredSteps = enrichStepsStructured(steps, [...scaledBase, ...scaledMeat])

    return {
      steps: structuredSteps,
      tips,
      scaledBase,
      scaledMeat,
      totalKcal: scaleNutrition(legacyMeal.kcal_baza, scaleFactor),
      totalProtein: scaleNutrition(legacyMeal.bialko_baza, scaleFactor),
    }
  }, [meal, scaleFactor, isVariantMeal])

  // Variant rendering data
  const variantData = useMemo(() => {
    if (!isVariantMeal || !variantAssignment) return null

    const variantMeal = meal as MealWithVariants

    // For variant meals, we need to create a minimal Meal object for parseRecipe
    const legacyForParsing: Meal = {
      id: variantMeal.id,
      nazwa: variantMeal.nazwa,
      opis: variantMeal.opis,
      photo_url: variantMeal.photo_url,
      prep_time: variantMeal.prep_time,
      kcal_baza: 0, // Not used for recipe parsing
      kcal_z_miesem: 0,
      bialko_baza: 0,
      bialko_z_miesem: 0,
      trudnosc: variantMeal.trudnosc,
      kuchnia: variantMeal.kuchnia,
      category: variantMeal.category,
      skladniki_baza: '[]', // Not used for variant-based ingredients
      skladniki_mieso: '[]',
      przepis: variantMeal.przepis,
      tags: variantMeal.tags,
    }

    const { steps, tips } = parseRecipe(legacyForParsing)

    // Group persons by variant
    const variantGroups = new Map<string, { persons: PersonSettings[]; variant: MealVariant }>()

    for (const person of persons) {
      const variant = variantAssignment[person.name]
      if (!variant) continue

      const key = variant.id
      if (!variantGroups.has(key)) {
        variantGroups.set(key, { persons: [], variant })
      }
      variantGroups.get(key)!.persons.push(person)
    }

    // Calculate shared and unique ingredients
    const allIngredientIds = new Set<string>()
    const ingredientsByVariant = new Map<string, Map<string, MealVariantIngredient>>()

    for (const [variantId, { variant }] of variantGroups) {
      const variantIngredients = new Map()
      for (const ing of variant.ingredients || []) {
        allIngredientIds.add(ing.ingredient_id)
        variantIngredients.set(ing.ingredient_id, ing)
      }
      ingredientsByVariant.set(variantId, variantIngredients)
    }

    // Find shared ingredients (present in ALL variants)
    const sharedIngredients: Array<MealVariantIngredient & { totalDisplay: string }> = []
    const uniqueByVariant = new Map<string, MealVariantIngredient[]>()

    for (const ingredientId of allIngredientIds) {
      const variants = Array.from(variantGroups.keys())
      const presentInAll = variants.every((vId) => ingredientsByVariant.get(vId)?.has(ingredientId))

      if (presentInAll && variants.length > 1) {
        // Shared ingredient - sum up amounts
        let totalGrams = 0
        let displayIngredient = null

        for (const [vId, { persons: vPersons }] of variantGroups) {
          const ingredient = ingredientsByVariant.get(vId)!.get(ingredientId)!
          for (const person of vPersons) {
            const { scale } = calculatePersonScale(variantGroups.get(vId)!.variant, person)
            const scaledAmount = scaleIngredientAmount(ingredient, scale)
            totalGrams += scaledAmount.grams || 0
          }
          if (!displayIngredient) displayIngredient = ingredient
        }

        sharedIngredients.push({
          ...displayIngredient,
          totalDisplay:
            totalGrams >= 1000 ? `${(totalGrams / 1000).toFixed(1)} kg` : `${totalGrams} g`,
        })
      } else {
        // Unique to specific variants
        for (const [vId] of variantGroups) {
          const ingredient = ingredientsByVariant.get(vId)?.get(ingredientId)
          if (!ingredient) continue

          if (!uniqueByVariant.has(vId)) {
            uniqueByVariant.set(vId, [])
          }
          uniqueByVariant.get(vId)!.push(ingredient)
        }
      }
    }

    // Calculate person-specific data
    const personData: Array<{
      person: PersonSettings
      variant: MealVariant
      resultKcal: number
      resultProtein: number
      scaledIngredients: Array<
        MealVariantIngredient & { scaled: ReturnType<typeof scaleIngredientAmount> }
      >
    }> = []

    for (const person of persons) {
      const variant = variantAssignment[person.name]
      if (!variant) continue

      const { scale, resultKcal, resultProtein } = calculatePersonScale(variant, person)
      const scaledIngredients = (variant.ingredients || []).map((ing) => ({
        ...ing,
        scaled: scaleIngredientAmount(ing, scale),
      }))

      personData.push({
        person,
        variant,
        resultKcal,
        resultProtein,
        scaledIngredients,
      })
    }

    return {
      steps: enrichStepsStructured(steps, []),
      tips,
      sharedIngredients,
      uniqueByVariant,
      variantGroups,
      personData,
      hasSplit: variantGroups.size > 1,
    }
  }, [meal, variantAssignment, persons, isVariantMeal])

  const toggleStep = (i: number) => setCheckedSteps((prev) => ({ ...prev, [i]: !prev[i] }))
  const toggleIngredient = (key: string) =>
    setCheckedIngredients((prev) => ({ ...prev, [key]: !prev[key] }))

  return (
    <div>
      {/* Hero image */}
      <div className="relative w-full" style={{ height: 'clamp(160px, 30vh, 280px)' }}>
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
            iconSize="text-7xl"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
          <h1 className="text-2xl font-bold leading-tight">{meal.nazwa}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-white/80">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">schedule</span>
              {meal.prep_time} min
            </span>
            {!isVariantMeal && legacyData && (
              <>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">
                    local_fire_department
                  </span>
                  {legacyData.totalKcal} kcal
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">fitness_center</span>
                  {legacyData.totalProtein}g białka
                </span>
              </>
            )}
            {isVariantMeal && variantData && (
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">group</span>
                {variantData.hasSplit ? 'Split per osoba' : 'Wspólny wariant'}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6 pb-8">
        {/* Legacy ingredients rendering */}
        {!isVariantMeal && legacyData && (
          <>
            {/* Składniki baza */}
            {legacyData.scaledBase.length > 0 && (
              <section>
                <h2 className="text-base font-bold text-slate-800 dark:text-text-primary-dark mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    grocery
                  </span>
                  Składniki ({people} {people === 1 ? 'osoby' : 'osób'})
                </h2>
                <div className="space-y-2">
                  {legacyData.scaledBase.map((ing, i) => {
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
            {legacyData.scaledMeat.length > 0 && (
              <section>
                <h2 className="text-base font-bold text-slate-800 dark:text-text-primary-dark mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-orange-500 text-[20px]">
                    set_meal
                  </span>
                  Opcja mięsna
                </h2>
                <div className="space-y-2">
                  {legacyData.scaledMeat.map((ing, i) => {
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
          </>
        )}

        {/* Variant ingredients rendering */}
        {isVariantMeal && variantData && (
          <>
            {/* Shared ingredients */}
            {variantData.sharedIngredients.length > 0 && (
              <section>
                <h2 className="text-base font-bold text-slate-800 dark:text-text-primary-dark mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    grocery
                  </span>
                  WSPÓLNE
                </h2>
                <div className="space-y-2">
                  {variantData.sharedIngredients.map((ing, i) => {
                    const key = `shared-${i}`
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
                            {ing.ingredient?.name || 'Unknown'}
                          </span>
                          <span
                            aria-hidden
                            className="mx-1.5 flex-1 self-end mb-[3px] border-b border-dotted border-slate-300/70 dark:border-slate-600/70"
                          />
                          <span
                            className={`text-sm text-slate-500 dark:text-text-secondary-dark font-bold shrink-0 ${checked ? 'line-through' : ''}`}
                          >
                            {ing.totalDisplay}
                          </span>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Per-person sections */}
            {variantData.personData.map((personInfo, personIndex) => {
              const uniqueIngredients = variantData.uniqueByVariant.get(personInfo.variant.id) || []

              return (
                <section key={personInfo.person.name}>
                  <h2 className="text-base font-bold text-slate-800 dark:text-text-primary-dark mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-500 text-[20px]">
                      person
                    </span>
                    {personInfo.person.name} ({personInfo.resultKcal} kcal)
                  </h2>
                  <div className="space-y-2">
                    {uniqueIngredients.map((ing, i) => {
                      const key = `person-${personIndex}-${i}`
                      const checked = checkedIngredients[key] ?? false
                      const scaledAmount = scaleIngredientAmount(
                        ing,
                        calculatePersonScale(personInfo.variant, personInfo.person).scale
                      )
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
                                ? 'bg-blue-500 border-blue-500'
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
                              {ing.ingredient?.name || 'Unknown'}
                            </span>
                            <span
                              aria-hidden
                              className="mx-1.5 flex-1 self-end mb-[3px] border-b border-dotted border-slate-300/70 dark:border-slate-600/70"
                            />
                            <span
                              className={`text-sm text-slate-500 dark:text-text-secondary-dark font-bold shrink-0 ${checked ? 'line-through' : ''}`}
                            >
                              {scaledAmount.display}
                            </span>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </section>
              )
            })}

            {/* Macros per person */}
            {variantData.personData.length > 0 && (
              <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">analytics</span>
                  Makroskładniki per osoba
                </h3>
                <div className="space-y-1">
                  {variantData.personData.map((personInfo) => (
                    <div
                      key={personInfo.person.name}
                      className="text-sm text-blue-700 dark:text-blue-300"
                    >
                      <strong>{personInfo.person.name}:</strong> ~{personInfo.resultKcal} kcal ·{' '}
                      {personInfo.resultProtein}g białka
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Recipe steps - works for both legacy and variant */}
        {((legacyData && legacyData.steps.length > 0) ||
          (variantData && variantData.steps.length > 0)) && (
          <section>
            <h2 className="text-base font-bold text-slate-800 dark:text-text-primary-dark mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">
                format_list_numbered
              </span>
              Przepis
            </h2>
            {legacyData && (
              <>
                <CookingProgressBar
                  total={legacyData.steps.length}
                  done={legacyData.steps.filter((_, i) => checkedSteps[i]).length}
                />
                <RecipeSteps
                  steps={legacyData.steps}
                  checkedSteps={checkedSteps}
                  onToggleStep={toggleStep}
                />
              </>
            )}
            {variantData && (
              <>
                <CookingProgressBar
                  total={variantData.steps.length}
                  done={variantData.steps.filter((_, i) => checkedSteps[i]).length}
                />
                <RecipeSteps
                  steps={variantData.steps}
                  checkedSteps={checkedSteps}
                  onToggleStep={toggleStep}
                />
              </>
            )}
          </section>
        )}

        {/* Tips - works for both legacy and variant */}
        {((legacyData && legacyData.tips) || (variantData && variantData.tips)) && (
          <section className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <h2 className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">lightbulb</span>
              Wskazówki szefa
            </h2>
            <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
              {legacyData?.tips || variantData?.tips}
            </p>
          </section>
        )}
      </div>
    </div>
  )
}
