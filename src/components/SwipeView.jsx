import { useState, useEffect, useRef } from 'react'
import TinderCard from 'react-tinder-card'

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
    <div className="flex flex-col items-center justify-center min-h-screen px-4 pt-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Wybierz posiłki</h1>

      <div className="relative w-full max-w-md h-[600px] mb-8">
        {meals.map((meal, index) => (
          <TinderCard
            key={meal.id}
            ref={meal.ref}
            className="absolute w-full"
            onSwipe={(dir) => swiped(dir, meal, index)}
            onCardLeftScreen={() => outOfFrame(meal.name, index)}
            preventSwipe={['up', 'down']}
          >
            <div
              className="relative bg-white rounded-2xl shadow-xl overflow-hidden"
              style={{ height: '600px' }}
            >
              <div className="h-2/3 overflow-hidden">
                <img
                  src={meal.photo}
                  alt={meal.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800'
                  }}
                />
              </div>
              <div className="h-1/3 p-6 flex flex-col justify-between">
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
          </TinderCard>
        ))}
      </div>

      <div className="flex gap-6 mb-8">
        <button
          onClick={() => swipe('left')}
          className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center text-3xl hover:scale-110 transition transform"
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

      <p className="text-gray-500 text-sm">
        Użyj klawiszy ← → lub przyciski powyżej
      </p>
    </div>
  )
}

export default SwipeView
