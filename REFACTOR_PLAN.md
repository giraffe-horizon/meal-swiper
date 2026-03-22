# Meal Swiper — Plan Refaktoru

## Audyt: 2026-03-22
- 70 plików źródłowych, ~11k LOC
- 58 test files, 512 testów ✅
- 0 ESLint errors, 27 warnings
- TypeScript: czysto

---

## Priorytet 1: Rozbicie God Components (Impact: 🔴 Wysoki)

### 1.1 SwipeView.tsx → modularyzacja
**Obecny stan:** 460L, 11 useState, 35 hooków, 3 useEffect
**Plan:**
- `hooks/useSwipeGestures.ts` — motion values, drag handlers, thresholds
- `hooks/useSwipeNavigation.ts` — currentIndex, shuffle, skip, reshuffle logic
- `hooks/useSwipeToast.ts` — toast state, show/hide, confetti
- `components/swipe/SwipeContainer.tsx` — layout only (badge + stack + buttons)
- `components/swipe/CompatibilityBadge.tsx` — match counter pill
- SwipeView.tsx → <200L orchestrator
**Estymata:** 2-3h

### 1.2 settings/page.tsx → component extraction
**Obecny stan:** 566L, 6 useState, 16 hooków
**Plan:**
- `components/settings/PersonCard.tsx` — avatar, name, sliders, diet, delete
- `components/settings/DietSelector.tsx` — 2x2 grid buttons
- `components/settings/CuisineSelector.tsx` — pill chips with checkmarks
- `components/settings/ExcludedIngredients.tsx` — input + chips
- `components/settings/HouseholdSection.tsx` — name, token, share
- settings/page.tsx → <150L layout + state coordination
**Estymata:** 2h

### 1.3 context.tsx → split providers
**Obecny stan:** 257L, God Object (auth + meals + plan + swipe + settings + theme)
**Plan:**
- `lib/providers/AuthProvider.tsx` — tenant token, auth state
- `lib/providers/MealProvider.tsx` — meals, mealsWithVariants
- `lib/providers/PlanProvider.tsx` — weeklyPlan, weekOffset, CRUD
- `lib/providers/SwipeProvider.tsx` — shuffled meals, swipe index, seen IDs
- `lib/providers/SettingsProvider.tsx` — settings, theme, scaling
- `lib/providers/AppProvider.tsx` — composes all providers
- Każdy provider: <80L, single responsibility
**Estymata:** 3h

---

## Priorytet 2: Czystość kodu (Impact: 🟡 Średni)

### 2.1 local-db.ts — extract seed data
**Obecny stan:** 2109L (!) z hardcoded 54 posiłkami
**Plan:**
- `data/seed-meals.json` — 54 posiłki jako JSON
- `data/schema.sql` — clean schema
- `lib/local-db.ts` → <200L (wrapper + schema init + seed import)
**Estymata:** 1h

### 2.2 Usunięcie mock-db.ts
**Obecny stan:** 540L duplikacji local-db
**Plan:**
- Usunąć `lib/mock-db.ts`
- Testy używają local-db z in-memory SQLite (`:memory:`)
- Albo: vitest setup z shared test DB
**Estymata:** 1h

### 2.3 Type safety — eliminate `as any`
**Obecny stan:** 13x `as any`
**Plan:**
- Każdy `as any` → proper type assertion lub generic
- Szczególnie: local-db.ts (better-sqlite3 types), get-db.ts, context.tsx
**Estymata:** 1h

### 2.4 Console cleanup
**Obecny stan:** 31x console.log/warn/error
**Plan:**
- Dev-only logs: wrap in `if (process.env.NODE_ENV === 'development')`
- Errors: keep console.error for actual error handling
- Remove casual console.log
**Estymata:** 30min

### 2.5 Unused imports cleanup
**Obecny stan:** 8 ESLint warnings
**Plan:** `npx eslint --fix`
**Estymata:** 5min

---

## Priorytet 3: Design System (Impact: 🟢 Niski, ale ważny long-term)

### 3.1 Extract Tailwind class combinations
**Obecny stan:** 37 className >100 znaków
**Plan:**
- `components/ui/Card.tsx` — reusable card with variants
- `components/ui/Pill.tsx` — badge/chip component
- `components/ui/IconButton.tsx` — circular icon button with size variants
- Tailwind @apply w globals.css dla powtarzalnych patterns
**Estymata:** 2h

### 3.2 Magic numbers → design tokens
**Obecny stan:** 41 hardcoded pixel values
**Plan:**
- Extend tailwind.config.js z custom spacing (card-height, nav-height, etc.)
- Replace px values z tokenami
**Estymata:** 1h

### 3.3 Framer-motion optimization
**Obecny stan:** Cała lib importowana, użyta w 3 plikach
**Plan:**
- Dynamic import: `const { motion } = await import('framer-motion')`
- Albo: replace z CSS animations + touch events (eliminating 500KB+ z bundle)
- Alternativa: `motion/react` (tree-shakeable subset)
**Estymata:** 2-4h

---

## Priorytet 4: Testing & DX (Impact: 🟡 Średni)

### 4.1 E2E test stability
**Obecny stan:** 1 flaky test (swipe-flow.spec.ts)
**Plan:**
- Fix race conditions w swipe tests
- Add retry logic
- Stabilize seed data for E2E
**Estymata:** 1h

### 4.2 Storybook / component preview
**Plan:**
- Dodać Storybook dla kluczowych komponentów
- Ułatwi visual testing bez full app
**Estymata:** 3h (setup + stories)

---

## Kolejność wykonania (recommended)

| # | Task | Estymata | Blokuje |
|---|------|----------|---------|
| 1 | 2.1 Extract seed data | 1h | - |
| 2 | 2.2 Remove mock-db | 1h | 2.1 |
| 3 | 2.4+2.5 Console + imports | 35min | - |
| 4 | 1.3 Split context | 3h | - |
| 5 | 1.1 SwipeView modularyzacja | 2-3h | 1.3 |
| 6 | 1.2 Settings extraction | 2h | 1.3 |
| 7 | 2.3 Type safety | 1h | - |
| 8 | 3.1 UI components | 2h | - |
| 9 | 3.2 Design tokens | 1h | 3.1 |
| 10 | 3.3 Framer-motion | 2-4h | 1.1 |

**Total: ~16-20h pracy**

---

## Metryki docelowe (po refaktorze)
- Żaden plik >300 LOC
- 0 `as any`
- 0 console.log (poza error handling)
- Każdy komponent <5 useState
- Każdy provider <100 LOC
- Bundle size: -30% (framer-motion optimization)
- Test coverage: utrzymać 512+ testów
