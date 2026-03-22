'use client'

import { useState, useMemo } from 'react'
import type { PersonSettings, DietaryFlag, CatalogIngredient } from '@/types'
import Card from '@/components/ui/Card'
import SliderField from '@/components/ui/SliderField'

const DIET_OPTIONS = [
  { id: 'none', label: 'Brak', flags: [] as DietaryFlag[] },
  { id: 'vegetarian', label: 'Wege', flags: ['vegetarian'] as DietaryFlag[] },
  { id: 'vegan', label: 'Wegańska', flags: ['vegan'] as DietaryFlag[] },
  { id: 'gluten_free', label: 'Bezglut.', flags: ['gluten_free'] as DietaryFlag[] },
  { id: 'dairy_free', label: 'Bez laktozy', flags: ['dairy_free'] as DietaryFlag[] },
] as const

interface PersonCardProps {
  person: PersonSettings
  index: number
  canDelete: boolean
  onUpdate: (index: number, person: PersonSettings) => void
  onDelete: () => void
  cuisines: string[]
  cuisinesLoading: boolean
  ingredients: CatalogIngredient[]
}

function getCurrentDiet(person: PersonSettings) {
  if (!person.diet || person.diet.length === 0) return 'none'
  return (
    DIET_OPTIONS.find(
      (opt) =>
        opt.flags.length === person.diet!.length && opt.flags.every((f) => person.diet!.includes(f))
    )?.id || 'none'
  )
}

