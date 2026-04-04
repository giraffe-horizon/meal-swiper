import { Redirect } from 'expo-router'
import { useAuthStore } from '@/stores/auth'

export default function Index() {
  const token = useAuthStore((s) => s.token)

  // If no token, redirect to onboarding (Phase 1)
  // For now, always redirect to tabs
  if (!token) {
    return <Redirect href="/(tabs)/swipe" />
  }

  return <Redirect href="/(tabs)/swipe" />
}
