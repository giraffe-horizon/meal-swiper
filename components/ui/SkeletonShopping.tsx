import { View } from 'react-native'
import PulsingBox from './PulsingBox'

function SkeletonCategory() {
  return (
    <View className="mb-4">
      {/* Category header */}
      <PulsingBox className="w-28 h-5 bg-surface-container rounded-lg mx-4 mb-2" />
      {/* Rows */}
      {Array.from({ length: 3 }).map((_, i) => (
        <View key={i} className="flex-row items-center px-4 h-12 gap-3">
          <PulsingBox className="w-5 h-5 bg-surface-container rounded" />
          <PulsingBox className="flex-1 h-4 bg-surface-container rounded-lg" />
          <PulsingBox className="w-12 h-4 bg-surface-container rounded-lg" />
        </View>
      ))}
    </View>
  )
}

export default function SkeletonShopping() {
  return (
    <View
      className="flex-1 bg-background pt-4"
      accessibilityRole="progressbar"
      accessibilityLabel="Ładowanie listy zakupów"
    >
      {/* Header placeholder */}
      <PulsingBox className="w-40 h-8 bg-surface-container rounded-xl mx-4 mb-3" />

      {/* Week nav placeholder */}
      <View className="flex-row items-center justify-between px-4 mb-4">
        <PulsingBox className="w-10 h-10 bg-surface-container rounded-full" />
        <PulsingBox className="w-32 h-6 bg-surface-container rounded-lg" />
        <PulsingBox className="w-10 h-10 bg-surface-container rounded-full" />
      </View>

      {/* Category sections */}
      <SkeletonCategory />
      <SkeletonCategory />
      <SkeletonCategory />
    </View>
  )
}
