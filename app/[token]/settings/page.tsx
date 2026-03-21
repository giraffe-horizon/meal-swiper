'use client'

import { useAppContext } from '@/lib/context'
import { useEffect, useState, useMemo } from 'react'
import type { PersonSettings, DietaryFlag } from '@/types'
import { useIngredientsQuery } from '@/hooks/queries/useIngredientsQuery'
import { useCuisinesQuery } from '@/hooks/queries/useCuisinesQuery'
import { useMealsWithVariantsQuery } from '@/hooks/queries/useMealsWithVariantsQuery'
import { filterMealsByPreferences } from '@/lib/meal-filter'

const DIET_OPTIONS = [
  { id: 'none', label: 'Brak', flags: [] as DietaryFlag[] },
  { id: 'vegetarian', label: 'Wege', flags: ['vegetarian'] as DietaryFlag[] },
  { id: 'vegan', label: 'Wega', flags: ['vegan'] as DietaryFlag[] },
  { id: 'gluten_free', label: 'Bezglut.', flags: ['gluten_free'] as DietaryFlag[] },
  { id: 'dairy_free', label: 'Bez laktozy', flags: ['dairy_free'] as DietaryFlag[] },
] as const

export default function SettingsPage() {
  const { settings, updateSettings, tenantToken } = useAppContext()

  // Tenant info state
  const [tenantName, setTenantName] = useState('')
  const [tenantCreatedAt, setTenantCreatedAt] = useState<string | null>(null)
  const [isEditingName, setIsEditingName] = useState(false)

  // UI state
  const [ingredientSearch, setIngredientSearch] = useState('')

  // Data queries
  const { data: ingredients = [] } = useIngredientsQuery()
  const { data: cuisines = [], isLoading: cuisinesLoading } = useCuisinesQuery()
  const { data: meals = [] } = useMealsWithVariantsQuery()

  // Calculate compatibility using real filtering logic
  const compatibleMealsCount = useMemo(() => {
    if (!meals || meals.length === 0 || !settings.persons || settings.persons.length === 0) {
      return 0
    }

    // Only process the first `settings.people` persons
    const activePersons = settings.persons.slice(0, settings.people)

    // Filter meals using the meal filter logic
    const filterResult = filterMealsByPreferences(meals, {
      persons: activePersons,
    })

    return filterResult.total
  }, [meals, settings.persons, settings.people])

  useEffect(() => {
    if (!tenantToken) return
    fetch(`/api/tenant?token=${tenantToken}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setTenantName(data.name || '')
          setTenantCreatedAt(data.created_at || null)
        }
      })
      .catch(() => {})
  }, [tenantToken])

  // Settings handlers
  const handlePeopleChange = (delta: number) => {
    const newPeople = Math.max(1, Math.min(8, settings.people + delta))
    const newPersons = [...settings.persons]
    while (newPersons.length < newPeople) {
      newPersons.push({
        name: `Osoba ${newPersons.length + 1}`,
        kcal: 2000,
        protein: 120,
        dailyKcal: 2000,
        dailyProtein: 120,
        mealsPerDay: 3,
        diet: [],
        cuisinePreferences: [],
        excludedIngredients: [],
      })
    }
    updateSettings({ ...settings, people: newPeople, persons: newPersons })
  }

  const handleNameChange = (index: number, name: string) => {
    const newPersons = [...settings.persons]
    newPersons[index] = { ...newPersons[index], name }
    updateSettings({ ...settings, persons: newPersons })
  }

  const handlePersonChange = (index: number, field: 'kcal' | 'protein', value: number) => {
    const newPersons = [...settings.persons]
    newPersons[index] = {
      ...newPersons[index],
      [field]: Math.max(0, value),
      ...(field === 'kcal'
        ? { dailyKcal: Math.max(0, value) }
        : { dailyProtein: Math.max(0, value) }),
    }
    updateSettings({ ...settings, persons: newPersons })
  }

  const handleDietChange = (index: number, optionId: string) => {
    const option = DIET_OPTIONS.find((opt) => opt.id === optionId)
    const newPersons = [...settings.persons]
    newPersons[index] = { ...newPersons[index], diet: option?.flags || [] }
    updateSettings({ ...settings, persons: newPersons })
  }

  const handleCuisineToggle = (index: number, cuisine: string) => {
    const person = settings.persons[index]
    const current = person.cuisinePreferences || []
    const updated = current.includes(cuisine)
      ? current.filter((c) => c !== cuisine)
      : [...current, cuisine]

    const newPersons = [...settings.persons]
    newPersons[index] = { ...newPersons[index], cuisinePreferences: updated }
    updateSettings({ ...settings, persons: newPersons })
  }

  const handleIngredientAdd = (index: number, ingredientId: string) => {
    const person = settings.persons[index]
    const current = person.excludedIngredients || []
    if (!current.includes(ingredientId)) {
      const newPersons = [...settings.persons]
      newPersons[index] = { ...newPersons[index], excludedIngredients: [...current, ingredientId] }
      updateSettings({ ...settings, persons: newPersons })
    }
    setIngredientSearch('')
  }

  const handleIngredientRemove = (index: number, ingredientId: string) => {
    const person = settings.persons[index]
    const current = person.excludedIngredients || []
    const updated = current.filter((id) => id !== ingredientId)

    const newPersons = [...settings.persons]
    newPersons[index] = { ...newPersons[index], excludedIngredients: updated }
    updateSettings({ ...settings, persons: newPersons })
  }

  const setTheme = (theme: 'light' | 'dark' | 'system') => {
    updateSettings({ ...settings, theme })
  }

  const saveTenantName = async () => {
    if (!tenantToken) return
    try {
      const response = await fetch('/api/tenant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: tenantToken,
          name: tenantName,
        }),
      })
      if (response.ok) {
        setIsEditingName(false)
      }
    } catch (error) {
      console.error('Failed to save tenant name:', error)
    }
  }

  const shareHousehold = () => {
    const shareUrl = `${window.location.origin}/${tenantToken}`
    const shareText = `🏠 Dołącz do mojego gospodarstwa domowego!\n\n${shareUrl}\n\nBudujemy wspólnie plan posiłków na całą rodzinę.`

    if (navigator.share) {
      navigator.share({
        title: 'Dołącz do mojego gospodarstwa',
        text: shareText,
        url: shareUrl,
      })
    } else {
      navigator.clipboard.writeText(shareText)
      alert('✅ Link skopiowany do schowka!')
    }
  }

  const copyToken = () => {
    if (tenantToken) {
      navigator.clipboard.writeText(tenantToken)
      alert('✅ Token skopiowany do schowka!')
    }
  }

  // Calculate days since creation (using lazy initialization to avoid Date.now() during render)
  const [currentTime] = useState(() => Date.now())
  const daysSinceCreation = tenantCreatedAt
    ? Math.floor((currentTime - new Date(tenantCreatedAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  // Filter ingredients by search term
  const filteredIngredients = ingredients
    .filter(
      (ingredient) =>
        !ingredient.is_seasoning &&
        ingredientSearch.trim() &&
        ingredient.name.toLowerCase().includes(ingredientSearch.toLowerCase())
    )
    .slice(0, 5)

  const getCurrentDiet = (person: PersonSettings) => {
    if (!person.diet || person.diet.length === 0) return 'none'
    const currentFlags = person.diet
    return (
      DIET_OPTIONS.find(
        (option) =>
          option.flags.length === currentFlags.length &&
          option.flags.every((flag) => currentFlags.includes(flag))
      )?.id || 'none'
    )
  }

  return (
    <div className="bg-background text-on-background font-body min-h-screen pb-40">
      <main className="max-w-2xl mx-auto px-6 pt-8 space-y-8">
        {/* Header Section */}
        <section>
          <h1 className="font-headline text-xl font-extrabold tracking-tight text-on-surface mb-4">
            Preferencje domowników
          </h1>
          <p className="text-on-surface-variant text-sm font-body">
            Dostosuj jadłospis do potrzeb każdego członka Twojej rodziny.
          </p>
        </section>

        {/* Compatibility Badge */}
        <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl flex items-center gap-4">
          <div className="bg-primary rounded-full p-2 flex items-center justify-center">
            <span
              className="material-symbols-outlined text-on-primary text-xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              auto_awesome
            </span>
          </div>
          <div>
            <span className="font-headline text-primary font-bold block">
              {compatibleMealsCount} posiłków pasuje do preferencji wszystkich
            </span>
            <span className="text-on-surface-variant text-xs">
              Twoja lista zakupów będzie zoptymalizowana.
            </span>
          </div>
        </div>

        {/* Person Cards */}
        {settings.persons.slice(0, settings.people).map((person, index) => {
          const currentDiet = getCurrentDiet(person)
          const excludedIngredientObjects = ingredients.filter((ing) =>
            (person.excludedIngredients || []).includes(ing.id)
          )

          return (
            <article key={index} className="bg-surface-container rounded-[20px] p-6 space-y-6">
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
                      onChange={(e) => handleNameChange(index, e.target.value)}
                    />
                    <span className="text-on-surface-variant text-xs uppercase tracking-widest font-bold">
                      {index === 0 ? 'GŁÓWNY UŻYTKOWNIK' : 'CZŁONEK RODZINY'}
                    </span>
                  </div>
                </div>
                {settings.people > 1 && (
                  <button
                    className="text-on-surface-variant hover:text-error transition-colors"
                    onClick={() => handlePeopleChange(-1)}
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                )}
              </div>

              {/* Nutrients Sliders */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <label className="font-headline text-sm text-on-surface-variant">
                      Cel energetyczny
                    </label>
                    <span className="font-label text-lg font-bold text-tertiary">
                      {person.kcal} <span className="text-xs uppercase">kcal</span>
                    </span>
                  </div>
                  <input
                    className="w-full"
                    max="4000"
                    min="1200"
                    type="range"
                    value={person.kcal}
                    onChange={(e) => handlePersonChange(index, 'kcal', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <label className="font-headline text-sm text-on-surface-variant">Białko</label>
                    <span className="font-label text-lg font-bold text-tertiary">
                      {person.protein} <span className="text-xs uppercase">g</span>
                    </span>
                  </div>
                  <input
                    className="w-full"
                    max="250"
                    min="40"
                    type="range"
                    value={person.protein}
                    onChange={(e) => handlePersonChange(index, 'protein', parseInt(e.target.value))}
                  />
                </div>
              </div>

              {/* Diet Radio Group */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-on-surface">
                  Rodzaj diety
                </label>
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
                          onChange={(e) => handleDietChange(index, e.target.value)}
                        />
                        <span className="text-sm font-semibold">
                          {option.label}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Cuisine Preference Chips */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-on-surface">
                  Ulubione kuchnie
                </label>
                {cuisinesLoading ? (
                  <div className="text-on-surface-variant text-sm">Ładowanie...</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {cuisines.map((cuisine) => {
                      const isSelected = (person.cuisinePreferences || []).includes(cuisine)
                      return (
                        <button
                          key={cuisine}
                          onClick={() => handleCuisineToggle(index, cuisine)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                            isSelected
                              ? 'bg-primary/10 border-primary text-primary'
                              : 'bg-surface-container border-outline-variant/30 text-on-surface-variant'
                          }`}
                        >
                          {isSelected && (
                            <span className="material-symbols-outlined text-xs">check</span>
                          )}
                          {cuisine}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Excluded ingredients tags */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-on-surface">
                  Wykluczone składniki
                </label>
                <div className="flex flex-wrap gap-2">
                  {/* DB-backed excluded ingredients */}
                  {excludedIngredientObjects.map((ingredient) => (
                    <div
                      key={ingredient.id}
                      className="px-3 py-1.5 rounded-full bg-surface-container border border-outline-variant/30 flex items-center gap-1.5 text-xs text-on-surface-variant"
                    >
                      <span>{ingredient.name}</span>
                      <span
                        className="material-symbols-outlined text-xs text-on-surface-variant cursor-pointer hover:text-error transition-colors"
                        onClick={() => handleIngredientRemove(index, ingredient.id)}
                      >
                        close
                      </span>
                    </div>
                  ))}
                  {/* Free-text excluded ingredients */}
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
                          onClick={() => handleIngredientRemove(index, text)}
                        >
                          close
                        </span>
                      </div>
                    ))}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="np. orzechy, gluten..."
                      value={ingredientSearch}
                      onChange={(e) => setIngredientSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && ingredientSearch.trim()) {
                          e.preventDefault()
                          // Try to match a DB ingredient first, otherwise add as free text
                          const match = filteredIngredients[0]
                          if (match) {
                            handleIngredientAdd(index, match.id)
                          } else {
                            handleIngredientAdd(index, ingredientSearch.trim())
                          }
                        }
                      }}
                      className="px-3 py-1.5 rounded-full bg-surface-container-highest text-on-surface text-xs border border-dashed border-outline-variant/30 focus:ring-0 min-w-[120px]"
                    />
                    {ingredientSearch && filteredIngredients.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-surface-container-highest rounded-lg border border-outline-variant/30 shadow-lg z-10">
                        {filteredIngredients.map((ingredient) => (
                          <button
                            key={ingredient.id}
                            onClick={() => handleIngredientAdd(index, ingredient.id)}
                            className="w-full text-left px-3 py-2 hover:bg-surface-container-high text-sm"
                          >
                            {ingredient.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </article>
          )
        })}

        {/* Add Person Button */}
        {settings.people < 8 && (
          <button
            onClick={() => handlePeopleChange(1)}
            className="w-full p-4 border-2 border-dashed border-outline-variant/40 rounded-lg text-sm text-on-surface-variant hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">add</span>
            Dodaj osobę
          </button>
        )}

        {/* Household Info - Twoje gospodarstwo */}
        {tenantToken && (
          <section className="space-y-4">
            <h3 className="font-headline text-sm text-on-surface-variant uppercase tracking-widest font-bold">
              Twoje gospodarstwo
            </h3>

            {/* Household name card */}
            <div className="bg-surface-container rounded-[20px] p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">home</span>
                  </div>
                  <div className="flex-1">
                    {isEditingName ? (
                      <input
                        type="text"
                        value={tenantName}
                        onChange={(e) => setTenantName(e.target.value)}
                        onBlur={saveTenantName}
                        onKeyDown={(e) => e.key === 'Enter' && saveTenantName()}
                        className="font-headline text-base font-bold text-on-surface bg-transparent border-b border-primary focus:outline-none w-full"
                        placeholder="Nazwa gospodarstwa"
                        autoFocus
                      />
                    ) : (
                      <h3
                        onClick={() => setIsEditingName(true)}
                        className="font-headline text-base font-bold text-on-surface cursor-pointer hover:text-primary"
                      >
                        {tenantName || 'Mój dom'}
                      </h3>
                    )}
                    {tenantCreatedAt && (
                      <p className="text-on-surface-variant text-xs">
                        Utworzono {daysSinceCreation} dni temu
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setIsEditingName(!isEditingName)}
                  className="p-2 text-on-surface-variant hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined">edit</span>
                </button>
              </div>

              {/* Token and share section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-surface-container-highest rounded-lg">
                  <div className="flex-1">
                    <p className="text-on-surface-variant text-xs mb-1">Token gospodarstwa</p>
                    <code className="font-mono text-xs text-on-surface bg-surface-container-low px-2 py-1 rounded break-all">
                      {tenantToken}
                    </code>
                  </div>
                  <button
                    onClick={copyToken}
                    className="ml-4 p-2 text-on-surface-variant hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined">content_copy</span>
                  </button>
                </div>

                <button
                  onClick={shareHousehold}
                  className="w-full flex items-center justify-center gap-3 py-3 px-6 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  <span className="material-symbols-outlined">share</span>
                  Udostępnij gospodarstwo
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Theme — dark only for now */}
      </main>
    </div>
  )
}
