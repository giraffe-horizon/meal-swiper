# CLAUDE.md — Meal Swiper: Plan Migracji do Next.js 15

> Przeczytaj ten plik w całości przed wykonaniem jakiegokolwiek działania.
> Działaj etap po etapie. Commituj po każdym etapie.

---

## 1. KONTEKST PROJEKTU

**Meal Swiper** to aplikacja do planowania posiłków na tydzień:
- Swipe lewo/prawo żeby odrzucić/wybrać danie (Tinder-style)
- Kalendarz tygodniowy (Pn–Pt) z możliwością oznaczenia "wolnego dnia"
- Lista zakupów generowana z tygodniowego planu
- Backend: Notion API (baza danych posiłków + weekly plan)
- Dane tygodniowego planu: localStorage (nie Notion — weekly.js istnieje, ale APP.jsx używa localStorage)

## 2. STAN OBECNY

### Stack
- Vite + React 18 (SPA, brak SSR)
- Tailwind CSS
- Cloudflare Pages + Functions (`/functions/api/`)
- Notion API (REST, bez SDK — czysty fetch)

### Pliki źródłowe
```
src/
  App.jsx              # Root — stan globalny (meals, weeklyPlan, currentView)
  main.jsx             # Punkt wejścia
  index.css            # Tailwind imports
  components/
    BottomNav.jsx      # Dolna nawigacja (mobile) + boczna (desktop, wbudowana)
    CalendarView.jsx   # Widok kalendarza tygodniowego
    ShoppingListView.jsx # Lista zakupów z kategoriami
    Sidebar.jsx        # Boczna nawigacja desktop (osobny komponent, NIEUŻYWANY przez BottomNav)
    SwipeCard.jsx      # Drag handler (wrapper na kartę — NIE JEST używany przez SwipeView!)
    SwipeView.jsx      # Widok swipe z logiką drag własną
    WeeklyPlanView.jsx # Stary komponent — NIEUŻYWANY

functions/api/
  meals.js             # GET /api/meals — pobiera z Notion
  weekly.js            # GET/POST /api/weekly — Notion (NIEUŻYWANE przez frontend!)
  image-search.js      # GET /api/image-search?q= — Google CSE
```

### Ważne odkrycia
1. **SwipeCard.jsx nie jest używany** — SwipeView.jsx ma własną logikę drag
2. **WeeklyPlanView.jsx nie jest używany** — App.jsx nie importuje go
3. **Sidebar.jsx jest zduplikowany** — BottomNav.jsx ma własną nawigację desktop
4. **weekly.js API nie jest używane** — App.jsx zapisuje plan do localStorage
5. **Plan tygodniowy w localStorage**, klucz: `weeklyPlan_YYYY-MM-DD` (poniedziałek tygodnia)

### Typy danych (wywnioskowane z kodu)

```typescript
// Z Notion API (meals.js)
interface Meal {
  id: string
  nazwa: string           // Name (tytuł)
  opis: string            // Opis (rich_text)
  photo_url: string       // Zdjecie (url)
  prep_time: number       // Czas_przygotowania (number)
  kcal_baza: number       // Kcal_baza (number)
  kcal_z_miesem: number   // Kcal_z_miesem (number)
  skladniki_baza: string  // JSON string — Ingredient[]
  skladniki_mieso: string // JSON string — Ingredient[]
  tags: string[]          // Tagi (multi_select)
}

interface Ingredient {
  name: string
  amount: string
  category: 'mięso' | 'warzywa' | 'nabiał' | 'suche'
}

// Plan tygodniowy (localStorage)
type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri'
type WeeklyPlan = {
  [K in DayKey]: Meal | null
} & {
  [K in `${DayKey}_free`]: boolean
}
// Klucz localStorage: weeklyPlan_YYYY-MM-DD (data poniedziałku)
```

### Env vars (Cloudflare Pages Secrets)
```
NOTION_TOKEN         # Bearer token dla Notion API
MEALS_DB_ID          # ID bazy danych posiłków w Notion
WEEKLY_PLAN_DB_ID    # ID bazy weekly plan (nieużywana przez frontend)
GOOGLE_CSE_API_KEY   # Google Custom Search API key
GOOGLE_CSE_CX        # Google Custom Search Engine ID
```

