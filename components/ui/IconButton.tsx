import { Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap
  onPress: () => void
  size?: number
  color?: string
  accessibilityLabel: string
  className?: string
}

export default function IconButton({
  icon,
  onPress,
  size = 24,
  color = '#dde4df',
  accessibilityLabel,
  className = '',
}: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`min-w-[44px] min-h-[44px] items-center justify-center rounded-full ${className}`}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Ionicons name={icon} size={size} color={color} />
    </Pressable>
  )
}
