import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { POST } from '@/app/api/ticktick-export/route'
import type { NextRequest } from 'next/server'

function makeRequest(body: unknown): NextRequest {
  return new Request('http://localhost/api/ticktick-export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest
}

describe('POST /api/ticktick-export', () => {
  beforeEach(() => {
    vi.stubEnv('TICKTICK_ACCESS_TOKEN', '')
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns 503 when TICKTICK_ACCESS_TOKEN is not configured', async () => {
    const res = await POST(makeRequest({ items: [{ name: 'Makaron', amount: '200g' }] }))
    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body.error).toContain('TICKTICK_ACCESS_TOKEN')
  })

  it('returns 400 when items are missing', async () => {
    vi.stubEnv('TICKTICK_ACCESS_TOKEN', 'test-token')
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })

  it('returns 400 when items array is empty', async () => {
    vi.stubEnv('TICKTICK_ACCESS_TOKEN', 'test-token')
    const res = await POST(makeRequest({ items: [] }))
    expect(res.status).toBe(400)
  })

  it('creates a TickTick project and adds tasks on success', async () => {
    vi.stubEnv('TICKTICK_ACCESS_TOKEN', 'valid-token')
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'project-123' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id2TaskMap: {} }),
      })

    const res = await POST(
      makeRequest({
        items: [
          { name: 'Makaron', amount: '200g' },
          { name: 'Jajka', amount: '3 szt' },
        ],
        weekLabel: '10-14.03',
      })
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.projectId).toBe('project-123')
    expect(body.projectName).toBe('🛒 Zakupy 10-14.03')

    // Verify TickTick API was called with correct payload
    expect(global.fetch).toHaveBeenCalledTimes(2)
    const [, batchCall] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls
    const batchBody = JSON.parse(batchCall[1].body as string)
    expect(batchBody.add).toHaveLength(2)
    expect(batchBody.add[0].title).toBe('Makaron — 200g')
    expect(batchBody.add[0].projectId).toBe('project-123')
  })

  it('returns 502 when TickTick API fails', async () => {
    vi.stubEnv('TICKTICK_ACCESS_TOKEN', 'valid-token')
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    })

    const res = await POST(makeRequest({ items: [{ name: 'Makaron', amount: '200g' }] }))

    expect(res.status).toBe(502)
  })
})
