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
  const allChecked = totalItems > 0 && checkedCount === totalItems

  const checkAllItems = () => {
    const newChecked: Record<string, boolean> = {}
    items.forEach((item) => {
      newChecked[item.normalizedName] = true
    })
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
    <div className="flex flex-col flex-1 min-h-0 bg-background-light dark:bg-background-dark">
      {/* Toolbar */}
      {hasAnyItems && (
        <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-border-light dark:border-border-dark">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
              {checkedCount}/{totalItems} produktów
            </span>
            {allChecked && <span className="text-sm">🎉</span>}
          </div>
          <div className="flex gap-2">
            <button
              onClick={checkAllItems}
              className="text-xs font-medium text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors"
            >
              Zaznacz wszystkie
            </button>
            <button
              onClick={shareList}
              className="text-xs font-medium text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">share</span>
              Udostępnij
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 overflow-y-auto">
        {!hasAnyItems ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-text-primary-dark mb-2">
              Brak listy zakupów
            </h2>
            <p className="text-slate-600 dark:text-text-secondary-dark text-center">
              Zaplanuj posiłki na tydzień, aby wygenerować listę.
            </p>
          </div>
        ) : (
          <>
            {allChecked && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-4 text-center">
                <div className="text-4xl mb-2">🎉</div>
                <p className="text-lg font-bold text-green-800 dark:text-green-200">
                  Zakupy zrobione!
                </p>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  Wszystkie produkty zaznaczone
                </p>
              </div>
            )}

            {/* Variant-based categorized display */}
            {isVariantBased && Object.keys(itemsByCategory).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(itemsByCategory).map(([category, categoryItems]) => (
                  <div
                    key={category}
                    className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm overflow-hidden border border-border-light dark:border-border-dark"
                  >
                    <div className="px-4 py-2 bg-slate-100 dark:bg-slate-700 border-b border-border-light dark:border-border-dark">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 capitalize">
                        {category}
                      </h3>
                    </div>
                    <div className="divide-y divide-border-light dark:divide-border-dark">
                      {categoryItems.map((item) => {
                        const isChecked = checkedItems[item.normalizedName] || false

                        return (
                          <label
                            key={item.normalizedName}
                            className={`flex items-center gap-4 px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors ${
                              isChecked ? 'opacity-60' : ''
                            }`}
                          >
                            <div className="flex size-6 items-center justify-center shrink-0">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleItem(item.normalizedName)}
                                className="h-5 w-5 rounded border-border-light dark:border-border-dark border-2 bg-transparent text-primary checked:bg-primary checked:border-primary focus:ring-0 focus:ring-offset-0 focus:border-border-light dark:focus:border-border-dark focus:outline-none transition-colors cursor-pointer"
                              />
                            </div>
                            <span
                              className={`text-base font-medium flex-1 text-text-primary-light dark:text-text-primary-dark ${
                                isChecked ? 'line-through' : ''
                              }`}
                            >
                              {item.name}
                              <span
                                className={`text-text-secondary-light dark:text-text-secondary-dark font-normal ${isChecked ? 'line-through' : ''}`}
                              >
                                {' '}
                                — {item.amount}
                              </span>
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Legacy flat display */
              <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm overflow-hidden border border-border-light dark:border-border-dark">
                <div className="divide-y divide-border-light dark:divide-border-dark">
                  {items.map((item) => {
                    const isChecked = checkedItems[item.normalizedName] || false

                    return (
                      <label
                        key={item.normalizedName}
                        className={`flex items-center gap-4 px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors ${
                          isChecked ? 'opacity-60' : ''
                        }`}
                      >
                        <div className="flex size-6 items-center justify-center shrink-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleItem(item.normalizedName)}
                            className="h-5 w-5 rounded border-border-light dark:border-border-dark border-2 bg-transparent text-primary checked:bg-primary checked:border-primary focus:ring-0 focus:ring-offset-0 focus:border-border-light dark:focus:border-border-dark focus:outline-none transition-colors cursor-pointer"
                          />
                        </div>
                        <span
                          className={`text-base font-medium flex-1 text-text-primary-light dark:text-text-primary-dark ${
                            isChecked ? 'line-through' : ''
                          }`}
                        >
                          {item.name}
                          <span
                            className={`text-text-secondary-light dark:text-text-secondary-dark font-normal ${isChecked ? 'line-through' : ''}`}
                          >
                            {' '}
                            — {item.amount}
                          </span>
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Reset Button */}
            <div className="pt-4 pb-8 flex justify-center">
              <button
                onClick={resetList}
                className="px-6 py-2.5 rounded-full border border-border-light dark:border-border-dark text-text-secondary-light dark:text-text-secondary-dark font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                Resetuj listę
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
