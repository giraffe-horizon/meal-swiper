import { describe, it, expect, vi, afterEach } from 'vitest'

describe('randomUUID', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns a valid UUID v4 string', async () => {
    const { randomUUID } = await import('../uuid')
    const uuid = randomUUID()
    expect(uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    )
  })

  it('returns a valid UUID even when crypto.randomUUID is unavailable', async () => {
    // Simulate environment where crypto.randomUUID doesn't exist
    const original = globalThis.crypto.randomUUID
    // @ts-expect-error — intentionally removing for test
    globalThis.crypto.randomUUID = undefined

    // Re-import to get fresh module
    vi.resetModules()
    const { randomUUID } = await import('../uuid')
    const uuid = randomUUID()

    expect(uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    )

    globalThis.crypto.randomUUID = original
  })

  it('returns a valid UUID even when crypto.randomUUID throws', async () => {
    const original = globalThis.crypto.randomUUID
    globalThis.crypto.randomUUID = () => {
      throw new Error('Not supported')
    }

    vi.resetModules()
    const { randomUUID } = await import('../uuid')
    const uuid = randomUUID()

    expect(uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    )

    globalThis.crypto.randomUUID = original
  })
})
