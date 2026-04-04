import { View, ActivityIndicator } from 'react-native'
import { Redirect } from 'expo-router'
import { useAuthStore } from '@/stores/auth'

export default function Index() {
  const token = useAuthStore((s) => s.token)
  const isHydrated = useAuthStore((s) => s.isHydrated)

  if (!isHydrated) {
    return (
      <View className="flex-1 bg-[#0e1512] justify-center items-center">
        <ActivityIndicator size="large" color="#69dd96" />
      </View>
    )
  }

  if (!token) {
    return <Redirect href="/onboarding" />
  }

  return <Redirect href="/(tabs)/swipe" />
}
