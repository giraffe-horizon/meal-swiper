'use client'

import { useState, useEffect, useMemo } from 'react'
import type { WeeklyPlan, MealWithVariants, MealVariant } from '@/types'
import { getWeekKey } from '@/lib/utils'
import { getCheckedItems, saveCheckedItems, removeCheckedItems } from '@/lib/storage'
import { generateShoppingList } from '@/lib/shopping'
import { aggregateShoppingList, calculatePersonScale } from '@/lib/scaling'
import { useAppContext } from '@/lib/context'
import {
  useShoppingCheckedQuery,
  useShoppingCheckedMutation,
} from '@/hooks/queries/useShoppingCheckedQuery'

interface ShoppingListViewProps {
  weeklyPlan: WeeklyPlan
  weekOffset: number
}

export default function ShoppingListView({ weeklyPlan, weekOffset }: ShoppingListViewProps) {
  const { scaleFactor, tenantToken, settings, getVariantAssignment } = useAppContext()
  const weekKey = getWeekKey(weekOffset)

  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() =>
    typeof window !== 'undefined' ? getCheckedItems(weekKey) : {}
  )

  const { items, itemsByCategory, isVariantBased } = useMemo(() => {
    // Check if we have any variant assignments available
    const weekPlanValues = Object.values(weeklyPlan).filter(
      (meal) => meal && typeof meal === 'object' && 'id' in meal
    ) as Array<{ id: string }>
    const hasVariants = weekPlanValues.some((meal) => {
      const variantAssignment = getVariantAssignment(meal.id)
      return variantAssignment && Object.keys(variantAssignment).length > 0
    })

    if (hasVariants && settings.persons.length > 0) {
      // Use variant-based aggregation
      const weekPlanEntries = weekPlanValues
        .map((meal) => {
          const variantAssignment = getVariantAssignment(meal.id) || {}
          const personScales: Record<string, number> = {}

          // Calculate scales for each person
          for (const person of settings.persons) {
            const variant = variantAssignment[person.name]
            if (variant) {
              const { scale } = calculatePersonScale(variant, person)
              personScales[person.name] = scale
            }
          }

          // Safety check: ensure meal has variants before casting
          const mealWithVariants = meal as { variants?: unknown }
          if (!('variants' in meal) || !Array.isArray(mealWithVariants.variants)) {
            return null
          }

          return {
            meal: meal as unknown as MealWithVariants,
            variantAssignment,
            personScales,
          }
        })
        .filter(
          (
            entry
          ): entry is {
            meal: MealWithVariants
            variantAssignment: Record<string, MealVariant>
            personScales: Record<string, number>
          } =>
            entry !== null &&
            entry.variantAssignment &&
            Object.keys(entry.variantAssignment).length > 0
        )

      const variantShoppingList = aggregateShoppingList(weekPlanEntries)

      // Group by category for variant-based shopping
      const grouped = variantShoppingList.reduce(
        (acc, item) => {
          const category = item.ingredient.category
          if (!acc[category]) acc[category] = []
          acc[category].push({
            name: item.ingredient.name,
            amount: item.display,
            normalizedName: item.ingredient.id,
          })
          return acc
        },
        {} as Record<string, Array<{ name: string; amount: string; normalizedName: string }>>
      )

      // Convert to flat list for backward compatibility
      const flatItems = variantShoppingList.map((item) => ({
        name: item.ingredient.name,
        amount: item.display,
        normalizedName: item.ingredient.id,
      }))

      return {
        items: flatItems,
        itemsByCategory: grouped,
        isVariantBased: true,
      }
    } else {
      // Fallback to legacy shopping list generation
      const legacyItems = generateShoppingList(weeklyPlan, scaleFactor)
      return {
        items: legacyItems,
        itemsByCategory: {},
        isVariantBased: false,
      }
    }
  }, [weeklyPlan, scaleFactor, settings, getVariantAssignment])

  const { data: serverChecked } = useShoppingCheckedQuery(weekKey, tenantToken)
  const { mutate: syncCheckedToServer } = useShoppingCheckedMutation(tenantToken)

  useEffect(() => {
    // Reload from localStorage when week changes (initializer only runs once)
    setCheckedItems(getCheckedItems(weekKey))
  }, [weekKey])

  // When server data arrives: sync to state + localStorage
  useEffect(() => {
    if (serverChecked) {
      setCheckedItems(serverChecked)
      saveCheckedItems(weekKey, serverChecked)
    }
  }, [serverChecked, weekKey])

  const toggleItem = (normalizedName: string) => {
    const newChecked = { ...checkedItems, [normalizedName]: !checkedItems[normalizedName] }
    setCheckedItems(newChecked)
    saveCheckedItems(weekKey, newChecked)
    syncCheckedToServer({ weekKey, checked: newChecked })
  }

  const resetList = () => {
    if (window.confirm('Czy na pewno chcesz zresetować listę?')) {
      setCheckedItems({})
      removeCheckedItems(weekKey)
      syncCheckedToServer({ weekKey, checked: {} })
    }
  }

  const hasAnyItems = items.length > 0
  const totalItems = items.length
  const checkedCount = items.filter((item) => checkedItems[item.normalizedName]).length
  const progressPercent = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0
  const allChecked = totalItems > 0 && checkedCount === totalItems

  const checkAllItems = () => {
    const newChecked = allChecked
      ? {} // Uncheck all
      : items.reduce((acc, item) => ({ ...acc, [item.normalizedName]: true }), {}) // Check all

    setCheckedItems(newChecked)
    saveCheckedItems(weekKey, newChecked)
    syncCheckedToServer({ weekKey, checked: newChecked })
  }

  const shareList = () => {
    let text = '📝 Lista zakupów\n\n'
    items.forEach((item) => {
      text += `• ${item.name} — ${item.amount}\n`
    })
    navigator.clipboard.writeText(text)
    alert('✅ Lista skopiowana do schowka!')
  }

  return (
    <div className="bg-surface text-on-surface font-body min-h-screen pb-32">
      <main className="px-6 pt-6 max-w-2xl mx-auto">
        {!hasAnyItems ? (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-4xl text-primary">shopping_cart</span>
            </div>
            <h2 className="text-2xl font-bold text-on-surface mb-2">Brak listy zakupów</h2>
            <p className="text-on-surface-variant text-center">
              Zaplanuj posiłki na tydzień, aby wygenerować listę.
            </p>
          </div>
        ) : (
          <>
            {/* Progress Hero Section */}
            <section className="mb-10">
              <div className="flex items-end justify-between mb-6">
                <div>
                  <span className="font-label text-tertiary text-sm font-bold tracking-widest uppercase">
                    POSTĘP ZAKUPÓW
                  </span>
                  <h2 className="font-headline text-4xl font-extrabold mt-2 text-on-surface">
                    {checkedCount}/{totalItems} kupione
                  </h2>
                </div>
                <button
                  onClick={shareList}
                  className="flex items-center gap-2 px-6 py-3 rounded-[24px] bg-primary text-on-primary font-semibold transition-all hover:opacity-90 active:scale-95"
                >
                  <span className="material-symbols-outlined text-[20px]">share</span>
                  <span className="text-sm font-bold">Udostępnij</span>
                </button>
              </div>
              <div className="h-3 w-full bg-surface-container-highest rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full shadow-[0_0_15px_rgba(105,221,150,0.3)] transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </section>

            {/* Shopping List Groups */}
            <div className="space-y-12">
              {/* Variant-based categorized display */}
              {isVariantBased && Object.keys(itemsByCategory).length > 0 ? (
                Object.entries(itemsByCategory).map(([category, categoryItems]) => (
                  <section key={category}>
                    <div className="flex items-center gap-4 mb-6">
                      <h3 className="font-headline text-lg font-bold text-on-surface-variant flex-shrink-0 capitalize">
                        {category}
                      </h3>
                      <div className="h-[1px] w-full bg-outline-variant/30"></div>
                    </div>
                    <div className="space-y-4">
                      {categoryItems.map((item) => {
                        const isChecked = checkedItems[item.normalizedName] || false

                        return (
                          <div
                            key={item.normalizedName}
                            className="flex items-center justify-between group"
                          >
                            <div
                              className="flex items-center gap-4 cursor-pointer"
                              onClick={() => toggleItem(item.normalizedName)}
                            >
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform active:scale-90 ${
                                  isChecked
                                    ? 'bg-primary'
                                    : 'border-2 border-outline-variant hover:border-primary transition-colors'
                                }`}
                              >
                                {isChecked && (
                                  <span
                                    className="material-symbols-outlined text-[16px] text-on-primary font-bold"
                                    style={{ fontVariationSettings: "'wght' 700" }}
                                  >
                                    check
                                  </span>
                                )}
                              </div>
                              <div>
                                <span
                                  className={`text-on-surface font-semibold ${isChecked ? 'line-through opacity-60' : ''}`}
                                >
                                  {item.name}
                                </span>
                                <span className="mx-2 text-outline-variant text-xs">•</span>
                                <span
                                  className={`font-label text-xs font-bold uppercase tracking-tighter ${
                                    isChecked
                                      ? 'text-outline-variant line-through'
                                      : 'text-tertiary'
                                  }`}
                                >
                                  {item.amount}
                                </span>
                              </div>
                            </div>
                            <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="material-symbols-outlined text-outline-variant">
                                more_vert
                              </span>
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </section>
                ))
              ) : (
                /* Legacy flat display */
                <section>
                  <div className="flex items-center gap-4 mb-6">
                    <h3 className="font-headline text-lg font-bold text-on-surface-variant flex-shrink-0">
                      Produkty
                    </h3>
                    <div className="h-[1px] w-full bg-outline-variant/30"></div>
                  </div>
                  <div className="space-y-4">
                    {items.map((item) => {
                      const isChecked = checkedItems[item.normalizedName] || false

                      return (
                        <div
                          key={item.normalizedName}
                          className="flex items-center justify-between group"
                        >
                          <div
                            className="flex items-center gap-4 cursor-pointer"
                            onClick={() => toggleItem(item.normalizedName)}
                          >
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform active:scale-90 ${
                                isChecked
                                  ? 'bg-primary'
                                  : 'border-2 border-outline-variant hover:border-primary transition-colors'
                              }`}
                            >
                              {isChecked && (
                                <span
                                  className="material-symbols-outlined text-[16px] text-on-primary font-bold"
                                  style={{ fontVariationSettings: "'wght' 700" }}
                                >
                                  check
                                </span>
                              )}
                            </div>
                            <div>
                              <span
                                className={`text-on-surface font-semibold ${isChecked ? 'line-through opacity-60' : ''}`}
                              >
                                {item.name}
                              </span>
                              <span className="mx-2 text-outline-variant text-xs">•</span>
                              <span
                                className={`font-label text-xs font-bold uppercase tracking-tighter ${
                                  isChecked ? 'text-outline-variant line-through' : 'text-tertiary'
                                }`}
                              >
                                {item.amount}
                              </span>
                            </div>
                          </div>
                          <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="material-symbols-outlined text-outline-variant">
                              more_vert
                            </span>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}
            </div>

            {/* Add Item FAB */}
            <div className="mt-12 mb-20">
              <button
                onClick={resetList}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-xl border-2 border-dashed border-outline-variant/30 text-on-surface-variant hover:border-primary/50 hover:text-primary transition-all"
              >
                <span className="material-symbols-outlined">refresh</span>
                <span className="font-semibold">Resetuj listę zakupów</span>
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
