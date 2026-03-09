import { useState, useRef, useEffect } from 'react'

const SwipeView = ({ meals, onSwipeRight, currentDay, onComplete, weeklyPlan, onSkipAll }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const dragStartPos = useRef({ x: 0, y: 0 })
  const cardRef = useRef(null)

  // Calculate progress
  const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri']
  const emptyDays = weeklyPlan ? dayKeys.filter(d => !weeklyPlan[d] && !weeklyPlan[`${d}_free`]) : []
  const currentDayIndex = currentDay ? emptyDays.indexOf(currentDay) + 1 : 0
  const totalDays = emptyDays.length

  const currentMeal = meals[currentIndex]

  const handleDragStart = (clientX, clientY) => {
    setIsDragging(true)
    dragStartPos.current = { x: clientX, y: clientY }
  }

  const handleDragMove = (clientX, clientY) => {
    if (!isDragging) return
    const deltaX = clientX - dragStartPos.current.x
    const deltaY = clientY - dragStartPos.current.y
    setDragOffset({ x: deltaX, y: deltaY })
  }

  const handleDragEnd = () => {
    if (!isDragging) return
    setIsDragging(false)

    const threshold = 120
    if (Math.abs(dragOffset.x) > threshold) {
      if (dragOffset.x > 0) {
        handleSwipeRight()
      } else {
        handleSwipeLeft()
      }
    } else {
      setDragOffset({ x: 0, y: 0 })
    }
  }

  const [showToast, setShowToast] = useState(false)
  const [toastText, setToastText] = useState('')

  const handleSwipeRight = () => {
    setDragOffset({ x: 1000, y: 0 })
    const day = currentDay ? dayNames[currentDay] : 'Wybierz dzień'
    setToastText(`Dodano: ${currentMeal.nazwa} do: ${day}`)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
    
    setTimeout(() => {
      onSwipeRight(currentMeal)
      nextCard()
    }, 300)
  }

  const handleSwipeLeft = () => {
    setDragOffset({ x: -1000, y: 0 })
    setTimeout(() => {
      nextCard()
    }, 300)
  }

  const nextCard = () => {
    if (currentIndex >= meals.length - 1) {
      setShowConfetti(true)
      setShowSuccess(true)
      setTimeout(() => {
        onComplete?.()
      }, 2000)
    } else {
      setCurrentIndex(prev => prev + 1)
      setDragOffset({ x: 0, y: 0 })
    }
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') handleSwipeLeft()
      if (e.key === 'ArrowRight') handleSwipeRight()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, currentMeal])

  const rotation = isDragging ? dragOffset.x / 20 : 0
  const opacity = Math.abs(dragOffset.x) / 120

  const dayNames = {
    mon: 'Poniedziałek',
    tue: 'Wtorek',
    wed: 'Środa',
    thu: 'Czwartek',
    fri: 'Piątek'
  }

  if (showSuccess) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background-light dark:bg-background-dark relative overflow-hidden">
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: '-10%',
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                  fontSize: `${20 + Math.random() * 20}px`,
                }}
              >
                {['🎉', '🎊', '✨', '🌟', '💫'][Math.floor(Math.random() * 5)]}
              </div>
            ))}
          </div>
        )}
        <div className="text-center z-10">
          <div className="text-6xl mb-4 animate-bounce">🎉</div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Tydzień gotowy!</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Wszystkie dni uzupełnione</p>
        </div>
      </div>
    )
  }

  if (!currentMeal) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-center text-slate-500">
          <p className="text-lg">Brak więcej posiłków</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-background-light dark:bg-background-dark overflow-hidden relative">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-[#2D6A4F] text-white px-6 py-3 rounded-full shadow-2xl z-50 animate-bounce flex items-center gap-2">
          <span className="material-symbols-outlined">check_circle</span>
          <span className="font-bold">{toastText}</span>
        </div>
      )}
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md z-10">
        <div className="flex size-10 items-center justify-center text-primary">
          <span className="material-symbols-outlined text-2xl">restaurant_menu</span>
        </div>
        <h1 className="text-xl font-bold text-center flex-1 text-slate-900 dark:text-slate-100">Meal Swiper</h1>
        {onSkipAll && (
          <button
            onClick={onSkipAll}
            className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-primary px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Pomiń wszystkie
          </button>
        )}
      </header>

      {/* Date Pill with Progress */}
      <div className="px-4 pb-2 flex justify-center gap-2 z-10 flex-wrap">
        {totalDays > 0 && (
          <div className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1.5 rounded-full text-xs font-medium">
            Dzień {currentDayIndex || 1} z {totalDays}
          </div>
        )}
        <div className="bg-primary/10 dark:bg-primary/20 text-primary px-4 py-1.5 rounded-full text-sm font-medium">
          📅 {currentDay ? dayNames[currentDay] : 'Wybierz posiłek'}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center px-4 pb-6 relative overflow-hidden">
        {/* The Card */}
        <div
          ref={cardRef}
          onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
          onMouseMove={(e) => handleDragMove(e.clientX, e.clientY)}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={(e) => handleDragStart(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchMove={(e) => handleDragMove(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchEnd={handleDragEnd}
          className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-lg flex flex-col h-[70vh] w-full overflow-hidden shrink-0 cursor-grab active:cursor-grabbing select-none touch-none"
          style={{
            transform: `translateX(${dragOffset.x}px) translateY(${dragOffset.y}px) rotate(${rotation}deg)`,
            transition: isDragging ? 'none' : 'transform 0.3s ease-out'
          }}
        >
          {/* Image Area */}
          <div className="relative h-[60%] w-full bg-slate-200 dark:bg-slate-700">
            <img
              alt={currentMeal.nazwa}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              src={currentMeal.photo_url}
              draggable="false"
            />
            {/* Overlays (Tinder-style stamps) */}
            <div
              className="absolute top-10 left-10 border-[6px] border-red-500 text-red-500 px-4 py-1 rounded-xl font-black text-5xl uppercase rotate-[-25deg] transition-opacity z-20 pointer-events-none"
              style={{ opacity: dragOffset.x < 0 ? Math.min(opacity * 1.5, 1) : 0 }}
            >
              NIE
            </div>
            <div
              className="absolute top-10 right-10 border-[6px] border-green-500 text-green-500 px-4 py-1 rounded-xl font-black text-5xl uppercase rotate-[25deg] transition-opacity z-20 pointer-events-none"
              style={{ opacity: dragOffset.x > 0 ? Math.min(opacity * 1.5, 1) : 0 }}
            >
              TAK
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-5 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-2xl font-bold leading-tight text-slate-900 dark:text-slate-100">{currentMeal.nazwa}</h2>
                <div className="bg-primary/10 dark:bg-primary/20 text-primary rounded-full px-2 py-1 text-xs font-bold whitespace-nowrap">
                  {currentIndex + 1}/{meals.length}
                </div>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">{currentMeal.opis}</p>
            </div>
            <div className="flex items-center gap-4 text-slate-700 dark:text-slate-300 font-medium text-sm">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px]">schedule</span>
                <span>{currentMeal.prep_time} min</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px]">local_fire_department</span>
                <span>{currentMeal.kcal_baza} kcal</span>
              </div>
              <div className="flex items-center gap-1 ml-auto">
                <span className="material-symbols-outlined text-[18px]">restaurant</span>
                <span>Główne</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-6 mt-6 shrink-0">
          <button
            onClick={handleSwipeLeft}
            className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full shadow-md flex items-center justify-center text-red-500 border border-slate-100 dark:border-slate-700 transition-transform active:scale-90"
          >
            <span className="material-symbols-outlined text-3xl font-bold">close</span>
          </button>
          <button
            onClick={handleSwipeRight}
            className="w-16 h-16 bg-primary rounded-full shadow-md flex items-center justify-center text-white transition-transform active:scale-90 shadow-primary/30"
          >
            <span className="material-symbols-outlined text-3xl font-bold">favorite</span>
          </button>
        </div>

        {/* Hint */}
        <div className="text-center mt-4 lg:mt-6">
          <p className="text-slate-400 dark:text-slate-500 text-xs lg:text-sm">
            użyj klawiszy strzałek lub przeciągnij kartę
          </p>
          <div className="hidden lg:flex items-center justify-center gap-4 mt-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800">
              <span className="material-symbols-outlined text-red-500">arrow_back</span>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Pomiń</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800">
              <span className="material-symbols-outlined text-green-500">arrow_forward</span>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Wybierz</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default SwipeView
