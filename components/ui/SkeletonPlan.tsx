import { View } from 'react-native'
import PulsingBox from './PulsingBox'

export default function SkeletonPlan() {
  return (
    <View
      className="flex-1 bg-background px-4 pt-4"
      accessibilityRole="progressbar"
      accessibilityLabel="Ładowanie planu"
    >
      {/* Header placeholder */}
      <PulsingBox className="w-48 h-8 bg-surface-container rounded-xl mb-4" />

      {/* Week nav placeholder */}
      <View className="flex-row items-center justify-between mb-4">
        <PulsingBox className="w-10 h-10 bg-surface-container rounded-full" />
        <PulsingBox className="w-32 h-6 bg-surface-container rounded-lg" />
        <PulsingBox className="w-10 h-10 bg-surface-container rounded-full" />
      </View>

      {/* Day cards placeholder */}
      {Array.from({ length: 5 }).map((_, i) => (
        <PulsingBox key={i} className="w-full h-20 bg-surface-container rounded-2xl mb-3" />
      ))}
    </View>
  )
}
