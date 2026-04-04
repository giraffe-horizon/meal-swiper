import { useCallback, useMemo, useRef, useState } from 'react'
import { View, Text, Pressable, ScrollView, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import { Ionicons } from '@expo/vector-icons'
import CalendarView from '@/components/plan/CalendarView'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useWeekDates } from '@/hooks/useWeekDates'
import { useWeeklyPlan } from '@/hooks/useWeeklyPlan'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import type { DayKey, Meal } from '@/types'
import { DAY_NAMES_MAP } from '@/lib/utils'

export default function PlanScreen() {
  const router = useRouter()
  const token = useAuthStore((s) => s.token)
  const weekOffset = useUIStore((s) => s.weekOffset)
  const setWeekOffset = useUIStore((s) => s.setWeekOffset)

  const { weekKey } = useWeekDates(weekOffset)
  const { plan, isLoading, isError, refetch, removeMeal, toggleVacation } =
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
    return (
      <View className="flex-1 bg-background">
        <LoadingSpinner />
      </View>
    )
  }

  // Error
  if (isError) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-8">
        <Text className="text-on-surface text-lg font-bold text-center">Błąd ładowania</Text>
        <Text className="text-on-surface-variant text-sm text-center mt-2">
          Nie udało się pobrać planu. Sprawdź połączenie.
        </Text>
        <Pressable
          onPress={() => refetch()}
          className="bg-primary rounded-2xl px-6 py-3 mt-4"
          accessibilityRole="button"
          accessibilityLabel="Spróbuj ponownie"
        >
          <Text className="text-background font-bold">Spróbuj ponownie</Text>
        </Pressable>
      </View>
    )
  }

  // Check if plan has any meals
  const hasMeals = ['mon', 'tue', 'wed', 'thu', 'fri'].some(
    (day) => plan[day as DayKey] !== null
  )

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Header */}
        <View className="px-4 pt-4 pb-1">
          <Text
            className="text-on-surface text-2xl font-bold"
            accessibilityRole="header"
          >
            Plan tygodnia
          </Text>
        </View>

        <CalendarView
          weekKey={weekKey}
          weekOffset={weekOffset}
          plan={plan}
          onWeekChange={handleWeekChange}
          onDayPress={handleDayPress}
          onRemoveMeal={removeMeal}
          onToggleVacation={toggleVacation}
          onCook={handleCook}
        />

        {/* Empty state hint */}
        {!hasMeals && (
          <View className="items-center px-8 mt-6">
            <Ionicons name="heart-outline" size={40} color="#94B4A6" />
            <Text className="text-on-surface-variant text-sm text-center mt-3">
              Zaplanuj posiłki — przejdź do Swipe!
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Action sheet for day with meal */}
      <BottomSheet
        ref={actionSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: '#1a211e' }}
        handleIndicatorStyle={{ backgroundColor: '#94B4A6' }}
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
              <Ionicons name="restaurant-outline" size={20} color="#69dd96" />
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
              className="flex-row items-center gap-3 py-3 min-h-[48px] opacity-40"
              accessibilityRole="button"
              accessibilityLabel="Zamień posiłek — dostępne wkrótce"
              accessibilityState={{ disabled: true }}
            >
              <Ionicons name="swap-horizontal-outline" size={20} color="#94B4A6" />
              <Text className="text-on-surface-variant text-sm">Zamień posiłek (wkrótce)</Text>
            </Pressable>
          </View>
        )}
      </BottomSheet>
    </View>
  )
}
