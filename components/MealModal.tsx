import { useCallback, useEffect, useRef, useMemo } from 'react'
import { View, Text, Pressable } from 'react-native'
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import MealImagePlaceholder from '@/components/ui/MealImagePlaceholder'
import type { MealWithVariants, RecipeStep } from '@/types'

export interface MealModalProps {
  meal: MealWithVariants | null
  visible: boolean
  onClose: () => void
  onAddToPlan: (meal: MealWithVariants) => void
}

function parseRecipeSteps(przepis: string): RecipeStep | null {
  try {
    return JSON.parse(przepis) as RecipeStep
  } catch {
    return null
  }
}

export default function MealModal({ meal, visible, onClose, onAddToPlan }: MealModalProps) {
  const bottomSheetRef = useRef<BottomSheet>(null)
  const snapPoints = useMemo(() => ['50%', '90%'], [])

  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose()
      }
    },
    [onClose]
  )

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.6} />
    ),
    []
  )

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.snapToIndex(0)
    } else {
      bottomSheetRef.current?.close()
    }
  }, [visible])

  if (!meal) return null

  const recipe = parseRecipeSteps(meal.przepis)
  const defaultVariant = meal.variants.find((v) => v.is_default) || meal.variants[0]

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={visible ? 0 : -1}
      snapPoints={snapPoints}
      onChange={handleSheetChange}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: '#1a211e' }}
      handleIndicatorStyle={{ backgroundColor: '#94B4A6' }}
      accessibilityLabel={`Szczegóły posiłku: ${meal.nazwa}`}
    >
      <BottomSheetScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Image */}
        {meal.photo_url ? (
          <Image
            source={{ uri: meal.photo_url }}
            style={{ width: '100%', height: 200 }}
            contentFit="cover"
            transition={200}
            accessibilityLabel={`Zdjęcie: ${meal.nazwa}`}
          />
        ) : (
          <View className="w-full items-center justify-center bg-surface-container" style={{ height: 200 }}>
            <MealImagePlaceholder size={80} />
          </View>
        )}

        <View className="px-4 pt-4 gap-3">
          {/* Title */}
          <Text className="text-on-surface text-2xl font-bold">{meal.nazwa}</Text>

          {/* Description */}
          {meal.opis ? (
            <Text className="text-on-surface-variant text-sm">{meal.opis}</Text>
          ) : null}

          {/* Macros row */}
          {defaultVariant && (
            <View className="flex-row items-center gap-4">
              <View className="flex-row items-center gap-1">
                <Ionicons name="flame-outline" size={16} color="#69dd96" />
                <Text className="text-primary text-sm font-semibold">{defaultVariant.kcal} kcal</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Ionicons name="barbell-outline" size={16} color="#94B4A6" />
                <Text className="text-on-surface-variant text-sm font-semibold">
                  {defaultVariant.protein}g białka
                </Text>
              </View>
              {meal.prep_time > 0 && (
                <View className="flex-row items-center gap-1">
                  <Ionicons name="time-outline" size={16} color="#94B4A6" />
                  <Text className="text-on-surface-variant text-sm">{meal.prep_time} min</Text>
                </View>
              )}
              {meal.trudnosc ? (
                <View className="flex-row items-center gap-1">
                  <Ionicons name="speedometer-outline" size={16} color="#94B4A6" />
                  <Text className="text-on-surface-variant text-sm">{meal.trudnosc}</Text>
                </View>
              ) : null}
            </View>
          )}

          {/* Variants / Ingredients */}
          {meal.variants.length > 0 && (
            <View className="gap-3 mt-2">
              <Text className="text-on-surface text-lg font-bold">Składniki</Text>
              {meal.variants.map((variant) => (
                <View key={variant.id} className="gap-2">
                  <Text className="text-primary text-sm font-semibold">{variant.name}</Text>
                  {variant.ingredients?.map((ing) => (
                    <View key={ing.id} className="flex-row items-center gap-2 pl-2">
                      <View className="w-1.5 h-1.5 rounded-full bg-on-surface-variant" />
                      <Text className="text-on-surface text-sm flex-1">
                        {ing.ingredient?.name ?? `Składnik ${ing.ingredient_id}`}
                      </Text>
                      <Text className="text-on-surface-variant text-sm">{ing.display_amount}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}

          {/* Recipe steps */}
          {recipe?.kroki && recipe.kroki.length > 0 && (
            <View className="gap-3 mt-2">
              <Text className="text-on-surface text-lg font-bold">Przepis</Text>
              {recipe.kroki.map((step, i) => (
                <View key={i} className="flex-row gap-3">
                  <View className="w-6 h-6 rounded-full bg-primary/20 items-center justify-center mt-0.5">
                    <Text className="text-primary text-xs font-bold">{i + 1}</Text>
                  </View>
                  <Text className="text-on-surface text-sm flex-1 leading-5">{step}</Text>
                </View>
              ))}
              {recipe.wskazowki ? (
                <View className="bg-primary/10 rounded-xl p-3 mt-1">
                  <Text className="text-primary text-sm font-semibold mb-1">Wskazówki</Text>
                  <Text className="text-on-surface-variant text-sm">{recipe.wskazowki}</Text>
                </View>
              ) : null}
            </View>
          )}

          {/* Add to plan button */}
          <Pressable
            onPress={() => onAddToPlan(meal)}
            className="bg-primary rounded-2xl py-4 items-center mt-4"
            accessibilityRole="button"
            accessibilityLabel="Dodaj do planu"
          >
            <Text className="text-background text-base font-bold">Dodaj do planu</Text>
          </Pressable>
        </View>
      </BottomSheetScrollView>
    </BottomSheet>
  )
}
