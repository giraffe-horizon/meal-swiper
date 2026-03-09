# Specyfikacja: Skrypt generowania propozycji obiadowych

## Cel
Skrypt CLI generuje nowe propozycje obiadowe przy użyciu Gemini AI,
generuje zdjęcia przez Gemini Image (nano-banana-pro), i zapisuje
wszystko do bazy Notion używanej przez aplikację Meal Swiper.

---

## Profil użytkowników

### Łukasz (mięsożerca)
- Wiek: 30 lat, 188cm, ~99kg, aktywny (trening do Iron Man 2027)
- Dzienne spożycie: **2500 kcal**, białko ~200g/dzień
- **Cel obiadu: ~900 kcal, ~70g białka** (35% + zapas)
- Lubi: mięso, tłuszcze, kuchnia włoska, koreańska, polska, azjatycka
- **NIE lubi: ryby (zero ryb w przepisach)**
- Dieta ADHD: posiłki muszą być smaczne i satysfakcjonujące

### Alicja / Ala (wegetarianka)
- Dzienne spożycie: **1500 kcal**
- **Cel obiadu: ~550 kcal, ~25g białka** (35% + zapas)
- Dieta wegetariańska — zero mięsa i ryb

### Model posiłku
- **Baza wspólna** (wegetariańska) — jedzona przez oboje
- **Dokładka mięsna** (osobno) — tylko dla Łukasza
- Porcje: 2 osoby (jedna baza + jedna porcja mięsa)
- Składniki muszą być **elastyczne** — parametryzowane liczbą porcji

---

## Wymagania funkcjonalne

### CLI
```bash
node scripts/generate-meals.js [opcje]

Opcje:
  --count <n>         Liczba posiłków do wygenerowania (domyślnie: 10)
  --cuisine <type>    Kuchnia: italian|korean|polish|asian|mexican|all (domyślnie: all)
  --dry-run           Generuj bez zapisywania do Notion (podgląd JSON)
  --no-images         Pomiń generowanie zdjęć (szybszy tryb testowy)
  --max-time <min>    Max czas przygotowania w minutach (domyślnie: 60)
```

### Deduplication
- Przed generowaniem: pobierz wszystkie istniejące nazwy dań z Notion
- Przekaż listę do Gemini — prompt musi jawnie zabraniać powtórzeń
- Po wygenerowaniu: dodatkowy check nazwy przed zapisem

### Generowanie (Gemini)
Dla każdego posiłku Gemini zwraca JSON:
```json
{
  "nazwa": "Makaron z sosem bolognese (wersja podwójna)",
  "opis": "Krótki opis 1-2 zdania",
  "kuchnia": "włoska",
  "trudnosc": "łatwe",
  "czas_przygotowania": 45,
  "tagi": ["makaron", "włoska", "szybkie"],
  "makro": {
    "baza": { "kcal": 540, "bialko": 22, "wegle": 65, "tluszcz": 18 },
    "z_miesem": { "kcal": 890, "bialko": 72, "wegle": 65, "tluszcz": 32 }
  },
  "skladniki_baza": [
    { "name": "makaron penne", "amount": "300g" },
    { "name": "pomidory krojone", "amount": "400g" },
    { "name": "cebula", "amount": "1 sztuka" }
  ],
  "skladniki_mieso": [
    { "name": "mielona wołowina", "amount": "300g" }
  ],
  "przepis": {
    "kroki": [
      "Ugotuj makaron al dente według instrukcji na opakowaniu.",
      "Na patelni podsmaż cebulę na oleju przez 3 minuty.",
      "Dodaj pomidory, przyprawy i duś 15 minut.",
      "(Opcja z mięsem): Na osobnej patelni podsmaż mielone przez 8 minut i dodaj do sosu.",
      "Wymieszaj z makaronem i podawaj."
    ],
    "wskazowki": "Sos można zrobić dzień wcześniej. Wegańska wersja: zamień mięso na soczewicę."
  },
  "prompt_zdjecia": "Penne bolognese, rustic Italian style, steam rising, overhead shot, natural light"
}
```

### Generowanie zdjęć (nano-banana-pro)
- Używa skryptu: `~/.npm-global/lib/node_modules/openclaw/skills/nano-banana-pro/scripts/generate_image.py`
- API Key: `GEMINI_API_KEY` z env
- Prompt z pola `prompt_zdjecia` + suffix: `, food photography, appetizing, high quality`
- Zapis tymczasowy do: `scripts/generated-images/YYYY-MM-DD-{slugified-name}.png`

### Upload zdjęć do Notion (File Upload API)
Notion od 2024r. obsługuje własny hosting plików. Flow:
1. `POST /v1/files/external` — inicjuj upload, dostań `upload_url` i `file_id`
2. `PUT {upload_url}` — wyślij plik PNG jako multipart/form-data
3. W polu `Zdjecie` strony użyj: `{ "type": "external", "external": { "url": file_url } }`
   LUB jeśli API zwraca hosted URL — użyj go bezpośrednio

**Alternatywa (prostszy fallback):** Notion `files` property type przyjmuje hosted pliki.
Użyj endpointu `POST /v1/files` (Notion File API v2) jeśli dostępny dla integration tokenu.

**Fallback**: jeśli upload się nie uda — zapisz z pustym URL, zaloguj warning, kontynuuj

