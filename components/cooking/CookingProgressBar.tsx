import { View, Text } from 'react-native'

interface CookingProgressBarProps {
  completed: number
  total: number
}

export default function CookingProgressBar({ completed, total }: CookingProgressBarProps) {
  const progress = total > 0 ? completed / total : 0

  return (
    <View
      className="px-4 py-2"
      accessibilityRole="progressbar"
      accessibilityLabel={`Postęp: ${completed} z ${total} kroków`}
      accessibilityValue={{ min: 0, max: total, now: completed }}
    >
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-on-surface-variant text-xs">Postęp</Text>
        <Text className="text-primary text-xs font-semibold">
          {completed}/{total}
        </Text>
      </View>
      <View className="h-2 bg-surface-container rounded-full overflow-hidden">
        <View
          className="h-full bg-primary rounded-full"
          style={{ width: `${progress * 100}%` }}
        />
      </View>
    </View>
  )
}
