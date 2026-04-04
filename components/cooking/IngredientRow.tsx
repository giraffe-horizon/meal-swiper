import { View, Text, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface IngredientRowProps {
  name: string
  amount: string
  checked: boolean
  onToggle: () => void
}

export default function IngredientRow({ name, amount, checked, onToggle }: IngredientRowProps) {
  return (
    <Pressable
      onPress={onToggle}
      className="flex-row items-center py-2 px-2 min-h-[44px]"
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={`${name}, ${amount}`}
    >
      <View
        className={`w-5 h-5 rounded border items-center justify-center mr-3 ${
          checked ? 'bg-primary border-primary' : 'border-on-surface-variant'
        }`}
      >
        {checked && <Ionicons name="checkmark" size={14} color="#0e1512" />}
      </View>
      <Text
        className={`flex-1 text-sm ${
          checked ? 'text-on-surface-variant line-through' : 'text-on-surface'
        }`}
        numberOfLines={1}
      >
        {name}
      </Text>
      <Text className="text-on-surface-variant text-sm ml-2">{amount}</Text>
    </Pressable>
  )
}
