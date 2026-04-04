import { Pressable, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

export interface FridgeModeFilterProps {
  active: boolean
  onToggle: () => void
}

export default function FridgeModeFilter({ active, onToggle }: FridgeModeFilterProps) {
  return (
    <Pressable
      onPress={onToggle}
      className={`flex-row items-center gap-1.5 rounded-full px-3 py-1 ${
        active ? 'bg-primary' : 'bg-surface-container'
      }`}
      accessibilityRole="button"
      accessibilityLabel="Tryb lodówki"
      accessibilityState={{ selected: active }}
      accessibilityHint="Filtruj posiłki do tych które możesz zrobić ze składników w lodówce"
    >
      <Ionicons
        name="snow-outline"
        size={14}
        color={active ? '#0e1512' : '#94B4A6'}
      />
      <Text
        className={`text-sm font-medium ${
          active ? 'text-background' : 'text-on-surface-variant'
        }`}
      >
        Lodówka
      </Text>
    </Pressable>
  )
}
