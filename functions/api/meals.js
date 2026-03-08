// GET /api/meals - List all meals from Notion

export async function onRequest(context) {
  const { NOTION_TOKEN, MEALS_DB_ID } = context.env

  if (!NOTION_TOKEN) {
    return new Response(JSON.stringify({ error: 'Missing NOTION_TOKEN' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    // Query the Meals database
    const response = await fetch(`https://api.notion.com/v1/databases/${MEALS_DB_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Notion API error:', error)
      return new Response(JSON.stringify({ error: 'Failed to fetch meals' }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const data = await response.json()

    // Transform Notion pages to meal objects
    const meals = data.results.map(page => {
      const props = page.properties
      return {
        id: page.id,
        nazwa: props.Name?.title?.[0]?.plain_text || 'Bez nazwy',
        opis: props.Opis?.rich_text?.[0]?.plain_text || '',
        photo_url: props.Zdjecie?.url || '',
        prep_time: props.Czas_przygotowania?.number || 0,
        kcal_baza: props.Kcal_baza?.number || 0,
        kcal_z_miesem: props.Kcal_z_miesem?.number || 0,
        skladniki_baza: props.Skladniki_baza?.rich_text?.[0]?.plain_text || '[]',
        skladniki_mieso: props.Skladniki_mieso?.rich_text?.[0]?.plain_text || '[]',
        tags: props.Tagi?.multi_select?.map(t => t.name) || []
      }
    })

    return new Response(JSON.stringify(meals), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (error) {
    console.error('Error fetching meals:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
