import { useState } from 'react'
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '@/stores/auth'
import { createTenant, fetchTenantInfo } from '@/lib/api'
import { randomUUID } from '@/lib/uuid'

type Mode = 'choose' | 'join'

export default function OnboardingScreen() {
  const setToken = useAuthStore((s) => s.setToken)
  const [mode, setMode] = useState<Mode>('choose')
  const [joinToken, setJoinToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    setLoading(true)
    setError(null)
    try {
      const token = randomUUID()
      await createTenant({ token })
      setToken(token)
      router.replace('/(tabs)/swipe')
    } catch {
      setError('Nie udało się utworzyć gospodarstwa. Spróbuj ponownie.')
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin() {
    const trimmed = joinToken.trim()
    if (!trimmed) {
      setError('Wpisz token zaproszenia.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const info = await fetchTenantInfo(trimmed)
      if (!info) {
        setError('Nie znaleziono gospodarstwa z tym tokenem.')
        return
      }
      setToken(trimmed)
      router.replace('/(tabs)/swipe')
    } catch {
      setError('Błąd połączenia. Spróbuj ponownie.')
    } finally {
      setLoading(false)
    }
  }

  if (mode === 'join') {
    return (
      <View className="flex-1 bg-background justify-center items-center px-8">
        <Pressable
          className="absolute top-16 left-6"
          onPress={() => {
            setMode('choose')
            setError(null)
          }}
          accessibilityRole="button"
          accessibilityLabel="Wróć"
        >
          <Ionicons name="arrow-back" size={24} color="#dde4df" /* on-surface */ />
        </Pressable>

        <Ionicons name="people-outline" size={48} color="#69dd96" /* primary */ />
        <Text className="text-on-surface text-2xl font-bold mt-4 mb-2">
          Dołącz do gospodarstwa
        </Text>
        <Text className="text-on-surface-variant text-base text-center mb-8">
          Wpisz token zaproszenia, który otrzymałeś od domownika.
        </Text>

        <TextInput
          className="w-full bg-[#1a211e] border border-[#24332D] rounded-xl px-4 py-3 text-on-surface text-base mb-4"
          placeholder="Token zaproszenia"
          placeholderTextColor="#94B4A680"
          value={joinToken}
          onChangeText={setJoinToken}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Token zaproszenia"
        />

        {error && (
          <Text className="text-red-400 text-sm mb-4 text-center">{error}</Text>
        )}

        <Pressable
          className="w-full bg-primary rounded-xl py-4 items-center"
          onPress={handleJoin}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Dołącz do gospodarstwa"
        >
          {loading ? (
            <ActivityIndicator color="#0e1512" /* background */ />
          ) : (
            <Text className="text-background text-base font-bold">Dołącz</Text>
          )}
        </Pressable>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-background justify-center items-center px-8">
      <View className="w-20 h-20 rounded-3xl bg-[#1a211e] items-center justify-center mb-6">
        <Ionicons name="restaurant-outline" size={40} color="#69dd96" /* primary */ />
      </View>

      <Text className="text-on-surface text-3xl font-bold mb-2">Meal Swiper</Text>
      <Text className="text-on-surface-variant text-base text-center mb-12">
        Planuj posiłki razem z domownikami — szybko i wygodnie.
      </Text>

      {error && (
        <Text className="text-red-400 text-sm mb-4 text-center">{error}</Text>
      )}

      <Pressable
        className="w-full bg-primary rounded-xl py-4 items-center mb-4"
        onPress={handleCreate}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Utwórz gospodarstwo"
      >
        {loading ? (
          <ActivityIndicator color="#0e1512" /* background */ />
        ) : (
          <Text className="text-background text-base font-bold">Utwórz gospodarstwo</Text>
        )}
      </Pressable>

      <Pressable
        className="w-full border border-primary rounded-xl py-4 items-center"
        onPress={() => setMode('join')}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Dołącz do istniejącego gospodarstwa"
      >
        <Text className="text-primary text-base font-bold">Dołącz do istniejącego</Text>
      </Pressable>
    </View>
  )
}
