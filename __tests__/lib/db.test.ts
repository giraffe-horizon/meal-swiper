import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  fetchMealsFromD1,
  getWeeklyPlan,
  saveWeeklyPlan,
  getShoppingChecked,
  saveShoppingChecked,
  getSettings,
  saveSettings,
  getTenantByToken,
  createTenant,
} from '@/lib/db'
import type { D1Database } from '@/lib/db'

const makeMockDb = (overrides: Partial<D1Database> = {}): D1Database => ({
  prepare: vi.fn().mockReturnValue({
    bind: vi.fn().mockReturnThis(),
    first: vi.fn().mockResolvedValue(null),
    run: vi.fn().mockResolvedValue({ results: [], success: true, meta: {} }),
    all: vi.fn().mockResolvedValue({ results: [], success: true, meta: {} }),
    raw: vi.fn().mockResolvedValue([]),
  }),
  exec: vi.fn(),
  batch: vi.fn(),
  ...overrides,
})

describe('fetchMealsFromD1', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('returns Meal[] with all required fields', async () => {
    const row = {
      id: 'meal-1',
      nazwa: 'Pasta Carbonara',
      opis: 'Pyszna pasta',
      photo_url: 'https://i.imgur.com/abc123.jpg',
      prep_time: 30,
      kcal_baza: 450,
      kcal_z_miesem: 600,
      bialko_baza: 15,
      bialko_z_miesem: 30,
      trudnosc: 'łatwe',
      kuchnia: 'włoska',
      skladniki_baza: '[{"name":"makaron","amount":"200g","category":"suche"}]',
      skladniki_mieso: '[{"name":"boczek","amount":"100g","category":"mięso"}]',
      przepis: '{"kroki":["Ugotuj makaron"]}',
      tags: '["obiad","szybkie"]',
    }

    const stmt = {
      bind: vi.fn().mockReturnThis(),
      first: vi.fn(),
      run: vi.fn(),
      all: vi.fn().mockResolvedValue({ results: [row], success: true, meta: {} }),
      raw: vi.fn(),
    }
    const db = makeMockDb({ prepare: vi.fn().mockReturnValue(stmt) })

    const meals = await fetchMealsFromD1(db)

    expect(meals).toHaveLength(1)
    const meal = meals[0]
    expect(meal.id).toBe('meal-1')
    expect(meal.nazwa).toBe('Pasta Carbonara')
    expect(meal.photo_url).toBe('https://i.imgur.com/abc123.jpg')
    expect(meal.prep_time).toBe(30)
    expect(meal.kcal_baza).toBe(450)
    expect(meal.bialko_baza).toBe(15)
    expect(meal.tags).toEqual(['obiad', 'szybkie'])
  })

  it('returns empty array when no meals in DB', async () => {
    const stmt = {
      bind: vi.fn().mockReturnThis(),
      first: vi.fn(),
      run: vi.fn(),
      all: vi.fn().mockResolvedValue({ results: [], success: true, meta: {} }),
      raw: vi.fn(),
    }
    const db = makeMockDb({ prepare: vi.fn().mockReturnValue(stmt) })

    const meals = await fetchMealsFromD1(db)
    expect(meals).toHaveLength(0)
  })

  it('defaults photo_url to empty string when missing', async () => {
    const row = {
      id: 'x',
      nazwa: 'Test',
      opis: '',
      photo_url: '',
      prep_time: 0,
      kcal_baza: 0,
      kcal_z_miesem: 0,
      bialko_baza: 0,
      bialko_z_miesem: 0,
      trudnosc: '',
      kuchnia: '',
      skladniki_baza: '[]',
      skladniki_mieso: '[]',
      przepis: '{}',
      tags: '[]',
    }
    const stmt = {
      bind: vi.fn().mockReturnThis(),
      first: vi.fn(),
      run: vi.fn(),
      all: vi.fn().mockResolvedValue({ results: [row], success: true, meta: {} }),
      raw: vi.fn(),
    }
    const db = makeMockDb({ prepare: vi.fn().mockReturnValue(stmt) })

    const meals = await fetchMealsFromD1(db)
    expect(meals[0].photo_url).toBe('')
  })
})

describe('getWeeklyPlan', () => {
  it('returns plan_data when found', async () => {
    const stmt = {
      bind: vi.fn().mockReturnThis(),
      first: vi.fn().mockResolvedValue({ plan_data: '{"mon":"pasta"}' }),
      run: vi.fn(),
      all: vi.fn(),
      raw: vi.fn(),
    }
    const db = makeMockDb({ prepare: vi.fn().mockReturnValue(stmt) })

    const result = await getWeeklyPlan(db, '2026-W10', 'tenant-1')
    expect(result).toBe('{"mon":"pasta"}')
    expect(stmt.bind).toHaveBeenCalledWith('tenant-1', '2026-W10')
  })

  it('returns null when not found', async () => {
    const stmt = {
      bind: vi.fn().mockReturnThis(),
      first: vi.fn().mockResolvedValue(null),
      run: vi.fn(),
      all: vi.fn(),
      raw: vi.fn(),
    }
    const db = makeMockDb({ prepare: vi.fn().mockReturnValue(stmt) })

    const result = await getWeeklyPlan(db, '2026-W99', 'default')
    expect(result).toBeNull()
  })

  it('defaults to "default" tenant when no tenantId provided', async () => {
    const stmt = {
      bind: vi.fn().mockReturnThis(),
      first: vi.fn().mockResolvedValue(null),
      run: vi.fn(),
      all: vi.fn(),
      raw: vi.fn(),
    }
    const db = makeMockDb({ prepare: vi.fn().mockReturnValue(stmt) })

    await getWeeklyPlan(db, '2026-W10')
    expect(stmt.bind).toHaveBeenCalledWith('default', '2026-W10')
  })
})

