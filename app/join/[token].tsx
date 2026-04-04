import { useEffect, useState } from 'react'
import { View, Text, Pressable, ActivityIndicator } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '@/stores/auth'
import { fetchTenantInfo } from '@/lib/api'

export default function JoinTokenScreen() {
  const { token } = useLocalSearchParams<{ token: string }>()
  const setToken = useAuthStore((s) => s.setToken)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function attemptJoin() {
    if (!token) {
      setError('Brak tokena w linku.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const info = await fetchTenantInfo(token)
      if (!info) {
        setError('Nie znaleziono gospodarstwa z tym tokenem.')
        setLoading(false)
        return
      }
      setToken(token)
      router.replace('/(tabs)/swipe')
    } catch {
      setError('Błąd połączenia. Spróbuj ponownie.')
      setLoading(false)
    }
  }

  useEffect(() => {
    attemptJoin()
  }, [token])

  if (loading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#69dd96" /* primary */ />
        <Text className="text-on-surface-variant text-base mt-4">Dołączanie do gospodarstwa…</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View className="flex-1 bg-background justify-center items-center px-8">
        <Ionicons name="alert-circle-outline" size={48} color="#f87171" />
        <Text className="text-on-surface text-xl font-bold mt-4 mb-2">Coś poszło nie tak</Text>
        <Text className="text-on-surface-variant text-base text-center mb-8">{error}</Text>

        <Pressable
          className="w-full bg-primary rounded-xl py-4 items-center mb-4"
          onPress={attemptJoin}
          accessibilityRole="button"
          accessibilityLabel="Spróbuj ponownie"
        >
          <Text className="text-background text-base font-bold">Spróbuj ponownie</Text>
        </Pressable>

        <Pressable
          className="w-full border border-[#24332D] rounded-xl py-4 items-center"
          onPress={() => router.replace('/onboarding')}
          accessibilityRole="button"
          accessibilityLabel="Wróć do ekranu powitalnego"
        >
          <Text className="text-on-surface-variant text-base">Wróć do ekranu powitalnego</Text>
        </Pressable>
      </View>
    )
  }

  return null
}
