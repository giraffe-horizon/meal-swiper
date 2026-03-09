import { useState, useEffect } from 'react'
import CalendarView from './components/CalendarView'
import SwipeView from './components/SwipeView'
import ShoppingListView from './components/ShoppingListView'
import Sidebar from './components/Sidebar'

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

  const tabs = [
    { id: 'plan', label: 'Plan', icon: 'calendar_today' },
    { id: 'swipe', label: 'Propozycje', icon: 'restaurant_menu' },
    { id: 'shopping', label: 'Lista', icon: 'shopping_cart' },
  ]

  useEffect(() => {
    fetchMeals()
  }, [])

  const fetchMeals = async () => {
    try {
      const response = await fetch('/api/meals')
      if (!response.ok) throw new Error(`API error: ${response.status}`)
      const data = await response.json()
      setMeals(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching meals:', error)
      setMeals([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWeeklyPlanFromLocalStorage()
  }, [weekOffset])

  const getWeekKey = () => {
    const today = new Date()
    const monday = new Date(today)
    const dayOfWeek = today.getDay()
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    monday.setDate(today.getDate() + diff + (weekOffset * 7))
    return `weeklyPlan_${monday.toISOString().split('T')[0]}`
  }

  const loadWeeklyPlanFromLocalStorage = () => {
    const key = getWeekKey()
    const saved = localStorage.getItem(key)
    if (saved) {
      setWeeklyPlan(JSON.parse(saved))
    } else {
      setWeeklyPlan({
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
    }
  }

  const saveWeeklyPlanToLocalStorage = (plan) => {
    const key = getWeekKey()
    localStorage.setItem(key, JSON.stringify(plan))
  }

  const handleDayClick = (day) => {
    if (weeklyPlan[`${day}_free`]) return
    setCurrentSwipeDay(day)
    setCurrentView('swipe')
  }

  const handleSwipeRight = (meal) => {
    let targetDay = currentSwipeDay
    
    if (!targetDay) {
      const days = ['mon', 'tue', 'wed', 'thu', 'fri']
      targetDay = days.find(d => !weeklyPlan[d] && !weeklyPlan[`${d}_free`])
    }

    if (targetDay) {
      const newPlan = { ...weeklyPlan, [targetDay]: meal }
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
    if (newPlan[key]) newPlan[day] = null
    setWeeklyPlan(newPlan)
    saveWeeklyPlanToLocalStorage(newPlan)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-[#2D6A4F] text-6xl mb-4 block animate-spin">restaurant</span>
          <div className="text-xl text-[#1A1A1A]">Ładowanie...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex text-[#1A1A1A]">
      {/* Sidebar for Desktop */}
      <Sidebar 
        activeTab={currentView} 
        setActiveTab={setCurrentView} 
        tabs={tabs} 
      />

      <main className="flex-1 lg:ml-64 w-full flex flex-col pb-20 lg:pb-0">
        <header className="bg-white lg:hidden px-6 py-5 border-b border-gray-200 sticky top-0 z-10 shadow-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[#2D6A4F]">restaurant</span>
          <h1 className="text-xl font-bold text-[#2D6A4F]">Meal Swiper</h1>
        </header>

        <div className="w-full flex-1">
          {currentView === 'plan' && (
            <CalendarView
              weeklyPlan={weeklyPlan}
              onDayClick={handleDayClick}
              onRemoveMeal={handleRemoveMeal}
              onToggleVacation={handleToggleVacation}
              onGenerateShoppingList={() => setCurrentView('shopping')}
              weekOffset={weekOffset}
              onWeekChange={setWeekOffset}
            />
          )}

          {currentView === 'swipe' && (
            <SwipeView
              meals={meals}
              onSwipeRight={handleSwipeRight}
              currentDay={currentSwipeDay}
              onComplete={() => {
                setCurrentView('plan')
                setCurrentSwipeDay(null)
              }}
              weeklyPlan={weeklyPlan}
              onSkipAll={() => {
                setCurrentView('plan')
                setCurrentSwipeDay(null)
              }}
            />
          )}

          {currentView === 'shopping' && (
            <ShoppingListView
              weeklyPlan={weeklyPlan}
              weekOffset={weekOffset}
              onWeekChange={setWeekOffset}
            />
          )}
        </div>
      </main>

      {/* Mobile/Tablet Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 w-full bg-white border-t border-gray-200 flex justify-around z-10 pb-safe">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCurrentView(tab.id)}
            className={`flex-1 py-4 flex flex-col items-center gap-1 transition-colors ${
              currentView === tab.id
                ? 'text-[#2D6A4F]'
                : 'text-gray-400'
            }`}
          >
            <span className="material-symbols-outlined">{tab.icon}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

export default App
