'use client'

import { useState, useCallback } from 'react'
import type { Meal } from '@/types'

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function useSwipeState() {
  const [shuffledMeals, setShuffledMeals] = useState<Meal[]>([])
  const [currentSwipeIndex, setCurrentSwipeIndex] = useState(0)
  const [seenIds, setSeenIds] = useState<string[]>([])

  const shuffleMeals = useCallback((meals: Meal[]) => {
    setShuffledMeals(shuffleArray(meals))
    setCurrentSwipeIndex(0)
    setSeenIds([])
  }, [])

  const advanceIndex = useCallback(() => {
    setCurrentSwipeIndex((i) => i + 1)
  }, [])

  const resetSwipe = useCallback(() => {
    setCurrentSwipeIndex(0)
    setSeenIds([])
  }, [])

  return {
    shuffledMeals,
    currentSwipeIndex,
    seenIds,
    setShuffledMeals,
    setCurrentSwipeIndex,
    setSeenIds,
    shuffleMeals,
    advanceIndex,
    resetSwipe,
  }
}
