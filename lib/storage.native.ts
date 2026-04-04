import AsyncStorage from '@react-native-async-storage/async-storage'
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

async function tenantPrefix(): Promise<string> {
  const token = await AsyncStorage.getItem('meal_swiper_tenant_token')
  return token ? `${token}_` : ''
}

export async function getWeeklyPlan(weekKey: string): Promise<WeeklyPlan> {
  const prefix = await tenantPrefix()
  const saved = await AsyncStorage.getItem(`${prefix}weeklyPlan_${weekKey}`)
  if (saved) {
    return JSON.parse(saved) as WeeklyPlan
  }
  return { ...DEFAULT_PLAN }
}

export async function saveWeeklyPlan(weekKey: string, plan: WeeklyPlan): Promise<void> {
  const prefix = await tenantPrefix()
  await AsyncStorage.setItem(`${prefix}weeklyPlan_${weekKey}`, JSON.stringify(plan))
}

export async function getCheckedItems(weekKey: string): Promise<Record<string, boolean>> {
  const prefix = await tenantPrefix()
  const saved = await AsyncStorage.getItem(`${prefix}checkedItems_${weekKey}`)
  if (saved) {
    return JSON.parse(saved) as Record<string, boolean>
  }
  return {}
}

export async function saveCheckedItems(
  weekKey: string,
  items: Record<string, boolean>
): Promise<void> {
  const prefix = await tenantPrefix()
  await AsyncStorage.setItem(`${prefix}checkedItems_${weekKey}`, JSON.stringify(items))
}

export async function removeCheckedItems(weekKey: string): Promise<void> {
  const prefix = await tenantPrefix()
  await AsyncStorage.removeItem(`${prefix}checkedItems_${weekKey}`)
}

export function createDefaultPlan(): WeeklyPlan {
  return { ...DEFAULT_PLAN }
}
