import type { WeeklyPlan } from '@/types'

const DEFAULT_PLAN: WeeklyPlan = {
  mon: null,
  tue: null,
  wed: null,
  thu: null,
  fri: null,
  mon_free: false,
  tue_free: false,
  wed_free: false,
  thu_free: false,
  fri_free: false,
}

function tenantPrefix(): string {
  if (typeof window === 'undefined') return ''
  const token = localStorage.getItem('meal_swiper_tenant_token') || ''
  return token ? `${token}_` : ''
}

export function getWeeklyPlan(weekKey: string): WeeklyPlan {
  if (typeof window === 'undefined') return createDefaultPlan()
  const prefix = tenantPrefix()
  const saved = localStorage.getItem(`${prefix}weeklyPlan_${weekKey}`)
  if (saved) {
    return JSON.parse(saved) as WeeklyPlan
  }
  return { ...DEFAULT_PLAN }
}

export function saveWeeklyPlan(weekKey: string, plan: WeeklyPlan): void {
  const prefix = tenantPrefix()
  localStorage.setItem(`${prefix}weeklyPlan_${weekKey}`, JSON.stringify(plan))
}

export function getCheckedItems(weekKey: string): Record<string, boolean> {
  const prefix = tenantPrefix()
  const saved = localStorage.getItem(`${prefix}checkedItems_${weekKey}`)
  if (saved) {
    return JSON.parse(saved) as Record<string, boolean>
  }
  return {}
}

export function saveCheckedItems(weekKey: string, items: Record<string, boolean>): void {
  const prefix = tenantPrefix()
  localStorage.setItem(`${prefix}checkedItems_${weekKey}`, JSON.stringify(items))
}

export function removeCheckedItems(weekKey: string): void {
  const prefix = tenantPrefix()
  localStorage.removeItem(`${prefix}checkedItems_${weekKey}`)
}

export function createDefaultPlan(): WeeklyPlan {
  return { ...DEFAULT_PLAN }
}
