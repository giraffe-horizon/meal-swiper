import { useState, useEffect } from 'react'
import CalendarView from './components/CalendarView'
import SwipeView from './components/SwipeView'
import ShoppingListView from './components/ShoppingListView'
import BottomNav from './components/BottomNav'

function App() {
  const [currentView, setCurrentView] = useState('plan')
  const [meals, setMeals] = useState([])
  const [weeklyPlan, setWeeklyPlan] = useState({
    mon: null,
    tue: null,
    wed: null,
    thu: null,
    fri: null,
    mon_free: false,
    tue_free: false,
    wed_free: false,
    thu_free: false,
    fri_free: false,
  })
  const [loading, setLoading] = useState(true)
  const [currentSwipeDay, setCurrentSwipeDay] = useState(null)
  const [weekOffset, setWeekOffset] = useState(0)

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

  const handleDayClick = (day) => {
    if (weeklyPlan[`${day}_free`]) return
    setCurrentSwipeDay(day)
    setCurrentView('swipe')
  }

  const handleSwipeRight = (meal) => {
    if (currentSwipeDay) {
      const newPlan = { ...weeklyPlan, [currentSwipeDay]: meal }
      setWeeklyPlan(newPlan)
      saveWeeklyPlanToLocalStorage(newPlan)

      const days = ['mon', 'tue', 'wed', 'thu', 'fri']
      const nextEmptyDay = days.find(d => !newPlan[d] && !newPlan[`${d}_free`])

      if (nextEmptyDay) {
        setCurrentSwipeDay(nextEmptyDay)
      } else {
        setTimeout(() => {
          setCurrentView('plan')
          setCurrentSwipeDay(null)
        }, 1500)
      }
    } else {
      const days = ['mon', 'tue', 'wed', 'thu', 'fri']
      const firstEmptyDay = days.find(d => !weeklyPlan[d] && !weeklyPlan[`${d}_free`])

      if (firstEmptyDay) {
        const newPlan = { ...weeklyPlan, [firstEmptyDay]: meal }
        setWeeklyPlan(newPlan)
        saveWeeklyPlanToLocalStorage(newPlan)
      }
    }
  }

  const handleRemoveMeal = (day) => {
    const newPlan = { ...weeklyPlan, [day]: null }
    setWeeklyPlan(newPlan)
    saveWeeklyPlanToLocalStorage(newPlan)
  }

  const handleToggleVacation = (day) => {
    const key = `${day}_free`
    const newPlan = { ...weeklyPlan, [key]: !weeklyPlan[key] }
    if (newPlan[key]) {
      newPlan[day] = null
    }
    setWeeklyPlan(newPlan)
    saveWeeklyPlanToLocalStorage(newPlan)
  }

  const handleGenerateShoppingList = () => {
    setCurrentView('shopping')
  }

  const handleSwipeComplete = () => {
    setCurrentView('plan')
    setCurrentSwipeDay(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-primary text-6xl mb-4 block animate-spin">restaurant</span>
          <div className="text-xl text-slate-600 dark:text-slate-400">Ładowanie...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex justify-center">
      <div className="w-full max-w-[400px] relative shadow-xl">
        {currentView === 'plan' && (
          <CalendarView
            weeklyPlan={weeklyPlan}
            onDayClick={handleDayClick}
            onRemoveMeal={handleRemoveMeal}
            onToggleVacation={handleToggleVacation}
            onGenerateShoppingList={handleGenerateShoppingList}
          />
        )}

        {currentView === 'swipe' && (
          <SwipeView
            meals={meals}
            onSwipeRight={handleSwipeRight}
            currentDay={currentSwipeDay}
            onComplete={handleSwipeComplete}
          />
        )}

        {currentView === 'shopping' && (
          <ShoppingListView
            weeklyPlan={weeklyPlan}
            weekOffset={weekOffset}
            onWeekChange={setWeekOffset}
          />
        )}

        <BottomNav currentView={currentView} onNavigate={setCurrentView} />
      </div>
    </div>
  )
}

export default App
