import { useState, useRef, useEffect } from 'react'

const SwipeCard = ({ children, onSwipe, onCardLeftScreen }) => {
  const [{ x, y, rotate }, setPosition] = useState({ x: 0, y: 0, rotate: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [isSwiping, setIsSwiping] = useState(false)
  const cardRef = useRef(null)
  const startPosRef = useRef({ x: 0, y: 0 })

  const SWIPE_THRESHOLD = 100
  const MAX_ROTATION = 15

  const handleStart = (clientX, clientY) => {
    setIsDragging(true)
    setIsSwiping(false)
    startPosRef.current = { x: clientX, y: clientY }
  }

  const handleMove = (clientX, clientY) => {
    if (!isDragging) return

    const deltaX = clientX - startPosRef.current.x
    const deltaY = clientY - startPosRef.current.y
    const rotation = (deltaX / window.innerWidth) * MAX_ROTATION * 2

    setPosition({ x: deltaX, y: deltaY, rotate: rotation })
  }

  const handleEnd = () => {
    if (!isDragging) return
    setIsDragging(false)

    const absX = Math.abs(x)

    if (absX > SWIPE_THRESHOLD) {
      // Swipe committed - fly off screen
      const direction = x > 0 ? 'right' : 'left'
      const exitX = direction === 'right' ? window.innerWidth * 1.5 : -window.innerWidth * 1.5
      const exitRotate = direction === 'right' ? MAX_ROTATION * 2 : -MAX_ROTATION * 2

      setIsSwiping(true)
      setPosition({ x: exitX, y: y, rotate: exitRotate })

      if (onSwipe) {
        setTimeout(() => onSwipe(direction), 100)
      }

      if (onCardLeftScreen) {
        setTimeout(() => onCardLeftScreen(), 300)
      }
    } else {
      // Spring back to center
      setPosition({ x: 0, y: 0, rotate: 0 })
    }
  }

  // Mouse events
  const handleMouseDown = (e) => {
    e.preventDefault()
    handleStart(e.clientX, e.clientY)
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e) => {
      handleMove(e.clientX, e.clientY)
    }

    const handleMouseUp = () => {
      handleEnd()
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, x, y])

  // Touch events
  const handleTouchStart = (e) => {
    const touch = e.touches[0]
    handleStart(touch.clientX, touch.clientY)
  }

  const handleTouchMove = (e) => {
    if (!isDragging) return
    const touch = e.touches[0]
    handleMove(touch.clientX, touch.clientY)
  }

  const handleTouchEnd = () => {
    handleEnd()
  }

  // Calculate overlay opacity based on drag distance
  const overlayOpacity = Math.min(Math.abs(x) / SWIPE_THRESHOLD, 1)
  const showLeftOverlay = x < -20
  const showRightOverlay = x > 20

  return (
    <div
      ref={cardRef}
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{
        transform: `translate(${x}px, ${y}px) rotate(${rotate}deg)`,
        transition: isDragging || isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        touchAction: 'none',
        userSelect: 'none',
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}

      {/* Left overlay (reject) */}
      {showLeftOverlay && (
        <div
          className="absolute inset-0 bg-red-500 bg-opacity-50 rounded-2xl flex items-center justify-center pointer-events-none"
          style={{ opacity: overlayOpacity }}
        >
          <div className="text-white text-8xl font-bold border-8 border-white rounded-full w-32 h-32 flex items-center justify-center rotate-12">
            ✗
          </div>
        </div>
      )}

      {/* Right overlay (accept) */}
      {showRightOverlay && (
        <div
          className="absolute inset-0 bg-green-500 bg-opacity-50 rounded-2xl flex items-center justify-center pointer-events-none"
          style={{ opacity: overlayOpacity }}
        >
          <div className="text-white text-8xl font-bold border-8 border-white rounded-full w-32 h-32 flex items-center justify-center -rotate-12">
            ✓
          </div>
        </div>
      )}
    </div>
  )
}

export default SwipeCard