### Zapis do Notion
Pola w bazie Meals (zgodne z istniejącą strukturą aplikacji):

| Pole Notion          | Typ          | Wartość                              |
|----------------------|--------------|--------------------------------------|
| Name                 | title        | nazwa                                |
| Opis                 | rich_text    | opis                                 |
| Zdjecie              | url          | URL wygenerowanego zdjęcia           |
| Czas_przygotowania   | number       | czas_przygotowania (minuty)          |
| Trudnosc             | select       | trudnosc (łatwe/średnie/trudne)      |
| Kuchnia              | select       | kuchnia                              |
| Kcal_baza            | number       | makro.baza.kcal                      |
| Kcal_z_miesem        | number       | makro.z_miesem.kcal                  |
| Bialko_baza          | number       | makro.baza.bialko                    |
| Bialko_z_miesem      | number       | makro.z_miesem.bialko                |
| Skladniki_baza       | rich_text    | JSON.stringify(skladniki_baza)       |
| Skladniki_mieso      | rich_text    | JSON.stringify(skladniki_mieso)      |
| Przepis              | rich_text    | JSON.stringify(przepis)              |
| Tagi                 | multi_select | tagi[]                               |

**WAŻNE:** Sprawdź jakie pola FAKTYCZNIE istnieją w Notion przed zapisem!
Użyj `GET /v1/databases/{MEALS_DB_ID}` żeby pobrać schemat.
Jeśli brakuje pól (Trudnosc, Kuchnia, Bialko_*, Przepis) — utwórz je przez `PATCH /v1/databases/{MEALS_DB_ID}`.

---

## Architektura skryptu

```
scripts/
  generate-meals.js       # Punkt wejścia (CLI)
  lib/
    gemini-generator.js   # Generowanie przepisów przez Gemini
    image-generator.js    # Generowanie zdjęć przez nano-banana-pro
    notion-client.js      # Zapis do Notion (reuse z lib/notion.ts gdzie możliwe)
    deduplication.js      # Sprawdzanie duplikatów
  generated-images/       # Lokalny cache wygenerowanych zdjęć (gitignored)
  GENERATE_MEALS_SPEC.md  # Ten plik
```

---

## Zmienne środowiskowe

```env
GEMINI_API_KEY=          # Google Gemini API key (nano-banana-pro też tego używa)
NOTION_TOKEN=            # Notion integration token
MEALS_DB_ID=             # ID bazy danych posiłków
```

Skrypt ładuje z `.env` (plik lokalny, gitignored) lub zmiennych środowiskowych.

---

## Prompt dla Gemini (szkielet)

```
Jesteś ekspertem kulinarnym. Wygeneruj {count} propozycji obiadowych jako tablicę JSON.

PROFIL:
- Gotujemy dla 2 osób: Łukasz (mięsożerca) i Ala (wegetarianka)
- Struktura: baza wegetariańska (dla obojga) + opcjonalna dokładka mięsna (tylko Łukasz)
- Łukasz: cel ~900 kcal, ~70g białka z mięsem
- Ala: cel ~550 kcal, ~25g białka z bazy
- Max czas przygotowania: {max_time} minut
- Kuchnia preferowana: {cuisine} (priorytet: włoska > koreańska > polska > azjatycka)

ZAKAZY:
- Zero ryb i owoców morza (jakichkolwiek)
- Zero jabłek (alergia krzyżowa)
- Żadnego z tych dań: {existing_meals_list}

FORMAT: Zwróć TYLKO prawidłowy JSON - tablicę obiektów zgodnych ze schematem.
Nie dodawaj żadnego tekstu przed ani po JSON.

SCHEMAT jednego obiektu:
{schemat_json}
```

---

## Obsługa błędów

- Gemini zwraca nieprawidłowy JSON → retry (max 3 razy)
- Gemini rate limit → czekaj 10s, retry
- Generowanie zdjęcia nie udaje się → zapisz z pustym URL, zaloguj warning
- Notion API błąd przy zapisie → zaloguj błąd, kontynuuj z następnym daniem
- Brak wymaganych env vars → zatrzymaj z czytelnym komunikatem błędu

---

## Przykład użycia

```bash
# Standardowe użycie
GEMINI_API_KEY=xxx NOTION_TOKEN=xxx MEALS_DB_ID=xxx node scripts/generate-meals.js

# Z plikiem .env
node scripts/generate-meals.js --count 20 --cuisine italian

# Suchy test bez zapisu
node scripts/generate-meals.js --dry-run --no-images --count 3

# Tylko kuchnia koreańska, max 30 min
node scripts/generate-meals.js --cuisine korean --max-time 30
```

---

## Uwagi implementacyjne

1. **Elastyczność porcji**: składniki opisane jako np. "300g na 2 porcje" — w przyszłości można dodać --servings
2. **Przepis w Notion**: przechowuj jako JSON string (rich_text), apka może go renderować
3. **Tryb wsadowy**: generuj propozycje najpierw wszystkie, potem zdjęcia, potem zapis — łatwiej obsłużyć błędy
4. **Logging**: wyraźne info: "Generuję 10 posiłków...", "Zdjęcie 3/10...", "Zapisuję do Notion 5/10..."
5. **Podsumowanie na końcu**: ile zapisano, ile błędów, czas wykonania
