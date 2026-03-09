#!/usr/bin/env node
// Generuje zdjęcia dla przepisów w Notion które nie mają zdjęcia

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
const IMAGES_DIR = path.join(__dirname, 'generated-images')
const NANO_BANANA = path.join(process.env.HOME, '.npm-global/lib/node_modules/openclaw/skills/nano-banana-pro/scripts/generate_image.py')

fs.mkdirSync(IMAGES_DIR, { recursive: true })

function slugify(str) {
  return str.toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
}

async function fetchAllMeals() {
  const meals = []
  let cursor = undefined
  do {
    const body = { page_size: 100 }
    if (cursor) body.start_cursor = cursor
    const res = await fetch(`https://api.notion.com/v1/databases/${MEALS_DB_ID}/query`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${NOTION_TOKEN}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    const data = await res.json()
    for (const page of data.results) {
      const name = page.properties.Name?.title?.[0]?.plain_text || ''
      const photo = page.properties.Zdjecie?.url || ''
      const opis = page.properties.Opis?.rich_text?.[0]?.plain_text || ''
      if (!photo) meals.push({ id: page.id, nazwa: name, opis })
    }
    cursor = data.has_more ? data.next_cursor : undefined
  } while (cursor)
  return meals
}

async function generateAndUpload(meal, index, total) {
  const slug = slugify(meal.nazwa)
  const filename = path.join(IMAGES_DIR, `${slug}.png`)
  const prompt = `${meal.opis || meal.nazwa}, food photography, appetizing, high quality, natural light, professional shot`

  process.stdout.write(`📸 [${index}/${total}] ${meal.nazwa.slice(0, 50)}...\n`)

  try {
    await execFileAsync('python3', [NANO_BANANA, '--prompt', prompt, '--filename', filename], {
      env: { ...process.env, GEMINI_API_KEY },
      timeout: 60000
    })
    console.log(`   ✅ Zdjęcie wygenerowane`)
  } catch (err) {
    console.log(`   ❌ Błąd generowania: ${err.message?.slice(0, 80)}`)
    return null
  }

  // Upload do Notion jako external URL nie jest możliwy bez CF/hosting
  // Zamiast tego: zakoduj jako base64 i zapisz w osobnym polu lub po prostu wróć ścieżkę
  // Na razie zwróć lokalną ścieżkę — do aktualizacji gdy będzie hosting
  if (!fs.existsSync(filename)) return null

  // Zaktualizuj Notion z file:// URL (placeholder — apka będzie używać photo_url)
  // Używamy Notion File Upload API v2
  try {
    const fileBuffer = fs.readFileSync(filename)
    const base64 = fileBuffer.toString('base64')
    const dataUrl = `data:image/png;base64,${base64}`

    // Notion URL field - spróbuj zapisać data URL
    const updateRes = await fetch(`https://api.notion.com/v1/pages/${meal.id}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${NOTION_TOKEN}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        properties: {
          Zdjecie: { url: dataUrl }
        }
      })
    })

    if (updateRes.ok) {
      console.log(`   ✅ Zapisano do Notion (base64, ${Math.round(fileBuffer.length/1024)}KB)`)
      return dataUrl
    } else {
      const err = await updateRes.text()
      console.log(`   ⚠️  Notion URL error: ${err.slice(0, 100)}`)
      // Fallback: zapisz lokalną ścieżkę jako tekst w Opis
      return null
    }
  } catch (err) {
    console.log(`   ⚠️  Upload error: ${err.message}`)
    return null
  }
}

async function main() {
  console.log('🖼️  Generator zdjęć dla istniejących przepisów\n')
  if (!NOTION_TOKEN || !MEALS_DB_ID || !GEMINI_API_KEY) {
    console.error('❌ Brakuje env vars: NOTION_TOKEN, MEALS_DB_ID, GEMINI_API_KEY')
    process.exit(1)
  }

  console.log('📚 Pobieram przepisy bez zdjęć...')
  const meals = await fetchAllMeals()
  console.log(`   Znaleziono ${meals.length} przepisów bez zdjęć\n`)

  let ok = 0, fail = 0
  for (let i = 0; i < meals.length; i++) {
    const result = await generateAndUpload(meals[i], i + 1, meals.length)
    result ? ok++ : fail++
    // Rate limiting
    await new Promise(r => setTimeout(r, 2000))
  }

  console.log(`\n✅ Gotowe! Zdjęcia: ${ok} OK, ${fail} błędów`)
}

main().catch(console.error)
