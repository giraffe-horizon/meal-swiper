import { Pressable, Text } from 'react-native'

interface PillProps {
  label: string
  active?: boolean
  onPress?: () => void
  className?: string
}

export default function Pill({ label, active = false, onPress, className = '' }: PillProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className={`rounded-full px-3 py-1 ${
        active ? 'bg-[#69dd96]' : 'bg-surface-container'
      } ${className}`}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
    >
      <Text
        className={`text-sm font-medium ${
          active ? 'text-[#0e1512]' : 'text-[#94B4A6]'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  )
}
