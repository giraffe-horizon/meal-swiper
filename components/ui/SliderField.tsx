import { View, Text, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface SliderFieldProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  className?: string
}

export default function SliderField({
  label,
  value,
  min,
  max,
  step,
  onChange,
  className = '',
}: SliderFieldProps) {
  const ratio = max > min ? (value - min) / (max - min) : 0

  function decrement() {
    const next = Math.max(min, value - step)
    onChange(next)
  }

  function increment() {
    const next = Math.min(max, value + step)
    onChange(next)
  }

  return (
    <View
      className={`mb-4 ${className}`}
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min, max, now: value }}
      onAccessibilityAction={(event) => {
        switch (event.nativeEvent.actionName) {
          case 'increment':
            increment()
            break
          case 'decrement':
            decrement()
            break
        }
      }}
      accessible
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
    >
      <View className="flex-row justify-between mb-2">
        <Text className="text-on-surface-variant text-sm">{label}</Text>
        <Text className="text-on-surface text-sm font-medium">{value}</Text>
      </View>
      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={decrement}
          disabled={value <= min}
          className="min-w-[44px] min-h-[44px] items-center justify-center rounded-full bg-surface-container"
          accessibilityRole="button"
          accessibilityLabel={`Zmniejsz ${label}`}
        >
          <Ionicons name="remove" size={20} color={value <= min ? '#24332D' : '#dde4df'} />
        </Pressable>
        <View className="flex-1 h-2 bg-[#24332D] rounded-full overflow-hidden">
          <View
            className="h-full bg-primary rounded-full"
            style={{ width: `${ratio * 100}%` }}
          />
        </View>
        <Pressable
          onPress={increment}
          disabled={value >= max}
          className="min-w-[44px] min-h-[44px] items-center justify-center rounded-full bg-surface-container"
          accessibilityRole="button"
          accessibilityLabel={`Zwiększ ${label}`}
        >
          <Ionicons name="add" size={20} color={value >= max ? '#24332D' : '#dde4df'} />
        </Pressable>
      </View>
    </View>
  )
}
