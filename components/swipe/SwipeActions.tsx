import { View, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

export interface SwipeActionsProps {
  onNope: () => void
  onInfo: () => void
  onLike: () => void
  disabled?: boolean
}

export default function SwipeActions({ onNope, onInfo, onLike, disabled = false }: SwipeActionsProps) {
  return (
    <View className="flex-row items-center justify-center gap-6 py-4">
      {/* Nope / Skip */}
      <Pressable
        onPress={onNope}
        disabled={disabled}
        className="w-14 h-14 rounded-full border-2 border-red-500 items-center justify-center"
        style={{ opacity: disabled ? 0.4 : 1 }}
        accessibilityRole="button"
        accessibilityLabel="Pomiń posiłek"
        accessibilityState={{ disabled }}
      >
        <Ionicons name="close-outline" size={28} color="#ef4444" />
      </Pressable>

      {/* Info / Details */}
      <Pressable
        onPress={onInfo}
        disabled={disabled}
        className="w-12 h-12 rounded-full border-2 border-on-surface-variant items-center justify-center"
        style={{ opacity: disabled ? 0.4 : 1 }}
        accessibilityRole="button"
        accessibilityLabel="Szczegóły posiłku"
        accessibilityState={{ disabled }}
      >
        <Ionicons name="information-outline" size={24} color="#94B4A6" />
      </Pressable>

      {/* Like / Add to plan */}
      <Pressable
        onPress={onLike}
        disabled={disabled}
        className="w-14 h-14 rounded-full bg-primary items-center justify-center"
        style={{ opacity: disabled ? 0.4 : 1 }}
        accessibilityRole="button"
        accessibilityLabel="Dodaj do planu"
        accessibilityState={{ disabled }}
      >
        <Ionicons name="heart" size={28} color="#0e1512" />
      </Pressable>
    </View>
  )
}
