// Gemini Flash meal generation via Google Generative AI SDK

import { GoogleGenerativeAI } from '@google/generative-ai'

const MEAL_SCHEMA = `{
  "nazwa": "string - krótka, apetyczna nazwa dania po polsku",
  "opis": "string - opis 2-3 zdania: czym jest, co wyróżnia, dlaczego warto",
  "kuchnia": "string - region: polska|włoska|azjatycka|meksykańska|indyjska|śródziemnomorska|koreańska",
  "kategoria": "string - typ dania: makarony|ryż i kasze|jednogarnkowe|tortille i wrapi|zapiekanki|sałatki i bowle|ziemniaki|placki i naleśniki",
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
    { "name": "string - nazwa mięsa (kurczak|wołowina|indyk|wieprzowina)", "amount": "string - DOKŁADNA gramatura na 1 porcję, np. '150g', '2 szt (120g)'" }
  ],
  "przepis": {
    "kroki": ["string - krok z czasem i temperaturą"],
    "wskazowki": "string - tip kulinarny"
  },
  "prompt_zdjecia": "string - English vivid food photography prompt WYŁĄCZNIE dla wersji wegetariańskiej (bez mięsa)"
}`

function buildPrompt({ count, cuisine, maxTime, existingMeals }) {
  const cuisineStr =
    cuisine === 'all'
      ? 'różnorodna: polska, włoska, azjatycka, meksykańska, indyjska, śródziemnomorska, koreańska — każda kuchnia maks. proporcjonalnie'
      : cuisine

  const existingList = existingMeals.length > 0 ? '\n- ' + existingMeals.join('\n- ') : '(brak)'

  return `Jesteś doświadczonym szefem kuchni. Stwórz ${count} ŁATWYCH do przyrządzenia propozycji obiadowych.

## KLUCZOWE: PROSTOTA I DOSTĘPNOŚĆ
- Dania MUSZĄ być ŁATWE do zrobienia
- Składniki WYŁĄCZNIE z POWSZECHNYCH produktów dostępnych w polskich sklepach (Biedronka, Lidl)
- Max 10-12 składników w bazie wegetariańskiej
- Kuchnia: ${cuisineStr} — zróżnicowana

## STRUKTURA każdego dania
1. Baza wegetariańska (porcje x2, ~550 kcal, ~25g białka) — MUSI być w pełni wegetariańska
2. Opcja mięsna (porcja x1, dodatkowe ~350 kcal, ~45g białka) — jako ADD-ON (kurczak|wołowina|indyk|wieprzowina)

## WYMAGANIA
- Autentyczne dania z prawdziwymi nazwami
- Max czas: ${maxTime} min
- ZERO ryb, ZERO owoców morza, ZERO jabłek
- ZERO zup, ZERO bulionów, ZERO żurku, ZERO rosołu — tylko dania główne (obiady/kolacje)
- DOKŁADNE gramatury każdego składnika (gramy, ml, sztuki z gramami w nawiasie)
- Kategorie: makarony, ryż i kasze, jednogarnkowe, tortille i wrapi, zapiekanki, sałatki i bowle, ziemniaki, placki i naleśniki

## ZAKAZ duplikatów:${existingList}

## FORMAT
Zwróć WYŁĄCZNIE JSON tablicę. Żadnego tekstu ani markdown.

SCHEMAT:
${MEAL_SCHEMA}`
}

export async function generateMeals({ count, cuisine, maxTime, existingMeals, apiKey }) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || apiKey)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
    },
  })

  const prompt = buildPrompt({ count, cuisine, maxTime, existingMeals })
  const maxRetries = 3

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`🤖 Gemini Flash: generowanie przepisów (próba ${attempt}/${maxRetries})...`)

    try {
      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      if (!text) throw new Error('Brak tekstu w odpowiedzi')

      const meals = JSON.parse(text)
      if (!Array.isArray(meals) || meals.length === 0) {
        throw new Error('Odpowiedź nie jest tablicą')
      }

      for (const meal of meals) {
        if (!meal.nazwa || !meal.skladniki_baza || !meal.makro) {
          throw new Error(`Niekompletny: ${meal.nazwa || '?'}`)
        }
      }

      console.log(`✅ Wygenerowano ${meals.length} przepisów przez Gemini Flash`)
      return meals
    } catch (err) {
      console.error(`❌ Próba ${attempt}: ${err.message}`)
      if (attempt === maxRetries)
        throw new Error(`Nieudane po ${maxRetries} próbach: ${err.message}`)
      await new Promise((r) => setTimeout(r, 2000 * attempt))
    }
  }
}
