import { View, Text } from 'react-native'
import { Image } from 'expo-image'
import MealImagePlaceholder from '@/components/ui/MealImagePlaceholder'

interface CookingHeroProps {
  photoUrl: string | null
  title: string
}

export default function CookingHero({ photoUrl, title }: CookingHeroProps) {
  return (
    <View className="relative" style={{ height: 260 }}>
      {photoUrl ? (
        <Image
          source={{ uri: photoUrl }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={200}
          accessibilityLabel={`Zdjęcie: ${title}`}
        />
      ) : (
        <View className="w-full h-full bg-surface-container items-center justify-center">
          <MealImagePlaceholder size={100} />
        </View>
      )}
      {/* Dark gradient overlay (bottom fade) */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 120,
          backgroundColor: 'rgba(14, 21, 18, 0.8)',
        }}
      />
      {/* Title overlay */}
      <View className="absolute bottom-0 left-0 right-0 px-4 pb-3">
        <Text
          className="text-on-surface text-2xl font-bold"
          accessibilityRole="header"
          numberOfLines={2}
        >
          {title}
        </Text>
      </View>
    </View>
  )
}
