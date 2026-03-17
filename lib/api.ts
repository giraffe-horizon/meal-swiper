import type {
  Meal,
  WeeklyPlan,
  AppSettings,
  TenantInfo,
  CatalogIngredient,
  MealWithVariants,
} from '@/types'

function tenantHeaders(token: string | null): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['X-Tenant-Token'] = token
  return headers
}

export async function fetchMeals(): Promise<Meal[]> {
  const res = await fetch('/api/meals')
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export async function fetchMealsWithVariants(): Promise<MealWithVariants[]> {
  const res = await fetch('/api/meals?format=variants')
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export async function fetchPlan(weekKey: string, token: string | null): Promise<WeeklyPlan | null> {
  const headers: Record<string, string> = {}
  if (token) headers['X-Tenant-Token'] = token
  const res = await fetch(`/api/plan?week=${encodeURIComponent(weekKey)}`, { headers })
  if (!res.ok) return null
  return res.json()
}

export async function savePlan(
  weekKey: string,
  plan: WeeklyPlan,
  token: string | null
): Promise<void> {
  await fetch('/api/plan', {
    method: 'POST',
    headers: tenantHeaders(token),
    body: JSON.stringify({ week: weekKey, plan }),
  })
}

export async function fetchSettings(token: string | null): Promise<AppSettings | null> {
  const headers: Record<string, string> = {}
  if (token) headers['X-Tenant-Token'] = token
  const res = await fetch('/api/settings?key=app_settings', { headers })
  if (!res.ok) return null
  const data = await res.json()
  return data || null
}

export async function saveSettings(settings: AppSettings, token: string | null): Promise<void> {
  await fetch('/api/settings', {
    method: 'POST',
    headers: tenantHeaders(token),
    body: JSON.stringify({ key: 'app_settings', value: settings }),
  })
}

export async function fetchShoppingChecked(
  weekKey: string,
  token: string | null
): Promise<Record<string, boolean> | null> {
  const headers: Record<string, string> = {}
  if (token) headers['X-Tenant-Token'] = token
  const res = await fetch(`/api/shopping-checked?week=${encodeURIComponent(weekKey)}`, { headers })
  if (!res.ok) return null
  return res.json()
}

export async function saveShoppingChecked(
  weekKey: string,
  checked: Record<string, boolean>,
  token: string | null
): Promise<void> {
  await fetch('/api/shopping-checked', {
    method: 'POST',
    headers: tenantHeaders(token),
    body: JSON.stringify({ week: weekKey, checked }),
  })
}

export async function fetchTenantInfo(token: string): Promise<TenantInfo | null> {
  const res = await fetch(`/api/tenant?token=${encodeURIComponent(token)}`)
  if (!res.ok) return null
  return res.json()
}

export async function createTenant(data: { token: string }): Promise<void> {
  await fetch('/api/tenant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export async function updateTenantName(token: string, name: string): Promise<void> {
  await fetch('/api/tenant', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, name }),
  })
}

export async function fetchIngredients(): Promise<CatalogIngredient[]> {
  const res = await fetch('/api/ingredients')
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export async function fetchCuisines(): Promise<string[]> {
  const res = await fetch('/api/cuisines')
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  const data = await res.json()
  return Array.isArray(data) ? data : []
}
