import { useCallback, useMemo, useRef, useState } from 'react'
import { View, Text, Pressable, ScrollView, RefreshControl } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useWeekDates } from '@/hooks/useWeekDates'
import { useWeeklyPlan } from '@/hooks/useWeeklyPlan'
import {
  useShoppingCheckedQuery,
  useShoppingCheckedMutation,
} from '@/hooks/queries/useShoppingCheckedQuery'
import { useSettingsQuery } from '@/hooks/queries/useSettingsQuery'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import { generateShoppingList, type MergedIngredient } from '@/lib/shopping'
import { computeScaleFactor } from '@/lib/scaling'
import IconButton from '@/components/ui/IconButton'

// Approximate category mapping based on ingredient name patterns
const CATEGORY_PATTERNS: { category: string; patterns: string[] }[] = [
  { category: 'Mięso i ryby', patterns: ['kurczak', 'indyk', 'wieprzow', 'wolowi', 'mieso', 'losos', 'dorsz', 'tunczyk', 'krewet', 'bekon', 'szynk', 'kielbas'] },
  { category: 'Nabiał', patterns: ['mleko', 'smietana', 'jogurt', 'ser ', 'twarog', 'maslo', 'jajk', 'jaj'] },
  { category: 'Warzywa', patterns: ['pomidor', 'cebul', 'czosnek', 'papryk', 'ogor', 'salat', 'szpinak', 'marchew', 'ziemniak', 'brokul', 'kalafior', 'cukin', 'baklazan', 'por ', 'seler', 'pieczark', 'grzyb', 'fasol', 'groch', 'soczewic', 'ciecierz', 'awokado', 'dyni'] },
  { category: 'Owoce', patterns: ['jablk', 'banan', 'cytryn', 'limon', 'pomarancz', 'truskaw', 'malin', 'jagod'] },
  { category: 'Suche i przetwory', patterns: ['ryz', 'makaron', 'kasza', 'maka', 'chleb', 'bulk', 'tortill', 'puszka', 'passata', 'koncentrat', 'sos', 'pasta', 'oliw', 'olej', 'ocet', 'miod'] },
]

function categorizeIngredient(normalizedName: string): string {
  for (const { category, patterns } of CATEGORY_PATTERNS) {
    for (const pattern of patterns) {
      if (normalizedName.includes(pattern)) return category
    }
  }
  return 'Inne'
}

interface GroupedIngredients {
  category: string
  items: MergedIngredient[]
}

function groupByCategory(ingredients: MergedIngredient[]): GroupedIngredients[] {
  const map = new Map<string, MergedIngredient[]>()

  for (const ing of ingredients) {
    const cat = categorizeIngredient(ing.normalizedName)
    const list = map.get(cat) ?? []
    list.push(ing)
    map.set(cat, list)
  }

  // Sort categories in a fixed order
  const order = ['Mięso i ryby', 'Warzywa', 'Owoce', 'Nabiał', 'Suche i przetwory', 'Inne']
  return order
    .filter((cat) => map.has(cat))
    .map((cat) => ({ category: cat, items: map.get(cat)! }))
}

