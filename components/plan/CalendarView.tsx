import { View, Text } from 'react-native'
import IconButton from '@/components/ui/IconButton'
import DayCard from '@/components/plan/DayCard'
import { useWeekDates } from '@/hooks/useWeekDates'
import { DAY_KEYS } from '@/lib/utils'
import type { DayKey, Meal, WeeklyPlan } from '@/types'

interface CalendarViewProps {
  weekKey: string
  weekOffset: number
  plan: WeeklyPlan
  onWeekChange: (offset: number) => void
  onDayPress: (day: DayKey) => void
  onRemoveMeal: (day: DayKey) => void
  onToggleVacation: (day: DayKey) => void
  onCook: (day: DayKey, mealId: string) => void
}

export default function CalendarView({
  weekOffset,
  plan,
  onWeekChange,
  onDayPress,
  onRemoveMeal,
  onToggleVacation,
  onCook,
}: CalendarViewProps) {
  const { dates, range } = useWeekDates(weekOffset)

  return (
    <View>
      {/* Week header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <IconButton
          icon="chevron-back"
          onPress={() => onWeekChange(weekOffset - 1)}
          accessibilityLabel="Poprzedni tydzień"
        />
        <Text
          className="text-on-surface text-base font-bold"
          accessibilityRole="header"
        >
          {range}
        </Text>
        <IconButton
          icon="chevron-forward"
          onPress={() => onWeekChange(weekOffset + 1)}
          accessibilityLabel="Następny tydzień"
        />
      </View>

      {/* Day cards */}
      <View className="px-4">
        {DAY_KEYS.map((day, index) => {
          const meal = plan[day] as Meal | null
          const freeKey = `${day}_free` as `${DayKey}_free`
          const isVacation = !!plan[freeKey]

          return (
            <DayCard
              key={day}
              day={day}
              date={dates[index]}
              meal={meal}
              isVacation={isVacation}
              onPress={() => onDayPress(day)}
              onRemove={() => onRemoveMeal(day)}
              onToggleVacation={() => onToggleVacation(day)}
              onCook={() => {
                if (meal) onCook(day, meal.id)
              }}
            />
          )
        })}
      </View>
    </View>
  )
}
