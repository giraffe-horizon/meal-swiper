import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchMealsFromNotion } from '@/lib/notion'

const mockNotionPage = (overrides: Record<string, unknown> = {}) => ({
  id: 'page-1',
  properties: {
    Name: { title: [{ plain_text: 'Pasta Carbonara' }] },
    Opis: { rich_text: [{ plain_text: 'Pyszna pasta' }] },
    Zdjecie: { url: 'https://i.imgur.com/abc123.jpg' },
    Czas_przygotowania: { number: 30 },
    Kcal_baza: { number: 450 },
    Kcal_z_miesem: { number: 600 },
    Bialko_baza: { number: 15 },
    Bialko_z_miesem: { number: 30 },
    Trudnosc: { select: { name: 'łatwe' } },
    Kuchnia: { select: { name: 'włoska' } },
    Skladniki_baza: { rich_text: [{ plain_text: '[{"name":"makaron","amount":"200g","category":"suche"}]' }] },
    Skladniki_mieso: { rich_text: [{ plain_text: '[{"name":"boczek","amount":"100g","category":"mięso"}]' }] },
    Przepis: { rich_text: [{ plain_text: '{"kroki":["Ugotuj makaron"]}' }] },
    Tagi: { multi_select: [{ name: 'obiad' }, { name: 'szybkie' }] },
    ...overrides,
  },
})

describe('fetchMealsFromNotion', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns Meal[] with all required fields', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        results: [mockNotionPage()],
        has_more: false,
        next_cursor: null,
      }),
    }))

    const meals = await fetchMealsFromNotion('token', 'db-id')

    expect(meals).toHaveLength(1)
    const meal = meals[0]
    expect(meal.id).toBe('page-1')
    expect(meal.nazwa).toBe('Pasta Carbonara')
    expect(meal.photo_url).toBe('https://i.imgur.com/abc123.jpg')
    expect(meal.prep_time).toBe(30)
    expect(meal.kcal_baza).toBe(450)
    expect(meal.bialko_baza).toBe(15)
    expect(meal.tags).toEqual(['obiad', 'szybkie'])
  })

  it('photo_url is not an empty string when Zdjecie is set', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        results: [mockNotionPage()],
        has_more: false,
        next_cursor: null,
      }),
    }))

    const meals = await fetchMealsFromNotion('token', 'db-id')
    expect(meals[0].photo_url).not.toBe('')
    expect(meals[0].photo_url).toMatch(/^https?:\/\//)
  })

  it('photo_url defaults to empty string when Zdjecie is null', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        results: [mockNotionPage({ Zdjecie: { url: null } })],
        has_more: false,
        next_cursor: null,
      }),
    }))

    const meals = await fetchMealsFromNotion('token', 'db-id')
    expect(meals[0].photo_url).toBe('')
  })

  it('handles pagination (has_more = true)', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          results: [mockNotionPage()],
          has_more: true,
          next_cursor: 'cursor-2',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          results: [mockNotionPage({ Name: { title: [{ plain_text: 'Pizza' }] } })],
          has_more: false,
          next_cursor: null,
        }),
      })

    vi.stubGlobal('fetch', fetchMock)

    const meals = await fetchMealsFromNotion('token', 'db-id')

    expect(meals).toHaveLength(2)
    expect(meals[0].nazwa).toBe('Pasta Carbonara')
    expect(meals[1].nazwa).toBe('Pizza')
    expect(fetchMock).toHaveBeenCalledTimes(2)

    // Second call should include start_cursor
    const secondCallBody = JSON.parse(fetchMock.mock.calls[1][1].body)
    expect(secondCallBody.start_cursor).toBe('cursor-2')
  })

  it('throws on 401 with readable message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve('Unauthorized'),
    }))

    await expect(fetchMealsFromNotion('bad-token', 'db-id'))
      .rejects.toThrow('Failed to fetch meals: 401')
  })

  it('throws on 500', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Internal Server Error'),
    }))

    await expect(fetchMealsFromNotion('token', 'db-id'))
      .rejects.toThrow('Failed to fetch meals: 500')
  })
})
