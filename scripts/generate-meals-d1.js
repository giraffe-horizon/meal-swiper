#!/usr/bin/env node

/**
 * Meal Swiper — generate 50 meal proposals via Claude Opus and save to Cloudflare D1
 * Usage: CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=... node scripts/generate-meals-d1.js --count 50
 */

import { config } from 'dotenv'
import { parseArgs } from 'node:util'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { generateMeals } from './lib/gemini.js'
import { generateImage } from './lib/image-gen.js'
import { deduplicateMeals } from './lib/dedup.js'

// Load .env from scripts directory
config({ path: path.join(import.meta.dirname, '.env') })

const { values: args } = parseArgs({
  options: {
    count: { type: 'string', default: '50' },
    cuisine: { type: 'string', default: 'all' },
    'no-images': { type: 'boolean', default: false },
    'max-time': { type: 'string', default: '60' },
  },
  strict: false,
})

const count = parseInt(args.count, 10)
const cuisine = args.cuisine
const noImages = args['no-images']
const maxTime = parseInt(args['max-time'], 10)

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const CF_TOKEN = process.env.CLOUDFLARE_API_TOKEN
const CF_ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID

if (!ANTHROPIC_API_KEY || !GEMINI_API_KEY) {
  console.error('❌ Missing API keys (ANTHROPIC/GEMINI)')
  process.exit(1)
}

function runD1(query) {
  const env = { ...process.env, CLOUDFLARE_API_TOKEN: CF_TOKEN, CLOUDFLARE_ACCOUNT_ID: CF_ACCOUNT }
  const cmd = `npx wrangler d1 execute meal-swiper-db --remote --command "${query.replace(/"/g, '\\"')}" --json`
  const out = execSync(cmd, { env, encoding: 'utf8' })
  return JSON.parse(out)
}

async function main() {
  console.log(`🚀 Starting generation of ${count} meals for D1...`)

  // 1. Get existing names for dedup
  const existingRes = runD1('SELECT nazwa FROM meals')
  const existingNames = existingRes[0].results.map((r) => r.nazwa)
  console.log(`   Found ${existingNames.length} existing meals.`)

  // 2. Generate in batches
  const BATCH_SIZE = 10
  const batches = Math.ceil(count / BATCH_SIZE)
  let allRawMeals = []
  let knownNames = [...existingNames]

  for (let i = 0; i < batches; i++) {
    const batchCount = Math.min(BATCH_SIZE, count - i * BATCH_SIZE)
    console.log(`\n📦 Batch ${i + 1}/${batches} (${batchCount} meals)...`)
    const batch = await generateMeals({
      count: batchCount,
      cuisine,
      maxTime,
      existingMeals: knownNames,
      apiKey: ANTHROPIC_API_KEY,
    })
    allRawMeals.push(...batch)
    knownNames.push(...batch.map((m) => m.nazwa))
  }

  // 3. Dedup
  const meals = deduplicateMeals(allRawMeals, existingNames)
  console.log(`\n✅ Generated ${meals.length} unique meals.`)

  // 4. Images
  if (!noImages) {
    console.log('\n📸 Generating images...')
    for (let i = 0; i < meals.length; i++) {
      process.stdout.write(`   ${i + 1}/${meals.length}: ${meals[i].nazwa}... `)
      try {
        const url = await generateImage(meals[i], GEMINI_API_KEY)
        if (url) {
          meals[i].photo_url = url
          console.log('Done.')
        } else {
          console.log('Skipped.')
        }
      } catch (e) {
        console.log('Error.')
      }
    }
  }

  // 5. Save to D1
  console.log('\n💾 Saving to D1...')
  let saved = 0
  for (const m of meals) {
    const esc = (s) => (s || '').toString().replace(/'/g, "''")
    const id = Math.random().toString(36).substring(2, 15)
    const query = `INSERT INTO meals (id, nazwa, opis, photo_url, prep_time, kcal_baza, kcal_z_miesem, bialko_baza, bialko_z_miesem, trudnosc, kuchnia, category, skladniki_baza, skladniki_mieso, przepis, tags) VALUES ('${id}', '${esc(m.nazwa)}', '${esc(m.opis)}', '${esc(m.photo_url)}', ${m.czas_przygotowania}, ${m.makro.baza.kcal}, ${m.makro.z_miesem.kcal}, ${m.makro.baza.bialko}, ${m.makro.z_miesem.bialko}, '${esc(m.trudnosc)}', '${esc(m.kuchnia)}', '${esc(m.kategoria)}', '${esc(JSON.stringify(m.skladniki_baza))}', '${esc(JSON.stringify(m.skladniki_mieso))}', '${esc(JSON.stringify(m.przepis))}', '${esc(JSON.stringify(m.tagi))}')`

    try {
      runD1(query)
      saved++
      console.log(`   ✅ ${m.nazwa}`)
    } catch (e) {
      console.error(`   ❌ Failed ${m.nazwa}: ${e.message}`)
    }
  }

  console.log(`\n🎉 Process finished. Saved ${saved} meals to D1.`)
}

main().catch(console.error)
