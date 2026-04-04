import { View } from 'react-native'
import PulsingBox from './PulsingBox'

export default function SkeletonSwipe() {
  return (
    <View
      className="flex-1 bg-background items-center px-4 pt-3"
      accessibilityRole="progressbar"
      accessibilityLabel="Ładowanie posiłków"
    >
      {/* Day selector placeholder */}
      <View className="flex-row gap-3 mb-4 w-full justify-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <PulsingBox key={i} className="w-12 h-10 bg-surface-container rounded-xl" />
        ))}
      </View>

      {/* Filter row placeholder */}
      <View className="flex-row gap-2 mb-4 w-full">
        <PulsingBox className="w-20 h-8 bg-surface-container rounded-full" />
        <PulsingBox className="w-24 h-8 bg-surface-container rounded-full" />
        <PulsingBox className="w-16 h-8 bg-surface-container rounded-full" />
      </View>

      {/* Card placeholder */}
      <PulsingBox className="w-full aspect-[3/4] bg-surface-container rounded-3xl" />

      {/* Action buttons placeholder */}
      <View className="flex-row gap-6 mt-6">
        <PulsingBox className="w-14 h-14 bg-surface-container rounded-full" />
        <PulsingBox className="w-14 h-14 bg-surface-container rounded-full" />
        <PulsingBox className="w-14 h-14 bg-surface-container rounded-full" />
      </View>
    </View>
  )
}
