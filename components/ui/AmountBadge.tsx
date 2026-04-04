import { View, Text } from 'react-native'

interface AmountBadgeProps {
  value: number | string
  unit: string
  className?: string
}

export default function AmountBadge({ value, unit, className = '' }: AmountBadgeProps) {
  return (
    <View
      className={`bg-surface-container rounded-full px-3 py-1 flex-row items-center ${className}`}
      accessibilityRole="text"
      accessibilityLabel={`${value} ${unit}`}
    >
      <Text className="text-[#69dd96] text-xs font-bold">{value}</Text>
      <Text className="text-[#94B4A6] text-xs ml-1">{unit}</Text>
    </View>
  )
}