export default function PersonCard({
  person,
  index,
  canDelete,
  onUpdate,
  onDelete,
  cuisines,
  cuisinesLoading,
  ingredients,
}: PersonCardProps) {
  const [ingredientSearch, setIngredientSearch] = useState('')
  const currentDiet = getCurrentDiet(person)

  const excludedIngredientObjects = useMemo(
    () => ingredients.filter((ing) => (person.excludedIngredients || []).includes(ing.id)),
    [ingredients, person.excludedIngredients]
  )

  const filteredIngredients = useMemo(
    () =>
      ingredients
        .filter(
          (ing) =>
            !ing.is_seasoning &&
            ingredientSearch.trim() &&
            ing.name.toLowerCase().includes(ingredientSearch.toLowerCase())
        )
        .slice(0, 5),
    [ingredients, ingredientSearch]
  )

  const update = (updates: Partial<PersonSettings>) => onUpdate(index, { ...person, ...updates })

  const handleKcalChange = (v: number) =>
    update({ kcal: Math.max(0, v), dailyKcal: Math.max(0, v) })
  const handleProteinChange = (v: number) =>
    update({ protein: Math.max(0, v), dailyProtein: Math.max(0, v) })

  const handleDietChange = (optionId: string) => {
    const option = DIET_OPTIONS.find((opt) => opt.id === optionId)
    update({ diet: option?.flags || [] })
  }

  const handleCuisineToggle = (cuisine: string) => {
    const current = person.cuisinePreferences || []
    update({
      cuisinePreferences: current.includes(cuisine)
        ? current.filter((c) => c !== cuisine)
        : [...current, cuisine],
    })
  }

  const handleIngredientAdd = (ingredientId: string) => {
    const current = person.excludedIngredients || []
    if (!current.includes(ingredientId)) {
      update({ excludedIngredients: [...current, ingredientId] })
    }
    setIngredientSearch('')
  }

  const handleIngredientRemove = (ingredientId: string) => {
    update({
      excludedIngredients: (person.excludedIngredients || []).filter((id) => id !== ingredientId),
    })
  }

  return (
    <Card className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-primary font-headline font-black text-xl uppercase">
              {(person.name || `Osoba ${index + 1}`).charAt(0)}
            </span>
          </div>
          <div>
            <input
              className="bg-transparent border-none p-0 font-headline text-base font-bold text-on-surface focus:ring-0 w-full"
              placeholder="Imię"
              type="text"
              value={person.name || `Osoba ${index + 1}`}
              onChange={(e) => update({ name: e.target.value })}
            />
            <span className="text-on-surface-variant text-xs uppercase tracking-widest font-bold">
              {index === 0 ? 'GŁÓWNY UŻYTKOWNIK' : 'CZŁONEK RODZINY'}
            </span>
          </div>
        </div>
        {canDelete && (
          <button
            className="text-on-surface-variant hover:text-error transition-colors"
            onClick={onDelete}
          >
            <span className="material-symbols-outlined">delete</span>
          </button>
        )}
      </div>

      {/* Nutrients Sliders */}
      <div className="space-y-6">
        <SliderField
          label="Cel energetyczny"
          value={person.kcal}
          unit="kcal"
          min={1200}
          max={4000}
          onChange={handleKcalChange}
        />
        <SliderField
          label="Białko"
          value={person.protein}
          unit="g"
          min={40}
          max={250}
          onChange={handleProteinChange}
        />
      </div>

      {/* Diet Radio Group */}
      <div className="space-y-3">
        <label className="text-sm font-bold text-on-surface">Rodzaj diety</label>
        <div className="grid grid-cols-2 gap-2">
          {DIET_OPTIONS.slice(0, 4).map((option) => {
            const isSelected = currentDiet === option.id
            return (
              <label
                key={option.id}
                className={`relative flex items-center justify-center h-9 rounded-full cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-highest text-on-surface border border-outline-variant'
                }`}
              >
                <input
                  className="sr-only"
                  name={`diet-${index}`}
                  type="radio"
                  value={option.id}
                  checked={isSelected}
                  onChange={(e) => handleDietChange(e.target.value)}
                />
                <span className="text-sm font-semibold">{option.label}</span>
              </label>
            )
          })}
        </div>
      </div>

      {/* Cuisine Preference Chips */}
      <div className="space-y-3">
        <label className="text-sm font-bold text-on-surface">Ulubione kuchnie</label>
        {cuisinesLoading ? (
          <div className="text-on-surface-variant text-sm">Ładowanie...</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {cuisines.map((cuisine) => {
              const isSelected = (person.cuisinePreferences || []).includes(cuisine)
              return (
                <button
                  key={cuisine}
                  onClick={() => handleCuisineToggle(cuisine)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                    isSelected
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-surface-container border-outline-variant/30 text-on-surface-variant'
                  }`}
                >
                  {isSelected && <span className="material-symbols-outlined text-xs">check</span>}
                  {cuisine}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Excluded ingredients */}
      <div className="space-y-3">
        <label className="text-sm font-bold text-on-surface">Wykluczone składniki</label>
        <div className="flex flex-wrap gap-2">
          {excludedIngredientObjects.map((ingredient) => (
            <div
              key={ingredient.id}
              className="px-3 py-1.5 rounded-full bg-surface-container border border-outline-variant/30 flex items-center gap-1.5 text-xs text-on-surface-variant"
            >
              <span>{ingredient.name}</span>
              <span
                className="material-symbols-outlined text-xs text-on-surface-variant cursor-pointer hover:text-error transition-colors"
                onClick={() => handleIngredientRemove(ingredient.id)}
              >
                close
              </span>
            </div>
          ))}
          {(person.excludedIngredients || [])
            .filter((id) => !ingredients.some((ing) => ing.id === id))
            .map((text) => (
              <div
                key={text}
                className="px-3 py-1.5 rounded-full bg-surface-container border border-outline-variant/30 flex items-center gap-1.5 text-xs text-on-surface-variant"
              >
                <span>{text}</span>
                <span
                  className="material-symbols-outlined text-xs text-on-surface-variant cursor-pointer hover:text-error transition-colors"
                  onClick={() => handleIngredientRemove(text)}
                >
                  close
                </span>
              </div>
            ))}
          <div className="relative">
            <input
              type="text"
              placeholder="Wpisz i naciśnij Enter..."
              value={ingredientSearch}
              onChange={(e) => setIngredientSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && ingredientSearch.trim()) {
                  e.preventDefault()
                  const match = filteredIngredients[0]
                  handleIngredientAdd(match ? match.id : ingredientSearch.trim())
                }
              }}
              className="px-3 py-1.5 rounded-full bg-surface-container-highest text-on-surface text-xs border border-dashed border-outline-variant/30 focus:ring-0 min-w-[120px]"
            />
            {ingredientSearch.trim() && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-surface-container-highest rounded-lg border border-outline-variant/30 shadow-lg z-10 max-h-32 overflow-y-auto">
                {filteredIngredients.map((ingredient) => (
                  <button
                    key={ingredient.id}
                    onClick={() => handleIngredientAdd(ingredient.id)}
                    className="w-full text-left px-3 py-2 hover:bg-surface-container-high text-sm"
                  >
                    {ingredient.name}
                  </button>
                ))}
                <button
                  onClick={() => handleIngredientAdd(ingredientSearch.trim())}
                  className="w-full text-left px-3 py-2 hover:bg-surface-container-high text-sm text-primary"
                >
                  + Dodaj &quot;{ingredientSearch.trim()}&quot;
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
