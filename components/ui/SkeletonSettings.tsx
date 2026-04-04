import { View } from 'react-native'
import PulsingBox from './PulsingBox'

function SkeletonPersonCard() {
  return (
    <View className="bg-surface-container rounded-2xl p-4 mb-3">
      {/* Name */}
      <PulsingBox className="w-24 h-5 bg-background rounded-lg mb-3" />
      {/* Sliders placeholder */}
      <PulsingBox className="w-full h-4 bg-background rounded-lg mb-2" />
      <PulsingBox className="w-full h-4 bg-background rounded-lg mb-2" />
      {/* Diet pills */}
      <View className="flex-row gap-2 mt-1">
        <PulsingBox className="w-20 h-7 bg-background rounded-full" />
        <PulsingBox className="w-16 h-7 bg-background rounded-full" />
        <PulsingBox className="w-24 h-7 bg-background rounded-full" />
      </View>
    </View>
  )
}

export default function SkeletonSettings() {
  return (
    <View
      className="flex-1 bg-background px-4 pt-4"
      accessibilityRole="progressbar"
      accessibilityLabel="Ładowanie ustawień"
    >
      {/* Header */}
      <PulsingBox className="w-40 h-8 bg-surface-container rounded-xl mb-4" />

      {/* Household section placeholder */}
      <View className="bg-surface-container rounded-2xl p-4 mb-4">
        <PulsingBox className="w-28 h-5 bg-background rounded-lg mb-3" />
        <PulsingBox className="w-full h-10 bg-background rounded-xl mb-3" />
        <View className="flex-row items-center justify-between">
          <PulsingBox className="w-16 h-4 bg-background rounded-lg" />
          <PulsingBox className="w-24 h-9 bg-background rounded-xl" />
        </View>
      </View>

      {/* Person cards */}
      <PulsingBox className="w-20 h-6 bg-surface-container rounded-lg mb-3" />
      <SkeletonPersonCard />
      <SkeletonPersonCard />

      {/* Account section */}
      <PulsingBox className="w-16 h-6 bg-surface-container rounded-lg mb-3 mt-2" />
      <PulsingBox className="w-full h-12 bg-surface-container rounded-2xl mb-3" />
      <PulsingBox className="w-full h-12 bg-surface-container rounded-2xl" />
    </View>
  )
}
