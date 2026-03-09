'use client'

import { useState, useEffect } from 'react'
import type { Ingredient, WeeklyPlan } from '@/types'
import { useWeekDates } from '@/hooks/useWeekDates'
import { getWeekKey } from '@/lib/utils'
import {
  getCheckedItems,
  saveCheckedItems,
  removeCheckedItems,
} from '@/lib/storage'

interface ShoppingListViewProps {
  weeklyPlan: WeeklyPlan
  weekOffset: number
  onWeekChange: (offset: number) => void
}

interface ShoppingList {
  [key: string]: Ingredient[]
}

const categories = [
  { key: 'mięso', label: '🥩 Mięso' },
  { key: 'warzywa', label: '🥦 Warzywa' },
  { key: 'nabiał', label: '🥛 Nabiał' },
  { key: 'suche', label: '🌾 Suche i inne' },
]

export default function ShoppingListView({
  weeklyPlan,
  weekOffset,
  onWeekChange,
}: ShoppingListViewProps) {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})
  const [shoppingList, setShoppingList] = useState<ShoppingList>({})
  const { formatWeekRange } = useWeekDates(weekOffset)

  const weekKey = getWeekKey(weekOffset)

  useEffect(() => {
    generateShoppingList()
    setCheckedItems(getCheckedItems(weekKey))
  }, [weeklyPlan, weekKey])

  const generateShoppingList = () => {
    const list: ShoppingList = {
      mięso: [],
      warzywa: [],
      nabiał: [],
      suche: [],
    }

    Object.values(weeklyPlan).forEach((meal) => {
      if (!meal || typeof meal !== 'object' || !('skladniki_baza' in meal))
        return

      try {
        const baseIngredients =
          typeof meal.skladniki_baza === 'string'
            ? JSON.parse(meal.skladniki_baza)
            : meal.skladniki_baza

        if (Array.isArray(baseIngredients)) {
          baseIngredients.forEach((ing: Ingredient) => {
            const category = (ing.category || 'suche').toLowerCase()
            if (list[category]) {
              list[category].push(ing)
            } else {
              list.suche.push(ing)
            }
          })
        }
      } catch (e) {
        console.error('Error parsing base ingredients:', e)
      }

      if (meal.skladniki_mieso) {
        try {
          const meatIngredients =
            typeof meal.skladniki_mieso === 'string'
              ? JSON.parse(meal.skladniki_mieso)
              : meal.skladniki_mieso

          if (Array.isArray(meatIngredients)) {
            meatIngredients.forEach((ing: Ingredient) => {
              list.mięso.push(ing)
            })
          }
        } catch (e) {
          console.error('Error parsing meat ingredients:', e)
        }
      }
    })

    setShoppingList(list)
  }

  const toggleItem = (category: string, index: number) => {
    const key = `${category}-${index}`
    const newChecked = { ...checkedItems, [key]: !checkedItems[key] }
    setCheckedItems(newChecked)
    saveCheckedItems(weekKey, newChecked)
  }

  const resetList = () => {
    if (window.confirm('Czy na pewno chcesz zresetować listę?')) {
      setCheckedItems({})
      removeCheckedItems(weekKey)
    }
  }

  const hasAnyItems = Object.values(shoppingList).some(
    (items) => items.length > 0
  )

  const totalItems = Object.values(shoppingList).reduce(
    (sum, items) => sum + items.length,
    0
  )
  const checkedCount = Object.keys(checkedItems).filter(
    (key) => checkedItems[key]
  ).length
  const allChecked = totalItems > 0 && checkedCount === totalItems

  const checkAllItems = () => {
    const newChecked: Record<string, boolean> = {}
    Object.keys(shoppingList).forEach((category) => {
      shoppingList[category].forEach((_, index) => {
        newChecked[`${category}-${index}`] = true
      })
    })
    setCheckedItems(newChecked)
    saveCheckedItems(weekKey, newChecked)
  }

  const shareList = () => {
    let text = '📝 Lista zakupów\n\n'
    categories.forEach(({ key, label }) => {
      const items = shoppingList[key] || []
      if (items.length > 0) {
        text += `${label}\n`
        items.forEach((item) => {
          text += `• ${item.name} - ${item.amount}\n`
        })
        text += '\n'
      }
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
              <span className="material-symbols-outlined text-[16px]">
                share
              </span>
              Udostępnij
            </button>
          </div>
        </div>
      )}

      {/* Week Navigation */}
      <div className="flex items-center justify-between px-4 py-3 bg-surface-light dark:bg-surface-dark shadow-sm">
        <button
          onClick={() => onWeekChange?.(weekOffset - 1)}
          className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors"
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <span className="font-semibold text-text-primary-light dark:text-text-primary-dark">
          {formatWeekRange()}
        </span>
        <button
          onClick={() => onWeekChange?.(weekOffset + 1)}
          className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors"
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 overflow-y-auto">
        {!hasAnyItems ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              Brak listy zakupów
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-center">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {categories.map(({ key, label }) => {
                const items = shoppingList[key] || []
                if (items.length === 0) return null

                return (
                  <section
                    key={key}
                    className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm overflow-hidden border border-border-light dark:border-border-dark"
                  >
                    <h3 className="text-lg font-bold px-4 py-3 bg-primary/5 dark:bg-primary/10 border-b border-border-light dark:border-border-dark text-text-primary-light dark:text-text-primary-dark">
                      {label}
                    </h3>
                    <div className="divide-y divide-border-light dark:divide-border-dark">
                      {items.map((item, index) => {
                        const itemKey = `${key}-${index}`
                        const isChecked = checkedItems[itemKey] || false

                        return (
                          <label
                            key={index}
                            className={`flex items-center gap-4 px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors ${
                              isChecked ? 'opacity-60' : ''
                            }`}
                          >
                            <div className="flex size-6 items-center justify-center shrink-0">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleItem(key, index)}
                                className="h-5 w-5 rounded border-border-light dark:border-border-dark border-2 bg-transparent text-primary checked:bg-primary checked:border-primary focus:ring-0 focus:ring-offset-0 focus:border-border-light dark:focus:border-border-dark focus:outline-none transition-colors cursor-pointer"
                              />
                            </div>
                            <span
                              className={`text-base font-medium flex-1 truncate text-text-primary-light dark:text-text-primary-dark ${
                                isChecked ? 'line-through' : ''
                              }`}
                            >
                              {item.name}
                            </span>
                            <span
                              className={`text-base text-text-secondary-light dark:text-text-secondary-dark font-medium shrink-0 ${
                                isChecked ? 'line-through' : ''
                              }`}
                            >
                              {item.amount}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </section>
                )
              })}
            </div>

            {/* Reset Button */}
            <div className="pt-4 pb-8 flex justify-center">
              <button
                onClick={resetList}
                className="px-6 py-2.5 rounded-full border border-border-light dark:border-border-dark text-text-secondary-light dark:text-text-secondary-dark font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">
                  refresh
                </span>
                Resetuj listę
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
