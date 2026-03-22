'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useMotionValue, useTransform, animate, type PanInfo } from 'framer-motion'

const SWIPE_THRESHOLD = 120

export function useSwipeGestures({ modalOpen }: { modalOpen: boolean }) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)

  const x = useMotionValue(0)
  const rotate = useTransform(x, [-300, 0, 300], [-18, 0, 18])
  const likeOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1])
  const nopeOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0])

  // Refs for swipe handlers — set by consumer to avoid circular deps
  const onSwipeRightRef = useRef<() => void>(() => {})
  const onSwipeLeftRef = useRef<() => void>(() => {})

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (isAnimating) return
      const offset = info.offset.x
      if (Math.abs(offset) > SWIPE_THRESHOLD) {
        if (offset > 0) onSwipeRightRef.current()
        else onSwipeLeftRef.current()
      } else {
        animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 })
      }
    },
    [isAnimating, x]
  )

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setDragStartX(e.clientX)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (modalOpen) return
      if (e.key === 'ArrowLeft') onSwipeLeftRef.current()
      if (e.key === 'ArrowRight') onSwipeRightRef.current()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [modalOpen])

  const animateSwipe = useCallback(
    (direction: 'left' | 'right') =>
      animate(x, direction === 'right' ? 600 : -600, { duration: 0.3 }),
    [x]
  )

  const resetX = useCallback(() => x.set(0), [x])

  return {
    x,
    rotate,
    likeOpacity,
    nopeOpacity,
    isAnimating,
    setIsAnimating,
    dragStartX,
    handleDragEnd,
    handlePointerDown,
    onSwipeRightRef,
    onSwipeLeftRef,
    animateSwipe,
    resetX,
  }
}
