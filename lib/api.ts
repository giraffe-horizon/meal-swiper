import type { Meal, MealWithVariants, WeeklyPlan, AppSettings, TenantInfo } from '@/types'

let API_BASE = '/api'
const API_HEADERS: Record<string, string> = {}

export function configureApi(options: { baseUrl: string; headers?: Record<string, string> }) {
  API_BASE = options.baseUrl
  Object.assign(API_HEADERS, options.headers || {})
}

function tenantHeaders(token: string | null): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...API_HEADERS }
  if (token) headers['X-Tenant-Token'] = token
  return headers
}

export async function fetchMeals(): Promise<Meal[]> {
  const res = await fetch(`${API_BASE}/meals`, { headers: { ...API_HEADERS } })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export async function fetchPlan(weekKey: string, token: string | null): Promise<WeeklyPlan | null> {
  const headers: Record<string, string> = { ...API_HEADERS }
  if (token) headers['X-Tenant-Token'] = token
  const res = await fetch(`${API_BASE}/plan?week=${encodeURIComponent(weekKey)}`, { headers })
  if (!res.ok) return null
  return res.json()
}

export async function savePlan(
  weekKey: string,
  plan: WeeklyPlan,
  token: string | null
): Promise<void> {
  await fetch(`${API_BASE}/plan`, {
    method: 'POST',
    headers: tenantHeaders(token),
    body: JSON.stringify({ week: weekKey, plan }),
  })
}

export async function fetchSettings(token: string | null): Promise<AppSettings | null> {
  const headers: Record<string, string> = { ...API_HEADERS }
  if (token) headers['X-Tenant-Token'] = token
  const res = await fetch(`${API_BASE}/settings?key=app_settings`, { headers })
  if (!res.ok) return null
  const data = await res.json()
  return data || null
}

export async function saveSettings(settings: AppSettings, token: string | null): Promise<void> {
  await fetch(`${API_BASE}/settings`, {
    method: 'POST',
    headers: tenantHeaders(token),
    body: JSON.stringify({ key: 'app_settings', value: settings }),
  })
}

export async function fetchShoppingChecked(
  weekKey: string,
  token: string | null
): Promise<Record<string, boolean> | null> {
  const headers: Record<string, string> = { ...API_HEADERS }
  if (token) headers['X-Tenant-Token'] = token
  const res = await fetch(`${API_BASE}/shopping-checked?week=${encodeURIComponent(weekKey)}`, {
    headers,
  })
  if (!res.ok) return null
  return res.json()
}

export async function saveShoppingChecked(
  weekKey: string,
  checked: Record<string, boolean>,
  token: string | null
): Promise<void> {
  await fetch(`${API_BASE}/shopping-checked`, {
    method: 'POST',
    headers: tenantHeaders(token),
    body: JSON.stringify({ week: weekKey, checked }),
  })
}

export async function fetchTenantInfo(token: string): Promise<TenantInfo | null> {
  const res = await fetch(`${API_BASE}/tenant?token=${encodeURIComponent(token)}`, {
    headers: { ...API_HEADERS },
  })
  if (!res.ok) return null
  return res.json()
}

export async function createTenant(data: { token: string }): Promise<void> {
  const res = await fetch(`${API_BASE}/tenant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...API_HEADERS },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
}

export async function updateTenantName(token: string, name: string): Promise<void> {
  await fetch(`${API_BASE}/tenant`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...API_HEADERS },
    body: JSON.stringify({ token, name }),
  })
}

export async function fetchIngredients(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/ingredients`, { headers: { ...API_HEADERS } })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function fetchCuisines(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/cuisines`, { headers: { ...API_HEADERS } })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function fetchMealsWithVariants(): Promise<MealWithVariants[]> {
  const res = await fetch(`${API_BASE}/meals?format=variants`, { headers: { ...API_HEADERS } })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export async function deleteAccount(token: string): Promise<void> {
  const res = await fetch(`${API_BASE}/account`, {
    method: 'DELETE',
    headers: tenantHeaders(token),
  })
  if (!res.ok) throw new Error('Delete account failed: ' + res.status)
}
