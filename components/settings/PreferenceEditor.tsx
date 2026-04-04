import { ScrollView, Text, View } from 'react-native'
import Pill from '@/components/ui/Pill'

interface PreferenceEditorProps {
  selected: string[]
  cuisines: string[]
  onChange: (cuisines: string[]) => void
}

export default function PreferenceEditor({ selected, cuisines, onChange }: PreferenceEditorProps) {
  function toggle(cuisine: string) {
    if (selected.includes(cuisine)) {
      onChange(selected.filter((c) => c !== cuisine))
    } else {
      onChange([...selected, cuisine])
    }
  }

  return (
    <View className="mb-4">
      <Text className="text-on-surface-variant text-sm mb-2">Preferowane kuchnie</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2">
          {cuisines.map((cuisine) => (
            <Pill
              key={cuisine}
              label={cuisine}
              active={selected.includes(cuisine)}
              onPress={() => toggle(cuisine)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  )
}
