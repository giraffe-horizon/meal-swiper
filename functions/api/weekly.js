// GET /api/weekly?week=2026-03-09 - Get weekly plan
// POST /api/weekly - Save weekly plan

export async function onRequestGet(context) {
  const { NOTION_TOKEN, WEEKLY_PLAN_DB_ID } = context.env
  const url = new URL(context.request.url)
  const week = url.searchParams.get('week')

  if (!NOTION_TOKEN || !WEEKLY_PLAN_DB_ID) {
    return new Response(JSON.stringify({ error: 'Missing configuration' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    // Query for the specific week
    const response = await fetch(`https://api.notion.com/v1/databases/${WEEKLY_PLAN_DB_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filter: {
          property: 'Tydzien',
          title: {
            equals: week
          }
        }
      })
    })

    const data = await response.json()

    if (data.results.length === 0) {
      return new Response(JSON.stringify({ week, meals: {} }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const page = data.results[0]
    const props = page.properties

    const weeklyPlan = {
      week,
      meals: {
        mon: props.Poniedzialek?.relation?.[0]?.id || null,
        tue: props.Wtorek?.relation?.[0]?.id || null,
        wed: props.Sroda?.relation?.[0]?.id || null,
        thu: props.Czwartek?.relation?.[0]?.id || null,
        fri: props.Piatek?.relation?.[0]?.id || null
      }
    }

    return new Response(JSON.stringify(weeklyPlan), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error fetching weekly plan:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export async function onRequestPost(context) {
  const { NOTION_TOKEN, WEEKLY_PLAN_DB_ID } = context.env

  if (!NOTION_TOKEN || !WEEKLY_PLAN_DB_ID) {
    return new Response(JSON.stringify({ error: 'Missing configuration' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const body = await context.request.json()
    const { week, meals } = body

    // First, check if a plan for this week already exists
    const queryResponse = await fetch(`https://api.notion.com/v1/databases/${WEEKLY_PLAN_DB_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filter: {
          property: 'Tydzien',
          title: {
            equals: week
          }
        }
      })
    })

    const queryData = await queryResponse.json()
    const existingPage = queryData.results[0]

    const properties = {
      Tydzien: {
        title: [{ text: { content: week } }]
      },
      Poniedzialek: {
        relation: meals.mon ? [{ id: meals.mon.id }] : []
      },
      Wtorek: {
        relation: meals.tue ? [{ id: meals.tue.id }] : []
      },
      Sroda: {
        relation: meals.wed ? [{ id: meals.wed.id }] : []
      },
      Czwartek: {
        relation: meals.thu ? [{ id: meals.thu.id }] : []
      },
      Piatek: {
        relation: meals.fri ? [{ id: meals.fri.id }] : []
      }
    }

    let response
    if (existingPage) {
      // Update existing page
      response = await fetch(`https://api.notion.com/v1/pages/${existingPage.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${NOTION_TOKEN}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ properties })
      })
    } else {
      // Create new page
      response = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NOTION_TOKEN}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          parent: { database_id: WEEKLY_PLAN_DB_ID },
          properties
        })
      })
    }

    if (!response.ok) {
      const error = await response.text()
      console.error('Notion API error:', error)
      return new Response(JSON.stringify({ error: 'Failed to save weekly plan' }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const data = await response.json()

    return new Response(JSON.stringify({ success: true, page: data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error saving weekly plan:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
