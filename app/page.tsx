'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type PersonDraft = { name: string; kcal: number; protein: number }
type Theme = 'light' | 'dark' | 'system'

export default function OnboardingPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [persons, setPersons] = useState<PersonDraft[]>([
    { name: 'Osoba 1', kcal: 2000, protein: 120 },
    { name: 'Osoba 2', kcal: 2000, protein: 120 },
  ])
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('meal_swiper_theme') as Theme) || 'system'
    }
    return 'system'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Apply theme to document and persist
  useEffect(() => {
    const root = document.documentElement
    localStorage.setItem('meal_swiper_theme', theme)
    if (theme === 'dark') {
      root.classList.add('dark')
    } else if (theme === 'light') {
      root.classList.remove('dark')
    } else {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (isDark) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }
  }, [theme])

  const addPerson = () => {
    if (persons.length >= 8) return
    setPersons((prev) => [...prev, { name: `Osoba ${prev.length + 1}`, kcal: 2000, protein: 120 }])
  }

  const removePerson = (index: number) => {
    if (persons.length <= 1) return
    setPersons((prev) => prev.filter((_, i) => i !== index))
  }

  const updatePerson = (index: number, field: keyof PersonDraft, value: string | number) => {
    setPersons((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError(null)

    const token = crypto.randomUUID()

    try {
      const res = await fetch('/api/tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name: name.trim(), persons }),
      })

      if (!res.ok) throw new Error('Nie udało się utworzyć gospodarstwa')

      localStorage.setItem('meal_swiper_tenant_token', token)
      router.push(`/${token}/plan`)
    } catch {
      setError('Wystąpił błąd. Spróbuj ponownie.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-4 transition-colors">
      <div className="w-full max-w-lg">
        {/* Theme toggle */}
        <div className="flex justify-end mb-4">
          <div className="flex gap-1 bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-border-dark p-1">
            {(
              [
                { id: 'light', icon: 'light_mode', label: 'Jasny' },
                { id: 'system', icon: 'settings_brightness', label: 'Auto' },
                { id: 'dark', icon: 'dark_mode', label: 'Ciemny' },
              ] as { id: Theme; icon: string; label: string }[]
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                title={t.label}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                  theme === t.id
                    ? 'bg-primary text-white'
                    : 'text-slate-400 dark:text-text-secondary-dark hover:text-slate-600 dark:hover:text-text-primary-dark'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Logo + title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-3xl shadow-lg mb-4">
            <span className="material-symbols-outlined text-white text-4xl">restaurant</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-text-primary-dark mb-2">
            Meal Swiper
          </h1>
          <p className="text-slate-500 dark:text-text-secondary-dark">
            Planowanie posiłków na tydzień
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-surface-dark rounded-3xl shadow-xl border border-slate-100 dark:border-border-dark p-6 md:p-8">
          <h2 className="text-xl font-bold text-slate-900 dark:text-text-primary-dark mb-1">
            Utwórz swoje gospodarstwo
          </h2>
          <p className="text-sm text-slate-500 dark:text-text-secondary-dark mb-6">
            Twoje plany posiłków i lista zakupów będą zapisane prywatnie.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nazwa gospodarstwa */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-semibold text-slate-700 dark:text-text-secondary-dark mb-1.5"
              >
                Nazwa gospodarstwa
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="np. Rodzina Kowalskich"
                required
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-surface-dark/50 text-slate-900 dark:text-text-primary-dark placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition"
              />
            </div>

            {/* Osoby */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-slate-700 dark:text-text-secondary-dark">
                  Osoby w gospodarstwie
                </label>
                <button
                  type="button"
                  onClick={addPerson}
                  disabled={persons.length >= 8}
                  className="flex items-center gap-1 text-xs font-semibold text-primary disabled:opacity-40 hover:text-primary/80 transition-colors"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  Dodaj osobę
                </button>
              </div>

              <div className="space-y-3">
                {persons.map((person, index) => (
                  <div
                    key={index}
                    className="bg-slate-50 dark:bg-surface-dark/50 rounded-xl border border-slate-100 dark:border-border-dark p-4 space-y-3"
                  >
                    {/* Nagłówek osoby */}
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-slate-400">
                        person
                      </span>
                      <input
                        type="text"
                        value={person.name}
                        onChange={(e) => updatePerson(index, 'name', e.target.value)}
                        placeholder={`Osoba ${index + 1}`}
                        className="flex-1 bg-transparent text-sm font-semibold text-slate-700 dark:text-text-secondary-dark focus:outline-none placeholder:text-slate-400"
                      />
                      {persons.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePerson(index)}
                          className="text-slate-300 dark:text-text-secondary-dark/40 hover:text-red-400 transition-colors"
                          aria-label="Usuń osobę"
                        >
                          <span className="material-symbols-outlined text-base">close</span>
                        </button>
                      )}
                    </div>

                    {/* Kalorie i białko */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-500 dark:text-text-secondary-dark/70 flex items-center gap-1 mb-1">
                          <span className="material-symbols-outlined text-xs">
                            local_fire_department
                          </span>
                          kcal / dzień
                        </label>
                        <input
                          type="number"
                          value={person.kcal}
                          onChange={(e) =>
                            updatePerson(index, 'kcal', parseInt(e.target.value) || 0)
                          }
                          min="0"
                          step="100"
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-border-dark bg-white dark:bg-surface-dark text-slate-900 dark:text-text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 dark:text-text-secondary-dark/70 flex items-center gap-1 mb-1">
                          <span className="material-symbols-outlined text-xs">fitness_center</span>
                          białko (g) / dzień
                        </label>
                        <input
                          type="number"
                          value={person.protein}
                          onChange={(e) =>
                            updatePerson(index, 'protein', parseInt(e.target.value) || 0)
                          }
                          min="0"
                          step="10"
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-border-dark bg-white dark:bg-surface-dark text-slate-900 dark:text-text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-lg px-4 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full py-3.5 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              {loading ? 'Tworzenie...' : 'Utwórz gospodarstwo'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 dark:text-text-secondary-dark/50 mt-6">
          Link do Twojego gospodarstwa zostanie zapisany w tej przeglądarce.
        </p>
      </div>
    </div>
  )
}
