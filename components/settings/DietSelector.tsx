import { View, Text } from 'react-native'
import Pill from '@/components/ui/Pill'
import type { DietaryFlag } from '@/types'

const DIET_OPTIONS: { value: DietaryFlag; label: string }[] = [
  { value: 'vegetarian', label: 'Wegetariańska' },
  { value: 'vegan', label: 'Wegańska' },
  { value: 'gluten_free', label: 'Bez glutenu' },
  { value: 'dairy_free', label: 'Bez laktozy' },
  { value: 'low_carb', label: 'Low carb' },
  { value: 'keto', label: 'Keto' },
  { value: 'paleo', label: 'Paleo' },
]

interface DietSelectorProps {
  selected: DietaryFlag[]
  onChange: (flags: DietaryFlag[]) => void
}

export default function DietSelector({ selected, onChange }: DietSelectorProps) {
  function toggle(flag: DietaryFlag) {
    if (selected.includes(flag)) {
      onChange(selected.filter((f) => f !== flag))
    } else {
      onChange([...selected, flag])
    }
  }

  return (
    <View className="mb-4">
      <Text className="text-on-surface-variant text-sm mb-2">Dieta</Text>
      <View className="flex-row flex-wrap gap-2">
        {DIET_OPTIONS.map((opt) => (
          <Pill
            key={opt.value}
            label={opt.label}
            active={selected.includes(opt.value)}
            onPress={() => toggle(opt.value)}
          />
        ))}
      </View>
    </View>
  )
}
