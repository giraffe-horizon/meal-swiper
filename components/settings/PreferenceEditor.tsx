'use client'

import { useState, useMemo } from 'react'
import type { PersonSettings, DietaryFlag } from '@/types'
import { useIngredientsQuery } from '@/hooks/queries/useIngredientsQuery'
import { useCuisinesQuery } from '@/hooks/queries/useCuisinesQuery'

interface PreferenceEditorProps {
  person: PersonSettings
  personIndex: number
  onChange: (index: number, updated: PersonSettings) => void
}

const DIET_OPTIONS = [
  { id: 'none', label: 'Brak', flags: [] as DietaryFlag[] },
  { id: 'vegetarian', label: 'Wegetariańska', flags: ['vegetarian'] as DietaryFlag[] },
  { id: 'vegan', label: 'Wegańska', flags: ['vegan'] as DietaryFlag[] },
  { id: 'gluten_free', label: 'Bez glutenu', flags: ['gluten_free'] as DietaryFlag[] },
  { id: 'dairy_free', label: 'Bez laktozy', flags: ['dairy_free'] as DietaryFlag[] },
] as const

export default function PreferenceEditor({ person, personIndex, onChange }: PreferenceEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [ingredientSearch, setIngredientSearch] = useState('')

  const { data: ingredients = [], isLoading: ingredientsLoading } = useIngredientsQuery()
  const { data: cuisines = [], isLoading: cuisinesLoading } = useCuisinesQuery()

  // Filter out seasonings from ingredients
  const nonSeasoningIngredients = useMemo(
    () => ingredients.filter((ingredient) => !ingredient.is_seasoning),
    [ingredients]
  )

  // Filter ingredients by search term
  const filteredIngredients = useMemo(() => {
    if (!ingredientSearch.trim()) return []
    return nonSeasoningIngredients
      .filter((ingredient) =>
        ingredient.name.toLowerCase().includes(ingredientSearch.toLowerCase())
      )
      .slice(0, 10) // Limit to 10 results
  }, [nonSeasoningIngredients, ingredientSearch])

  // Selected ingredients (excluded)
  const selectedIngredients = useMemo(
    () =>
      nonSeasoningIngredients.filter((ingredient) =>
        (person.excludedIngredients || []).includes(ingredient.id)
      ),
    [nonSeasoningIngredients, person.excludedIngredients]
  )

  const currentDiet = useMemo(() => {
    if (!person.diet || person.diet.length === 0) return 'none'
    const currentFlags = person.diet
    return (
      DIET_OPTIONS.find(
        (option) =>
          option.flags.length === currentFlags.length &&
          option.flags.every((flag) => currentFlags.includes(flag))
      )?.id || 'none'
    )
  }, [person.diet])

  const handleUpdate = (updates: Partial<PersonSettings>) => {
    onChange(personIndex, { ...person, ...updates })
  }

  const handleDietChange = (optionId: string) => {
    const option = DIET_OPTIONS.find((opt) => opt.id === optionId)
    handleUpdate({ diet: option?.flags || [] })
  }

  const handleCuisineToggle = (cuisine: string) => {
    const current = person.cuisinePreferences || []
    const updated = current.includes(cuisine)
      ? current.filter((c) => c !== cuisine)
      : [...current, cuisine]
    handleUpdate({ cuisinePreferences: updated })
  }

  const handleIngredientToggle = (ingredientId: string) => {
    const current = person.excludedIngredients || []
    const updated = current.includes(ingredientId)
      ? current.filter((id) => id !== ingredientId)
      : [...current, ingredientId]
    handleUpdate({ excludedIngredients: updated })
  }

  const handleMealsPerDayChange = (value: number) => {
    handleUpdate({ mealsPerDay: Math.max(1, Math.min(10, value)) })
  }

  return (
    <div className="bg-slate-50 dark:bg-surface-dark/50 rounded-xl p-4 space-y-3">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <h3 className="text-sm font-semibold text-slate-700 dark:text-text-secondary-dark flex items-center gap-2">
          <span>🍳</span>
          Preferencje — {person.name}
        </h3>
        <span
          className={`material-symbols-outlined text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        >
          expand_more
        </span>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="space-y-4 pt-2">
          {/* Diet Options */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-text-secondary-dark uppercase tracking-wider mb-2">
              Dieta
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DIET_OPTIONS.map((option) => (
                <label key={option.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`diet-${personIndex}`}
                    value={option.id}
                    checked={currentDiet === option.id}
                    onChange={(e) => handleDietChange(e.target.value)}
                    className="w-4 h-4 text-primary focus:ring-primary/50 focus:ring-2"
                  />
                  <span className="text-sm text-slate-700 dark:text-text-secondary-dark">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Cuisine Preferences */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-text-secondary-dark uppercase tracking-wider mb-2">
              Lubię kuchnie
            </label>
            {cuisinesLoading ? (
              <div className="text-sm text-slate-400">Ładowanie...</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {cuisines.map((cuisine) => {
                  const isSelected = (person.cuisinePreferences || []).includes(cuisine)
                  return (
                    <button
                      key={cuisine}
                      onClick={() => handleCuisineToggle(cuisine)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        isSelected
                          ? 'bg-primary text-white'
                          : 'bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark text-slate-700 dark:text-text-secondary-dark hover:bg-slate-50 dark:hover:bg-surface-dark/50'
                      }`}
                    >
                      {cuisine}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Excluded Ingredients */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-text-secondary-dark uppercase tracking-wider mb-2">
              Nie lubię (składniki)
            </label>

            {/* Selected ingredients chips */}
            {selectedIngredients.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedIngredients.map((ingredient) => (
                  <div
                    key={ingredient.id}
                    className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 rounded-full text-sm"
                  >
                    <span>{ingredient.name}</span>
                    <button
                      onClick={() => handleIngredientToggle(ingredient.id)}
                      className="w-4 h-4 rounded-full hover:bg-red-200 dark:hover:bg-red-500/30 flex items-center justify-center"
                      title="Usuń"
                    >
                      <span className="material-symbols-outlined text-xs">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Search input */}
            <input
              type="text"
              value={ingredientSearch}
              onChange={(e) => setIngredientSearch(e.target.value)}
              placeholder="Szukaj składników..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-border-dark bg-white dark:bg-surface-dark text-slate-900 dark:text-text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder-slate-400"
            />

            {/* Search results */}
            {ingredientSearch && (
              <div className="mt-2 space-y-1">
                {ingredientsLoading ? (
                  <div className="text-sm text-slate-400 px-3 py-2">Ładowanie...</div>
                ) : filteredIngredients.length > 0 ? (
                  filteredIngredients.map((ingredient) => {
                    const isExcluded = (person.excludedIngredients || []).includes(ingredient.id)
                    return (
                      <button
                        key={ingredient.id}
                        onClick={() => handleIngredientToggle(ingredient.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          isExcluded
                            ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400'
                            : 'hover:bg-slate-50 dark:hover:bg-surface-dark/50 text-slate-700 dark:text-text-secondary-dark'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{ingredient.name}</span>
                          <span className="text-xs text-slate-400">({ingredient.category})</span>
                          {isExcluded && (
                            <span className="material-symbols-outlined text-sm text-red-500">
                              check
                            </span>
                          )}
                        </span>
                      </button>
                    )
                  })
                ) : (
                  <div className="text-sm text-slate-400 px-3 py-2">Brak wyników</div>
                )}
              </div>
            )}
          </div>

          {/* Meals Per Day */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-text-secondary-dark uppercase tracking-wider mb-2">
              Posiłków dziennie
            </label>
            <input
              type="number"
              value={person.mealsPerDay || 3}
              onChange={(e) => handleMealsPerDayChange(parseInt(e.target.value) || 3)}
              min="1"
              max="10"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-border-dark bg-white dark:bg-surface-dark text-slate-900 dark:text-text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
      )}
    </div>
  )
}
