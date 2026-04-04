import { View, Text } from 'react-native'
import IngredientRow from '@/components/cooking/IngredientRow'
import type { Ingredient } from '@/types'

interface IngredientSectionProps {
  title: string
  ingredients: Ingredient[]
  checkedItems: Record<string, boolean>
  onToggle: (name: string) => void
}

export default function IngredientSection({
  title,
  ingredients,
  checkedItems,
  onToggle,
}: IngredientSectionProps) {
  if (ingredients.length === 0) return null

  return (
    <View className="mb-4">
      <Text className="text-primary text-sm font-semibold mb-2 px-2">{title}</Text>
      {ingredients.map((ing, i) => (
        <IngredientRow
          key={`${ing.name}-${i}`}
          name={ing.name}
          amount={ing.amount}
          checked={!!checkedItems[ing.name]}
          onToggle={() => onToggle(ing.name)}
        />
      ))}
    </View>
  )
}
