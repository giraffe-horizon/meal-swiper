const MONTH_NAMES = [
  'Sty',
  'Lut',
  'Mar',
  'Kwi',
  'Maj',
  'Cze',
  'Lip',
  'Sie',
  'Wrz',
  'Paź',
  'Lis',
  'Gru',
]

export function getMonday(weekOffset: number): Date {
  const today = new Date()
  const monday = new Date(today)
  const dayOfWeek = today.getDay()
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  monday.setDate(today.getDate() + diff + weekOffset * 7)
  return monday
}

export function getWeekKey(weekOffset: number): string {
  const monday = getMonday(weekOffset)
  return monday.toISOString().split('T')[0]
}

export function getWeekDates(weekOffset: number): Date[] {
  const monday = getMonday(weekOffset)
  const days: Date[] = []
  for (let i = 0; i < 5; i++) {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    days.push(date)
  }
  return days
}

export function formatWeekRange(weekDates: Date[]): string {
  const start = weekDates[0]
  const end = weekDates[4]

  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()} - ${end.getDate()} ${MONTH_NAMES[end.getMonth()]}`
  }
  return `${start.getDate()} ${MONTH_NAMES[start.getMonth()]} - ${end.getDate()} ${MONTH_NAMES[end.getMonth()]}`
}

export function formatWeekRangeShort(weekDates: Date[]): string {
  const start = weekDates[0]
  const end = weekDates[4]
  const pad = (n: number) => String(n + 1).padStart(2, '0')

  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()}-${end.getDate()}.${pad(end.getMonth())}`
  }
  return `${start.getDate()}.${pad(start.getMonth())}-${end.getDate()}.${pad(end.getMonth())}`
}

export function formatDateShort(date: Date): string {
  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]}`
}

export const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri'] as const
export const DAY_NAMES = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek'] as const
export const DAY_NAMES_MAP: Record<string, string> = {
  mon: 'Poniedziałek',
  tue: 'Wtorek',
  wed: 'Środa',
  thu: 'Czwartek',
  fri: 'Piątek',
}
