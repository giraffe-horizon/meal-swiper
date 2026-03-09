// Claude Opus meal generation via @anthropic-ai/sdk

import Anthropic from '@anthropic-ai/sdk'

const MEAL_SCHEMA = `{
  "nazwa": "string - krótka, apetyczna nazwa dania po polsku",
  "opis": "string - opis 2-3 zdania: czym jest, co wyróżnia, dlaczego warto",
  "kuchnia": "string - włoska|koreańska|polska|azjatycka|meksykańska",
  "trudnosc": "string - łatwe|średnie|trudne",
  "czas_przygotowania": "number - minuty max 60",
  "tagi": ["string"],
  "makro": {
    "baza": { "kcal": "number", "bialko": "number", "wegle": "number", "tluszcz": "number" },
    "z_miesem": { "kcal": "number", "bialko": "number", "wegle": "number", "tluszcz": "number" }
  },
  "skladniki_baza": [
    { "name": "string - nazwa składnika", "amount": "string - DOKŁADNA gramatura na 2 porcje, np. '200g', '2 łyżki (30ml)', '1 puszka (400g)', '3 szt (150g)'" }
  ],
  "skladniki_mieso": [
    { "name": "string - nazwa mięsa/jaj/nabiału", "amount": "string - DOKŁADNA gramatura na 1 porcję, np. '150g', '2 szt (120g)'" }
  ],
  "przepis": {
    "kroki": ["string - krok z czasem i temperaturą"],
    "wskazowki": "string - tip kulinarny"
  },
  "prompt_zdjecia": "string - English vivid food photography prompt"
}`

function buildPrompt({ count, cuisine, maxTime, existingMeals }) {
  const cuisineStr =
    cuisine === 'all'
      ? 'różnorodna: włoska, koreańska, polska, azjatycka, meksykańska — każda kuchnia max 3 razy'
      : cuisine

  const existingList = existingMeals.length > 0 ? '\n- ' + existingMeals.join('\n- ') : '(brak)'

  return `Jesteś doświadczonym szefem kuchni. Stwórz ${count} autentycznych propozycji obiadowych.

## PROFIL
- Łukasz (mięsożerca, triatleta): cel ~900 kcal, ~70g białka z mięsem
- Alicja (wegetarianka): cel ~550 kcal, ~25g białka z bazy

## STRUKTURA każdego dania
1. Baza wegetariańska (dla obojga, porcje x2)
2. Dokładka mięsna (tylko Łukasz, porcja x1)

## WYMAGANIA
- Autentyczne dania z prawdziwymi nazwami
- Składniki dostępne w polskim sklepie
- Max czas: ${maxTime} min
- ZERO ryb, ZERO owoców morza, ZERO jabłek
- ZERO zup, ZERO bulionów, ZERO żurku, ZERO rosołu — tylko dania główne (obiady/kolacje)
- DOKŁADNE gramaturykatalogu każdego składnika (gramy, ml, sztuki z gramami w nawiasie)

## ZAKAZ duplikatów:${existingList}

## FORMAT
Zwróć WYŁĄCZNIE JSON tablicę. Żadnego tekstu ani markdown.

SCHEMAT:
${MEAL_SCHEMA}`
}

export async function generateMeals({ count, cuisine, maxTime, existingMeals, apiKey }) {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || apiKey,
    timeout: 300000, // 5 minut
    maxRetries: 2,
  })

  const prompt = buildPrompt({ count, cuisine, maxTime, existingMeals })
  const maxRetries = 3

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`🤖 Claude Opus: generowanie przepisów (próba ${attempt}/${maxRetries})...`)

    try {
      const message = await client.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 16000,
        temperature: 1,
        messages: [{ role: 'user', content: prompt }],
      })

      const text = message.content?.[0]?.text
      if (!text) throw new Error('Brak tekstu w odpowiedzi')

      let cleaned = text.trim()
      const jsonStart = cleaned.indexOf('[')
      const jsonEnd = cleaned.lastIndexOf(']')
      if (jsonStart !== -1 && jsonEnd !== -1) {
        cleaned = cleaned.slice(jsonStart, jsonEnd + 1)
      }

      const meals = JSON.parse(cleaned)
      if (!Array.isArray(meals) || meals.length === 0) {
        throw new Error('Odpowiedź nie jest tablicą')
      }

      for (const meal of meals) {
        if (!meal.nazwa || !meal.skladniki_baza || !meal.makro) {
          throw new Error(`Niekompletny: ${meal.nazwa || '?'}`)
        }
      }

      console.log(`✅ Wygenerowano ${meals.length} przepisów przez Claude Opus`)
      return meals
    } catch (err) {
      console.error(`❌ Próba ${attempt}: ${err.message}`)
      if (attempt === maxRetries)
        throw new Error(`Nieudane po ${maxRetries} próbach: ${err.message}`)
      await new Promise((r) => setTimeout(r, 5000 * attempt))
    }
  }
}
