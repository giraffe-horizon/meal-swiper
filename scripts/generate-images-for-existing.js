#!/usr/bin/env node
// Generuje zdjęcia, zapisuje do public/meals/, aktualizuje URL w Notion

import 'dotenv/config'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const execFileAsync = promisify(execFile)

const NOTION_TOKEN = process.env.NOTION_TOKEN
const MEALS_DB_ID = process.env.MEALS_DB_ID
const GEMINI_API_KEY = process.env.GEMINI_API_KEY

// Zdjęcia lądują w public/meals/ — serwowane przez Cloudflare Pages
const PUBLIC_MEALS_DIR = path.join(__dirname, '..', 'public', 'meals')
const BASE_URL = 'https://meal-swiper.pages.dev/meals'

fs.mkdirSync(PUBLIC_MEALS_DIR, { recursive: true })

const NANO_BANANA = path.join(
  process.env.HOME,
  '.npm-global/lib/node_modules/openclaw/skills/nano-banana-pro/scripts/generate_image.py'
)

function slugify(str) {
  return str.toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 70)
}

async function fetchMealsWithoutPhoto() {
  const meals = []
  let cursor = undefined
  do {
    const body = { page_size: 100 }
    if (cursor) body.start_cursor = cursor
    const res = await fetch(`https://api.notion.com/v1/databases/${MEALS_DB_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    const data = await res.json()
    for (const page of data.results) {
      const name = page.properties.Name?.title?.[0]?.plain_text || ''
      const photo = page.properties.Zdjecie?.url || ''
      const opis = page.properties.Opis?.rich_text?.[0]?.plain_text || ''
      // Regeneruj jeśli brak URL lub URL nie jest z naszego domeny
      if (!photo || photo.startsWith('data:')) {
        meals.push({ id: page.id, nazwa: name, opis })
      }
    }
    cursor = data.has_more ? data.next_cursor : undefined
  } while (cursor)
  return meals
}

async function updateNotionUrl(pageId, url) {
  const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ properties: { Zdjecie: { url } } })
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Notion update failed: ${err.slice(0, 150)}`)
  }
}

async function main() {
  console.log('🖼️  Generator zdjęć → public/meals/ → Cloudflare Pages\n')

  if (!NOTION_TOKEN || !MEALS_DB_ID || !GEMINI_API_KEY) {
    console.error('❌ Brakuje env vars: NOTION_TOKEN, MEALS_DB_ID, GEMINI_API_KEY')
    process.exit(1)
  }

  console.log('📚 Pobieram przepisy bez zdjęć...')
  const meals = await fetchMealsWithoutPhoto()
  console.log(`   Znaleziono: ${meals.length} przepisów\n`)

  if (meals.length === 0) {
    console.log('✅ Wszystkie przepisy mają zdjęcia!')
    return
  }

  let ok = 0, fail = 0

  for (let i = 0; i < meals.length; i++) {
    const meal = meals[i]
    const slug = slugify(meal.nazwa)
    const filename = `${slug}.png`
    const filepath = path.join(PUBLIC_MEALS_DIR, filename)
    const publicUrl = `${BASE_URL}/${filename}`

    process.stdout.write(`📸 [${i + 1}/${meals.length}] ${meal.nazwa.slice(0, 55)}...\n`)

    // Generuj tylko jeśli plik nie istnieje
    if (!fs.existsSync(filepath)) {
      const prompt = `${meal.opis || meal.nazwa}, food photography, appetizing, high quality, natural light`
      try {
        await execFileAsync('python3', [NANO_BANANA,
          '--prompt', prompt,
          '--filename', filepath
        ], {
          env: { ...process.env, GEMINI_API_KEY },
          timeout: 90000
        })
        const size = Math.round(fs.statSync(filepath).size / 1024)
        console.log(`   ✅ Wygenerowane (${size}KB)`)
      } catch (err) {
        console.log(`   ❌ Błąd: ${String(err.stderr || err.message).slice(0, 100)}`)
        fail++
        await new Promise(r => setTimeout(r, 2000))
        continue
      }
    } else {
      console.log(`   ⏭️  Już istnieje (skip generowania)`)
    }

    // Zaktualizuj Notion
    try {
      await updateNotionUrl(meal.id, publicUrl)
      console.log(`   ✅ Notion: ${publicUrl}`)
      ok++
    } catch (err) {
      console.log(`   ⚠️  Notion error: ${err.message}`)
      fail++
    }

    // Rate limit: 2s między requestami
    await new Promise(r => setTimeout(r, 2000))
  }

  console.log(`\n════════════════════════`)
  console.log(`✅ OK: ${ok}  ❌ Błędy: ${fail}`)
  console.log(`\n📦 Teraz uruchom:`)
  console.log(`   cd .. && git add public/meals/ && git commit -m "feat: zdjęcia posiłków" && git push`)
  console.log(`   Cloudflare Pages automatycznie deplouje zdjęcia.`)
}

main().catch(console.error)
