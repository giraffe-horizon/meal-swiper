'use client'

import { useAppContext } from '@/lib/context'

export default function SettingsPage() {
  const { settings, updateSettings } = useAppContext()

  const handlePeopleChange = (delta: number) => {
    const newPeople = Math.max(1, Math.min(8, settings.people + delta))
    const newPersons = [...settings.persons]

    // Jeśli zwiększamy liczbę osób, dodaj domyślne ustawienia
    while (newPersons.length < newPeople) {
      newPersons.push({ kcal: 2000, protein: 120 })
    }

    updateSettings({
      ...settings,
      people: newPeople,
      persons: newPersons,
    })
  }

  const handlePersonChange = (index: number, field: 'kcal' | 'protein', value: number) => {
    const newPersons = [...settings.persons]
    newPersons[index] = {
      ...newPersons[index],
      [field]: Math.max(0, value),
    }
    updateSettings({
      ...settings,
      persons: newPersons,
    })
  }

  const totalKcal = settings.persons.slice(0, settings.people).reduce((sum, p) => sum + p.kcal, 0)
  const totalProtein = settings.persons
    .slice(0, settings.people)
    .reduce((sum, p) => sum + p.protein, 0)

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="container mx-auto max-w-2xl px-4 py-6 pb-32 space-y-6">
        {/* Dla kogo gotujesz */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Dla kogo gotujesz?
          </h2>

          {/* Stepper liczby osób */}
          <div className="flex items-center justify-between mb-6 bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Liczba osób
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handlePeopleChange(-1)}
                disabled={settings.people <= 1}
                className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                aria-label="Zmniejsz liczbę osób"
              >
                <span className="material-symbols-outlined text-slate-700 dark:text-slate-300">
                  remove
                </span>
              </button>
              <span className="text-2xl font-bold text-slate-900 dark:text-white w-12 text-center">
                {settings.people}
              </span>
              <button
                onClick={() => handlePeopleChange(1)}
                disabled={settings.people >= 8}
                className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                aria-label="Zwiększ liczbę osób"
              >
                <span className="material-symbols-outlined text-slate-700 dark:text-slate-300">
                  add
                </span>
              </button>
            </div>
          </div>

          {/* Ustawienia dla każdej osoby */}
          <div className="space-y-4">
            {settings.persons.slice(0, settings.people).map((person, index) => (
              <div key={index} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Osoba {index + 1}
                </h3>

                {/* Kalorie */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">local_fire_department</span>
                    Kalorie dzienne (kcal)
                  </label>
                  <input
                    type="number"
                    value={person.kcal}
                    onChange={(e) =>
                      handlePersonChange(index, 'kcal', parseInt(e.target.value) || 0)
                    }
                    min="0"
                    step="100"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                {/* Białko */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">fitness_center</span>
                    Białko dzienne (g)
                  </label>
                  <input
                    type="number"
                    value={person.protein}
                    onChange={(e) =>
                      handlePersonChange(index, 'protein', parseInt(e.target.value) || 0)
                    }
                    min="0"
                    step="10"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Podsumowanie */}
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Łącznie dziennie
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {totalKcal}
                </div>
                <div className="text-xs text-orange-700 dark:text-orange-500 mt-1">kcal</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {totalProtein}
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-500 mt-1">g białka</div>
              </div>
            </div>
          </div>
        </section>

        {/* Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex gap-3">
          <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-xl">
            info
          </span>
          <p className="text-sm text-blue-800 dark:text-blue-300">
            Ustawienia są automatycznie zapisywane i będą używane do planowania posiłków.
          </p>
        </div>
      </div>
    </div>
  )
}
