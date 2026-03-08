import { useState, useRef } from 'react'

const SwipeCard = ({ children, onSwipe, onCardLeftScreen, preventSwipe = [] }) => {
  const [{ x, y, rotate }, setPosition] = useState({ x: 0, y: 0, rotate: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const cardRef = useRef(null)
  const startPosRef = useRef({ x: 0, y: 0 })

  const handleStart = (clientX, clientY) => {
    setIsDragging(true)
    startPosRef.current = { x: clientX - x, y: clientY - y }
  }

  const handleMove = (clientX, clientY) => {
    if (!isDragging) return

    const newX = clientX - startPosRef.current.x
    const newY = clientY - startPosRef.current.y
    const newRotate = newX / 20 // Rotation based on horizontal movement

    // Check if swipe direction is prevented
    if (preventSwipe.includes('up') && newY < -10) return
    if (preventSwipe.includes('down') && newY > 10) return
    if (preventSwipe.includes('left') && newX < -10) return
    if (preventSwipe.includes('right') && newX > 10) return

    setPosition({ x: newX, y: newY, rotate: newRotate })
  }

  const handleEnd = () => {
    if (!isDragging) return
    setIsDragging(false)

    const threshold = 100
    let direction = null

    if (Math.abs(x) > threshold) {
      direction = x > 0 ? 'right' : 'left'
    } else if (Math.abs(y) > threshold) {
      direction = y > 0 ? 'down' : 'up'
    }

    if (direction && !preventSwipe.includes(direction)) {
      // Animate card off screen
      const exitX = direction === 'right' ? 1000 : direction === 'left' ? -1000 : x
      const exitY = direction === 'down' ? 1000 : direction === 'up' ? -1000 : y
      setPosition({ x: exitX, y: exitY, rotate: exitX / 10 })

      if (onSwipe) onSwipe(direction)

      setTimeout(() => {
        if (onCardLeftScreen) onCardLeftScreen()
      }, 300)
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

  const handleMouseMove = (e) => {
    handleMove(e.clientX, e.clientY)
  }

  const handleMouseUp = () => {
    handleEnd()
  }

  // Touch events
  const handleTouchStart = (e) => {
    const touch = e.touches[0]
    handleStart(touch.clientX, touch.clientY)
  }

  const handleTouchMove = (e) => {
    const touch = e.touches[0]
    handleMove(touch.clientX, touch.clientY)
  }

  const handleTouchEnd = () => {
    handleEnd()
  }

  const style = {
    transform: `translate(${x}px, ${y}px) rotate(${rotate}deg)`,
    transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    cursor: isDragging ? 'grabbing' : 'grab',
    touchAction: 'none',
    userSelect: 'none'
  }

  return (
    <div
      ref={cardRef}
      style={style}
      onMouseDown={handleMouseDown}
      onMouseMove={isDragging ? handleMouseMove : undefined}
      onMouseUp={handleMouseUp}
      onMouseLeave={isDragging ? handleMouseUp : undefined}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  )
}

export default SwipeCard