---

## 3. DOCELOWA ARCHITEKTURA

### Stack
- **Next.js 15** (App Router)
- **TypeScript** (wszędzie)
- **@cloudflare/next-on-pages** (edge runtime na Cloudflare Pages)
- **Tailwind CSS** (bez zmian w designie)
- **wrangler** (deploy)

### Struktura katalogów (docelowa)
```
meal-swiper/
├── app/
│   ├── layout.tsx           # Root layout (fonts, metadata, global CSS)
│   ├── page.tsx             # Główna strona (obecny App.jsx)
│   ├── globals.css          # Tailwind imports
│   └── api/
│       ├── meals/
│       │   └── route.ts     # GET — migracja z functions/api/meals.js
│       └── image-search/
│           └── route.ts     # GET — migracja z functions/api/image-search.js
├── components/
│   ├── Navigation.tsx       # Jeden komponent nawigacji (łączy BottomNav + Sidebar)
│   ├── CalendarView.tsx
│   ├── ShoppingListView.tsx
│   ├── SwipeView.tsx
│   └── ui/
│       └── LoadingSpinner.tsx
├── hooks/
│   ├── useMeals.ts          # Fetching i cache posiłków
│   ├── useWeeklyPlan.ts     # Stan tygodniowego planu + localStorage
│   ├── useWeekDates.ts      # Obliczenia dat tygodnia
│   └── useSwipe.ts          # Logika drag/swipe
├── lib/
│   ├── notion.ts            # Warstwa abstrakcji nad Notion API (fetch wrapper)
│   ├── storage.ts           # localStorage helpers (typowane)
│   └── utils.ts             # Pomocnicze funkcje (formatWeekRange itp.)
├── types/
│   └── index.ts             # Wszystkie TypeScript types
├── next.config.ts           # Next.js config z security headers
├── wrangler.toml            # Cloudflare Pages config
├── .dev.vars                # Lokalne env vars (gitignored)
└── package.json
```

---

## 4. WYMAGANIA TECHNICZNE

### Edge Runtime (KRYTYCZNE)
Każda API route MUSI eksportować:
```typescript
export const runtime = 'edge'
```
Cloudflare Pages Workers nie obsługują Node.js runtime.

### Env vars w edge routes
```typescript
// NIE UŻYWAJ process.env w edge runtime dla sekretów
// Zamiast tego, użyj:
import { env } from 'cloudflare:workers'  // jeśli dostępne
// LUB przez next.config.ts + wrangler binding
```
W praktyce: `process.env.NOTION_TOKEN` działa na Cloudflare gdy skonfigurowane przez wrangler.

### Next.js config (next.config.ts)
```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",  // Next.js wymaga unsafe-eval w dev
              "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
              "font-src 'self' fonts.gstatic.com",
              "img-src 'self' data: https:",  // https: bo zdjęcia z zewnętrznych CDN
              "connect-src 'self'",
            ].join('; ')
          },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

export default nextConfig
```

### wrangler.toml
```toml
name = "meal-swiper"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = ".vercel/output/static"

[build]
command = "npx @cloudflare/next-on-pages"
```

