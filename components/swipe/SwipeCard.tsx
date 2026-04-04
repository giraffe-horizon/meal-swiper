import { Pressable, Text, View } from 'react-native'
import { GestureDetector } from 'react-native-gesture-handler'
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import MealImagePlaceholder from '@/components/ui/MealImagePlaceholder'
import CompatibilityIndicator from '@/components/swipe/CompatibilityIndicator'
import type { MealWithVariants, PersonSettings } from '@/types'
import type { SwipeGesturesResult } from '@/hooks/useSwipeGestures'

export interface SwipeCardProps {
  meal: MealWithVariants
  persons: PersonSettings[]
  gestureResult: SwipeGesturesResult
  onPress: () => void
  isTop: boolean
}

function DifficultyIcon({ trudnosc }: { trudnosc: string }) {
  const color =
    trudnosc === 'łatwe' ? '#69dd96' : trudnosc === 'średnie' ? '#eab308' : '#ef4444'
  return <Ionicons name="flame-outline" size={12} color={color} />
}

function OpacityBadge({
  label,
  color,
  opacity,
  side,
}: {
  label: string
  color: string
  opacity: SharedValue<number>
  side: 'left' | 'right'
}) {
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  return (
    <Animated.View
      style={[style]}
      className={`absolute top-6 ${side === 'right' ? 'right-4' : 'left-4'} z-10 rounded-lg border-2 px-3 py-1`}
      pointerEvents="none"
      // @ts-expect-error — NativeWind className merging with border color
      borderColor={color}
    >
      <Text style={{ color, fontSize: 20, fontWeight: '800', letterSpacing: 2 }}>{label}</Text>
    </Animated.View>
  )
}

export default function SwipeCard({
  meal,
  persons,
  gestureResult,
  onPress,
  isTop,
}: SwipeCardProps) {
  const { gesture, animatedStyle, likeOpacity, nopeOpacity } = gestureResult

  const defaultVariant = meal.variants.find((v) => v.is_default) || meal.variants[0]
  const kcal = defaultVariant?.kcal ?? 0
  const protein = defaultVariant?.protein ?? 0

  const card = (
    <Animated.View
      style={isTop ? [animatedStyle] : undefined}
      className="w-full bg-surface-container rounded-3xl overflow-hidden shadow-lg shadow-black/30"
      accessibilityLabel={meal.nazwa}
      accessibilityHint="Przesuń w prawo aby dodać do planu, w lewo aby pominąć"
      accessibilityActions={[
        { name: 'like', label: 'Dodaj do planu' },
        { name: 'skip', label: 'Pomiń' },
        { name: 'details', label: 'Szczegóły' },
      ]}
      onAccessibilityAction={(event) => {
        switch (event.nativeEvent.actionName) {
          case 'like':
            gestureResult.animateSwipe('right')
            break
          case 'skip':
            gestureResult.animateSwipe('left')
            break
          case 'details':
            onPress()
            break
        }
      }}
    >
      {/* LIKE badge */}
      <OpacityBadge label="LIKE" color="#69dd96" opacity={likeOpacity} side="right" />
      {/* NOPE badge */}
      <OpacityBadge label="NOPE" color="#ef4444" opacity={nopeOpacity} side="left" />

      {/* Image */}
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Otwórz szczegóły: ${meal.nazwa}`}>
        {meal.photo_url ? (
          <Image
            source={{ uri: meal.photo_url }}
            style={{ width: '100%', height: 280 }}
            contentFit="cover"
            transition={200}
            accessibilityLabel={`Zdjęcie posiłku: ${meal.nazwa}`}
          />
        ) : (
          <View className="w-full items-center justify-center bg-surface-container" style={{ height: 280 }}>
            <MealImagePlaceholder size={120} />
          </View>
        )}
      </Pressable>

      {/* Content */}
      <View className="p-4 gap-2">
        {/* Title row */}
        <View className="flex-row items-center justify-between">
          <Text className="text-on-surface text-xl font-bold flex-1 mr-2" numberOfLines={1}>
            {meal.nazwa}
          </Text>
          <CompatibilityIndicator meal={meal} persons={persons} />
        </View>

        {/* Description */}
        {meal.opis ? (
          <Text className="text-on-surface-variant text-sm" numberOfLines={2}>
            {meal.opis}
          </Text>
        ) : null}

        {/* Badges row */}
        <View className="flex-row items-center gap-3 mt-1">
          {/* Kcal */}
          <View className="flex-row items-center gap-1">
            <Ionicons name="flame-outline" size={14} color="#69dd96" />
            <Text className="text-primary text-xs font-semibold">{kcal} kcal</Text>
          </View>

          {/* Protein */}
          <View className="flex-row items-center gap-1">
            <Ionicons name="barbell-outline" size={14} color="#94B4A6" />
            <Text className="text-on-surface-variant text-xs font-semibold">{protein}g</Text>
          </View>

          {/* Prep time */}
          {meal.prep_time > 0 && (
            <View className="flex-row items-center gap-1">
              <Ionicons name="time-outline" size={14} color="#94B4A6" />
              <Text className="text-on-surface-variant text-xs">{meal.prep_time} min</Text>
            </View>
          )}

          {/* Difficulty */}
          {meal.trudnosc ? (
            <View className="flex-row items-center gap-1">
              <DifficultyIcon trudnosc={meal.trudnosc} />
              <Text className="text-on-surface-variant text-xs">{meal.trudnosc}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Animated.View>
  )

  if (isTop) {
    return <GestureDetector gesture={gesture}>{card}</GestureDetector>
  }

  return card
}
