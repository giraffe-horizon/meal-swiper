import { View, Text, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface RecipeStepsProps {
  steps: string[]
  tips: string
  completedSteps: Record<number, boolean>
  onToggleStep: (index: number) => void
}

export default function RecipeSteps({
  steps,
  tips,
  completedSteps,
  onToggleStep,
}: RecipeStepsProps) {
  if (steps.length === 0) return null

  return (
    <View className="gap-3">
      <Text className="text-on-surface text-lg font-bold px-4" accessibilityRole="header">
        Przepis
      </Text>

      {steps.map((step, i) => {
        const isDone = !!completedSteps[i]
        return (
          <Pressable
            key={i}
            onPress={() => onToggleStep(i)}
            className="flex-row gap-3 px-4 py-1"
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isDone }}
            accessibilityLabel={`Krok ${i + 1}: ${step}`}
          >
            <View
              className={`w-7 h-7 rounded-full items-center justify-center mt-0.5 ${
                isDone ? 'bg-primary' : 'bg-primary/20'
              }`}
            >
              {isDone ? (
                <Ionicons name="checkmark" size={16} color="#0e1512" />
              ) : (
                <Text className="text-primary text-xs font-bold">{i + 1}</Text>
              )}
            </View>
            <Text
              className={`flex-1 text-sm leading-5 ${
                isDone ? 'text-on-surface-variant line-through' : 'text-on-surface'
              }`}
            >
              {step}
            </Text>
          </Pressable>
        )
      })}

      {tips ? (
        <View className="bg-primary/10 rounded-xl p-3 mx-4 mt-1">
          <Text className="text-primary text-sm font-semibold mb-1">Wskazówki</Text>
          <Text className="text-on-surface-variant text-sm">{tips}</Text>
        </View>
      ) : null}
    </View>
  )
}
