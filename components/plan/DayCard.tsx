import { View, Text, Pressable } from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import MealImagePlaceholder from '@/components/ui/MealImagePlaceholder'
import type { DayKey, Meal } from '@/types'
import { DAY_NAMES_MAP } from '@/lib/utils'

interface DayCardProps {
  day: DayKey
  date: Date
  meal: Meal | null
  isVacation: boolean
  onPress: () => void
  onRemove?: () => void
  onToggleVacation: () => void
  onCook: () => void
}

function formatDayDate(date: Date): string {
  return `${date.getDate()}.${String(date.getMonth() + 1).padStart(2, '0')}`
}

export default function DayCard({
  day,
  date,
  meal,
  isVacation,
  onPress,
  onRemove: _onRemove,
  onToggleVacation,
  onCook,
}: DayCardProps) {
  const dayName = DAY_NAMES_MAP[day] ?? day
  const dateStr = formatDayDate(date)

  // Vacation state
  if (isVacation) {
    return (
      <Pressable
        onPress={onToggleVacation}
        className="bg-surface-container rounded-2xl p-3 mb-2"
        accessibilityRole="button"
        accessibilityLabel={`${dayName} ${dateStr}, wolne. Dotknij aby anulować wolne`}
      >
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-on-surface-variant text-xs font-semibold">{dateStr}</Text>
            <Text className="text-on-surface text-sm font-bold">{dayName}</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Ionicons name="airplane-outline" size={16} color="#94B4A6" />
            <Text className="text-on-surface-variant text-sm line-through">Wolne</Text>
          </View>
        </View>
      </Pressable>
    )
  }

  // Meal assigned
  if (meal) {
    return (
      <Pressable
        onPress={onPress}
        className="bg-surface-container rounded-2xl p-3 mb-2"
        accessibilityRole="button"
        accessibilityLabel={`${dayName} ${dateStr}, ${meal.nazwa}. Dotknij aby zobaczyć opcje`}
      >
        <View className="flex-row items-center gap-3">
          {/* Meal image */}
          {meal.photo_url ? (
            <Image
              source={{ uri: meal.photo_url }}
              style={{ width: 56, height: 56, borderRadius: 12 }}
              contentFit="cover"
              transition={200}
              accessibilityLabel={`Zdjęcie: ${meal.nazwa}`}
            />
          ) : (
            <View
              className="bg-background rounded-xl items-center justify-center"
              style={{ width: 56, height: 56 }}
            >
              <MealImagePlaceholder size={32} />
            </View>
          )}

          {/* Info */}
          <View className="flex-1">
            <Text className="text-on-surface-variant text-xs font-semibold">
              {dayName} · {dateStr}
            </Text>
            <Text className="text-on-surface text-sm font-bold" numberOfLines={1}>
              {meal.nazwa}
            </Text>
            <View className="flex-row items-center gap-3 mt-0.5">
              <View className="flex-row items-center gap-1">
                <Ionicons name="flame-outline" size={12} color="#69dd96" />
                <Text className="text-primary text-xs">{meal.kcal_baza} kcal</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Ionicons name="barbell-outline" size={12} color="#94B4A6" />
                <Text className="text-on-surface-variant text-xs">{meal.bialko_baza}g</Text>
              </View>
            </View>
          </View>

          {/* Cook button */}
          <Pressable
            onPress={onCook}
            className="min-w-[44px] min-h-[44px] items-center justify-center rounded-xl bg-primary/15"
            accessibilityRole="button"
            accessibilityLabel={`Gotuj ${meal.nazwa}`}
          >
            <Ionicons name="restaurant-outline" size={20} color="#69dd96" />
          </Pressable>
        </View>
      </Pressable>
    )
  }

  // Empty state
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onToggleVacation}
      className="bg-surface-container/50 rounded-2xl p-3 mb-2 border border-dashed border-border-dark"
      accessibilityRole="button"
      accessibilityLabel={`${dayName} ${dateStr}, brak posiłku. Dotknij aby dodać lub przytrzymaj aby ustawić wolne`}
    >
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-on-surface-variant text-xs font-semibold">{dateStr}</Text>
          <Text className="text-on-surface text-sm font-bold">{dayName}</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Ionicons name="add-circle-outline" size={20} color="#94B4A6" />
          <Text className="text-on-surface-variant text-sm">Przeciągnij posiłek</Text>
        </View>
      </View>
    </Pressable>
  )
}
