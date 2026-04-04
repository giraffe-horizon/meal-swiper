import { useCallback } from 'react'
import { Dimensions } from 'react-native'
import { Gesture } from 'react-native-gesture-handler'
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  useReducedMotion,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated'

const SCREEN_WIDTH = Dimensions.get('window').width
const SWIPE_VELOCITY_THRESHOLD = 800
const SWIPE_DISTANCE_THRESHOLD = SCREEN_WIDTH * 0.4
const MAX_ROTATION_DEG = 18
const SWIPE_OUT_DURATION = 300

export interface SwipeGestureCallbacks {
  onSwipeRight: () => void
  onSwipeLeft: () => void
}

export interface SwipeGesturesResult {
  gesture: ReturnType<typeof Gesture.Pan>
  animatedStyle: ReturnType<typeof useAnimatedStyle>
  likeOpacity: ReturnType<typeof useSharedValue<number>>
  nopeOpacity: ReturnType<typeof useSharedValue<number>>
  animateSwipe: (direction: 'left' | 'right') => void
  resetPosition: () => void
}

export function useSwipeGestures(callbacks: SwipeGestureCallbacks): SwipeGesturesResult {
  const reducedMotion = useReducedMotion()

  const translateX = useSharedValue(0)
  const likeOpacity = useSharedValue(0)
  const nopeOpacity = useSharedValue(0)

  const triggerSwipeRight = useCallback(() => {
    callbacks.onSwipeRight()
  }, [callbacks])

  const triggerSwipeLeft = useCallback(() => {
    callbacks.onSwipeLeft()
  }, [callbacks])

  const resetPosition = useCallback(() => {
    if (reducedMotion) {
      translateX.value = 0
      likeOpacity.value = 0
      nopeOpacity.value = 0
    } else {
      translateX.value = withSpring(0, { damping: 15, stiffness: 120 })
      likeOpacity.value = withTiming(0, { duration: 150 })
      nopeOpacity.value = withTiming(0, { duration: 150 })
    }
  }, [translateX, likeOpacity, nopeOpacity, reducedMotion])

  const animateSwipe = useCallback(
    (direction: 'left' | 'right') => {
      const target = direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5
      const callback = direction === 'right' ? triggerSwipeRight : triggerSwipeLeft

      if (reducedMotion) {
        translateX.value = target
        likeOpacity.value = 0
        nopeOpacity.value = 0
        callback()
      } else {
        translateX.value = withTiming(target, { duration: SWIPE_OUT_DURATION }, (finished) => {
          if (finished) {
            runOnJS(callback)()
          }
        })
        if (direction === 'right') {
          likeOpacity.value = withTiming(1, { duration: 150 })
          nopeOpacity.value = withTiming(0, { duration: 150 })
        } else {
          nopeOpacity.value = withTiming(1, { duration: 150 })
          likeOpacity.value = withTiming(0, { duration: 150 })
        }
      }
    },
    [translateX, likeOpacity, nopeOpacity, triggerSwipeRight, triggerSwipeLeft, reducedMotion]
  )

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX

      // Update badge opacities based on translation
      if (event.translationX > 0) {
        likeOpacity.value = interpolate(
          event.translationX,
          [0, SCREEN_WIDTH * 0.25],
          [0, 1],
          Extrapolation.CLAMP
        )
        nopeOpacity.value = 0
      } else {
        nopeOpacity.value = interpolate(
          -event.translationX,
          [0, SCREEN_WIDTH * 0.25],
          [0, 1],
          Extrapolation.CLAMP
        )
        likeOpacity.value = 0
      }
    })
    .onEnd((event) => {
      const shouldSwipeRight =
        event.velocityX > SWIPE_VELOCITY_THRESHOLD ||
        event.translationX > SWIPE_DISTANCE_THRESHOLD

      const shouldSwipeLeft =
        event.velocityX < -SWIPE_VELOCITY_THRESHOLD ||
        event.translationX < -SWIPE_DISTANCE_THRESHOLD

      if (shouldSwipeRight) {
        const target = SCREEN_WIDTH * 1.5
        if (reducedMotion) {
          translateX.value = target
          runOnJS(triggerSwipeRight)()
        } else {
          translateX.value = withTiming(target, { duration: SWIPE_OUT_DURATION }, (finished) => {
            if (finished) {
              runOnJS(triggerSwipeRight)()
            }
          })
          likeOpacity.value = withTiming(1, { duration: 100 })
        }
      } else if (shouldSwipeLeft) {
        const target = -SCREEN_WIDTH * 1.5
        if (reducedMotion) {
          translateX.value = target
          runOnJS(triggerSwipeLeft)()
        } else {
          translateX.value = withTiming(target, { duration: SWIPE_OUT_DURATION }, (finished) => {
            if (finished) {
              runOnJS(triggerSwipeLeft)()
            }
          })
          nopeOpacity.value = withTiming(1, { duration: 100 })
        }
      } else {
        // Snap back
        if (reducedMotion) {
          translateX.value = 0
          likeOpacity.value = 0
          nopeOpacity.value = 0
        } else {
          translateX.value = withSpring(0, { damping: 15, stiffness: 120 })
          likeOpacity.value = withTiming(0, { duration: 200 })
          nopeOpacity.value = withTiming(0, { duration: 200 })
        }
      }
    })

  const animatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [-MAX_ROTATION_DEG, 0, MAX_ROTATION_DEG],
      Extrapolation.CLAMP
    )

    return {
      transform: [{ translateX: translateX.value }, { rotate: `${rotate}deg` }],
    }
  })

  return {
    gesture,
    animatedStyle,
    likeOpacity,
    nopeOpacity,
    animateSwipe,
    resetPosition,
  }
}