### package.json scripts
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "cf:build": "npx @cloudflare/next-on-pages",
    "cf:dev": "wrangler pages dev .vercel/output/static",
    "deploy": "npm run cf:build && wrangler pages deploy .vercel/output/static",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  }
}
```

---

## 5. PLAN ETAPÓW (kolejność obowiązkowa)

### ETAP 0: Przygotowanie
- [ ] Backup istniejącego projektu: `git checkout -b legacy-vite`
- [ ] Wróć na `master`
- [ ] Usuń stare pliki: `src/`, `functions/`, `vite.config.js`, `index.html`
- [ ] Zachowaj: `tailwind.config.js`, `.gitleaks.toml`, `.pre-commit-config.yaml`, `.github/`
- Commit: `chore: remove vite+react SPA, prepare for Next.js migration`

### ETAP 1: Setup Next.js + Cloudflare
- [ ] Zainstaluj: `next@15`, `react@18`, `react-dom@18`, `typescript`, `@types/react`, `@types/react-dom`, `@cloudflare/next-on-pages`, `wrangler`
- [ ] Utwórz `next.config.ts` (z security headers jak wyżej)
- [ ] Utwórz `wrangler.toml`
- [ ] Utwórz `tsconfig.json` (standardowy dla Next.js)
- [ ] Utwórz `app/globals.css` (Tailwind imports)
- [ ] Utwórz `app/layout.tsx` (root layout, Material Symbols font)
- [ ] Utwórz `app/page.tsx` (placeholder "Hello World")
- [ ] Sprawdź: `npm run build` musi przejść
- [ ] Sprawdź: `npm run cf:build` musi przejść
- Commit: `feat: Next.js 15 + @cloudflare/next-on-pages setup`

### ETAP 2: Types + Lib
- [ ] Utwórz `types/index.ts` — wszystkie interfejsy (Meal, Ingredient, WeeklyPlan, DayKey)
- [ ] Utwórz `lib/notion.ts` — wrapper fetch dla Notion API (transformacja danych)
- [ ] Utwórz `lib/storage.ts` — typowane helpery localStorage (getWeeklyPlan, saveWeeklyPlan, getCheckedItems, saveCheckedItems)
- [ ] Utwórz `lib/utils.ts` — getWeekKey(), getWeekDates(), formatWeekRange()
- Commit: `feat: types, notion lib, storage helpers, utils`

### ETAP 3: API Routes
- [ ] Utwórz `app/api/meals/route.ts`:
  - `export const runtime = 'edge'`
  - GET: fetch z Notion, transformacja danych jak w `functions/api/meals.js`
  - Walidacja env vars: jeśli brak NOTION_TOKEN → 500 z jasnym błędem
  - Cache: `revalidate = 300` (5 min)
- [ ] Utwórz `app/api/image-search/route.ts`:
  - `export const runtime = 'edge'`
  - GET z `?q=` param
  - Walidacja: q jest wymagane, max 100 znaków
  - Rate limit: prosty (licznik w pamięci, reset co minutę)
  - Walidacja env vars
- [ ] Sprawdź typy: `npm run type-check`
- Commit: `feat: API routes /meals i /image-search (edge runtime)`

### ETAP 4: Hooks
- [ ] Utwórz `hooks/useMeals.ts`:
  - fetch `/api/meals` przy mount
  - Loading state, error state
  - Return: `{ meals, loading, error, refetch }`
- [ ] Utwórz `hooks/useWeeklyPlan.ts`:
  - Stan: `weeklyPlan`, `weekOffset`
  - Akcje: `setMeal(day, meal)`, `removeMeal(day)`, `toggleVacation(day)`, `setWeekOffset(offset)`
  - Persystencja: localStorage przez `lib/storage.ts`
  - Return: `{ weeklyPlan, weekOffset, setMeal, removeMeal, toggleVacation, setWeekOffset, getWeekKey }`
- [ ] Utwórz `hooks/useWeekDates.ts`:
  - Przyjmuje `weekOffset: number`
  - Return: `{ weekDates, formatWeekRange }`
- [ ] Utwórz `hooks/useSwipe.ts`:
  - Logika drag/swipe (wyciągnięta z SwipeView)
  - Obsługa mouse + touch events
  - Return: `{ dragOffset, isDragging, handlers }`
- Commit: `feat: custom hooks (useMeals, useWeeklyPlan, useWeekDates, useSwipe)`

### ETAP 5: Komponenty
Zachowaj CAŁY istniejący design — przenoś 1:1, tylko zmień na TypeScript i użyj hooków.

- [ ] `components/ui/LoadingSpinner.tsx` — animacja ładowania
- [ ] `components/Navigation.tsx` — łączy BottomNav + desktop sidebar w jeden komponent
  - Props: `{ activeView, onNavigate }`
  - Zawiera logikę mobile (bottom) + desktop (sidebar)
- [ ] `components/CalendarView.tsx`:
  - Props: `{ weeklyPlan, weekOffset, onDayClick, onRemoveMeal, onToggleVacation, onGenerateShoppingList, onWeekChange }`
  - Użyj `useWeekDates(weekOffset)` do dat
  - Zachowaj context menu (activeMenu state)
- [ ] `components/SwipeView.tsx`:
  - Props: `{ meals, onSwipeRight, currentDay, onComplete, weeklyPlan, onSkipAll }`
  - Użyj `useSwipe()` hooka do drag logic
  - Zachowaj toast notyfikację i confetti
- [ ] `components/ShoppingListView.tsx`:
  - Props: `{ weeklyPlan, weekOffset, onWeekChange }`
  - Zachowaj logikę generowania listy, kategorie, checkbox persistence
- Commit: `feat: komponenty (Navigation, CalendarView, SwipeView, ShoppingListView)`

### ETAP 6: Strona główna
- [ ] `app/page.tsx` — główna logika aplikacji (obecny App.jsx):
  - `'use client'`
  - Używa: `useMeals()`, `useWeeklyPlan()`
  - Stan: `currentView`, `currentSwipeDay`
  - Renderuje: `<Navigation>` + odpowiedni widok
  - Loading state jeśli `meals.loading`
- Commit: `feat: strona główna z pełną logiką aplikacji`

### ETAP 7: Weryfikacja + Deploy config
- [ ] Sprawdź: `npm run build` — zero błędów TS i build
- [ ] Sprawdź: `npm run cf:build` — zero błędów @cloudflare/next-on-pages
- [ ] Utwórz `.dev.vars` (gitignored) z lokalnymi env vars
- [ ] Sprawdź że `.gitignore` zawiera: `.dev.vars`, `.vercel/`, `.next/`, `node_modules/`
- [ ] Upewnij się że gitleaks hooks działają (`pre-commit run --all-files`)
- [ ] Zaktualizuj `package.json` — deploy script
- Commit: `feat: deploy config, .dev.vars template, gitignore updates`

### ETAP 8: README
- [ ] Utwórz `README.md`:
  - Co to jest / jak działa
  - Architektura (diagram ASCII)
  - Env vars (lista z opisem, bez wartości)
  - Jak uruchomić lokalnie
  - Jak deployować na Cloudflare Pages
  - Technologie
- Commit: `docs: README z architekturą i instrukcją deploymentu`

---

## 6. ZASADY I OGRANICZENIA

### Absolutnie zakazane
- Zmienianie designu / kolorów / układu UI — przenosimy 1:1
- Dodawanie nowych features, których nie było
- Użycie `export default` w API routes — Next.js wymaga named exports (GET, POST)
- Node.js-only API w edge routes (fs, path, crypto bez Web Crypto API, itp.)
- Hardkodowanie sekretów lub env vars w kodzie
- `@notionhq/client` — używa Node.js internals, nie działa w edge. Zostań przy czystym fetch.

### Wymagane
- Każda API route: `export const runtime = 'edge'`
- TypeScript strict mode
- Sprawdzenie env vars na początku każdej route (zwróć 500 jeśli brak)
- `'use client'` w każdym komponencie używającym hooks/events
- Zachowanie logiki localStorage dla weekly plan (nie migruj do Notion)

### Kolejność jest ważna
Nie przechodź do kolejnego etapu bez:
1. Działającego `npm run type-check`
2. Działającego `npm run build`
3. Commita z opisem etapu

---

## 7. WERYFIKACJA PRZED DEPLOYEM

```bash
# 1. TypeScript
npm run type-check

# 2. Next.js build
npm run build

# 3. Cloudflare build
npm run cf:build

# 4. Security scan
pre-commit run --all-files

# 5. Deploy
wrangler pages deploy .vercel/output/static --project-name meal-swiper
```

---

## 8. SYGNAŁ ZAKOŃCZENIA

Po zakończeniu WSZYSTKICH etapów i weryfikacji:
```bash
openclaw system event --text "Meal Swiper: migracja Next.js zakończona, wszystkie etapy zrobione" --mode now
```
