import { useState, useEffect } from 'react'

const CalendarView = ({ weeklyPlan, onDayClick, onRemoveMeal, onToggleVacation, onGenerateShoppingList, weekOffset, onWeekChange }) => {
  const [activeMenu, setActiveMenu] = useState(null)

  const getWeekDates = () => {
    const today = new Date()
    const monday = new Date(today)
    const dayOfWeek = today.getDay()
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    monday.setDate(today.getDate() + diff + (weekOffset * 7))

    const days = []
    for (let i = 0; i < 5; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      days.push(date)
    }
    return days
  }

  const weekDates = getWeekDates()
  const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri']
  const dayNames = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek']

  const formatWeekRange = () => {
    const start = weekDates[0]
    const end = weekDates[4]
    const monthNames = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru']

    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()} - ${end.getDate()} ${monthNames[end.getMonth()]}`
    }
    return `${start.getDate()} ${monthNames[start.getMonth()]} - ${end.getDate()} ${monthNames[end.getMonth()]}`
  }

  const handleContextMenu = (e, day) => {
    e.preventDefault()
    const action = window.confirm(
      weeklyPlan[`${day}_free`]
        ? 'Usuń oznaczenie wolnego dnia?'
        : weeklyPlan[day]
          ? 'Co chcesz zrobić?\nOK = Usuń danie\nCancel = Oznacz jako wolny'
          : 'Oznaczyć jako wolny dzień?'
    )

    if (weeklyPlan[`${day}_free`]) {
      if (action) onToggleVacation(day)
    } else if (weeklyPlan[day]) {
      if (action) {
        onRemoveMeal(day)
      } else {
        onToggleVacation(day)
      }
    } else {
      if (action) onToggleVacation(day)
    }
  }

  const hasEmptyDays = dayKeys.some(day => !weeklyPlan[day] && !weeklyPlan[`${day}_free`])

  useEffect(() => {
    const handleClickOutside = () => setActiveMenu(null)
    if (activeMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [activeMenu])

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
      {/* Header */}
      <div className="flex items-center px-4 pt-6 pb-2 justify-between sticky top-0 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-3xl">restaurant</span>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Meal Swiper</h1>
        </div>
        <div className="flex items-center">
          <button className="flex items-center justify-center p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
            <span className="material-symbols-outlined text-slate-700 dark:text-slate-300">search</span>
          </button>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 mx-4 rounded-xl shadow-sm mb-6 mt-2">
        <button
          onClick={() => onWeekChange(weekOffset - 1)}
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">chevron_left</span>
        </button>
        <p className="text-base font-bold text-slate-800 dark:text-slate-200">{formatWeekRange()}</p>
        <button
          onClick={() => onWeekChange(weekOffset + 1)}
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">chevron_right</span>
        </button>
      </div>

      {/* Daily Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 px-4 flex-1 min-h-0 overflow-y-auto pb-32 lg:pb-8">
        {dayKeys.map((day, index) => {
          const meal = weeklyPlan[day]
          const isFree = weeklyPlan[`${day}_free`]
          const date = weekDates[index]
          const dateStr = `${date.getDate()} ${['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'][date.getMonth()]}`

          if (isFree) {
            return (
              <div
                key={day}
                data-testid={`day-card-${day}`}
                onContextMenu={(e) => handleContextMenu(e, day)}
                className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-4 flex items-center justify-between opacity-70 group relative"
              >
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-slate-500">flight_takeoff</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{dayNames[index]}, {dateStr}</p>
                    <p className="text-base font-bold text-slate-600 dark:text-slate-300">Urlop</p>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveMenu(activeMenu === day ? null : day)
                    }}
                    className="p-2 shrink-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
                  >
                    <span className="material-symbols-outlined text-slate-500">more_vert</span>
                  </button>
                  {activeMenu === day && (
                    <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-50 min-w-[180px]">
                      <button
                        onClick={() => {
                          setActiveMenu(null)
                          onToggleVacation(day)
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-300"
                      >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                        Anuluj urlop
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          }

          if (meal) {
            return (
              <div
                key={day}
                data-testid={`day-card-${day}`}
                onContextMenu={(e) => handleContextMenu(e, day)}
                className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm flex items-center justify-between border border-slate-100 dark:border-slate-800 group relative"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div
                    className="h-14 w-14 rounded-full bg-cover bg-center shadow-sm shrink-0"
                    style={{ backgroundImage: `url(${meal.photo_url})` }}
                  />
                  <div className="flex flex-col min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{dayNames[index]}, {dateStr}</p>
                    <p className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">{meal.nazwa}</p>
                    {meal.nazwa && meal.prep_time && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {meal.prep_time} min • {meal.kcal_baza} kcal
                      </p>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setActiveMenu(activeMenu === day ? null : day)}
                    className="p-2 shrink-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                  >
                    <span className="material-symbols-outlined text-slate-400">more_vert</span>
                  </button>
                  {activeMenu === day && (
                    <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-50 min-w-[180px]">
                      <button
                        onClick={() => {
                          setActiveMenu(null)
                          onDayClick(day)
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-300"
                      >
                        <span className="material-symbols-outlined text-[18px]">sync_alt</span>
                        Zmień danie
                      </button>
                      <button
                        onClick={() => {
                          setActiveMenu(null)
                          onRemoveMeal(day)
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-red-600 dark:text-red-400"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                        Usuń danie
                      </button>
                      <button
                        onClick={() => {
                          setActiveMenu(null)
                          onToggleVacation(day)
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-300"
                      >
                        <span className="material-symbols-outlined text-[18px]">flight_takeoff</span>
                        Oznacz jako wolny
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          }

          return (
            <div
              key={day}
              data-testid={`day-card-${day}`}
              onClick={() => onDayClick(day)}
              onContextMenu={(e) => handleContextMenu(e, day)}
              className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm flex items-center justify-between border border-slate-100 dark:border-slate-800 border-dashed cursor-pointer hover:border-primary/50 transition-colors group"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="h-14 w-14 rounded-full bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-slate-400">restaurant_menu</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{dayNames[index]}, {dateStr}</p>
                  <p className="text-base font-medium text-slate-400 dark:text-slate-500 italic">Brak planu</p>
                </div>
              </div>
              <button className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors shrink-0">
                <span className="material-symbols-outlined text-primary">add</span>
              </button>
              <div className="relative ml-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveMenu(activeMenu === day ? null : day)
                  }}
                  className="p-2 shrink-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  <span className="material-symbols-outlined text-slate-400">more_vert</span>
                </button>
                {activeMenu === day && (
                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-50 min-w-[180px]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setActiveMenu(null)
                        onDayClick(day)
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-300"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                      Dodaj danie
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setActiveMenu(null)
                        onToggleVacation(day)
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-300"
                    >
                      <span className="material-symbols-outlined text-[18px]">flight_takeoff</span>
                      Oznacz jako wolny
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* CTA Button */}
      {!hasEmptyDays && (
        <div className="fixed bottom-20 left-0 right-0 max-w-[400px] mx-auto px-4 z-20">
          <button
            onClick={onGenerateShoppingList}
            className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">shopping_cart</span>
            Generuj listę zakupów
          </button>
        </div>
      )}
    </div>
  )
}

export default CalendarView
