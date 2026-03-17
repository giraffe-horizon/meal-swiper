'use client'

import { useAppContext } from '@/lib/context'
import { useEffect, useState, useRef } from 'react'
import PreferenceEditor from '@/components/settings/PreferenceEditor'
import type { PersonSettings } from '@/types'

export default function SettingsPage() {
  const { settings, updateSettings, tenantToken } = useAppContext()

  // Tenant info state
  const [tenantName, setTenantName] = useState('')
  const [daysSince, setDaysSince] = useState<number | null>(null)
  const [copied, setCopied] = useState<'token' | 'link' | null>(null)
  const saveNameTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const shareLink =
    tenantToken && typeof window !== 'undefined'
      ? `${window.location.origin}/${tenantToken}/plan`
      : ''

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
      newPersons.push({ name: `Osoba ${newPersons.length + 1}`, kcal: 2000, protein: 120 })
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
    newPersons[index] = { ...newPersons[index], [field]: Math.max(0, value) }
    updateSettings({ ...settings, persons: newPersons })
  }

  const handlePreferenceChange = (index: number, updatedPerson: PersonSettings) => {
    const newPersons = [...settings.persons]
    newPersons[index] = updatedPerson
    updateSettings({ ...settings, persons: newPersons })
  }

  const totalKcal = settings.persons.slice(0, settings.people).reduce((sum, p) => sum + p.kcal, 0)
  const totalProtein = settings.persons
    .slice(0, settings.people)
    .reduce((sum, p) => sum + p.protein, 0)

  const setTheme = (theme: 'light' | 'dark' | 'system') => {
    updateSettings({ ...settings, theme })
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="container mx-auto max-w-2xl px-4 py-6 pb-32 space-y-6">
        {/* Informacje o gospodarstwie */}
        {tenantToken && (
          <section className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-border-dark p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-text-primary-dark mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-400">home</span>
              Twoje gospodarstwo
            </h2>

            <div className="space-y-4">
              {/* Nazwa gospodarstwa */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-text-secondary-dark uppercase tracking-wider mb-1.5">
                  Nazwa
                </label>
                <input
                  type="text"
                  value={tenantName}
                  onChange={(e) => handleTenantNameChange(e.target.value)}
                  placeholder="Nazwa gospodarstwa"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-surface-dark/50 text-slate-900 dark:text-text-primary-dark placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                />
              </div>

              {/* Token */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-text-secondary-dark uppercase tracking-wider mb-1.5">
                  Token dostępu
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-surface-dark/50 text-slate-700 dark:text-text-secondary-dark text-xs font-mono truncate">
                    {tenantToken}
                  </code>
                  <button
                    onClick={() => copyToClipboard(tenantToken, 'token')}
                    title="Kopiuj token"
                    className="flex-shrink-0 w-9 h-9 rounded-xl border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-surface-dark/50 flex items-center justify-center text-slate-500 dark:text-text-secondary-dark hover:bg-slate-100 dark:hover:bg-surface-dark transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">
                      {copied === 'token' ? 'check' : 'content_copy'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Link do udostępnienia */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-text-secondary-dark uppercase tracking-wider mb-1.5">
                  Link do udostępnienia
                </label>
                <div className="flex items-center gap-2">
                  <span className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-surface-dark/50 text-slate-700 dark:text-text-secondary-dark text-xs font-mono truncate">
                    {shareLink}
                  </span>
                  <button
                    onClick={handleShare}
                    title="Udostępnij link"
                    className="flex-shrink-0 w-9 h-9 rounded-xl border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-surface-dark/50 flex items-center justify-center text-slate-500 dark:text-text-secondary-dark hover:bg-slate-100 dark:hover:bg-surface-dark transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">
                      {copied === 'link' ? 'check' : 'share'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Dni od założenia */}
              {daysSince !== null && (
                <p className="text-xs text-slate-400 dark:text-text-secondary-dark/60">
                  Konto założone{' '}
                  {daysSince === 0
                    ? 'dzisiaj'
                    : daysSince === 1
                      ? 'wczoraj'
                      : `${daysSince} dni temu`}
                </p>
              )}
            </div>
          </section>
        )}

        {/* Motyw aplikacji */}
        <section className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-border-dark p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-text-primary-dark mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400">palette</span>
            Motyw aplikacji
          </h2>

          <div className="grid grid-cols-3 gap-3">
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
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    isActive
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-slate-100 dark:border-border-dark text-slate-500 dark:text-text-secondary-dark hover:border-slate-200 dark:hover:border-slate-700'
                  }`}
                >
                  <span className="material-symbols-outlined text-2xl">{themeOption.icon}</span>
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {themeOption.label}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        {/* Dla kogo gotujesz */}
        <section className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-border-dark p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-text-primary-dark mb-4">
            Dla kogo gotujesz?
          </h2>

          {/* Stepper liczby osób */}
          <div className="flex items-center justify-between mb-6 bg-slate-50 dark:bg-surface-dark/50 rounded-xl p-4">
            <span className="text-sm font-medium text-slate-700 dark:text-text-secondary-dark">
              Liczba osób
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handlePeopleChange(-1)}
                disabled={settings.people <= 1}
                className="w-10 h-10 rounded-full bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-surface-dark transition-colors"
                aria-label="Zmniejsz liczbę osób"
              >
                <span className="material-symbols-outlined text-slate-700 dark:text-text-secondary-dark">
                  remove
                </span>
              </button>
              <span className="text-2xl font-bold text-slate-900 dark:text-text-primary-dark w-12 text-center">
                {settings.people}
              </span>
              <button
                onClick={() => handlePeopleChange(1)}
                disabled={settings.people >= 8}
                className="w-10 h-10 rounded-full bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-surface-dark transition-colors"
                aria-label="Zwiększ liczbę osób"
              >
                <span className="material-symbols-outlined text-slate-700 dark:text-text-secondary-dark">
                  add
                </span>
              </button>
            </div>
          </div>

          {/* Ustawienia dla każdej osoby */}
          <div className="space-y-4">
            {settings.persons.slice(0, settings.people).map((person, index) => (
              <div
                key={index}
                className="bg-slate-50 dark:bg-surface-dark/50 rounded-xl p-4 space-y-3"
              >
                {/* Imię */}
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-slate-400">person</span>
                  <input
                    type="text"
                    value={person.name || `Osoba ${index + 1}`}
                    onChange={(e) => handleNameChange(index, e.target.value)}
                    placeholder={`Osoba ${index + 1}`}
                    className="flex-1 px-2 py-1 rounded-lg border-0 bg-transparent text-sm font-semibold text-slate-700 dark:text-text-secondary-dark focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-slate-400"
                  />
                </div>

                {/* Kalorie */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-600 dark:text-text-secondary-dark flex items-center gap-1">
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
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-border-dark bg-white dark:bg-surface-dark text-slate-900 dark:text-text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                {/* Białko */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-600 dark:text-text-secondary-dark flex items-center gap-1">
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
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-border-dark bg-white dark:bg-surface-dark text-slate-900 dark:text-text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                {/* Preferencje */}
                <PreferenceEditor
                  person={person}
                  personIndex={index}
                  onChange={handlePreferenceChange}
                />
              </div>
            ))}
          </div>

          {/* Podsumowanie */}
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-border-dark">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-text-secondary-dark mb-3">
              Łącznie dziennie
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-orange-50 dark:bg-orange-500/10 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {totalKcal}
                </div>
                <div className="text-xs text-orange-700 dark:text-orange-500/70 mt-1">kcal</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-500/10 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {totalProtein}
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-500/70 mt-1">g białka</div>
              </div>
            </div>
          </div>
        </section>

        {/* Info */}
        <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-800/30 rounded-xl p-4 flex gap-3">
          <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-xl">
            info
          </span>
          <p className="text-sm text-blue-800 dark:text-blue-300">
            Ustawienia są automatycznie zapisywane i będą używane do planowania posiłków.
          </p>
        </div>

        {/* Wersja aplikacji */}
        <div className="text-center pt-4 pb-2">
          <p className="text-xs text-slate-400 dark:text-slate-600">
            Meal Swiper v{process.env.NEXT_PUBLIC_APP_VERSION || '0.0.0'}
          </p>
          <a
            href="https://github.com/liskeee/meal-swiper/blob/master/CHANGELOG.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary/60 hover:text-primary transition-colors"
          >
            Changelog
          </a>
        </div>
      </div>
    </div>
  )
}
