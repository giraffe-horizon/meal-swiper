import { useState } from 'react'
import { View, Text, TextInput, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/lib/colors'

interface IngredientExcluderProps {
  excluded: string[]
  onChange: (excluded: string[]) => void
}

export default function IngredientExcluder({ excluded, onChange }: IngredientExcluderProps) {
  const [input, setInput] = useState('')

  function handleAdd() {
    const trimmed = input.trim()
    if (!trimmed || excluded.includes(trimmed)) return
    onChange([...excluded, trimmed])
    setInput('')
  }

  function handleRemove(ingredient: string) {
    onChange(excluded.filter((e) => e !== ingredient))
  }

  return (
    <View className="mb-4">
      <Text className="text-on-surface-variant text-sm mb-2">Wykluczone składniki</Text>
      <View className="flex-row gap-2 mb-2">
        <TextInput
          className="flex-1 bg-surface-container border border-border-dark rounded-xl px-3 py-2 text-on-surface text-sm"
          placeholder="Np. orzechy"
          placeholderTextColor={`${colors.onSurfaceVariant}80`}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
          accessibilityLabel="Wyklucz składnik"
        />
        <Pressable
          onPress={handleAdd}
          disabled={!input.trim()}
          className="min-w-[44px] min-h-[44px] items-center justify-center rounded-xl bg-primary"
          accessibilityRole="button"
          accessibilityLabel="Dodaj wykluczony składnik"
          style={{ opacity: input.trim() ? 1 : 0.4 }}
        >
          <Ionicons name="add" size={20} color={colors.background} />
        </Pressable>
      </View>
      {excluded.length > 0 && (
        <View className="flex-row flex-wrap gap-2">
          {excluded.map((ingredient) => (
            <Pressable
              key={ingredient}
              onPress={() => handleRemove(ingredient)}
              className="flex-row items-center gap-1 bg-surface-container rounded-full px-3 py-1"
              accessibilityRole="button"
              accessibilityLabel={`Usuń ${ingredient} z wykluczonych`}
            >
              <Text className="text-on-surface text-sm">{ingredient}</Text>
              <Ionicons name="close" size={14} color={colors.onSurfaceVariant} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  )
}
