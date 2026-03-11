# CLAUDE.md — Meal Swiper

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS
- Cloudflare Pages + @cloudflare/next-on-pages
- Cloudflare D1 (SQLite — meals, weekly plans, shopping checked)
- Framer Motion (swipe animations)

## Architektura

```
meal-swiper/
├── app/
│   ├── layout.tsx           # Root layout z AppShell
│   ├── page.tsx             # Redirect do /plan
│   ├── globals.css
│   ├── plan/page.tsx        # Widok kalendarza tygodniowego
│   ├── swipe/page.tsx       # Tinder-style swipe posiłków
│   ├── shopping/page.tsx    # Lista zakupów
│   ├── cooking/page.tsx     # Widok gotowania (DaySelector + CookingView)
│   ├── settings/page.tsx    # Ustawienia (osoby, kcal, białko)
│   └── api/
│       ├── meals/route.ts           # GET — D1
│       ├── plan/route.ts            # GET/POST — D1
│       ├── shopping-checked/route.ts # GET/POST — D1
│       ├── image-search/route.ts    # Google CSE
│       └── ticktick-export/route.ts # POST — eksport do TickTick
├── components/
│   ├── AppShell.tsx         # Layout wrapper (header, nav, context)
│   ├── Navigation.tsx       # Mobile bottom nav (4 tabs) + desktop sidebar
│   ├── CalendarView.tsx     # Slim orkiestrator kalendarza
│   ├── SwipeView.tsx        # Slim orkiestrator swipe
│   ├── ShoppingListView.tsx # Lista zakupów z checkboxami
│   ├── MealModal.tsx        # Modal przepisu (people z contextu)
│   ├── CongratulationsToast.tsx
│   ├── cooking/
│   │   └── CookingView.tsx  # UI gotowania (hero + składniki + przepis)
│   ├── plan/
│   │   └── DayCard.tsx      # Karta dnia w kalendarzu
│   ├── swipe/
│   │   ├── SwipeCard.tsx    # Draggable top card
│   │   ├── SwipeStack.tsx   # Stack kart
│   │   └── SwipeActions.tsx # Przyciski ❌ ❤️
│   └── ui/
│       ├── DaySelector.tsx  # Selector Pn-Pt (reusable, swipe + cooking)
│       └── LoadingSpinner.tsx
├── hooks/
│   ├── useMeals.ts          # Fetch posiłków z /api/meals
│   ├── useWeeklyPlan.ts     # Stan planu + localStorage + D1 sync
│   ├── useWeekDates.ts      # Obliczenia dat tygodnia
│   ├── useSwipeState.ts     # Stan shufflowanych kart swipe
│   └── useSettings.ts       # Ustawienia użytkownika
├── lib/
│   ├── context.tsx          # AppContext (wiring hooków)
│   ├── db.ts                # D1 abstraction layer (fetchMealsFromD1, plan, shopping)
│   ├── storage.ts           # localStorage helpers (typowane)
│   ├── shopping.ts          # Generowanie listy zakupów (merge + scaling)
│   ├── scaling.ts           # Skalowanie składników na osoby
│   ├── recipe.ts            # Parsowanie przepisu z Meal
│   └── utils.ts             # getWeekDates, formatWeekRange, DAY_KEYS, etc.
├── types/
│   └── index.ts             # Meal, Ingredient, WeeklyPlan, DayKey, AppSettings
├── schema.sql               # D1 schema (meals, weekly_plans, shopping_checked)
├── next.config.ts           # Security headers
└── wrangler.toml            # Cloudflare Pages config
```

## Konwencje

- `'use client'` na każdym komponencie z hooks/events
- Edge runtime na API routes (`export const runtime = 'edge'`)
- Typy w `types/index.ts`
- Hooki: jeden hook = jedna odpowiedzialność
- Komponenty: < 200 linii, rozbijaj na podkatalogi (`swipe/`, `plan/`, `cooking/`)
- MealModal pobiera `people` z contextu (nie z propsa)
- Przepisy bazowe są na 2 osoby — skaluj przez `scaleIngredient(ing, people)`

## Uruchomienie

```bash
npm install
cp .dev.vars.example .dev.vars  # uzupełnij env vars
npm run dev
```

## Build & Deploy

```bash
npm run build          # next build (dev check)
npm run pages:build    # @cloudflare/next-on-pages (production)
npm run deploy         # build + wrangler deploy
```

## Env vars (Cloudflare Pages Secrets)

- `GOOGLE_CSE_API_KEY` — Google Custom Search (image fallback)
- `GOOGLE_CSE_CX` — Google Search Engine ID
- `TICKTICK_ACCESS_TOKEN` — TickTick Open API OAuth2 access token (eksport listy zakupów)

## D1 — baza danych

Database name: `meal-swiper-db`
Database ID: `c5e30a72-01c9-4ec8-ba0a-d286088c0016`
Binding: `DB`

Tabele: `meals`, `weekly_plans`, `shopping_checked`
Schema: `schema.sql`

Dostęp: `(process.env as unknown as { DB: D1Database }).DB`
Abstraction layer: `lib/db.ts` — fetchMealsFromD1, getWeeklyPlan, saveWeeklyPlan, getShoppingChecked, saveShoppingChecked

Przepisy bazowe są na 2 osoby. App skaluje dynamicznie przez `scaleIngredient`.

## Ważne

- `@cloudflare/next-on-pages` max Next.js 15.5.2 (nie 16!)
- NIE importuj żadnych SDK — D1 dostępne przez binding (edge compatible)
- Zdjęcia posiłków na Imgur (anonymous upload, client_id w `scripts/.env`)
- 63+ testy vitest muszą zawsze przechodzić przed commitem
