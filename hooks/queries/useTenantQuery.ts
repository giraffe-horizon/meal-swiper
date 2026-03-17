'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchTenantInfo, createTenant, updateTenantName } from '@/lib/api'

export const tenantQueryKey = (token: string) => ['tenant', token] as const

export function useTenantQuery(token: string | null) {
  return useQuery({
    queryKey: token ? tenantQueryKey(token) : ['tenant', null],
    queryFn: () => fetchTenantInfo(token!),
    enabled: !!token,
  })
}

export function useCreateTenantMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createTenant,
    onSuccess: (_, { token }) => {
      queryClient.invalidateQueries({ queryKey: tenantQueryKey(token) })
    },
  })
}

export function useUpdateTenantNameMutation(token: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => updateTenantName(token!, name),
    onSuccess: () => {
      if (token) queryClient.invalidateQueries({ queryKey: tenantQueryKey(token) })
    },
  })
}
