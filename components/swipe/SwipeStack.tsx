import { useCallback, useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import { View, Text } from 'react-native'
import * as Haptics from 'expo-haptics'
import { useAnimatedReaction, runOnJS } from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import SwipeCard from './SwipeCard'
import { useSwipeGestures } from '@/hooks/useSwipeGestures'
import type { MealWithVariants, PersonSettings } from '@/types'

export interface SwipeStackHandle {
  swipe: (direction: 'left' | 'right') => void
}

export interface SwipeStackProps {
  meals: MealWithVariants[]
  persons: PersonSettings[]
  onSwipeRight: (meal: MealWithVariants) => void
  onSwipeLeft: (meal: MealWithVariants) => void
  onCardPress: (meal: MealWithVariants) => void
}

const SwipeStack = forwardRef<SwipeStackHandle, SwipeStackProps>(function SwipeStack(
  { meals, persons, onSwipeRight, onSwipeLeft, onCardPress },
  ref
) {
  const hapticFiredRef = useRef(false)

  const topMeal = meals[0]

  const handleSwipeRight = useCallback(() => {
    if (topMeal) onSwipeRight(topMeal)
  }, [topMeal, onSwipeRight])

  const handleSwipeLeft = useCallback(() => {
    if (topMeal) onSwipeLeft(topMeal)
  }, [topMeal, onSwipeLeft])

  const gestureResult = useSwipeGestures({
    onSwipeRight: handleSwipeRight,
    onSwipeLeft: handleSwipeLeft,
  })

  // Expose swipe method to parent via ref
  useImperativeHandle(ref, () => ({
    swipe: (direction: 'left' | 'right') => {
      gestureResult.animateSwipe(direction)
    },
  }))

  // Reset position when top card changes
  useEffect(() => {
    gestureResult.resetPosition()
    hapticFiredRef.current = false
  }, [topMeal?.id])

  // Haptic feedback when crossing threshold
  const triggerHaptic = useCallback(() => {
    if (!hapticFiredRef.current) {
      hapticFiredRef.current = true
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    }
  }, [])

  const resetHaptic = useCallback(() => {
    hapticFiredRef.current = false
  }, [])

  // Watch translateX for haptic trigger via likeOpacity/nopeOpacity
  useAnimatedReaction(
    () => {
      // Threshold crossed when either badge is fully visible
      return Math.max(gestureResult.likeOpacity.value, gestureResult.nopeOpacity.value)
    },
    (current, previous) => {
      if (current >= 0.8 && (previous === null || previous < 0.8)) {
        runOnJS(triggerHaptic)()
      } else if (current < 0.3 && previous !== null && previous >= 0.3) {
        runOnJS(resetHaptic)()
      }
    }
  )

  // Empty state
  if (meals.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-8">
        <Ionicons name="restaurant-outline" size={64} color="#94B4A6" />
        <Text className="text-on-surface text-lg font-bold mt-4 text-center">
          Brak więcej posiłków
        </Text>
        <Text className="text-on-surface-variant text-sm mt-2 text-center">
          Przejrzałeś wszystkie posiłki. Zmień filtry lub odśwież.
        </Text>
      </View>
    )
  }

  // Render top 3 cards
  const visibleMeals = meals.slice(0, 3)

  return (
    <View className="flex-1 items-center justify-center px-4">
      {visibleMeals.map((meal, index) => {
        const isTop = index === 0
        const zIndex = 3 - index
        const scale = 1 - index * 0.05 // 1, 0.95, 0.9
        const translateY = index * 10 // 0, 10, 20

        return (
          <View
            key={meal.id}
            className="absolute w-full px-2"
            style={{
              zIndex,
              transform: isTop ? [] : [{ scale }, { translateY }],
            }}
            pointerEvents={isTop ? 'auto' : 'none'}
          >
            <SwipeCard
              meal={meal}
              persons={persons}
              gestureResult={gestureResult}
              onPress={() => onCardPress(meal)}
              isTop={isTop}
            />
          </View>
        )
      })}
    </View>
  )
})

export default SwipeStack
