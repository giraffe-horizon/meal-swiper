'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import { fetchShoppingChecked, saveShoppingChecked } from '@/lib/api'

export const shoppingCheckedQueryKey = (weekKey: string, token: string | null) =>
  ['shopping-checked', weekKey, token] as const

export function useShoppingCheckedQuery(weekKey: string, token: string | null) {
  return useQuery({
    queryKey: shoppingCheckedQueryKey(weekKey, token),
    queryFn: () => fetchShoppingChecked(weekKey, token),
    // Shopping works with or without token (global fallback)
  })
}

export function useShoppingCheckedMutation(token: string | null) {
  return useMutation({
    mutationFn: ({ weekKey, checked }: { weekKey: string; checked: Record<string, boolean> }) =>
      saveShoppingChecked(weekKey, checked, token),
    // No invalidation — local state is source of truth; server is backup
  })
}