describe('saveWeeklyPlan', () => {
  it('calls INSERT OR REPLACE with tenant_id', async () => {
    const run = vi.fn().mockResolvedValue({ success: true })
    const stmt = { bind: vi.fn().mockReturnThis(), first: vi.fn(), run, all: vi.fn(), raw: vi.fn() }
    const db = makeMockDb({ prepare: vi.fn().mockReturnValue(stmt) })

    await saveWeeklyPlan(db, '2026-W10', '{"mon":"pasta"}', 'tenant-1')
    expect(stmt.bind).toHaveBeenCalledWith('tenant-1', '2026-W10', '{"mon":"pasta"}')
    expect(run).toHaveBeenCalled()
  })
})

describe('getSettings', () => {
  it('returns value when found with tenant_id', async () => {
    const stmt = {
      bind: vi.fn().mockReturnThis(),
      first: vi.fn().mockResolvedValue({ value: '{"people":3}' }),
      run: vi.fn(),
      all: vi.fn(),
      raw: vi.fn(),
    }
    const db = makeMockDb({ prepare: vi.fn().mockReturnValue(stmt) })

    const result = await getSettings(db, 'app_settings', 'tenant-1')
    expect(result).toBe('{"people":3}')
    expect(stmt.bind).toHaveBeenCalledWith('tenant-1', 'app_settings')
  })
})

describe('saveSettings', () => {
  it('calls INSERT OR REPLACE with tenant_id', async () => {
    const run = vi.fn().mockResolvedValue({ success: true })
    const stmt = { bind: vi.fn().mockReturnThis(), first: vi.fn(), run, all: vi.fn(), raw: vi.fn() }
    const db = makeMockDb({ prepare: vi.fn().mockReturnValue(stmt) })

    await saveSettings(db, 'app_settings', '{"people":3}', 'tenant-1')
    expect(stmt.bind).toHaveBeenCalledWith('tenant-1', 'app_settings', '{"people":3}')
    expect(run).toHaveBeenCalled()
  })
})

describe('getShoppingChecked', () => {
  it('returns checked_data when found with tenant_id', async () => {
    const stmt = {
      bind: vi.fn().mockReturnThis(),
      first: vi.fn().mockResolvedValue({ checked_data: '{"item1":true}' }),
      run: vi.fn(),
      all: vi.fn(),
      raw: vi.fn(),
    }
    const db = makeMockDb({ prepare: vi.fn().mockReturnValue(stmt) })

    const result = await getShoppingChecked(db, '2026-W10', 'tenant-1')
    expect(result).toBe('{"item1":true}')
    expect(stmt.bind).toHaveBeenCalledWith('tenant-1', '2026-W10')
  })
})

describe('saveShoppingChecked', () => {
  it('calls INSERT OR REPLACE with tenant_id', async () => {
    const run = vi.fn().mockResolvedValue({ success: true })
    const stmt = { bind: vi.fn().mockReturnThis(), first: vi.fn(), run, all: vi.fn(), raw: vi.fn() }
    const db = makeMockDb({ prepare: vi.fn().mockReturnValue(stmt) })

    await saveShoppingChecked(db, '2026-W10', '{"item1":true}', 'tenant-1')
    expect(stmt.bind).toHaveBeenCalledWith('tenant-1', '2026-W10', '{"item1":true}')
    expect(run).toHaveBeenCalled()
  })
})

describe('getTenantByToken', () => {
  it('returns tenant when found', async () => {
    const stmt = {
      bind: vi.fn().mockReturnThis(),
      first: vi.fn().mockResolvedValue({ id: 'tenant-1', token: 'abc-123' }),
      run: vi.fn(),
      all: vi.fn(),
      raw: vi.fn(),
    }
    const db = makeMockDb({ prepare: vi.fn().mockReturnValue(stmt) })

    const result = await getTenantByToken(db, 'abc-123')
    expect(result).toEqual({ id: 'tenant-1', token: 'abc-123' })
  })

  it('returns null when not found', async () => {
    const stmt = {
      bind: vi.fn().mockReturnThis(),
      first: vi.fn().mockResolvedValue(null),
      run: vi.fn(),
      all: vi.fn(),
      raw: vi.fn(),
    }
    const db = makeMockDb({ prepare: vi.fn().mockReturnValue(stmt) })

    const result = await getTenantByToken(db, 'nonexistent')
    expect(result).toBeNull()
  })
})

describe('createTenant', () => {
  it('inserts a new tenant', async () => {
    const run = vi.fn().mockResolvedValue({ success: true })
    const stmt = { bind: vi.fn().mockReturnThis(), first: vi.fn(), run, all: vi.fn(), raw: vi.fn() }
    const db = makeMockDb({ prepare: vi.fn().mockReturnValue(stmt) })

    await createTenant(db, 'new-id', 'new-token')
    expect(stmt.bind).toHaveBeenCalledWith('new-id', 'new-token')
    expect(run).toHaveBeenCalled()
  })
})
