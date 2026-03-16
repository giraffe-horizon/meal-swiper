'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [people, setPeople] = useState(2)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        body: JSON.stringify({ token, name: name.trim(), people }),
      })

      if (!res.ok) {
        throw new Error('Nie udało się utworzyć gospodarstwa')
      }

      // Store token in localStorage for this device
      localStorage.setItem('meal_swiper_tenant_token', token)

      router.push(`/${token}/plan`)
    } catch {
      setError('Wystąpił błąd. Spróbuj ponownie.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo + title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500 rounded-3xl shadow-lg mb-4">
            <span className="material-symbols-outlined text-white text-4xl">restaurant</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Meal Swiper</h1>
          <p className="text-slate-600">Planowanie posiłków na tydzień</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-1">Utwórz swoje gospodarstwo</h2>
          <p className="text-sm text-slate-500 mb-6">
            Twoje plany posiłków i lista zakupów będą zapisane prywatnie.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Household name */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-1.5">
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
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
              />
            </div>

            {/* People count */}
            <div>
              <label htmlFor="people" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Liczba osób
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPeople((p) => Math.max(1, p - 1))}
                  disabled={people <= 1}
                  className="w-11 h-11 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-600 disabled:opacity-40 hover:bg-slate-100 transition"
                  aria-label="Zmniejsz liczbę osób"
                >
                  <span className="material-symbols-outlined text-lg">remove</span>
                </button>
                <span className="text-2xl font-bold text-slate-900 w-12 text-center">{people}</span>
                <button
                  type="button"
                  onClick={() => setPeople((p) => Math.min(8, p + 1))}
                  disabled={people >= 8}
                  className="w-11 h-11 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-600 disabled:opacity-40 hover:bg-slate-100 transition"
                  aria-label="Zwiększ liczbę osób"
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              {loading ? 'Tworzenie...' : 'Utwórz'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Link do Twojego gospodarstwa zostanie zapisany w tej przeglądarce.
        </p>
      </div>
    </div>
  )
}
