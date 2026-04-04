# CLAUDE.md — Meal Swiper

## Stack

- Expo SDK 53 + React Native + TypeScript
- NativeWind (Tailwind CSS for RN)
- Expo Router (file-based routing)
- Cloudflare Workers API (Hono) — separate `api/` directory
- Cloudflare D1 (SQLite — meals, weekly plans, shopping checked)
- Zustand (state management)
- React Query (server state)

## Architektura

```
meal-swiper/
├── app/
│   ├── _layout.tsx          # Root layout (Expo Router)
│   ├── index.tsx            # Entry / onboarding
│   └── (tabs)/
│       ├── _layout.tsx      # Tab navigator
│       ├── plan/index.tsx   # Weekly calendar view
│       ├── swipe.tsx        # Tinder-style meal swipe
│       ├── shopping.tsx     # Shopping list
│       └── settings.tsx     # Settings (people, kcal, protein)
├── api/                     # Cloudflare Workers API (Hono)
│   ├── src/
│   │   ├── index.ts         # Hono app + route registration
│   │   ├── middleware.ts    # API key auth, tenant extraction
│   │   ├── db.ts            # D1 abstraction layer
│   │   └── routes/          # Route handlers
│   ├── wrangler.toml
│   └── package.json
├── hooks/
│   └── queries/             # React Query hooks
├── lib/
│   ├── api.ts               # HTTP client for API
│   ├── storage.native.ts    # AsyncStorage helpers (RN)
│   ├── shopping.ts          # Shopping list generation (merge + scaling)
│   ├── scaling.ts           # Ingredient scaling per person
│   ├── recipe.ts            # Recipe parsing from Meal
│   ├── utils.ts             # getWeekDates, formatWeekRange, DAY_KEYS, etc.
│   └── ...                  # Pure logic modules
├── stores/
│   ├── auth.ts              # Zustand auth store (token, onboarding)
│   └── swipe.ts             # Zustand swipe state
├── types/
│   └── index.ts             # Meal, Ingredient, WeeklyPlan, DayKey, AppSettings
├── assets/                  # App icons, splash screen
├── app.json                 # Expo config
├── tailwind.config.js       # NativeWind config
├── global.css               # NativeWind global styles
└── data/                    # Static data / schema
```

## Konwencje

- Typy w `types/index.ts`
- Hooki: jeden hook = jedna odpowiedzialność
- State management: Zustand stores in `stores/`
- Server state: React Query hooks in `hooks/queries/`
- NO `'use client'` directives (React Native, not Next.js)
- Przepisy bazowe są na 2 osoby — skaluj przez `scaleIngredient(ing, people)`

## Uruchomienie

```bash
npm install
npm run dev           # expo start
```

## API (Cloudflare Workers)

```bash
cd api
npm install
npm run dev           # wrangler dev
npm run deploy        # wrangler deploy
```

## D1 — baza danych

Database name: `meal-swiper-db`
Database ID: `c5e30a72-01c9-4ec8-ba0a-d286088c0016`
Binding: `DB`

Tabele: `meals`, `weekly_plans`, `shopping_checked`
Schema: `api/` directory has migrations

Przepisy bazowe są na 2 osoby. App skaluje dynamicznie przez `scaleIngredient`.

## Ważne

- Zdjęcia posiłków na Imgur (anonymous upload)
- API is in `api/` directory with its own package.json and wrangler.toml
- Token stored in Zustand auth store, persisted via expo-secure-store (Phase 1)
- `lib/storage.native.ts` reads token from Zustand store (not AsyncStorage directly)
