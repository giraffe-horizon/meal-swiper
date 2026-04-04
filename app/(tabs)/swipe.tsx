import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, Pressable, BackHandler, Platform } from 'react-native'
import { useNavigation } from 'expo-router'
import SwipeStack, { type SwipeStackHandle } from '@/components/swipe/SwipeStack'
import SwipeActions from '@/components/swipe/SwipeActions'
import CategoryFilter from '@/components/swipe/CategoryFilter'
import FridgeModeFilter from '@/components/swipe/FridgeModeFilter'
import MealModal from '@/components/MealModal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import DaySelector from '@/components/ui/DaySelector'
import { useMealsWithVariantsQuery } from '@/hooks/queries/useMealsWithVariantsQuery'
import { useCuisinesQuery } from '@/hooks/queries/useCuisinesQuery'
import { useSettingsQuery } from '@/hooks/queries/useSettingsQuery'
import { useWeekDates } from '@/hooks/useWeekDates'
import { useWeeklyPlan } from '@/hooks/useWeeklyPlan'
import { useSwipeStore } from '@/stores/swipe'
import { useUIStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { filterMealsByPreferences } from '@/lib/meal-filter'
import { toMealForModal } from '@/lib/meal-convert'
import { DAY_KEYS, DAY_NAMES_MAP } from '@/lib/utils'
import type { DayKey, MealWithVariants } from '@/types'

export default function SwipeScreen() {
  const navigation = useNavigation()
  const token = useAuthStore((s) => s.token)
  const swipeStackRef = useRef<SwipeStackHandle>(null)

  // Queries
  const mealsQuery = useMealsWithVariantsQuery()
  const cuisinesQuery = useCuisinesQuery()
  const settingsQuery = useSettingsQuery(token)

  // Stores
  const { seenIds, addSeenId, currentDay, setCurrentDay } = useSwipeStore()
  const { activeFilters, setActiveFilters, weekOffset, addToast } = useUIStore()

  // Plan integration
  const { weekKey } = useWeekDates(weekOffset)
  const { plan, setMeal } = useWeeklyPlan(weekKey, token)

  // Local state
  const [modalMeal, setModalMeal] = useState<MealWithVariants | null>(null)
  const [fridgeMode, setFridgeMode] = useState(false)

  // Cuisine filter (single-select from activeFilters)
  const activeCuisineFilter = activeFilters.length > 0 ? activeFilters[0] : null

  const handleCuisineFilterChange = useCallback(
    (filter: string | null) => {
      setActiveFilters(filter ? [filter] : [])
    },
    [setActiveFilters]
  )

  // Filter meals by household preferences
  const persons = settingsQuery.data?.persons ?? []

  const filteredMeals = useMemo(() => {
    const allMeals = mealsQuery.data ?? []
    if (allMeals.length === 0) return []

    // Filter by household preferences (diet, excluded ingredients, cuisine score)
    const result = filterMealsByPreferences(allMeals, { persons })

    let meals = result.results

    // Filter by cuisine
    if (activeCuisineFilter) {
      meals = meals.filter((fm) => fm.meal.kuchnia === activeCuisineFilter)
    }

    // TODO: fridgeMode filtering will use lib/fridge.ts but requires ingredient data which is Phase 3+

    // Filter out seen meals
    const seenSet = new Set(seenIds)
    meals = meals.filter((fm) => !seenSet.has(fm.meal.id))

    return meals
  }, [mealsQuery.data, persons, activeCuisineFilter, seenIds])

  // Extract just the MealWithVariants for SwipeStack
  const stackMeals = useMemo(() => filteredMeals.map((fm) => fm.meal), [filteredMeals])

  // Find next empty day helper
  const findNextEmptyDay = useCallback(
    (startDay: DayKey): DayKey | null => {
      const startIdx = DAY_KEYS.indexOf(startDay)
      for (let i = 0; i < DAY_KEYS.length; i++) {
        const idx = (startIdx + i) % DAY_KEYS.length
        const day = DAY_KEYS[idx]
        const freeKey = `${day}_free` as `${DayKey}_free`
        if (!plan[day] && !plan[freeKey]) return day
      }
      return null
    },
    [plan]
  )

  // Swipe handlers
  const handleSwipeRight = useCallback(
    (meal: MealWithVariants) => {
      addSeenId(meal.id)

      // Save to plan
      const mealForPlan = toMealForModal(meal)
      setMeal(currentDay, mealForPlan)
      addToast({
        message: `Dodano ${meal.nazwa} na ${DAY_NAMES_MAP[currentDay]}!`,
        type: 'success',
      })

      // Advance to next empty day
      const nextIdx = DAY_KEYS.indexOf(currentDay) + 1
      const nextDay = nextIdx < DAY_KEYS.length ? DAY_KEYS[nextIdx] : null
      const emptyDay = nextDay ? findNextEmptyDay(nextDay) : findNextEmptyDay(DAY_KEYS[0])
      if (emptyDay) {
        setCurrentDay(emptyDay)
      } else {
        addToast({ message: 'Plan pełny!', type: 'info' })
      }
    },
    [addSeenId, currentDay, setMeal, setCurrentDay, addToast, findNextEmptyDay]
  )

  const handleSwipeLeft = useCallback(
    (meal: MealWithVariants) => {
      addSeenId(meal.id)
    },
    [addSeenId]
  )

  const handleCardPress = useCallback((meal: MealWithVariants) => {
    setModalMeal(meal)
  }, [])

  const handleAddToPlan = useCallback(
    (meal: MealWithVariants) => {
      addSeenId(meal.id)
      setModalMeal(null)

      const mealForPlan = toMealForModal(meal)
      setMeal(currentDay, mealForPlan)
      addToast({
        message: `Dodano ${meal.nazwa} na ${DAY_NAMES_MAP[currentDay]}!`,
        type: 'success',
      })

      // Advance to next empty day
      const nextIdx = DAY_KEYS.indexOf(currentDay) + 1
      const nextDay = nextIdx < DAY_KEYS.length ? DAY_KEYS[nextIdx] : null
      const emptyDay = nextDay ? findNextEmptyDay(nextDay) : findNextEmptyDay(DAY_KEYS[0])
      if (emptyDay) {
        setCurrentDay(emptyDay)
      } else {
        addToast({ message: 'Plan pełny!', type: 'info' })
      }
    },
    [addSeenId, currentDay, setMeal, setCurrentDay, addToast, findNextEmptyDay]
  )

  // Disable iOS swipe-back on this screen
  useEffect(() => {
    navigation.setOptions?.({ gestureEnabled: false })
  }, [navigation])

  // Android BackHandler — intercept back press
  useEffect(() => {
    if (Platform.OS !== 'android') return

    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      // If modal is open, close it
      if (modalMeal) {
        setModalMeal(null)
        return true
      }
      // Otherwise let default behavior (don't exit app from swipe tab)
      return false
    })

    return () => handler.remove()
  }, [modalMeal])

  // Loading state
  if (mealsQuery.isLoading) {
    return (
      <View className="flex-1 bg-background">
        <LoadingSpinner />
      </View>
    )
  }

  // Error state
  if (mealsQuery.isError) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-8">
        <Text className="text-on-surface text-lg font-bold text-center">Błąd ładowania</Text>
        <Text className="text-on-surface-variant text-sm text-center mt-2">
          Nie udało się pobrać posiłków. Sprawdź połączenie.
        </Text>
        <Pressable
          onPress={() => mealsQuery.refetch()}
          className="bg-primary rounded-2xl px-6 py-3 mt-4"
          accessibilityRole="button"
          accessibilityLabel="Spróbuj ponownie"
        >
          <Text className="text-background font-bold">Spróbuj ponownie</Text>
        </Pressable>
      </View>
    )
  }

  const cuisines = (cuisinesQuery.data as string[] | undefined) ?? []

  return (
    <View className="flex-1 bg-background">
      {/* Day selector — which day are we swiping for? */}
      <View className="px-4 pt-3 pb-1">
        <DaySelector activeDay={currentDay} onSelect={setCurrentDay} />
      </View>

      {/* Filters row */}
      <View className="flex-row items-center gap-2 pt-2 pb-2">
        <View className="flex-1">
          <CategoryFilter
            cuisines={cuisines}
            activeFilter={activeCuisineFilter}
            onFilterChange={handleCuisineFilterChange}
          />
        </View>
        <View className="pr-4">
          <FridgeModeFilter active={fridgeMode} onToggle={() => setFridgeMode(!fridgeMode)} />
        </View>
      </View>

      {/* Card stack */}
      <SwipeStack
        ref={swipeStackRef}
        meals={stackMeals}
        persons={persons}
        onSwipeRight={handleSwipeRight}
        onSwipeLeft={handleSwipeLeft}
        onCardPress={handleCardPress}
      />

      {/* Action buttons — primary a11y path */}
      <SwipeActions
        onNope={() => swipeStackRef.current?.swipe('left')}
        onInfo={() => {
          if (stackMeals[0]) handleCardPress(stackMeals[0])
        }}
        onLike={() => swipeStackRef.current?.swipe('right')}
        disabled={stackMeals.length === 0}
      />

      {/* Meal detail modal */}
      <MealModal
        meal={modalMeal}
        visible={modalMeal !== null}
        onClose={() => setModalMeal(null)}
        onAddToPlan={handleAddToPlan}
      />
    </View>
  )
}
