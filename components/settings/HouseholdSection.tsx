import { useCallback, useEffect, useRef, useState } from 'react'
import { View, Text, TextInput, Pressable, Share, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Card from '@/components/ui/Card'
import { colors } from '@/lib/colors'

interface HouseholdSectionProps {
  name: string
  token: string
  personCount: number
  onNameChange: (name: string) => void
}

export default function HouseholdSection({
  name,
  token,
  personCount,
  onNameChange,
}: HouseholdSectionProps) {
  const [localName, setLocalName] = useState(name)
  const [sharing, setSharing] = useState(false)

  // Sync from prop when it changes externally
  useEffect(() => {
    setLocalName(name)
  }, [name])

  // Debounced save — flush immediately on cleanup instead of discarding
  const pendingNameRef = useRef<string | null>(null)
  useEffect(() => {
    if (localName === name) {
      pendingNameRef.current = null
      return
    }
    pendingNameRef.current = localName
    const timer = setTimeout(() => {
      pendingNameRef.current = null
      onNameChange(localName)
    }, 600)
    return () => {
      clearTimeout(timer)
      // Flush: save pending name change immediately
      if (pendingNameRef.current !== null) {
        onNameChange(pendingNameRef.current)
        pendingNameRef.current = null
      }
    }
  }, [localName, name, onNameChange])

  const handleInvite = useCallback(async () => {
    setSharing(true)
    try {
      await Share.share({
        message: `Dołącz do mojego gospodarstwa w Meal Swiper: mealswiper://join/${token}`,
      })
    } finally {
      setSharing(false)
    }
  }, [token])

  return (
    <Card className="mb-4">
      <Text className="text-on-surface text-lg font-bold mb-3" accessibilityRole="header">
        Gospodarstwo
      </Text>

      <Text className="text-on-surface-variant text-sm mb-1">Nazwa</Text>
      <TextInput
        className="bg-background border border-border-dark rounded-xl px-3 py-2 text-on-surface text-base mb-3"
        value={localName}
        onChangeText={setLocalName}
        placeholder="Nazwa gospodarstwa"
        placeholderTextColor={`${colors.onSurfaceVariant}80`}
        accessibilityLabel="Nazwa gospodarstwa"
      />

      <View className="flex-row items-center justify-between">
        <Text className="text-on-surface-variant text-sm">
          {personCount} {personCount === 1 ? 'osoba' : personCount < 5 ? 'osoby' : 'osób'}
        </Text>
        <Pressable
          onPress={handleInvite}
          disabled={sharing}
          className="flex-row items-center gap-2 bg-primary rounded-xl px-4 py-2"
          accessibilityRole="button"
          accessibilityLabel="Zaproś do gospodarstwa"
        >
          {sharing ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <>
              <Ionicons name="share-outline" size={16} color={colors.background} />
              <Text className="text-background text-sm font-bold">Zaproś</Text>
            </>
          )}
        </Pressable>
      </View>
    </Card>
  )
}
