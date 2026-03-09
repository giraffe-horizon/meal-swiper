#!/usr/bin/env node
/**
 * Naprawia zepsute obrazki dań — generuje przez nano-banana-pro i uploaduje na Imgur
 */
import { config } from 'dotenv'
import path from 'node:path'
import { generateImage } from './lib/image-gen.js'

config({ path: path.join(import.meta.dirname, '.env') })

const NOTION_TOKEN = process.env.NOTION_TOKEN
const MEALS_DB_ID = process.env.MEALS_DB_ID

async function fetchAllMeals() {
  const results = []
  let cursor = undefined
  do {
    const body = { page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) }
    const r = await fetch(`https://api.notion.com/v1/databases/${MEALS_DB_ID}/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    const data = await r.json()
    results.push(...data.results)
    cursor = data.has_more ? data.next_cursor : undefined
  } while (cursor)
  return results
}

async function updateMealPhoto(pageId, imgurUrl) {
  await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { Zdjecie: { url: imgurUrl } },
    }),
  })
}

async function main() {
  console.log('🔧 Naprawianie obrazków...')
  const meals = await fetchAllMeals()

  // Tylko dania z lokalnymi URL-ami (nie imgur)
  const broken = meals.filter((p) => {
    const url = p.properties?.Zdjecie?.url || ''
    return url && !url.includes('imgur') && !url.includes('i.imgur')
  })

  console.log(`🍽️  Dania do naprawy: ${broken.length}`)

  for (const page of broken) {
    const name = page.properties?.Name?.title?.[0]?.plain_text ?? 'Danie'
    const opis = page.properties?.Opis?.rich_text?.[0]?.plain_text ?? ''
    const kuchnia = page.properties?.Kuchnia?.select?.name ?? ''

    console.log(`\n📸 Generuję zdjęcie dla: ${name}`)

    try {
      const mealObj = {
        nazwa: name,
        prompt_zdjecia: `${name}, ${kuchnia || 'European'} cuisine, food photography, professional, appetizing, natural lighting, restaurant quality plate`,
      }
      const imgurUrl = await generateImage(mealObj, process.env.GEMINI_API_KEY)
      if (imgurUrl) {
        await updateMealPhoto(page.id, imgurUrl)
        console.log(`   ✅ Imgur: ${imgurUrl}`)
      } else {
        console.log(`   ⚠️  Brak URL z imgur, pomijam`)
      }
    } catch (err) {
      console.error(`   ❌ Błąd: ${err.message}`)
    }

    // Przerwa między requestami
    await new Promise((r) => setTimeout(r, 2000))
  }

  console.log('\n✨ Gotowe!')
}

main().catch(console.error)
