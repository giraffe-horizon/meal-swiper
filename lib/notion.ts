import type { Meal } from '@/types'

interface NotionPage {
  id: string
  properties: {
    Name?: { title?: Array<{ plain_text: string }> }
    Opis?: { rich_text?: Array<{ plain_text: string }> }
    Zdjecie?: { url?: string | null }
    Czas_przygotowania?: { number?: number | null }
    Kcal_baza?: { number?: number | null }
    Kcal_z_miesem?: { number?: number | null }
    Bialko_baza?: { number?: number | null }
    Bialko_z_miesem?: { number?: number | null }
    Trudnosc?: { select?: { name: string } | null }
    Kuchnia?: { select?: { name: string } | null }
    Skladniki_baza?: { rich_text?: Array<{ plain_text: string }> }
    Skladniki_mieso?: { rich_text?: Array<{ plain_text: string }> }
    Przepis?: { rich_text?: Array<{ plain_text: string }> }
    Tagi?: { multi_select?: Array<{ name: string }> }
  }
}

interface NotionQueryResponse {
  results: NotionPage[]
  has_more: boolean
  next_cursor: string | null
}

export async function fetchMealsFromNotion(
  notionToken: string,
  mealsDbId: string
): Promise<Meal[]> {
  const allMeals: Meal[] = []
  let cursor: string | undefined = undefined

  do {
    const body: Record<string, unknown> = { page_size: 100 }
    if (cursor) body.start_cursor = cursor

    const response = await fetch(
      `https://api.notion.com/v1/databases/${mealsDbId}/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${notionToken}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('Notion API error:', error)
      throw new Error(`Failed to fetch meals: ${response.status}`)
    }

    const data: NotionQueryResponse = await response.json()

    const meals = data.results.map((page) => {
      const props = page.properties
      return {
        id: page.id,
        nazwa: props.Name?.title?.[0]?.plain_text || 'Bez nazwy',
        opis: props.Opis?.rich_text?.[0]?.plain_text || '',
        photo_url: props.Zdjecie?.url || '',
        prep_time: props.Czas_przygotowania?.number || 0,
        kcal_baza: props.Kcal_baza?.number || 0,
        kcal_z_miesem: props.Kcal_z_miesem?.number || 0,
        bialko_baza: props.Bialko_baza?.number || 0,
        bialko_z_miesem: props.Bialko_z_miesem?.number || 0,
        trudnosc: (props.Trudnosc?.select?.name as Meal['trudnosc']) || '',
        kuchnia: props.Kuchnia?.select?.name || '',
        skladniki_baza: props.Skladniki_baza?.rich_text?.[0]?.plain_text || '[]',
        skladniki_mieso: props.Skladniki_mieso?.rich_text?.[0]?.plain_text || '[]',
        przepis: props.Przepis?.rich_text?.[0]?.plain_text || '{}',
        tags: props.Tagi?.multi_select?.map((t) => t.name) || [],
      } satisfies Meal
    })

    allMeals.push(...meals)
    cursor = data.has_more && data.next_cursor ? data.next_cursor : undefined
  } while (cursor)

  return allMeals
}
