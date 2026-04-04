import { View, Pressable, Text } from 'react-native'
import type { DayKey } from '@/types'

const DAYS: { key: DayKey; label: string }[] = [
  { key: 'mon', label: 'Pon' },
  { key: 'tue', label: 'Wt' },
  { key: 'wed', label: 'Śr' },
  { key: 'thu', label: 'Czw' },
  { key: 'fri', label: 'Pt' },
]

interface DaySelectorProps {
  activeDay: DayKey
  onSelect: (day: DayKey) => void
  className?: string
}

export default function DaySelector({ activeDay, onSelect, className = '' }: DaySelectorProps) {
  return (
    <View
      className={`flex-row justify-between ${className}`}
      accessibilityRole="tablist"
      accessibilityLabel="Wybierz dzień tygodnia"
    >
      {DAYS.map(({ key, label }) => {
        const isActive = key === activeDay
        return (
          <Pressable
            key={key}
            onPress={() => onSelect(key)}
            className={`min-w-[48px] min-h-[44px] items-center justify-center rounded-xl px-3 py-2 ${
              isActive ? 'bg-[#69dd96]' : 'bg-surface-container'
            }`}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: isActive }}
          >
            <Text
              className={`text-sm font-bold ${
                isActive ? 'text-[#0e1512]' : 'text-[#94B4A6]'
              }`}
            >
              {label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
