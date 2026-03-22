'use client'

import { useState, useMemo } from 'react'
import type { Meal, MealWithVariants, MealVariant, PersonSettings } from '@/types'
import { calculatePersonScale, scaleIngredientAmount } from '@/lib/scaling'
import RecipeSteps from '@/components/cooking/RecipeSteps'
import CookingProgressBar from '@/components/cooking/CookingProgressBar'
import CookingHero from '@/components/cooking/CookingHero'
import IngredientSection from '@/components/cooking/IngredientSection'
import IngredientRow from '@/components/cooking/IngredientRow'
import { useCookingData } from '@/hooks/useCookingData'
import Section from '@/components/ui/Section'

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

  const { isVariantMeal, legacyData, variantData } = useCookingData(
    meal,
    scaleFactor,
    persons,
    variantAssignment
  )

  const toggleStep = (i: number) => setCheckedSteps((prev) => ({ ...prev, [i]: !prev[i] }))
  const toggleIngredient = (key: string) =>
    setCheckedIngredients((prev) => ({ ...prev, [key]: !prev[key] }))

  const heroStats = useMemo(() => {
    const stats = [{ icon: 'schedule', label: `${meal.prep_time} min` }]
    if (!isVariantMeal && legacyData) {
      stats.push(
        { icon: 'local_fire_department', label: `${legacyData.totalKcal} kcal` },
        { icon: 'fitness_center', label: `${legacyData.totalProtein}g białka` }
      )
    }
    if (isVariantMeal && variantData) {
      stats.push({
        icon: 'group',
        label: variantData.hasSplit ? 'Split per osoba' : 'Wspólny wariant',
      })
    }
    return stats
  }, [meal.prep_time, isVariantMeal, legacyData, variantData])

  const activeSteps = legacyData?.steps || variantData?.steps || []
  const activeTips = legacyData?.tips || variantData?.tips

  return (
    <div className="bg-surface text-on-surface font-body min-h-screen">
      <CookingHero meal={meal} stats={heroStats} />

      <div className="px-6 mt-8 space-y-12 pb-40 max-w-2xl mx-auto">
        {/* Legacy ingredients */}
        {!isVariantMeal && legacyData && (
          <>
            <IngredientSection
              icon="grocery"
              title={`Składniki (${people} ${people === 1 ? 'osoby' : 'osób'})`}
              items={legacyData.scaledBase.map((ing) => ({ name: ing.name, amount: ing.amount }))}
              keyPrefix="base"
              checkedIngredients={checkedIngredients}
              onToggle={toggleIngredient}
            />
            <IngredientSection
              icon="set_meal"
              title="Opcja mięsna"
              iconColor="text-secondary"
              accentColor="secondary"
              items={legacyData.scaledMeat.map((ing) => ({ name: ing.name, amount: ing.amount }))}
              keyPrefix="meat"
              checkedIngredients={checkedIngredients}
              onToggle={toggleIngredient}
            />
          </>
        )}

        {/* Variant ingredients */}
        {isVariantMeal && variantData && (
          <>
            <IngredientSection
              icon="grocery"
              title="WSPÓLNE"
              items={variantData.sharedIngredients.map((ing) => ({
                name: ing.ingredient?.name || 'Unknown',
                amount: ing.totalDisplay,
              }))}
              keyPrefix="shared"
              checkedIngredients={checkedIngredients}
              onToggle={toggleIngredient}
            />

            {variantData.personData.map((personInfo, personIndex) => {
              const uniqueIngredients = variantData.uniqueByVariant.get(personInfo.variant.id) || []
              return (
                <Section
                  key={personInfo.person.name}
                  title={`${personInfo.person.name} (${personInfo.resultKcal} kcal)`}
                  icon={
                    <span className="material-symbols-outlined text-secondary text-[24px]">
                      person
                    </span>
                  }
                >
                  <div className="space-y-4">
                    {uniqueIngredients.map((ing, i) => {
                      const key = `person-${personIndex}-${i}`
                      const scaledAmount = scaleIngredientAmount(
                        ing,
                        calculatePersonScale(personInfo.variant, personInfo.person).scale
                      )
                      return (
                        <IngredientRow
                          key={key}
                          name={ing.ingredient?.name || 'Unknown'}
                          amount={scaledAmount.display}
                          checked={checkedIngredients[key] ?? false}
                          onToggle={() => toggleIngredient(key)}
                          accentColor="secondary"
                        />
                      )
                    })}
                  </div>
                </Section>
              )
            })}

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

        {/* Recipe steps */}
        {activeSteps.length > 0 && (
          <Section
            title="Przepis"
            icon={
              <span className="material-symbols-outlined text-primary text-[24px]">
                format_list_numbered
              </span>
            }
          >
            <CookingProgressBar
              total={activeSteps.length}
              done={activeSteps.filter((_, i) => checkedSteps[i]).length}
            />
            <RecipeSteps
              steps={activeSteps}
              checkedSteps={checkedSteps}
              onToggleStep={toggleStep}
            />
          </Section>
        )}

        {/* Tips */}
        {activeTips && (
          <section className="bg-tertiary-container rounded-xl p-6 border border-tertiary-container/20">
            <h2 className="font-headline text-base font-bold text-on-tertiary-container mb-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-[24px]">lightbulb</span>
              Wskazówki szefa
            </h2>
            <p className="text-on-tertiary-container/80 font-body text-sm leading-relaxed">
              {activeTips}
            </p>
          </section>
        )}
      </div>
    </div>
  )
}
