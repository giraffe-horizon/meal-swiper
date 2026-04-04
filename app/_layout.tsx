import '../global.css'
import { Stack } from 'expo-router'
import { StatusBar } from 'react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useEffect } from 'react'
import Constants from 'expo-constants'
import { configureApi } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'

configureApi({
  baseUrl:
    Constants.expoConfig?.extra?.apiUrl ??
    'https://meal-swiper-api.giraffehorizon.workers.dev',
  headers: { 'X-API-Key': Constants.expoConfig?.extra?.apiKey ?? '' },
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
    },
  },
})

export default function RootLayout() {
  useEffect(() => {
    useAuthStore.getState().hydrate()
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar barStyle="light-content" backgroundColor="#0B120F" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="join/[token]" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
