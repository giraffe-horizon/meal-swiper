import { useState, useEffect } from 'react'
import SwipeView from './components/SwipeView'
import WeeklyPlanView from './components/WeeklyPlanView'
import ShoppingListView from './components/ShoppingListView'

function App() {
  const [currentView, setCurrentView] = useState('swipe')
  const [meals, setMeals] = useState([])
  const [weeklyPlan, setWeeklyPlan] = useState({
    mon: null,
    tue: null,
    wed: null,
    thu: null,
    fri: null
  })
  const [loading, setLoading] = useState(true)

  // Load meals from API on mount
  useEffect(() => {
    fetchMeals()
    loadWeeklyPlanFromLocalStorage()
  }, [])

  const fetchMeals = async () => {
    try {
      const response = await fetch('/api/meals')
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      const data = await response.json()
      if (Array.isArray(data) && data.length > 0) {
        setMeals(data)
      } else {
        console.warn('No meals returned from API')
        setMeals([])
      }
    } catch (error) {
      console.error('Error fetching meals:', error)
      setMeals([])
    } finally {
      setLoading(false)
    }
  }

  const loadWeeklyPlanFromLocalStorage = () => {
    const saved = localStorage.getItem('weeklyPlan')
    if (saved) {
      setWeeklyPlan(JSON.parse(saved))
    }
  }

  const saveWeeklyPlanToLocalStorage = (plan) => {
    localStorage.setItem('weeklyPlan', JSON.stringify(plan))
  }

  const addMealToWeek = (meal) => {
    // Find first empty slot
    const days = ['mon', 'tue', 'wed', 'thu', 'fri']
    for (const day of days) {
      if (!weeklyPlan[day]) {
        const newPlan = { ...weeklyPlan, [day]: meal }
        setWeeklyPlan(newPlan)
        saveWeeklyPlanToLocalStorage(newPlan)
        return
      }
    }
    // If all slots are full, replace the first one
    const newPlan = { ...weeklyPlan, mon: meal }
    setWeeklyPlan(newPlan)
    saveWeeklyPlanToLocalStorage(newPlan)
  }

  const removeMealFromDay = (day) => {
    const newPlan = { ...weeklyPlan, [day]: null }
    setWeeklyPlan(newPlan)
    saveWeeklyPlanToLocalStorage(newPlan)
  }

  const saveWeeklyPlanToNotion = async () => {
    // Get current week (Monday)
    const today = new Date()
    const monday = new Date(today)
    const dayOfWeek = today.getDay()
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    monday.setDate(today.getDate() + diff)
    const weekId = monday.toISOString().split('T')[0]

    try {
      await fetch('/api/weekly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          week: weekId,
          meals: weeklyPlan
        })
      })
      alert('Plan zapisany w Notion! ✅')
    } catch (error) {
      console.error('Error saving plan:', error)
      alert('Błąd podczas zapisywania planu')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-2xl text-gray-600">Ładowanie...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream pb-20">
      {currentView === 'swipe' && (
        <SwipeView meals={meals} onSwipeRight={addMealToWeek} />
      )}
      {currentView === 'plan' && (
        <WeeklyPlanView
          weeklyPlan={weeklyPlan}
          onRemoveMeal={removeMealFromDay}
          onSave={saveWeeklyPlanToNotion}
        />
      )}
      {currentView === 'shopping' && (
        <ShoppingListView weeklyPlan={weeklyPlan} />
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 shadow-lg">
        <button
          onClick={() => setCurrentView('swipe')}
          className={`flex flex-col items-center justify-center flex-1 h-full ${
            currentView === 'swipe' ? 'text-green-accent' : 'text-gray-500'
          }`}
        >
          <span className="text-2xl">🍽️</span>
          <span className="text-xs mt-1">Propozycje</span>
        </button>
        <button
          onClick={() => setCurrentView('plan')}
          className={`flex flex-col items-center justify-center flex-1 h-full ${
            currentView === 'plan' ? 'text-green-accent' : 'text-gray-500'
          }`}
        >
          <span className="text-2xl">📅</span>
          <span className="text-xs mt-1">Plan</span>
        </button>
        <button
          onClick={() => setCurrentView('shopping')}
          className={`flex flex-col items-center justify-center flex-1 h-full ${
            currentView === 'shopping' ? 'text-green-accent' : 'text-gray-500'
          }`}
        >
          <span className="text-2xl">🛒</span>
          <span className="text-xs mt-1">Lista</span>
        </button>
      </div>
    </div>
  )
}

export default App
