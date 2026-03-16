'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchSettings, saveSettings } from '@/lib/api'
import type { AppSettings } from '@/types'

export const settingsQueryKey = (token: string | null) => ['settings', token] as const

export function useSettingsQuery(token: string | null) {
  return useQuery({
    queryKey: settingsQueryKey(token),
    queryFn: () => fetchSettings(token),
  })
}

export function useSettingsMutation(token: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (settings: AppSettings) => saveSettings(settings, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsQueryKey(token) })
    },
  })
}
