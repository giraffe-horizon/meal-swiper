// Gemini AI meal generation

const MEAL_SCHEMA = `{
  "nazwa": "string - nazwa dania po polsku",
  "opis": "string - krótki opis 1-2 zdania",
  "kuchnia": "string - np. włoska, koreańska, polska, azjatycka, meksykańska",
  "trudnosc": "string - łatwe|średnie|trudne",
  "czas_przygotowania": "number - minuty",
  "tagi": ["string - tagi opisujące danie"],
  "makro": {
    "baza": { "kcal": "number", "bialko": "number", "wegle": "number", "tluszcz": "number" },
    "z_miesem": { "kcal": "number", "bialko": "number", "wegle": "number", "tluszcz": "number" }
  },
  "skladniki_baza": [
    { "name": "string - nazwa składnika", "amount": "string - ilość np. 300g, 1 sztuka" }
  ],
  "skladniki_mieso": [
    { "name": "string - nazwa składnika mięsnego", "amount": "string - ilość" }
  ],
  "przepis": {
    "kroki": ["string - kolejne kroki przepisu"],
    "wskazowki": "string - dodatkowe wskazówki"
  },
  "prompt_zdjecia": "string - English prompt for food photography image generation"
}`;

function buildPrompt({ count, cuisine, maxTime, existingMeals }) {
  const cuisineStr = cuisine === 'all'
    ? 'dowolna (priorytet: włoska > koreańska > polska > azjatycka > meksykańska)'
    : cuisine;

  const existingList = existingMeals.length > 0
    ? existingMeals.join(', ')
    : '(brak)';

  return `Jesteś ekspertem kulinarnym. Wygeneruj ${count} propozycji obiadowych jako tablicę JSON.

PROFIL:
- Gotujemy dla 2 osób: Łukasz (mięsożerca) i Ala (wegetarianka)
- Struktura: baza wegetariańska (dla obojga) + opcjonalna dokładka mięsna (tylko Łukasz)
- Łukasz: cel ~900 kcal, ~70g białka z mięsem
- Ala: cel ~550 kcal, ~25g białka z bazy
- Max czas przygotowania: ${maxTime} minut
- Kuchnia preferowana: ${cuisineStr}

ZAKAZY:
- Zero ryb i owoców morza (jakichkolwiek)
- Zero jabłek (alergia krzyżowa)
- Żadnego z tych dań (już istnieją): ${existingList}

FORMAT: Zwróć TYLKO prawidłowy JSON - tablicę obiektów. Nie dodawaj żadnego tekstu, markdown ani komentarzy przed ani po JSON.

SCHEMAT jednego obiektu:
${MEAL_SCHEMA}

WAŻNE:
- Składniki w ilościach na 2 porcje
- Baza MUSI być w pełni wegetariańska (zero mięsa, ryb)
- Dokładka mięsna to osobna lista składników
- Makro baza = kalorie/białko BEZ mięsa, makro z_miesem = z dokładką mięsną
- prompt_zdjecia powinien być po angielsku, opisywać gotowe danie, styl food photography
- Każde danie musi być UNIKALNE i różnorodne`;
}

export async function generateMeals({ count, cuisine, maxTime, existingMeals, apiKey }) {
  const prompt = buildPrompt({ count, cuisine, maxTime, existingMeals });
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`🤖 Gemini: generowanie przepisów (próba ${attempt}/${maxRetries})...`);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 1.0,
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      if (response.status === 429) {
        console.log('⏳ Rate limit — czekam 10s...');
        await new Promise(r => setTimeout(r, 10000));
        continue;
      }

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Gemini API ${response.status}: ${errorBody}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error('Brak tekstu w odpowiedzi Gemini');
      }

      // Parse JSON — Gemini may wrap in ```json blocks
      let cleaned = text.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
      }

      const meals = JSON.parse(cleaned);

      if (!Array.isArray(meals)) {
        throw new Error('Odpowiedź nie jest tablicą JSON');
      }

      if (meals.length === 0) {
        throw new Error('Pusta tablica');
      }

      // Basic validation
      for (const meal of meals) {
        if (!meal.nazwa || !meal.skladniki_baza || !meal.makro) {
          throw new Error(`Niekompletny przepis: ${meal.nazwa || 'brak nazwy'}`);
        }
      }

      console.log(`✅ Wygenerowano ${meals.length} przepisów`);
      return meals;
    } catch (err) {
      console.error(`❌ Próba ${attempt}: ${err.message}`);
      if (attempt === maxRetries) {
        throw new Error(`Nie udało się wygenerować przepisów po ${maxRetries} próbach: ${err.message}`);
      }
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}
