import { useState, useCallback, useMemo } from 'react'
import { View, Text, Pressable, ScrollView } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useKeepAwake } from 'expo-keep-awake'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import CookingHero from '@/components/cooking/CookingHero'
import CookingProgressBar from '@/components/cooking/CookingProgressBar'
import IngredientSection from '@/components/cooking/IngredientSection'
import RecipeSteps from '@/components/cooking/RecipeSteps'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useMealsWithVariantsQuery } from '@/hooks/queries/useMealsWithVariantsQuery'
import { useSettingsQuery } from '@/hooks/queries/useSettingsQuery'
import { useAuthStore } from '@/stores/auth'
import { colors } from '@/lib/colors'
import { parseRecipe } from '@/lib/recipe'
import { toMealForModal } from '@/lib/meal-convert'
import { scaleIngredient, computeScaleFactor } from '@/lib/scaling'
import type { Ingredient } from '@/types'

export default function CookScreen() {
  useKeepAwake()

  const { mealId } = useLocalSearchParams<{ mealId: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const token = useAuthStore((s) => s.token)

  const mealsQuery = useMealsWithVariantsQuery()
  const settingsQuery = useSettingsQuery(token)

  const mealWithVariants = useMemo(
    () => mealsQuery.data?.find((m) => m.id === mealId) ?? null,
    [mealsQuery.data, mealId]
  )

  // Parse recipe from legacy Meal format (memoized to avoid unstable references)
  const parsedRecipe = useMemo(() => {
    if (!mealWithVariants) return null
    const legacy = toMealForModal(mealWithVariants)
    return parseRecipe(legacy)
  }, [mealWithVariants])

  // Scale ingredients
  const persons = settingsQuery.data?.persons ?? []
  const scaleFactor = computeScaleFactor(persons)

  const scaledBaseIngredients: Ingredient[] = useMemo(
    () => (parsedRecipe?.baseIngredients ?? []).map((ing) => scaleIngredient(ing, scaleFactor)),
    [parsedRecipe, scaleFactor]
  )

  const scaledMeatIngredients: Ingredient[] = useMemo(
    () => (parsedRecipe?.meatIngredients ?? []).map((ing) => scaleIngredient(ing, scaleFactor)),
    [parsedRecipe, scaleFactor]
  )

  // Per-variant ingredients (from MealWithVariants)
  const variantSections = useMemo(() => {
    if (!mealWithVariants) return []
    return mealWithVariants.variants
      .filter((v) => v.ingredients && v.ingredients.length > 0)
      .map((variant) => ({
        title: variant.name,
        ingredients: (variant.ingredients ?? []).map((vi) => ({
          name: vi.ingredient?.name ?? `Składnik ${vi.ingredient_id}`,
          amount: vi.display_amount,
        }))
      }))
  }, [mealWithVariants])

  // Recipe step state
  const steps = parsedRecipe?.steps ?? []
  const tips = parsedRecipe?.tips ?? ''
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({})
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({})

  const completedCount = Object.values(completedSteps).filter(Boolean).length

  const handleToggleStep = useCallback((index: number) => {
    setCompletedSteps((prev) => ({ ...prev, [index]: !prev[index] }))
  }, [])

  const handleToggleIngredient = useCallback((name: string) => {
    setCheckedIngredients((prev) => ({ ...prev, [name]: !prev[name] }))
  }, [])

  // Loading
  if (mealsQuery.isLoading || settingsQuery.isLoading) {
    return (
      <View className="flex-1 bg-background">
        <LoadingSpinner />
      </View>
    )
  }

  // Not found
  if (!mealWithVariants) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-8">
        <Text className="text-on-surface text-lg font-bold">Nie znaleziono posiłku</Text>
        <Pressable
          onPress={() => router.back()}
          className="bg-primary rounded-2xl px-6 py-3 mt-4"
          accessibilityRole="button"
          accessibilityLabel="Wróć do planu"
        >
          <Text className="text-background font-bold">Wróć do planu</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-background">
      {/* Back button (overlaid) */}
      <Pressable
        onPress={() => router.back()}
        className="absolute top-0 left-4 z-10 min-w-[44px] min-h-[44px] items-center justify-center rounded-full bg-background/70"
        style={{ marginTop: insets.top + 4 }}
        accessibilityRole="button"
        accessibilityLabel="Wróć do planu"
      >
        <Ionicons name="arrow-back" size={22} color={colors.onSurface} />
      </Pressable>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Hero image */}
        <CookingHero
          photoUrl={mealWithVariants.photo_url || null}
          title={mealWithVariants.nazwa}
        />

        {/* Info row */}
        <View className="flex-row items-center gap-4 px-4 py-3">
          {mealWithVariants.prep_time > 0 && (
            <View className="flex-row items-center gap-1">
              <Ionicons name="time-outline" size={16} color={colors.onSurfaceVariant} />
              <Text className="text-on-surface-variant text-sm">
                {mealWithVariants.prep_time} min
              </Text>
            </View>
          )}
          {mealWithVariants.trudnosc ? (
            <View className="flex-row items-center gap-1">
              <Ionicons name="speedometer-outline" size={16} color={colors.onSurfaceVariant} />
              <Text className="text-on-surface-variant text-sm">{mealWithVariants.trudnosc}</Text>
            </View>
          ) : null}
          {mealWithVariants.kuchnia ? (
            <View className="flex-row items-center gap-1">
              <Ionicons name="globe-outline" size={16} color={colors.onSurfaceVariant} />
              <Text className="text-on-surface-variant text-sm">{mealWithVariants.kuchnia}</Text>
            </View>
          ) : null}
          {mealWithVariants.variants[0] && (
            <View className="flex-row items-center gap-1">
              <Ionicons name="flame-outline" size={16} color={colors.primary} />
              <Text className="text-primary text-sm font-semibold">
                {mealWithVariants.variants[0].kcal} kcal
              </Text>
            </View>
          )}
        </View>

        {/* Progress bar */}
        {steps.length > 0 && (
          <CookingProgressBar completed={completedCount} total={steps.length} />
        )}

        {/* Ingredients — variant sections */}
        {variantSections.length > 0 && (
          <View className="mt-4">
            <Text className="text-on-surface text-lg font-bold px-4 mb-2" accessibilityRole="header">
              Składniki
            </Text>
            {variantSections.map((section) => (
              <IngredientSection
                key={section.title}
                title={section.title}
                ingredients={section.ingredients}
                checkedItems={checkedIngredients}
                onToggle={handleToggleIngredient}
              />
            ))}
          </View>
        )}

        {/* Ingredients — legacy base + meat (fallback when no variants with ingredients) */}
        {variantSections.length === 0 && (scaledBaseIngredients.length > 0 || scaledMeatIngredients.length > 0) && (
          <View className="mt-4">
            <Text className="text-on-surface text-lg font-bold px-4 mb-2" accessibilityRole="header">
              Składniki
            </Text>
            <IngredientSection
              title="Bazowe"
              ingredients={scaledBaseIngredients}
              checkedItems={checkedIngredients}
              onToggle={handleToggleIngredient}
            />
            <IngredientSection
              title="Mięsne"
              ingredients={scaledMeatIngredients}
              checkedItems={checkedIngredients}
              onToggle={handleToggleIngredient}
            />
          </View>
        )}

        {/* Recipe steps */}
        <View className="mt-4">
          <RecipeSteps
            steps={steps}
            tips={tips}
            completedSteps={completedSteps}
            onToggleStep={handleToggleStep}
          />
        </View>
      </ScrollView>
    </View>
  )
}
