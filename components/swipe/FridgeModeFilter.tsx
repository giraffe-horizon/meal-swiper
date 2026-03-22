'use client'

import { useState, useMemo } from 'react'
import type { IngredientWithCategory } from '@/lib/fridge'

interface FridgeModeFilterProps {
  enabled: boolean
  allIngredients: IngredientWithCategory[]
  selectedIngredients: string[]
  matchingMealsCount: number
  onToggle: () => void
  onToggleIngredient: (name: string) => void
  onClear: () => void
}

const CATEGORY_LABELS: Record<string, string> = {
  mięso: '🥩 Mięso i ryby',
  warzywa: '🥦 Warzywa',
  nabiał: '🥚 Nabiał',
  suche: '🌾 Suche i sypkie',
  inne: '🫙 Inne',
}

const CATEGORY_ORDER = ['mięso', 'warzywa', 'nabiał', 'suche', 'inne']

export default function FridgeModeFilter({
  enabled,
  allIngredients,
  selectedIngredients,
  matchingMealsCount,
  onToggle,
  onToggleIngredient,
  onClear,
}: FridgeModeFilterProps) {
  const [panelOpen, setPanelOpen] = useState(false)
  const [search, setSearch] = useState('')

  const grouped = useMemo(() => {
    const filtered = search
      ? allIngredients.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
      : allIngredients

    const map = new Map<string, IngredientWithCategory[]>()
    for (const cat of CATEGORY_ORDER) {
      map.set(cat, [])
    }
    for (const ing of filtered) {
      const cat = map.has(ing.category) ? ing.category : 'inne'
      map.get(cat)!.push(ing)
    }
    return map
  }, [allIngredients, search])

  const selectedSet = useMemo(() => new Set(selectedIngredients), [selectedIngredients])

  const handleToggle = () => {
    onToggle()
    if (!enabled) {
      setPanelOpen(true)
    } else {
      setPanelOpen(false)
    }
  }

  return (
    <>
      {/* Fridge mode toggle button row */}
      <div className="px-4 py-1.5 flex items-center gap-2">
        <button
          onClick={handleToggle}
          className={[
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150',
            enabled
              ? 'bg-teal-500 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 dark:bg-surface-dark dark:text-text-secondary-dark hover:bg-slate-200 dark:hover:bg-border-dark',
          ].join(' ')}
          aria-pressed={enabled}
        >
          <span className="text-sm">🧊</span>
          <span>Co mam w lodówce</span>
          {enabled && selectedIngredients.length > 0 && (
            <span className="ml-1 bg-white/30 rounded-full px-1.5 py-0.5 text-[10px] font-bold">
              {selectedIngredients.length}
            </span>
          )}
        </button>

        {enabled && (
          <>
            <button
              onClick={() => setPanelOpen((v) => !v)}
              className="text-teal-600 dark:text-teal-400 text-xs underline"
            >
              {panelOpen ? 'Zwiń' : 'Edytuj składniki'}
            </button>
            {selectedIngredients.length > 0 && (
              <span className="ml-auto text-xs text-slate-500 dark:text-text-secondary-dark">
                {matchingMealsCount} dań
              </span>
            )}
          </>
        )}
      </div>

      {/* Ingredient selection panel */}
      {enabled && panelOpen && (
        <div className="mx-4 mb-2 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-surface-dark shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-3 py-2 flex items-center justify-between border-b border-slate-100 dark:border-border-dark">
            <span className="text-xs font-semibold text-slate-700 dark:text-text-primary-dark">
              Zaznacz składniki, które masz
            </span>
            {selectedIngredients.length > 0 && (
              <button
                onClick={onClear}
                className="text-xs text-slate-400 hover:text-red-500 transition-colors"
              >
                Wyczyść
              </button>
            )}
          </div>

          {/* Search */}
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-border-dark">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Szukaj składnika..."
              className="w-full text-xs bg-slate-50 dark:bg-background-dark rounded-lg px-2 py-1.5 outline-none border border-slate-200 dark:border-border-dark focus:border-teal-400 dark:text-text-primary-dark placeholder:text-slate-400"
            />
          </div>

          {/* Ingredient chips grouped by category */}
          <div className="max-h-52 overflow-y-auto">
            {CATEGORY_ORDER.map((cat) => {
              const items = grouped.get(cat) ?? []
              if (items.length === 0) return null
              return (
                <div key={cat} className="px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-text-secondary-dark mb-1.5">
                    {CATEGORY_LABELS[cat]}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {items.map((ing) => {
                      const active = selectedSet.has(ing.name)
                      return (
                        <button
                          key={ing.name}
                          onClick={() => onToggleIngredient(ing.name)}
                          className={[
                            'px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-100',
                            active
                              ? 'bg-teal-500 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-600 dark:bg-background-dark dark:text-text-secondary-dark',
                          ].join(' ')}
                        >
                          {ing.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
            {allIngredients.length === 0 && (
              <p className="text-xs text-slate-400 px-3 py-4 text-center">Brak składników</p>
            )}
          </div>

          {/* Footer with match info */}
          {selectedIngredients.length > 0 && (
            <div className="px-3 py-2 bg-teal-50 dark:bg-teal-900/20 border-t border-teal-100 dark:border-teal-800/30">
              <p className="text-xs text-teal-700 dark:text-teal-300 font-medium">
                🍽️ Znajdziesz <strong>{matchingMealsCount} dań</strong> z Twoich składników
              </p>
            </div>
          )}
        </div>
      )}
    </>
  )
}
