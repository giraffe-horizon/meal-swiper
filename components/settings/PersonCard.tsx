import { View, TextInput, Pressable, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Card from '@/components/ui/Card'
import SliderField from '@/components/ui/SliderField'
import DietSelector from './DietSelector'
import PreferenceEditor from './PreferenceEditor'
import IngredientExcluder from './IngredientExcluder'
import { colors } from '@/lib/colors'
import type { DietaryFlag, PersonSettings } from '@/types'

interface PersonCardProps {
  person: PersonSettings
  index: number
  cuisines: string[]
  canDelete: boolean
  onUpdate: (updated: PersonSettings) => void
  onDelete: () => void
}

export default function PersonCard({
  person,
  index,
  cuisines,
  canDelete,
  onUpdate,
  onDelete,
}: PersonCardProps) {
  function handleDelete() {
    Alert.alert(
      'Usuń osobę',
      `Czy na pewno chcesz usunąć ${person.name || `Osoba ${index + 1}`}?`,
      [
        { text: 'Anuluj', style: 'cancel' },
        { text: 'Usuń', style: 'destructive', onPress: onDelete },
      ]
    )
  }

  return (
    <Card className="mb-4">
      <View className="flex-row items-center justify-between mb-3">
        <TextInput
          className="flex-1 text-on-surface text-lg font-bold bg-transparent"
          value={person.name}
          onChangeText={(name) => onUpdate({ ...person, name })}
          placeholder={`Osoba ${index + 1}`}
          placeholderTextColor={`${colors.onSurfaceVariant}80`}
          accessibilityLabel={`Imię osoby ${index + 1}`}
        />
        {canDelete && (
          <Pressable
            onPress={handleDelete}
            className="min-w-[44px] min-h-[44px] items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel={`Usuń ${person.name || `osobę ${index + 1}`}`}
          >
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          </Pressable>
        )}
      </View>

      <SliderField
        label="Dzienne kcal"
        value={person.dailyKcal ?? person.kcal ?? 2000}
        min={1200}
        max={4000}
        step={50}
        onChange={(dailyKcal) => onUpdate({ ...person, dailyKcal })}
      />

      <SliderField
        label="Dzienne białko (g)"
        value={person.dailyProtein ?? person.protein ?? 80}
        min={40}
        max={250}
        step={5}
        onChange={(dailyProtein) => onUpdate({ ...person, dailyProtein })}
      />

      <SliderField
        label="Posiłki dziennie"
        value={person.mealsPerDay ?? 3}
        min={1}
        max={6}
        step={1}
        onChange={(mealsPerDay) => onUpdate({ ...person, mealsPerDay })}
      />

      <DietSelector
        selected={person.diet ?? []}
        onChange={(diet: DietaryFlag[]) => onUpdate({ ...person, diet })}
      />

      <PreferenceEditor
        selected={person.cuisinePreferences ?? []}
        cuisines={cuisines}
        onChange={(cuisinePreferences) => onUpdate({ ...person, cuisinePreferences })}
      />

      <IngredientExcluder
        excluded={person.excludedIngredients ?? []}
        onChange={(excludedIngredients) => onUpdate({ ...person, excludedIngredients })}
      />
    </Card>
  )
}
