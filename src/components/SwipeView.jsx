import { useState, useEffect, useRef } from 'react'
import SwipeCard from './SwipeCard'

const SwipeView = ({ meals, onSwipeRight }) => {
  const [currentIndex, setCurrentIndex] = useState(meals.length - 1)
  const [lastDirection, setLastDirection] = useState()
  const currentIndexRef = useRef(currentIndex)

  useEffect(() => {
    currentIndexRef.current = currentIndex
  }, [currentIndex])

  const canSwipe = currentIndex >= 0

  const swiped = (direction, meal, index) => {
    setLastDirection(direction)
    if (direction === 'right') {
      onSwipeRight(meal)
    }
    updateCurrentIndex(index - 1)
  }

  const outOfFrame = (name, idx) => {
    console.log(`${name} (${idx}) left the screen!`)
  }

  const updateCurrentIndex = (val) => {
    setCurrentIndex(val)
    currentIndexRef.current = val
  }

  const swipe = async (dir) => {
    if (canSwipe && currentIndex < meals.length) {
      const meal = meals[currentIndex]
      if (dir === 'right') {
        onSwipeRight(meal)
      }
      setLastDirection(dir)
      updateCurrentIndex(currentIndex - 1)
    }
  }

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        swipe('left')
      } else if (e.key === 'ArrowRight') {
        swipe('right')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex])

  if (meals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-4xl mb-4">🍽️</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Brak przepisów</h2>
        <p className="text-gray-600 text-center">
          Dodaj przepisy do bazy danych Notion, aby zacząć planowanie.
        </p>
      </div>
    )
  }

  if (!canSwipe) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Koniec propozycji</h2>
        <p className="text-gray-600 text-center mb-6">
          Przejrzyłeś wszystkie dostępne przepisy!
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-green-accent text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition"
        >
          Zacznij od nowa
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Card container - takes up remaining space above bottom controls */}
      <div className="flex-1 relative overflow-hidden">
        {meals.map((meal, index) => (
          index >= currentIndex && (
            <SwipeCard
              key={meal.id}
              onSwipe={(dir) => swiped(dir, meal, index)}
              onCardLeftScreen={() => outOfFrame(meal.name, index)}
            >
              <div className="absolute inset-0 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                {/* Image - 70% of card height */}
                <div className="h-[70%] overflow-hidden">
                  <img
                    src={meal.photo}
                    alt={meal.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800'
                    }}
                  />
                </div>

                {/* Content - 30% of card height */}
                <div className="h-[30%] p-6 flex flex-col justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">{meal.name}</h2>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{meal.description}</p>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span className="flex items-center gap-1 text-gray-700">
                      ⏱️ {meal.prepTime} min
                    </span>
                    <span className="flex items-center gap-1 text-gray-700">
                      🔥 {meal.kcal} kcal
                    </span>
                  </div>
                  {meal.tags && meal.tags.length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {meal.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </SwipeCard>
          )
        ))}
      </div>

      {/* Bottom controls */}
      <div className="flex flex-col items-center pb-8 pt-4 px-4 bg-gradient-to-t from-white to-transparent">
        <div className="flex gap-6 mb-3">
          <button
            onClick={() => swipe('left')}
            className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center text-3xl hover:scale-110 transition transform text-red-500 border-2 border-red-200"
          >
            ✗
          </button>
          <button
            onClick={() => swipe('right')}
            className="w-16 h-16 rounded-full bg-green-accent shadow-lg flex items-center justify-center text-3xl hover:scale-110 transition transform text-white"
          >
            ✓
          </button>
        </div>
        <p className="text-gray-500 text-xs">
          Użyj klawiszy ← → lub przyciski powyżej
        </p>
      </div>
    </div>
  )
}

export default SwipeView
