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

        if (displayIngredient) {
          sharedIngredients.push({
            ...displayIngredient,
            totalDisplay:
              totalGrams >= 1000 ? `${(totalGrams / 1000).toFixed(1)} kg` : `${totalGrams} g`,
          })
        }
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
    <div className="bg-surface text-on-surface font-body min-h-screen">
      {/* Hero image with glassmorphism overlay */}
      <div className="relative w-full" style={{ height: 'clamp(200px, 35vh, 320px)' }}>
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

        {/* Glassmorphism overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 p-6 glass-card border-t border-white/5">
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="text-primary text-[10px] font-label font-bold uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded">
                {meal.kuchnia || 'Międzynarodowa'}
              </span>
              <h1 className="font-headline text-xl font-bold text-on-surface mt-1 leading-tight">
                {meal.nazwa}
              </h1>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex items-center gap-2 text-on-surface-variant bg-black/20 px-3 py-2 rounded-lg backdrop-blur-md">
              <span className="material-symbols-outlined text-sm">schedule</span>
              <span className="font-label text-sm font-bold">{meal.prep_time} min</span>
            </div>
            {!isVariantMeal && legacyData && (
              <>
                <div className="flex items-center gap-2 text-on-surface-variant bg-black/20 px-3 py-2 rounded-lg backdrop-blur-md">
                  <span className="material-symbols-outlined text-sm">local_fire_department</span>
                  <span className="font-label text-sm font-bold">{legacyData.totalKcal} kcal</span>
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant bg-black/20 px-3 py-2 rounded-lg backdrop-blur-md">
                  <span className="material-symbols-outlined text-sm">fitness_center</span>
                  <span className="font-label text-sm font-bold">
                    {legacyData.totalProtein}g białka
                  </span>
                </div>
              </>
            )}
            {isVariantMeal && variantData && (
              <div className="flex items-center gap-2 text-on-surface-variant bg-black/20 px-3 py-2 rounded-lg backdrop-blur-md">
                <span className="material-symbols-outlined text-sm">group</span>
                <span className="font-label text-sm font-bold">
                  {variantData.hasSplit ? 'Split per osoba' : 'Wspólny wariant'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 mt-8 space-y-12 pb-32 max-w-2xl mx-auto">
        {/* Legacy ingredients rendering */}
        {!isVariantMeal && legacyData && (
          <>
            {/* Składniki baza */}
            {legacyData.scaledBase.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-6">
                  <h2 className="font-headline text-base font-bold text-on-surface-variant flex items-center gap-3 flex-shrink-0">
                    <span className="material-symbols-outlined text-primary text-[24px]">
                      grocery
                    </span>
                    Składniki ({people} {people === 1 ? 'osoby' : 'osób'})
                  </h2>
                  <div className="h-[1px] w-full bg-outline-variant/30"></div>
                </div>
                <div className="space-y-4">
                  {legacyData.scaledBase.map((ing, i) => {
                    const key = `base-${i}`
                    const checked = checkedIngredients[key] ?? false
                    return (
                      <div key={key} className="flex items-center justify-between group">
                        <div
                          className="flex items-center gap-4 cursor-pointer flex-1"
                          onClick={() => toggleIngredient(key)}
                        >
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform active:scale-90 ${
                              checked
                                ? 'bg-primary'
                                : 'border-2 border-outline-variant hover:border-primary transition-colors'
                            }`}
                          >
                            {checked && (
                              <span
                                className="material-symbols-outlined text-[16px] text-on-primary font-bold"
                                style={{ fontVariationSettings: '"wght" 700' }}
                              >
                                check
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <span
                              className={`text-sm text-on-surface font-semibold ${checked ? 'line-through opacity-60' : ''}`}
                            >
                              {ing.name}
                            </span>
                            <span className="mx-2 text-outline-variant text-xs">•</span>
                            <span
                              className={`font-label text-xs font-bold uppercase tracking-tighter ${
                                checked ? 'text-outline-variant line-through' : 'text-tertiary'
                              }`}
                            >
                              {ing.amount}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Dokładka mięsna */}
            {legacyData.scaledMeat.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-6">
                  <h2 className="font-headline text-base font-bold text-on-surface-variant flex items-center gap-3 flex-shrink-0">
                    <span className="material-symbols-outlined text-secondary text-[24px]">
                      set_meal
                    </span>
                    Opcja mięsna
                  </h2>
                  <div className="h-[1px] w-full bg-outline-variant/30"></div>
                </div>
                <div className="space-y-4">
                  {legacyData.scaledMeat.map((ing, i) => {
                    const key = `meat-${i}`
                    const checked = checkedIngredients[key] ?? false
                    return (
                      <div key={key} className="flex items-center justify-between group">
                        <div
                          className="flex items-center gap-4 cursor-pointer flex-1"
                          onClick={() => toggleIngredient(key)}
                        >
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform active:scale-90 ${
                              checked
                                ? 'bg-secondary'
                                : 'border-2 border-outline-variant hover:border-secondary transition-colors'
                            }`}
                          >
                            {checked && (
                              <span
                                className="material-symbols-outlined text-[16px] text-on-secondary font-bold"
                                style={{ fontVariationSettings: '"wght" 700' }}
                              >
                                check
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <span
                              className={`text-sm text-on-surface font-semibold ${checked ? 'line-through opacity-60' : ''}`}
                            >
                              {ing.name}
                            </span>
                            <span className="mx-2 text-outline-variant text-xs">•</span>
                            <span
                              className={`font-label text-xs font-bold uppercase tracking-tighter ${
                                checked ? 'text-outline-variant line-through' : 'text-tertiary'
                              }`}
                            >
                              {ing.amount}
                            </span>
                          </div>
                        </div>
                      </div>
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
                <div className="flex items-center gap-4 mb-6">
                  <h2 className="font-headline text-base font-bold text-on-surface-variant flex items-center gap-3 flex-shrink-0">
                    <span className="material-symbols-outlined text-primary text-[24px]">
                      grocery
                    </span>
                    WSPÓLNE
                  </h2>
                  <div className="h-[1px] w-full bg-outline-variant/30"></div>
                </div>
                <div className="space-y-4">
                  {variantData.sharedIngredients.map((ing, i) => {
                    const key = `shared-${i}`
                    const checked = checkedIngredients[key] ?? false
                    return (
                      <div key={key} className="flex items-center justify-between group">
                        <div
                          className="flex items-center gap-4 cursor-pointer flex-1"
                          onClick={() => toggleIngredient(key)}
                        >
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform active:scale-90 ${
                              checked
                                ? 'bg-primary'
                                : 'border-2 border-outline-variant hover:border-primary transition-colors'
                            }`}
                          >
                            {checked && (
                              <span
                                className="material-symbols-outlined text-[16px] text-on-primary font-bold"
                                style={{ fontVariationSettings: '"wght" 700' }}
                              >
                                check
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <span
                              className={`text-sm text-on-surface font-semibold ${checked ? 'line-through opacity-60' : ''}`}
                            >
                              {ing.ingredient?.name || 'Unknown'}
                            </span>
                            <span className="mx-2 text-outline-variant text-xs">•</span>
                            <span
                              className={`font-label text-xs font-bold uppercase tracking-tighter ${
                                checked ? 'text-outline-variant line-through' : 'text-tertiary'
                              }`}
                            >
                              {ing.totalDisplay}
                            </span>
                          </div>
                        </div>
                      </div>
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
                  <div className="flex items-center gap-4 mb-6">
                    <h2 className="font-headline text-base font-bold text-on-surface-variant flex items-center gap-3 flex-shrink-0">
                      <span className="material-symbols-outlined text-secondary text-[24px]">
                        person
                      </span>
                      {personInfo.person.name} ({personInfo.resultKcal} kcal)
                    </h2>
                    <div className="h-[1px] w-full bg-outline-variant/30"></div>
                  </div>
                  <div className="space-y-4">
                    {uniqueIngredients.map((ing, i) => {
                      const key = `person-${personIndex}-${i}`
                      const checked = checkedIngredients[key] ?? false
                      const scaledAmount = scaleIngredientAmount(
                        ing,
                        calculatePersonScale(personInfo.variant, personInfo.person).scale
                      )
                      return (
                        <div key={key} className="flex items-center justify-between group">
                          <div
                            className="flex items-center gap-4 cursor-pointer flex-1"
                            onClick={() => toggleIngredient(key)}
                          >
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform active:scale-90 ${
                                checked
                                  ? 'bg-secondary'
                                  : 'border-2 border-outline-variant hover:border-secondary transition-colors'
                              }`}
                            >
                              {checked && (
                                <span
                                  className="material-symbols-outlined text-[16px] text-on-secondary font-bold"
                                  style={{ fontVariationSettings: '"wght" 700' }}
                                >
                                  check
                                </span>
                              )}
                            </div>
                            <div className="flex-1">
                              <span
                                className={`text-sm text-on-surface font-semibold ${checked ? 'line-through opacity-60' : ''}`}
                              >
                                {ing.ingredient?.name || 'Unknown'}
                              </span>
                              <span className="mx-2 text-outline-variant text-xs">•</span>
                              <span
                                className={`font-label text-xs font-bold uppercase tracking-tighter ${
                                  checked ? 'text-outline-variant line-through' : 'text-tertiary'
                                }`}
                              >
                                {scaledAmount.display}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )
            })}

            {/* Macros per person */}
            {variantData.personData.length > 0 && (
              <section className="bg-secondary-container rounded-xl p-6 border border-secondary-container/20">
                <h3 className="font-headline text-base font-bold text-on-secondary-container mb-4 flex items-center gap-3">
                  <span className="material-symbols-outlined text-[24px]">analytics</span>
                  Makroskładniki per osoba
                </h3>
                <div className="space-y-3">
                  {variantData.personData.map((personInfo) => (
                    <div
                      key={personInfo.person.name}
                      className="text-on-secondary-container/80 font-body"
                    >
                      <span className="font-semibold text-on-secondary-container">
                        {personInfo.person.name}:
                      </span>{' '}
                      ~{personInfo.resultKcal} kcal · {personInfo.resultProtein}g białka
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
            <div className="flex items-center gap-4 mb-6">
              <h2 className="font-headline text-base font-bold text-on-surface-variant flex items-center gap-3 flex-shrink-0">
                <span className="material-symbols-outlined text-primary text-[24px]">
                  format_list_numbered
                </span>
                Przepis
              </h2>
              <div className="h-[1px] w-full bg-outline-variant/30"></div>
            </div>
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
          <section className="bg-tertiary-container rounded-xl p-6 border border-tertiary-container/20">
            <h2 className="font-headline text-base font-bold text-on-tertiary-container mb-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-[24px]">lightbulb</span>
              Wskazówki szefa
            </h2>
            <p className="text-on-tertiary-container/80 font-body text-sm leading-relaxed">
              {legacyData?.tips || variantData?.tips}
            </p>
          </section>
        )}
      </div>
    </div>
  )
}
