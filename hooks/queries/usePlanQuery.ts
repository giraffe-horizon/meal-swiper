'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchPlan, savePlan } from '@/lib/api'
import type { WeeklyPlan } from '@/types'

export const planQueryKey = (weekKey: string, token: string | null) =>
  ['plan', weekKey, token] as const

export function usePlanQuery(weekKey: string, token: string | null) {
  return useQuery({
    queryKey: planQueryKey(weekKey, token),
    queryFn: () => fetchPlan(weekKey, token),
  })
}

export function usePlanMutation(token: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ weekKey, plan }: { weekKey: string; plan: WeeklyPlan }) =>
      savePlan(weekKey, plan, token),
    onSuccess: (_, { weekKey }) => {
      queryClient.invalidateQueries({ queryKey: ['plan', weekKey, token] })
    },
  })
}
