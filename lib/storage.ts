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
  mon_eaten: false,
  tue_eaten: false,
  wed_eaten: false,
  thu_eaten: false,
  fri_eaten: false,
}

export function getWeeklyPlan(weekKey: string): WeeklyPlan {
  if (typeof window === 'undefined') return createDefaultPlan()
  const saved = localStorage.getItem(`weeklyPlan_${weekKey}`)
  if (saved) {
    return JSON.parse(saved) as WeeklyPlan
  }
  return { ...DEFAULT_PLAN }
}

export function saveWeeklyPlan(weekKey: string, plan: WeeklyPlan): void {
  localStorage.setItem(`weeklyPlan_${weekKey}`, JSON.stringify(plan))
}

export function getCheckedItems(weekKey: string): Record<string, boolean> {
  const saved = localStorage.getItem(`checkedItems_${weekKey}`)
  if (saved) {
    return JSON.parse(saved) as Record<string, boolean>
  }
  return {}
}

export function saveCheckedItems(weekKey: string, items: Record<string, boolean>): void {
  localStorage.setItem(`checkedItems_${weekKey}`, JSON.stringify(items))
}

export function removeCheckedItems(weekKey: string): void {
  localStorage.removeItem(`checkedItems_${weekKey}`)
}

export function createDefaultPlan(): WeeklyPlan {
  return { ...DEFAULT_PLAN }
}
