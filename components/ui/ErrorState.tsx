import { View, Text, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/lib/colors'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export default function ErrorState({
  message = 'Nie udało się pobrać danych. Sprawdź połączenie.',
  onRetry,
}: ErrorStateProps) {
  return (
    <View
      className="flex-1 bg-background items-center justify-center px-8"
      accessibilityRole="alert"
    >
      <Ionicons name="alert-circle-outline" size={48} color={colors.onSurfaceVariant} />
      <Text className="text-on-surface text-lg font-bold text-center mt-3">Błąd ładowania</Text>
      <Text className="text-on-surface-variant text-sm text-center mt-2">{message}</Text>
      {onRetry && (
        <Pressable
          onPress={onRetry}
          className="bg-primary rounded-2xl px-6 py-3 mt-4 min-h-[44px] items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="Spróbuj ponownie"
        >
          <Text className="text-background font-bold">Spróbuj ponownie</Text>
        </Pressable>
      )}
    </View>
  )
}
