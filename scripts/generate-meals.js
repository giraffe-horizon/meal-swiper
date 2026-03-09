#!/usr/bin/env node

// Meal Swiper — generate meal proposals via Gemini AI and save to Notion

import { config } from 'dotenv';
import { parseArgs } from 'node:util';
import path from 'node:path';
import { generateMeals } from './lib/gemini.js';
import { getDatabaseSchema, ensureMissingProperties, getExistingMealNames, createMealPage } from './lib/notion-meals.js';
import { generateImage } from './lib/image-gen.js';
import { deduplicateMeals } from './lib/dedup.js';

// Load .env from scripts directory
config({ path: path.join(import.meta.dirname, '.env') });

// --- CLI args ---
const { values: args } = parseArgs({
  options: {
    count: { type: 'string', default: '10' },
    cuisine: { type: 'string', default: 'all' },
    'dry-run': { type: 'boolean', default: false },
    'no-images': { type: 'boolean', default: false },
    'max-time': { type: 'string', default: '60' },
  },
  strict: false,
});

const count = parseInt(args.count, 10);
const cuisine = args.cuisine;
const dryRun = args['dry-run'];
const noImages = args['no-images'];
const maxTime = parseInt(args['max-time'], 10);

// --- Env validation ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const MEALS_DB_ID = process.env.MEALS_DB_ID;

if (!GEMINI_API_KEY) {
  console.error('❌ Brak GEMINI_API_KEY w zmiennych środowiskowych');
  process.exit(1);
}

if (!dryRun) {
  if (!NOTION_TOKEN) {
    console.error('❌ Brak NOTION_TOKEN w zmiennych środowiskowych');
    process.exit(1);
  }
  if (!MEALS_DB_ID) {
    console.error('❌ Brak MEALS_DB_ID w zmiennych środowiskowych');
    process.exit(1);
  }
}

// --- Main ---
async function main() {
  const startTime = Date.now();

  console.log('🍽️  Meal Swiper — Generator przepisów');
  console.log('─'.repeat(40));
  console.log(`📋 Liczba: ${count} | Kuchnia: ${cuisine} | Max czas: ${maxTime} min`);
  if (dryRun) console.log('🧪 Tryb dry-run (bez zapisu do Notion)');
  if (noImages) console.log('🖼️  Pominięto generowanie zdjęć');
  console.log('─'.repeat(40));

  // 1. Get existing meals for deduplication
  let existingNames = [];
  if (!dryRun) {
    console.log('\n📚 Pobieram istniejące dania z Notion...');
    existingNames = await getExistingMealNames(NOTION_TOKEN, MEALS_DB_ID);
    console.log(`   Znaleziono ${existingNames.length} istniejących dań`);
  }

  // 2. Ensure Notion DB has all required properties
  if (!dryRun) {
    console.log('\n🔍 Sprawdzam schemat bazy Notion...');
    const schema = await getDatabaseSchema(NOTION_TOKEN, MEALS_DB_ID);
    await ensureMissingProperties(NOTION_TOKEN, MEALS_DB_ID, schema.properties);
  }

  // 3. Generate meals via Gemini
  console.log(`\n🤖 Generuję ${count} przepisów przez Gemini AI...`);
  const rawMeals = await generateMeals({
    count,
    cuisine,
    maxTime,
    existingMeals: existingNames,
    apiKey: GEMINI_API_KEY,
  });

  // 4. Deduplicate
  const meals = deduplicateMeals(rawMeals, existingNames);
  console.log(`\n📝 ${meals.length} unikalnych przepisów do przetworzenia`);

  // 5. Dry-run: just print and exit
  if (dryRun) {
    console.log('\n📄 Wygenerowane przepisy (dry-run):\n');
    for (let i = 0; i < meals.length; i++) {
      const m = meals[i];
      console.log(`--- ${i + 1}. ${m.nazwa} ---`);
      console.log(`   Kuchnia: ${m.kuchnia} | Trudność: ${m.trudnosc} | Czas: ${m.czas_przygotowania} min`);
      console.log(`   Kcal baza: ${m.makro?.baza?.kcal} | Kcal z mięsem: ${m.makro?.z_miesem?.kcal}`);
      console.log(`   Białko baza: ${m.makro?.baza?.bialko}g | Białko z mięsem: ${m.makro?.z_miesem?.bialko}g`);
      console.log(`   Składniki baza: ${m.skladniki_baza?.map(s => s.name).join(', ')}`);
      console.log(`   Składniki mięso: ${m.skladniki_mieso?.map(s => s.name).join(', ')}`);
      console.log(`   Tagi: ${m.tagi?.join(', ')}`);
    }
    console.log('\n' + JSON.stringify(meals, null, 2));
    printSummary(meals.length, 0, 0, startTime);
    return;
  }

  // 6. Generate images (if enabled)
  if (!noImages) {
    console.log('\n📸 Generuję zdjęcia...');
    for (let i = 0; i < meals.length; i++) {
      console.log(`   Zdjęcie ${i + 1}/${meals.length}: ${meals[i].nazwa}`);
      const imagePath = await generateImage(meals[i], GEMINI_API_KEY);
      // For now, just store local path — Notion URL field needs a web URL
      // Leave photo_url empty if we only have a local path
      if (imagePath) {
        meals[i]._localImagePath = imagePath;
      }
    }
  }

  // 7. Save to Notion
  console.log('\n💾 Zapisuję do Notion...');
  let saved = 0;
  let errors = 0;

  for (let i = 0; i < meals.length; i++) {
    const meal = meals[i];
    console.log(`   Zapisuję ${i + 1}/${meals.length}: ${meal.nazwa}...`);
    try {
      await createMealPage(NOTION_TOKEN, MEALS_DB_ID, meal);
      saved++;
      console.log(`   ✅ Zapisano: ${meal.nazwa}`);
    } catch (err) {
      errors++;
      console.error(`   ❌ Błąd zapisu "${meal.nazwa}": ${err.message}`);
    }
  }

  printSummary(meals.length, saved, errors, startTime);
}

function printSummary(total, saved, errors, startTime) {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n' + '═'.repeat(40));
  console.log('📊 PODSUMOWANIE');
  console.log('═'.repeat(40));
  console.log(`   Wygenerowano: ${total}`);
  if (saved !== undefined && saved > 0) console.log(`   Zapisano:     ${saved}`);
  if (errors > 0) console.log(`   Błędy:        ${errors}`);
  console.log(`   Czas:         ${elapsed}s`);
  console.log('═'.repeat(40));
}

main().catch(err => {
  console.error(`\n💥 Krytyczny błąd: ${err.message}`);
  process.exit(1);
});
