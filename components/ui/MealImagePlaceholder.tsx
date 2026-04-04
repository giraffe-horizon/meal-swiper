import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface MealImagePlaceholderProps {
  size?: number
  className?: string
}

export default function MealImagePlaceholder({
  size = 64,
  className = '',
}: MealImagePlaceholderProps) {
  return (
    <View
      className={`bg-surface-container rounded-2xl items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      accessibilityRole="image"
      accessibilityLabel="Brak zdjęcia posiłku"
    >
      <Ionicons name="restaurant-outline" size={size * 0.4} color="#94B4A6" />
    </View>
  )
}
