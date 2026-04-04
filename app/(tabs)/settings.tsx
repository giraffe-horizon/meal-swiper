import { useCallback, useEffect, useRef, useState } from 'react'
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import HouseholdSection from '@/components/settings/HouseholdSection'
import PersonCard from '@/components/settings/PersonCard'
import ErrorState from '@/components/ui/ErrorState'
import SkeletonSettings from '@/components/ui/SkeletonSettings'
import Section from '@/components/ui/Section'
import { useSettingsQuery, useSettingsMutation } from '@/hooks/queries/useSettingsQuery'
import { useTenantQuery, useUpdateTenantNameMutation } from '@/hooks/queries/useTenantQuery'
import { useCuisinesQuery } from '@/hooks/queries/useCuisinesQuery'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import { deleteAccount } from '@/lib/api'
import { randomUUID } from '@/lib/uuid'
import { colors } from '@/lib/colors'
import type { AppSettings, PersonSettings } from '@/types'

const DEFAULT_PERSON: PersonSettings = {
  name: '',
  kcal: 2000,
  protein: 80,
  dailyKcal: 2000,
  dailyProtein: 80,
  mealsPerDay: 3,
  diet: [],
  cuisinePreferences: [],
  excludedIngredients: [],
}

export default function SettingsScreen() {
  const token = useAuthStore((s) => s.token)
  const clearToken = useAuthStore((s) => s.clearToken)
  const addToast = useUIStore((s) => s.addToast)

  const settingsQuery = useSettingsQuery(token)
  const settingsMutation = useSettingsMutation(token)
  const tenantQuery = useTenantQuery(token)
  const tenantNameMutation = useUpdateTenantNameMutation(token)
  const cuisinesQuery = useCuisinesQuery()

  const [deleting, setDeleting] = useState(false)

  // Local settings copy for optimistic editing
  const [localSettings, setLocalSettings] = useState<AppSettings | null>(null)

  // Sync from server when data arrives
  useEffect(() => {
    if (settingsQuery.data && !localSettings) {
      setLocalSettings(settingsQuery.data)
    }
  }, [settingsQuery.data, localSettings])

  // Reset local settings on mutation failure (rollback)
  useEffect(() => {
    if (settingsMutation.isError && settingsQuery.data) {
      setLocalSettings(settingsQuery.data)
    }
  }, [settingsMutation.isError, settingsQuery.data])

  // Debounced save
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { mutate: mutateSettings } = settingsMutation

  const saveSettings = useCallback(
    (updated: AppSettings) => {
      setLocalSettings(updated)
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        mutateSettings(updated)
      }, 600)
    },
    [mutateSettings]
  )

  // Flush pending save on screen blur instead of discarding
  useFocusEffect(
    useCallback(() => {
      return () => {
        if (saveTimerRef.current) {
          clearTimeout(saveTimerRef.current)
          saveTimerRef.current = null
        }
        // Flush: save immediately if there are unsaved local changes
        if (localSettings) {
          mutateSettings(localSettings)
        }
      }
    }, [localSettings, mutateSettings])
  )

  const settings = localSettings ?? settingsQuery.data

  const handlePersonUpdate = useCallback(
    (index: number, updated: PersonSettings) => {
      if (!settings) return
      const persons = [...settings.persons]
      persons[index] = updated
      saveSettings({ ...settings, persons, people: persons.length })
    },
    [settings, saveSettings]
  )

  const handleAddPerson = useCallback(() => {
    if (!settings) return
    const persons = [...settings.persons, { ...DEFAULT_PERSON, id: randomUUID(), name: `Osoba ${settings.persons.length + 1}` }]
    saveSettings({ ...settings, persons, people: persons.length })
  }, [settings, saveSettings])

  const handleDeletePerson = useCallback(
    (index: number) => {
      if (!settings || settings.persons.length <= 1) return
      const persons = settings.persons.filter((_, i) => i !== index)
      saveSettings({ ...settings, persons, people: persons.length })
    },
    [settings, saveSettings]
  )

  const { mutate: mutateTenantName } = tenantNameMutation

  const handleTenantNameChange = useCallback(
    (name: string) => {
      mutateTenantName(name)
    },
    [mutateTenantName]
  )

  const handleLogout = useCallback(async () => {
    await clearToken()
    router.replace('/onboarding')
  }, [clearToken])

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Usuń konto',
      'Czy na pewno? To usunie wszystkie Twoje dane.',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: async () => {
            if (!token) return
            setDeleting(true)
            try {
              await deleteAccount(token)
              await clearToken()
              router.replace('/onboarding')
            } catch {
              addToast({ message: 'Nie udało się usunąć konta. Spróbuj ponownie.', type: 'error' })
              setDeleting(false)
            }
          },
        },
      ]
    )
  }, [token, clearToken, addToast])

  // Loading
  if (settingsQuery.isLoading) {
    return <SkeletonSettings />
  }

  // Error
  if (settingsQuery.isError) {
    return <ErrorState onRetry={() => settingsQuery.refetch()} />
  }

  const cuisines = (cuisinesQuery.data as string[] | undefined) ?? []
  const tenantName = tenantQuery.data?.name ?? ''

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="px-4 pt-4 pb-2 flex-row items-center gap-2">
          <Text className="text-on-surface text-2xl font-bold" accessibilityRole="header">
            Ustawienia
          </Text>
          {settingsMutation.isPending && (
            <ActivityIndicator size="small" color={colors.primary} accessibilityLabel="Zapisywanie" />
          )}
        </View>

        <View className="px-4">
          {/* Household section */}
          {token && (
            <HouseholdSection
              name={tenantName}
              token={token}
              personCount={settings?.persons.length ?? 0}
              onNameChange={handleTenantNameChange}
            />
          )}

          {/* People */}
          <Section title="Osoby">
            {settings?.persons.map((person, index) => (
              <PersonCard
                key={person.id ?? person.name + index}
                person={person}
                index={index}
                cuisines={cuisines}
                canDelete={settings.persons.length > 1}
                onUpdate={(updated) => handlePersonUpdate(index, updated)}
                onDelete={() => handleDeletePerson(index)}
              />
            ))}

            <Pressable
              onPress={handleAddPerson}
              className="flex-row items-center justify-center gap-2 bg-surface-container rounded-2xl py-3 min-h-[48px]"
              accessibilityRole="button"
              accessibilityLabel="Dodaj osobę"
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
              <Text className="text-primary font-bold">Dodaj osobę</Text>
            </Pressable>
          </Section>

          {/* Account section */}
          <Section title="Konto">
            <Pressable
              onPress={handleLogout}
              className="flex-row items-center gap-3 bg-surface-container rounded-2xl px-4 py-3 mb-3 min-h-[48px]"
              accessibilityRole="button"
              accessibilityLabel="Wyloguj"
            >
              <Ionicons name="log-out-outline" size={20} color={colors.onSurface} />
              <Text className="text-on-surface text-base">Wyloguj</Text>
            </Pressable>

            <Pressable
              onPress={handleDeleteAccount}
              disabled={deleting}
              className="flex-row items-center justify-center gap-2 border border-red-500 rounded-2xl px-4 py-3 min-h-[48px]"
              accessibilityRole="button"
              accessibilityLabel="Usuń konto"
              style={{ opacity: deleting ? 0.5 : 1 }}
            >
              {deleting ? (
                <ActivityIndicator size="small" color="#ef4444" />
              ) : (
                <>
                  <Ionicons name="warning-outline" size={20} color="#ef4444" />
                  <Text className="text-red-500 font-bold">Usuń konto</Text>
                </>
              )}
            </Pressable>
          </Section>
        </View>
      </ScrollView>
    </View>
  )
}
