// Script to create Notion databases and seed initial data
// Run with: NOTION_TOKEN=your_token node scripts/setup-notion.js

const NOTION_TOKEN = process.env.NOTION_TOKEN

if (!NOTION_TOKEN) {
  console.error('Error: NOTION_TOKEN environment variable is required')
  console.log('Usage: NOTION_TOKEN=your_token node scripts/setup-notion.js')
  process.exit(1)
}

async function createMealsDatabase() {
  console.log('Creating Meals database...')

  const response = await fetch('https://api.notion.com/v1/databases', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      parent: {
        type: 'page_id',
        page_id: await getWorkspaceRootPage()
      },
      title: [
        {
          type: 'text',
          text: {
            content: 'Przepisy'
          }
        }
      ],
      properties: {
        Name: {
          title: {}
        },
        Opis: {
          rich_text: {}
        },
        Zdjecie: {
          url: {}
        },
        Czas_przygotowania: {
          number: {
            format: 'number'
          }
        },
        Kcal_baza: {
          number: {
            format: 'number'
          }
        },
        Kcal_z_miesem: {
          number: {
            format: 'number'
          }
        },
        Skladniki_baza: {
          rich_text: {}
        },
        Skladniki_mieso: {
          rich_text: {}
        },
        Tagi: {
          multi_select: {
            options: [
              { name: 'szybkie', color: 'green' },
              { name: 'azjatyckie', color: 'orange' },
              { name: 'włoskie', color: 'red' },
              { name: 'śródziemnomorskie', color: 'blue' },
              { name: 'zdrowe', color: 'purple' },
              { name: 'kolorowe', color: 'pink' },
              { name: 'rozgrzewające', color: 'yellow' }
            ]
          }
        },
        Wegetarianskie: {
          checkbox: {}
        }
      }
    })
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Failed to create Meals database:', error)
    throw new Error('Failed to create Meals database')
  }

  const data = await response.json()
  console.log('✓ Meals database created:', data.id)
  return data.id
}

async function createWeeklyPlanDatabase(mealsDbId) {
  console.log('Creating Weekly Plan database...')

  const response = await fetch('https://api.notion.com/v1/databases', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      parent: {
        type: 'page_id',
        page_id: await getWorkspaceRootPage()
      },
      title: [
        {
          type: 'text',
          text: {
            content: 'Tygodniowy Plan'
          }
        }
      ],
      properties: {
        Tydzien: {
          title: {}
        },
        Poniedzialek: {
          relation: {
            database_id: mealsDbId,
            single_property: {}
          }
        },
        Wtorek: {
          relation: {
            database_id: mealsDbId,
            single_property: {}
          }
        },
        Sroda: {
          relation: {
            database_id: mealsDbId,
            single_property: {}
          }
        },
        Czwartek: {
          relation: {
            database_id: mealsDbId,
            single_property: {}
          }
        },
        Piatek: {
          relation: {
            database_id: mealsDbId,
            single_property: {}
          }
        }
      }
    })
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Failed to create Weekly Plan database:', error)
    throw new Error('Failed to create Weekly Plan database')
  }

  const data = await response.json()
  console.log('✓ Weekly Plan database created:', data.id)
  return data.id
}

async function getWorkspaceRootPage() {
  // Search for a page to use as parent (or use an existing page ID)
  const response = await fetch('https://api.notion.com/v1/search', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      filter: {
        value: 'page',
        property: 'object'
      },
      page_size: 1
    })
  })

  const data = await response.json()
  if (data.results.length > 0) {
    return data.results[0].id
  }

  // If no pages found, create a root page
  const createResponse = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      parent: {
        type: 'workspace',
        workspace: true
      },
      properties: {
        title: {
          title: [
            {
              text: {
                content: 'Meal Swiper'
              }
            }
          ]
        }
      }
    })
  })

  const createData = await createResponse.json()
  return createData.id
}

