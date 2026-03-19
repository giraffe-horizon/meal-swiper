'use client'

import { useAppContext } from '@/lib/context'
import { useEffect, useState, useRef } from 'react'
import type { PersonSettings, DietaryFlag } from '@/types'
import { useIngredientsQuery } from '@/hooks/queries/useIngredientsQuery'
import { useCuisinesQuery } from '@/hooks/queries/useCuisinesQuery'
import { useMealsQuery } from '@/hooks/queries/useMealsQuery'

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
  const [daysSince, setDaysSince] = useState<number | null>(null)
  const [copied, setCopied] = useState<'token' | 'link' | null>(null)
  const saveNameTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // UI state
  const [ingredientSearch, setIngredientSearch] = useState('')

  const shareLink =
    tenantToken && typeof window !== 'undefined'
      ? `${window.location.origin}/${tenantToken}/plan`
      : ''

  // Data queries
  const { data: ingredients = [], isLoading: ingredientsLoading } = useIngredientsQuery()
  const { data: cuisines = [], isLoading: cuisinesLoading } = useCuisinesQuery()
  const { data: meals = [] } = useMealsQuery()

  // Calculate compatibility
  const compatibleMealsCount = meals.length // Simplified for now

  useEffect(() => {
    if (!tenantToken) return
    fetch(`/api/tenant?token=${tenantToken}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setTenantName(data.name || '')
          if (data.created_at) {
            const days = Math.floor(
              (Date.now() - new Date(data.created_at).getTime()) / (1000 * 60 * 60 * 24)
            )
            setDaysSince(days)
          }
        }
      })
      .catch(() => {})
  }, [tenantToken])

  const handleTenantNameChange = (value: string) => {
    setTenantName(value)
    if (saveNameTimer.current) clearTimeout(saveNameTimer.current)
    saveNameTimer.current = setTimeout(async () => {
      if (!tenantToken) return
      await fetch('/api/tenant', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tenantToken, name: value }),
      }).catch(() => {})
    }, 500)
  }

  const copyToClipboard = async (text: string, type: 'token' | 'link') => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      window.prompt('Skopiuj:', text)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Meal Swiper',
          text: tenantName ? `Dołącz do "${tenantName}" w Meal Swiper` : 'Dołącz do Meal Swiper',
          url: shareLink,
        })
      } catch {
        // User cancelled share dialog
      }
    } else {
      // Fallback: copy link
      await copyToClipboard(shareLink, 'link')
    }
  }

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
    <div className="bg-background text-on-background font-body min-h-screen pb-32">
      {/* Top AppBar */}
      <header className="bg-background flex items-center justify-between px-6 py-4 w-full">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-2xl">menu_book</span>
          <h1 className="font-headline font-bold tracking-tight text-xl uppercase text-primary">
            Culinary Alchemist
          </h1>
        </div>
        <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center overflow-hidden border border-outline-variant/20">
          <span className="material-symbols-outlined text-on-surface">person</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 pt-8 space-y-8">
        {/* Header Section */}
        <section>
          <h2 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface mb-2">
            Preferencje domowników
          </h2>
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
            <article key={index} className="bg-surface-container rounded-lg p-6 space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-surface-container-highest flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-2xl">person</span>
                  </div>
                  <div>
                    <input
                      className="bg-transparent border-none p-0 font-headline text-xl font-bold text-on-surface focus:ring-0 w-full"
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
                    <span className="font-label text-xl font-bold text-tertiary">
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
                    <span className="font-label text-xl font-bold text-tertiary">
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
                <label className="font-headline text-sm text-on-surface-variant">
                  Rodzaj diety
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {DIET_OPTIONS.map((option) => {
                    const isSelected = currentDiet === option.id
                    return (
                      <label
                        key={option.id}
                        className={`relative flex flex-col items-center justify-center p-3 rounded-xl cursor-pointer transition-all ${
                          isSelected
                            ? 'border-2 border-primary bg-primary/5'
                            : 'border border-outline-variant bg-surface-container-low hover:bg-surface-container-high'
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
                        <span
                          className={`text-sm font-semibold ${isSelected ? 'text-primary' : ''}`}
                        >
                          {option.label}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Cuisine Preference Chips */}
              <div className="space-y-3">
                <label className="font-headline text-sm text-on-surface-variant">
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
                          className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 ${
                            isSelected
                              ? 'bg-primary text-on-primary'
                              : 'bg-surface-container-highest text-on-surface-variant'
                          }`}
                        >
                          {cuisine}
                          {isSelected && (
                            <span className="material-symbols-outlined text-sm">check</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Excluded ingredients tags */}
              <div className="space-y-3">
                <label className="font-headline text-sm text-on-surface-variant">
                  Wykluczone składniki
                </label>
                <div className="flex flex-wrap gap-2">
                  {excludedIngredientObjects.map((ingredient) => (
                    <div
                      key={ingredient.id}
                      className="px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-outline-variant/30 flex items-center gap-2 text-sm"
                    >
                      <span>{ingredient.name}</span>
                      <span
                        className="material-symbols-outlined text-sm text-on-surface-variant cursor-pointer"
                        onClick={() => handleIngredientRemove(index, ingredient.id)}
                      >
                        close
                      </span>
                    </div>
                  ))}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Szukaj składnika..."
                      value={ingredientSearch}
                      onChange={(e) => setIngredientSearch(e.target.value)}
                      className="px-3 py-1.5 rounded-lg bg-surface-container-highest text-primary text-sm font-bold border-none focus:ring-0 min-w-[120px]"
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
            className="w-full p-4 border-2 border-dashed border-outline-variant/40 rounded-lg text-on-surface-variant hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">add</span>
            Dodaj osobę
          </button>
        )}

        {/* Household Info */}
        {tenantToken && (
          <section className="bg-surface-container-low rounded-lg p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center">
                <span className="material-symbols-outlined text-on-surface-variant">home</span>
              </div>
              <div>
                <h3 className="font-headline font-bold text-on-surface">
                  {tenantName || 'Mój dom'}
                </h3>
                <p className="text-on-surface-variant text-sm">Warszawa, ul. Smaczna 12</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
          </section>
        )}

        {/* Theme Selector */}
        <section className="space-y-4">
          <h3 className="font-headline text-sm text-on-surface-variant uppercase tracking-widest font-bold">
            Wygląd aplikacji
          </h3>
          <div className="grid grid-cols-3 gap-3 p-1 bg-surface-container-low rounded-xl">
            {[
              { id: 'light', label: 'Jasny', icon: 'light_mode' },
              { id: 'dark', label: 'Ciemny', icon: 'dark_mode' },
              { id: 'system', label: 'System', icon: 'settings_brightness' },
            ].map((themeOption) => {
              const isActive = settings.theme === themeOption.id
              return (
                <button
                  key={themeOption.id}
                  onClick={() => setTheme(themeOption.id as 'light' | 'dark' | 'system')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm transition-all ${
                    isActive
                      ? 'bg-surface-container-highest text-primary shadow-sm font-bold'
                      : 'text-on-surface-variant'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-lg"
                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                  >
                    {themeOption.icon}
                  </span>
                  {themeOption.label}
                </button>
              )
            })}
          </div>
        </section>
      </main>
    </div>
  )
}
