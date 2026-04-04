import { ScrollView, View } from 'react-native'
import Pill from '@/components/ui/Pill'

export interface CategoryFilterProps {
  cuisines: string[]
  activeFilter: string | null
  onFilterChange: (filter: string | null) => void
}

export default function CategoryFilter({
  cuisines,
  activeFilter,
  onFilterChange,
}: CategoryFilterProps) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="Filtruj po kuchni">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 px-4"
      >
        <Pill
          label="Wszystkie"
          active={activeFilter === null}
          onPress={() => onFilterChange(null)}
          accessibilityRole="radio"
        />
        {cuisines.map((cuisine) => (
          <Pill
            key={cuisine}
            label={cuisine}
            active={activeFilter === cuisine}
            onPress={() => onFilterChange(cuisine === activeFilter ? null : cuisine)}
            accessibilityRole="radio"
          />
        ))}
      </ScrollView>
    </View>
  )
}
