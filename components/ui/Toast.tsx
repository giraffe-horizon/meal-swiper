import { useEffect } from 'react'
import { Text } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  useReducedMotion,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useUIStore } from '@/stores/ui'

const TYPE_STYLES = {
  success: 'bg-primary',
  error: 'bg-red-500',
  info: 'bg-surface-container',
} as const

const TEXT_STYLES = {
  success: 'text-background',
  error: 'text-white',
  info: 'text-on-surface',
} as const

export default function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts)
  const removeToast = useUIStore((s) => s.removeToast)
  const insets = useSafeAreaInsets()

  // Show only the latest toast
  const toast = toasts[toasts.length - 1]

  if (!toast) return null

  return (
    <ToastItem
      key={toast.id}
      id={toast.id}
      message={toast.message}
      type={toast.type}
      topInset={insets.top}
      onDismiss={removeToast}
    />
  )
}

function ToastItem({
  id,
  message,
  type,
  topInset,
  onDismiss,
}: {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
  topInset: number
  onDismiss: (id: string) => void
}) {
  const reduceMotion = useReducedMotion()
  const translateY = useSharedValue(-100)
  const opacity = useSharedValue(0)

  useEffect(() => {
    if (reduceMotion) {
      translateY.value = 0
      opacity.value = 1
      // Auto-dismiss after 3s
      const timer = setTimeout(() => {
        translateY.value = -100
        opacity.value = 0
        onDismiss(id)
      }, 3000)
      return () => clearTimeout(timer)
    }

    translateY.value = withTiming(0, { duration: 300 })
    opacity.value = withTiming(1, { duration: 300 })

    // Auto-dismiss after 3s
    translateY.value = withDelay(3000, withTiming(-100, { duration: 300 }))
    opacity.value = withDelay(
      3000,
      withTiming(0, { duration: 300 }, () => {
        runOnJS(onDismiss)(id)
      })
    )
  }, [id, translateY, opacity, onDismiss, reduceMotion])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }))

  return (
    <Animated.View
      style={[{ position: 'absolute', top: topInset + 8, left: 16, right: 16, zIndex: 9999 }, animatedStyle]}
      className={`${TYPE_STYLES[type]} rounded-2xl px-4 py-3 shadow-lg shadow-black/30`}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Text className={`${TEXT_STYLES[type]} text-sm font-medium text-center`}>{message}</Text>
    </Animated.View>
  )
}
