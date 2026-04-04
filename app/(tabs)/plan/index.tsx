import { useCallback, useMemo, useRef, useState } from 'react'
import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import { Ionicons } from '@expo/vector-icons'
import CalendarView from '@/components/plan/CalendarView'
import SkeletonPlan from '@/components/ui/SkeletonPlan'
import ErrorState from '@/components/ui/ErrorState'
import EmptyState from '@/components/ui/EmptyState'
import { useWeekDates } from '@/hooks/useWeekDates'
import { useWeeklyPlan } from '@/hooks/useWeeklyPlan'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import { colors } from '@/lib/colors'
import type { DayKey, Meal } from '@/types'
import { DAY_KEYS, DAY_NAMES_MAP } from '@/lib/utils'

export default function PlanScreen() {
  const router = useRouter()
  const token = useAuthStore((s) => s.token)
  const weekOffset = useUIStore((s) => s.weekOffset)
  const setWeekOffset = useUIStore((s) => s.setWeekOffset)

  const { weekKey } = useWeekDates(weekOffset)
  const { plan, isLoading, isError, refetch, removeMeal, toggleVacation, isSaving } =
    useWeeklyPlan(weekKey, token)

  // Action sheet state
  const [selectedDay, setSelectedDay] = useState<DayKey | null>(null)
  const actionSheetRef = useRef<BottomSheet>(null)
  const snapPoints = useMemo(() => [220], [])

  const selectedMeal = selectedDay ? (plan[selectedDay] as Meal | null) : null

  const handleDayPress = useCallback(
    (day: DayKey) => {
      const meal = plan[day] as Meal | null
      if (meal) {
        setSelectedDay(day)
        actionSheetRef.current?.snapToIndex(0)
      }
      // Empty day — no action (user swipes meals to assign)
    },
    [plan]
  )

  const handleCloseSheet = useCallback(() => {
    actionSheetRef.current?.close()
    setSelectedDay(null)
  }, [])

  const handleCook = useCallback(
    (day: DayKey, mealId: string) => {
      handleCloseSheet()
      router.push(`/plan/cook/${mealId}`)
    },
    [router, handleCloseSheet]
  )

  const handleRemoveMeal = useCallback(() => {
    if (!selectedDay) return
    const meal = plan[selectedDay] as Meal | null
    Alert.alert(
      'Usuń posiłek',
      `Czy na pewno chcesz usunąć "${meal?.nazwa}" z planu?`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: () => {
            removeMeal(selectedDay)
            handleCloseSheet()
          },
        },
      ]
    )
  }, [selectedDay, plan, removeMeal, handleCloseSheet])

  const handleWeekChange = useCallback(
    (offset: number) => {
      setWeekOffset(offset)
    },
    [setWeekOffset]
  )

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    []
  )

  // Loading
  if (isLoading) {
    return <SkeletonPlan />
  }

  // Error
  if (isError) {
    return (
      <ErrorState
        message="Nie udało się pobrać planu. Sprawdź połączenie."
        onRetry={() => refetch()}
      />
    )
  }

  // Check if plan has any meals
  const hasMeals = DAY_KEYS.some((day) => plan[day] !== null)

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Header */}
        <View className="px-4 pt-4 pb-1 flex-row items-center gap-2">
          <Text
            className="text-on-surface text-2xl font-bold"
            accessibilityRole="header"
          >
            Plan tygodnia
          </Text>
          {isSaving && (
            <ActivityIndicator size="small" color={colors.primary} accessibilityLabel="Zapisywanie" />
          )}
        </View>

        <CalendarView
          weekOffset={weekOffset}
          plan={plan}
          onWeekChange={handleWeekChange}
          onDayPress={handleDayPress}
          onToggleVacation={toggleVacation}
          onCook={handleCook}
        />

        {/* Empty state hint */}
        {!hasMeals && (
          <EmptyState
            icon="heart-outline"
            message="Zaplanuj posiłki — przejdź do Swipe!"
          />
        )}
      </ScrollView>

      {/* Action sheet for day with meal */}
      <BottomSheet
        ref={actionSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: colors.surfaceContainer }}
        handleIndicatorStyle={{ backgroundColor: colors.onSurfaceVariant }}
        onChange={(index) => {
          if (index === -1) setSelectedDay(null)
        }}
      >
        {selectedDay && selectedMeal && (
          <View className="px-4 pt-2 gap-1">
            <Text className="text-on-surface text-base font-bold mb-3">
              {DAY_NAMES_MAP[selectedDay]} — {selectedMeal.nazwa}
            </Text>

            <Pressable
              onPress={() => handleCook(selectedDay, selectedMeal.id)}
              className="flex-row items-center gap-3 py-3 min-h-[48px]"
              accessibilityRole="button"
              accessibilityLabel="Pokaż przepis"
            >
              <Ionicons name="restaurant-outline" size={20} color={colors.primary} />
              <Text className="text-on-surface text-sm">Pokaż przepis</Text>
            </Pressable>

            <Pressable
              onPress={handleRemoveMeal}
              className="flex-row items-center gap-3 py-3 min-h-[48px]"
              accessibilityRole="button"
              accessibilityLabel="Usuń posiłek"
            >
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
              <Text className="text-red-400 text-sm">Usuń posiłek</Text>
            </Pressable>

            <Pressable
              disabled
              className="flex-row items-center gap-3 py-3 min-h-[48px] opacity-40"
              accessibilityRole="button"
              accessibilityLabel="Zamień posiłek — dostępne wkrótce"
              accessibilityState={{ disabled: true }}
            >
              <Ionicons name="swap-horizontal-outline" size={20} color={colors.onSurfaceVariant} />
              <Text className="text-on-surface-variant text-sm">Zamień posiłek (wkrótce)</Text>
            </Pressable>
          </View>
        )}
      </BottomSheet>
    </View>
  )
}
