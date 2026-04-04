import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock fetch globally
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('configureApi', () => {
  beforeEach(() => {
    vi.resetModules()
    mockFetch.mockReset()
  })

  it('configureApi sets base URL used by fetchMeals', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    })

    const { configureApi, fetchMeals } = await import('../api')
    configureApi({
      baseUrl: 'https://my-api.example.com',
      headers: { 'X-API-Key': 'test-key' },
    })

    await fetchMeals()

    expect(mockFetch).toHaveBeenCalledWith(
      'https://my-api.example.com/meals',
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-API-Key': 'test-key' }),
      })
    )
  })
})

describe('deleteAccount', () => {
  beforeEach(() => {
    vi.resetModules()
    mockFetch.mockReset()
  })

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 })

    const { deleteAccount } = await import('../api')

    await expect(deleteAccount('test-token')).rejects.toThrow(
      'Delete account failed: 500'
    )
  })

  it('resolves on ok response', async () => {
    mockFetch.mockResolvedValue({ ok: true })

    const { deleteAccount } = await import('../api')

    await expect(deleteAccount('test-token')).resolves.toBeUndefined()
  })
})
