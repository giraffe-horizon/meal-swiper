# Specyfikacja testów — Meal Swiper

## Cel
Testy mają wyłapywać regresje takie jak:
- Brakujące zdjęcia w przepisach
- Broken API routes
- Nieprawidłowe dane z Notion
- UI nie renderuje danych

## Stack testowy
- **Vitest** — unit testy (szybkie, natywne ESM, TypeScript)
- **Playwright** — E2E testy (przeglądarka, user flows)
- **@testing-library/react** — testy komponentów React

## 1. TESTY JEDNOSTKOWE (Vitest)

### lib/notion.ts
- `fetchMealsFromNotion` zwraca tablicę Meal[]
- każdy Meal ma wymagane pola: id, nazwa, photo_url, prep_time, kcal_baza
- `photo_url` NIE JEST pustym stringiem (właśnie ten bug!)
- pagination działa (has_more = true → fetchuje kolejne strony)
- błąd 401 → rzuca Error z czytelnym komunikatem
- błąd 500 → rzuca Error

### lib/storage.ts
- getWeeklyPlan() zwraca pusty plan jeśli brak w localStorage
- saveWeeklyPlan() → getWeeklyPlan() roundtrip
- getCheckedItems() zwraca {} jeśli brak

### lib/utils.ts
- getWeekKey() zwraca datę poniedziałku w formacie YYYY-MM-DD
- getWeekDates(0) zwraca 5 dat (Pn-Pt bieżącego tygodnia)
- formatWeekRange() zwraca niepusty string

### hooks/useMeals.ts
- loading=true podczas fetcha
- loading=false po fetchu
- error ustawiony jeśli API zwróci błąd
- meals zawiera dane po pomyślnym fetchu

### scripts/lib/image-gen.js
- generateImage() zwraca URL zaczynający się od 'https://' (nie localPath!)
- zwraca null przy błędzie (nie rzuca)

### scripts/generate-meals.js — logika
- meal.photo_url jest ustawiony po generateImage (nie _localImagePath)
- dedup usuwa duplikaty po nazwie

## 2. TESTY KOMPONENTÓW (Vitest + @testing-library/react)

### SwipeView
- renderuje kartę z nazwą dania
- renderuje zdjęcie (img[src] != '')
- swipe w prawo wywołuje onSwipeRight
- swipe w lewo przechodzi do następnej karty
- brak meals → renderuje komunikat "Brak posiłków"

### CalendarView
- renderuje 5 dni tygodnia
- pusty dzień pokazuje "Brak planu"
- dzień z posiłkiem pokazuje nazwę i zdjęcie
- dzień "wolny" pokazuje ikonę urlopu

### ShoppingListView
- pusta lista pokazuje komunikat
- zaznaczenie checkboxa persystuje w localStorage
- "Udostępnij" kopiuje tekst do schowka

### Navigation
- kliknięcie "Plan" wywołuje onNavigate('plan')
- kliknięcie "Propozycje" wywołuje onNavigate('swipe')
- aktywny widok ma wyróżnioną ikonę

## 3. TESTY E2E (Playwright)

### Smoke test
- strona ładuje się (200 OK)
- brak błędów JS w konsoli
- brak failed network requests

### /api/meals
- GET /api/meals zwraca 200
- Response jest JSON tablicą
- Każdy element ma: id, nazwa, photo_url (niepusty!), prep_time, kcal_baza
- photo_url zaczyna się od 'https://' (nie jest lokalną ścieżką)

### /api/image-search
- GET /api/image-search?q=pasta zwraca 200
- GET /api/image-search (bez q) zwraca 400

### Swipe flow (happy path)
1. Wejdź na stronę
2. Kliknij "Propozycje"
3. Widoczna karta z nazwą i zdjęciem
4. Zdjęcie NIE jest broken (img.naturalWidth > 0)
5. Kliknij przycisk "serce" (swipe right)
6. Karta znika, pojawia się toast z nazwą dania
7. Przejdź do "Plan" — dzień ma zaplanowany posiłek

### Shopping list flow
1. Zaplanuj posiłki na 2 dni
2. Przejdź do "Lista"
3. Lista zakupów nie jest pusta
4. Zaznacz checkbox
5. Odśwież stronę — checkbox nadal zaznaczony (localStorage)

### Image health check (KLUCZOWY — wyłapuje nasz bug)
1. Pobierz /api/meals
2. Dla każdego dania sprawdź photo_url
3. photo_url musi być niepusty
4. Fetch na photo_url musi zwrócić 200
5. Content-Type musi być image/*

## SETUP
```
npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/user-event playwright @playwright/test jsdom
```

## URUCHOMIENIE
```bash
# Unit + komponent
npm run test

# E2E (wymaga działającego serwera)
npm run test:e2e

# Wszystko + coverage
npm run test:all
```

## KONFIGURACJA CI (GitHub Actions)
Dodaj do .github/workflows/test.yml:
- unit testy na każdy push
- E2E na deploy preview URL
