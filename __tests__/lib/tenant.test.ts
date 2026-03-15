import { describe, it, expect, vi, beforeEach } from 'vitest'
import { resolveTenantId, extractTenantToken } from '@/lib/tenant'
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

describe('extractTenantToken', () => {
  it('returns token from X-Tenant-Token header', () => {
    const request = new Request('https://example.com/api/plan?week=2026-03-09', {
      headers: { 'X-Tenant-Token': 'abc-123' },
    })
    expect(extractTenantToken(request)).toBe('abc-123')
  })

  it('returns token from query param', () => {
    const request = new Request('https://example.com/api/plan?week=2026-03-09&token=xyz-456')
    expect(extractTenantToken(request)).toBe('xyz-456')
  })

  it('prefers header over query param', () => {
    const request = new Request('https://example.com/api/plan?token=query-token', {
      headers: { 'X-Tenant-Token': 'header-token' },
    })
    expect(extractTenantToken(request)).toBe('header-token')
  })

  it('returns null when no token present', () => {
    const request = new Request('https://example.com/api/plan?week=2026-03-09')
    expect(extractTenantToken(request)).toBeNull()
  })
})

describe('resolveTenantId', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('returns "default" when token is null', async () => {
    const db = makeMockDb()
    const result = await resolveTenantId(db, null)
    expect(result).toBe('default')
  })

  it('returns tenant id when token exists in DB', async () => {
    const stmt = {
      bind: vi.fn().mockReturnThis(),
      first: vi.fn().mockResolvedValue({ id: 'tenant-1', token: 'abc-123' }),
      run: vi.fn(),
      all: vi.fn(),
      raw: vi.fn(),
    }
    const db = makeMockDb({ prepare: vi.fn().mockReturnValue(stmt) })

    const result = await resolveTenantId(db, 'abc-123')
    expect(result).toBe('tenant-1')
  })

  it('creates new tenant when token not found in DB', async () => {
    const run = vi.fn().mockResolvedValue({ success: true })
    let callCount = 0
    const prepare = vi.fn().mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // First call: getTenantByToken — returns null
        return {
          bind: vi.fn().mockReturnThis(),
          first: vi.fn().mockResolvedValue(null),
          run: vi.fn(),
          all: vi.fn(),
          raw: vi.fn(),
        }
      }
      // Second call: createTenant
      return {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn(),
        run,
        all: vi.fn(),
        raw: vi.fn(),
      }
    })
    const db = makeMockDb({ prepare })

    const result = await resolveTenantId(db, 'new-token')
    expect(result).toBe('new-token')
    expect(run).toHaveBeenCalled()
  })
})
