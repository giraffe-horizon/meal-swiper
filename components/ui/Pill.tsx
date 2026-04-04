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
        active ? 'bg-primary' : 'bg-surface-container'
      } ${className}`}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
    >
      <Text
        className={`text-sm font-medium ${
          active ? 'text-background' : 'text-on-surface-variant'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  )
}
