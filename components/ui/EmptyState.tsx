import { View, Text, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/lib/colors'

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap
  message: string
  actionLabel?: string
  onAction?: () => void
}

export default function EmptyState({
  icon = 'document-text-outline',
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="items-center px-8 py-10">
      <Ionicons name={icon} size={48} color={colors.onSurfaceVariant} />
      <Text className="text-on-surface-variant text-sm text-center mt-3">{message}</Text>
      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          className="bg-primary rounded-2xl px-6 py-3 mt-4 min-h-[44px] items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text className="text-background font-bold">{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  )
}