async function seedMeals(mealsDbId) {
  console.log('Seeding meals...')

  const meals = [
    {
      name: 'Stir-fry ryżowy z warzywami',
      opis: 'Szybki stir-fry z ryżem jaśminowym, brokułem, papryką i marchewką w sosie sojowym',
      zdjecie: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800',
      czas: 25,
      kcalBaza: 490,
      kcalMieso: 850,
      skladnikiBaza: [
        {"name":"Ryż jaśminowy","amount":"160g","category":"suche"},
        {"name":"Brokuł","amount":"200g","category":"warzywa"},
        {"name":"Papryka czerwona","amount":"2 szt","category":"warzywa"},
        {"name":"Marchew","amount":"2 szt","category":"warzywa"},
        {"name":"Sos sojowy","amount":"3 łyżki","category":"suche"},
        {"name":"Czosnek","amount":"2 ząbki","category":"warzywa"},
        {"name":"Imbir","amount":"1 łyżeczka","category":"warzywa"}
      ],
      skladnikiMieso: [
        {"name":"Pierś kurczaka","amount":"200g","category":"mięso"}
      ],
      tagi: ['szybkie', 'azjatyckie']
    },
    {
      name: 'Kasza bulgur z pieczonymi warzywami',
      opis: 'Kasza bulgur z bakłażanem, cukinią i sosem jogurtowo-czosnkowym',
      zdjecie: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
      czas: 35,
      kcalBaza: 500,
      kcalMieso: 880,
      skladnikiBaza: [
        {"name":"Kasza bulgur","amount":"160g","category":"suche"},
        {"name":"Bakłażan","amount":"1 szt","category":"warzywa"},
        {"name":"Cukinia","amount":"1 szt","category":"warzywa"},
        {"name":"Pomidorki cherry","amount":"200g","category":"warzywa"},
        {"name":"Czerwona cebula","amount":"1 szt","category":"warzywa"},
        {"name":"Jogurt grecki","amount":"150g","category":"nabiał"},
        {"name":"Czosnek","amount":"2 ząbki","category":"warzywa"}
      ],
      skladnikiMieso: [
        {"name":"Mielony indyk","amount":"220g","category":"mięso"}
      ],
      tagi: ['śródziemnomorskie']
    },
    {
      name: 'Makaron bolognese (wersja lekka)',
      opis: 'Makaron z sosem pomidorowym, czosnkiem i bazylią — Ala z soczewicą, Łukasz z indykiem',
      zdjecie: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800',
      czas: 25,
      kcalBaza: 520,
      kcalMieso: 900,
      skladnikiBaza: [
        {"name":"Makaron pełnoziarnisty","amount":"130g","category":"suche"},
        {"name":"Passata pomidorowa","amount":"300ml","category":"suche"},
        {"name":"Soczewica czerwona","amount":"80g","category":"suche"},
        {"name":"Czosnek","amount":"3 ząbki","category":"warzywa"},
        {"name":"Cebula","amount":"1 szt","category":"warzywa"},
        {"name":"Oliwa z oliwek","amount":"2 łyżki","category":"suche"},
        {"name":"Bazylia","amount":"garść","category":"warzywa"}
      ],
      skladnikiMieso: [
        {"name":"Mielony indyk","amount":"200g","category":"mięso"}
      ],
      tagi: ['włoskie', 'szybkie']
    },
    {
      name: 'Buddha bowl z quinoa',
      opis: 'Quinoa z pieczoną dynią, awokado, pomidorkami i dressingiem tahini',
      zdjecie: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800',
      czas: 30,
      kcalBaza: 480,
      kcalMieso: 760,
      skladnikiBaza: [
        {"name":"Quinoa","amount":"150g","category":"suche"},
        {"name":"Dynia","amount":"300g","category":"warzywa"},
        {"name":"Awokado","amount":"1 szt","category":"warzywa"},
        {"name":"Pomidorki cherry","amount":"150g","category":"warzywa"},
        {"name":"Tahini","amount":"2 łyżki","category":"suche"},
        {"name":"Cytryna","amount":"1 szt","category":"warzywa"},
        {"name":"Szpinak","amount":"100g","category":"warzywa"}
      ],
      skladnikiMieso: [
        {"name":"Pierś kurczaka","amount":"180g","category":"mięso"}
      ],
      tagi: ['zdrowe', 'kolorowe']
    },
    {
      name: 'Curry z ciecierzycą i szpinakiem',
      opis: 'Kremowe curry z ciecierzycą, szpinakiem i mlekiem kokosowym — podawane z ryżem basmati',
      zdjecie: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
      czas: 30,
      kcalBaza: 530,
      kcalMieso: 820,
      skladnikiBaza: [
        {"name":"Ciecierzyca (z puszki)","amount":"400g","category":"suche"},
        {"name":"Szpinak","amount":"200g","category":"warzywa"},
        {"name":"Mleko kokosowe","amount":"200ml","category":"suche"},
        {"name":"Passata pomidorowa","amount":"200ml","category":"suche"},
        {"name":"Ryż basmati","amount":"150g","category":"suche"},
        {"name":"Cebula","amount":"1 szt","category":"warzywa"},
        {"name":"Czosnek","amount":"3 ząbki","category":"warzywa"},
        {"name":"Curry w proszku","amount":"2 łyżeczki","category":"suche"},
        {"name":"Imbir","amount":"1 łyżeczka","category":"warzywa"}
      ],
      skladnikiMieso: [
        {"name":"Pierś kurczaka","amount":"180g","category":"mięso"}
      ],
      tagi: ['azjatyckie', 'rozgrzewające']
    }
  ]

  for (const meal of meals) {
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        parent: {
          database_id: mealsDbId
        },
        properties: {
          Name: {
            title: [{ text: { content: meal.name } }]
          },
          Opis: {
            rich_text: [{ text: { content: meal.opis } }]
          },
          Zdjecie: {
            url: meal.zdjecie
          },
          Czas_przygotowania: {
            number: meal.czas
          },
          Kcal_baza: {
            number: meal.kcalBaza
          },
          Kcal_z_miesem: {
            number: meal.kcalMieso
          },
          Skladniki_baza: {
            rich_text: [{ text: { content: JSON.stringify(meal.skladnikiBaza) } }]
          },
          Skladniki_mieso: {
            rich_text: [{ text: { content: JSON.stringify(meal.skladnikiMieso) } }]
          },
          Tagi: {
            multi_select: meal.tagi.map(tag => ({ name: tag }))
          },
          Wegetarianskie: {
            checkbox: true
          }
        }
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error(`Failed to create meal ${meal.name}:`, error)
    } else {
      console.log(`✓ Created meal: ${meal.name}`)
    }

    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 300))
  }
}

async function main() {
  try {
    console.log('Starting Notion setup...\n')

    const mealsDbId = await createMealsDatabase()
    const weeklyPlanDbId = await createWeeklyPlanDatabase(mealsDbId)

    console.log('\n--- Database IDs (save these) ---')
    console.log('MEALS_DB_ID:', mealsDbId)
    console.log('WEEKLY_PLAN_DB_ID:', weeklyPlanDbId)
    console.log('---\n')

    await seedMeals(mealsDbId)

    console.log('\n✅ Setup complete!')
    console.log('\nNext steps:')
    console.log('1. Add these environment variables to Cloudflare Pages:')
    console.log(`   NOTION_TOKEN=<your_notion_token>`)
    console.log(`   MEALS_DB_ID=${mealsDbId}`)
    console.log(`   WEEKLY_PLAN_DB_ID=${weeklyPlanDbId}`)
  } catch (error) {
    console.error('Setup failed:', error)
    process.exit(1)
  }
}

main()
