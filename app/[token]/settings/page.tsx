'use client'

import { useAppContext } from '@/lib/context'
import { useMemo } from 'react'
import type { PersonSettings } from '@/types'
import { useIngredientsQuery } from '@/hooks/queries/useIngredientsQuery'
import { useCuisinesQuery } from '@/hooks/queries/useCuisinesQuery'
import { useMealsWithVariantsQuery } from '@/hooks/queries/useMealsWithVariantsQuery'
import { filterMealsByPreferences } from '@/lib/meal-filter'
import PersonCard from '@/components/settings/PersonCard'
import HouseholdSection from '@/components/settings/HouseholdSection'

export default function SettingsPage() {
  const { settings, updateSettings, tenantToken } = useAppContext()

  const { data: ingredients = [] } = useIngredientsQuery()
  const { data: cuisines = [], isLoading: cuisinesLoading } = useCuisinesQuery()
  const { data: meals = [] } = useMealsWithVariantsQuery()

  const compatibleMealsCount = useMemo(() => {
    if (!meals || meals.length === 0 || !settings.persons || settings.persons.length === 0) return 0
    const activePersons = settings.persons.slice(0, settings.people)
    return filterMealsByPreferences(meals, { persons: activePersons }).total
  }, [meals, settings.persons, settings.people])

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

  const handlePersonUpdate = (index: number, updatedPerson: PersonSettings) => {
    const newPersons = [...settings.persons]
    newPersons[index] = updatedPerson
    updateSettings({ ...settings, persons: newPersons })
  }

  return (
    <div className="bg-background text-on-background font-body min-h-screen pb-nav-clearance">
      <main className="max-w-2xl mx-auto px-6 pt-8 space-y-8">
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
        {settings.persons.slice(0, settings.people).map((person, index) => (
          <PersonCard
            key={index}
            person={person}
            index={index}
            canDelete={settings.people > 1}
            onUpdate={handlePersonUpdate}
            onDelete={() => handlePeopleChange(-1)}
            cuisines={cuisines}
            cuisinesLoading={cuisinesLoading}
            ingredients={ingredients}
          />
        ))}

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

        {/* Household Info */}
        {tenantToken && <HouseholdSection tenantToken={tenantToken} />}
      </main>
    </div>
  )
}