export default function ShoppingScreen() {
  const token = useAuthStore((s) => s.token)
  const weekOffset = useUIStore((s) => s.weekOffset)
  const setWeekOffset = useUIStore((s) => s.setWeekOffset)

  const { weekKey, range } = useWeekDates(weekOffset)
  const { plan, isLoading: planLoading } = useWeeklyPlan(weekKey, token)
  const settingsQuery = useSettingsQuery(token)
  const checkedQuery = useShoppingCheckedQuery(weekKey, token)
  const checkedMutation = useShoppingCheckedMutation(token)

  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})

  // Compute scale factor from settings
  const persons = settingsQuery.data?.persons ?? []
  const scaleFactor = computeScaleFactor(persons)

  // Generate shopping list
  const shoppingList = useMemo(
    () => generateShoppingList(plan, scaleFactor),
    [plan, scaleFactor]
  )

  const grouped = useMemo(() => groupByCategory(shoppingList), [shoppingList])

  // Checked state (merge server + local)
  const [localChecked, setLocalChecked] = useState<Record<string, boolean>>({})
  const serverChecked = checkedQuery.data ?? {}
  const checked = useMemo(
    () => ({ ...serverChecked, ...localChecked }),
    [serverChecked, localChecked]
  )

  // Use ref to avoid stale closure on rapid toggles
  const checkedRef = useRef(checked)
  checkedRef.current = checked

  const handleToggleChecked = useCallback(
    (normalizedName: string) => {
      const current = checkedRef.current
      const newValue = !current[normalizedName]
      setLocalChecked((prev) => ({ ...prev, [normalizedName]: newValue }))
      const newChecked = { ...current, [normalizedName]: newValue }
      checkedMutation.mutate({ weekKey, checked: newChecked })
    },
    [weekKey, checkedMutation]
  )

  const handleClearChecked = useCallback(() => {
    setLocalChecked({})
    checkedMutation.mutate({ weekKey, checked: {} })
  }, [weekKey, checkedMutation])

  const handleToggleExpand = useCallback((normalizedName: string) => {
    setExpandedItems((prev) => ({ ...prev, [normalizedName]: !prev[normalizedName] }))
  }, [])

  const [refreshing, setRefreshing] = useState(false)
  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await checkedQuery.refetch()
    setRefreshing(false)
  }, [checkedQuery])

  const checkedCount = Object.values(checked).filter(Boolean).length

  // Loading
  if (planLoading) {
    return (
      <View className="flex-1 bg-background">
        <LoadingSpinner />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#69dd96"
            colors={['#69dd96']}
          />
        }
      >
        {/* Header */}
        <View className="px-4 pt-4 pb-1">
          <Text className="text-on-surface text-2xl font-bold" accessibilityRole="header">
            Lista zakupów
          </Text>
        </View>

        {/* Week nav */}
        <View className="flex-row items-center justify-between px-4 py-2">
          <IconButton
            icon="chevron-back"
            onPress={() => setWeekOffset(weekOffset - 1)}
            accessibilityLabel="Poprzedni tydzień"
          />
          <Text className="text-on-surface text-base font-bold">{range}</Text>
          <IconButton
            icon="chevron-forward"
            onPress={() => setWeekOffset(weekOffset + 1)}
            accessibilityLabel="Następny tydzień"
          />
        </View>

        {/* Empty state */}
        {shoppingList.length === 0 && (
          <View className="items-center px-8 mt-10">
            <Ionicons name="cart-outline" size={48} color="#94B4A6" />
            <Text className="text-on-surface-variant text-sm text-center mt-3">
              Brak posiłków w planie — najpierw zaplanuj tydzień!
            </Text>
          </View>
        )}

        {/* Clear button + counter */}
        {shoppingList.length > 0 && (
          <View className="flex-row items-center justify-between px-4 pb-2">
            <Text className="text-on-surface-variant text-xs">
              {checkedCount}/{shoppingList.length} kupione
            </Text>
            {checkedCount > 0 && (
              <Pressable
                onPress={handleClearChecked}
                className="flex-row items-center gap-1 py-1 px-2"
                accessibilityRole="button"
                accessibilityLabel="Wyczyść zaznaczenia"
              >
                <Ionicons name="close-circle-outline" size={16} color="#94B4A6" />
                <Text className="text-on-surface-variant text-xs">Wyczyść</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Grouped ingredients */}
        {grouped.map(({ category, items }) => (
          <View key={category} className="mb-4">
            <Text
              className="text-primary text-sm font-semibold px-4 py-2"
              accessibilityRole="header"
            >
              {category}
            </Text>
            {items.map((ing) => {
              const isChecked = !!checked[ing.normalizedName]
              const isExpanded = !!expandedItems[ing.normalizedName]

              return (
                <View key={ing.normalizedName}>
                  <View className="flex-row items-center px-4 min-h-[48px]">
                    {/* Checkbox */}
                    <Pressable
                      onPress={() => handleToggleChecked(ing.normalizedName)}
                      className="min-w-[44px] min-h-[44px] items-center justify-center"
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isChecked }}
                      accessibilityLabel={`${ing.name}, ${ing.amount}`}
                    >
                      <View
                        className={`w-5 h-5 rounded border items-center justify-center ${
                          isChecked ? 'bg-primary border-primary' : 'border-on-surface-variant'
                        }`}
                      >
                        {isChecked && <Ionicons name="checkmark" size={14} color="#0e1512" />}
                      </View>
                    </Pressable>

                    {/* Name */}
                    <Text
                      className={`flex-1 text-sm ${
                        isChecked ? 'text-on-surface-variant line-through' : 'text-on-surface'
                      }`}
                      numberOfLines={1}
                    >
                      {ing.name}
                    </Text>

                    {/* Amount */}
                    <Text className="text-on-surface-variant text-sm ml-2">{ing.amount}</Text>

                    {/* Expand toggle */}
                    <Pressable
                      onPress={() => handleToggleExpand(ing.normalizedName)}
                      className="min-w-[44px] min-h-[44px] items-center justify-center"
                      accessibilityRole="button"
                      accessibilityLabel={isExpanded ? 'Ukryj szczegóły' : 'Pokaż szczegóły'}
                    >
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color="#94B4A6"
                      />
                    </Pressable>
                  </View>

                  {/* Expanded details placeholder */}
                  {isExpanded && (
                    <View className="pl-16 pr-4 pb-2">
                      <Text className="text-on-surface-variant text-xs">
                        Składnik z planu na tydzień {range}
                      </Text>
                    </View>
                  )}
                </View>
              )
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  )
}
