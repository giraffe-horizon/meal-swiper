import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchPlan, savePlan } from '@/lib/api'
import type { WeeklyPlan } from '@/types'

export const planQueryKey = (weekKey: string, token: string | null) =>
  ['plan', weekKey, token] as const

export function usePlanQuery(weekKey: string, token: string | null) {
  return useQuery({
    queryKey: planQueryKey(weekKey, token),
    queryFn: () => fetchPlan(weekKey, token),
    // Plan works with or without token (global fallback)
    refetchOnWindowFocus: false,
  })
}

export function usePlanMutation(token: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ weekKey, plan }: { weekKey: string; plan: WeeklyPlan }) =>
      savePlan(weekKey, plan, token),
    onMutate: async ({ weekKey, plan }) => {
      const qk = planQueryKey(weekKey, token)
      await queryClient.cancelQueries({ queryKey: qk })
      const previous = queryClient.getQueryData<WeeklyPlan>(qk)
      queryClient.setQueryData(qk, plan)
      return { previous, weekKey }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        const qk = planQueryKey(context.weekKey, token)
        queryClient.setQueryData(qk, context.previous)
      }
    },
    onSettled: (_data, _err, { weekKey }) => {
      queryClient.invalidateQueries({ queryKey: planQueryKey(weekKey, token) })
    },
  })
}
