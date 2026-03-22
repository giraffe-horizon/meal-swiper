# Meal Swiper — Plan Refaktoru do 10/10

## Stan wyjściowy (2026-03-22)
- 70 plików źródłowych, ~11k LOC
- 58 test files, 512 testów ✅
- 0 ESLint errors, 27 warnings
- TypeScript: kompiluje czysto
- node_modules: 1.1GB

---

## FAZA 1: Czystość i higiena (Quick Wins) — ~2h

### 1.1 Extract seed data z local-db.ts
**Problem:** `lib/local-db.ts` ma 2109 linii — 80% to hardcoded dane seed (54 posiłki, 20 składników).
**Cel:** local-db.ts < 250 LOC

**Zmiany:**
```
Nowe pliki:
  data/seed-meals.json          — 54 posiłki jako JSON array
  data/seed-ingredients.json    — 20 składników jako JSON array  
  data/schema.sql               — CREATE TABLE statements (clean, z komentarzami)

Zmienione pliki:
  lib/local-db.ts               — import JSON, exec schema.sql, loop inserts
```

**Kroki:**
1. Wyciąg JSON z istniejących meal/ingredient obiektów w seedData()
2. Utwórz `data/schema.sql` z clean CREATE TABLE (skopiuj z seedData())
3. `local-db.ts` seedData() → `fs.readFileSync('data/seed-meals.json')` + loop
4. Zweryfikuj: `rm local.db && npm run dev` → 54 meali w bazie
5. Testy: `npx vitest run`

**Metryka sukcesu:** local-db.ts < 250 LOC, seed data w osobnych plikach

---

### 1.2 Usunięcie mock-db.ts (duplikacja)
**Problem:** `lib/mock-db.ts` (540L) to praktycznie kopia local-db.ts z in-memory storage
**Cel:** Usunięcie pliku, testy używają local-db z `:memory:`

**Zmiany:**
```
Usunięte:
  lib/mock-db.ts

Zmienione:
  lib/local-db.ts     — dodaj opcję `:memory:` mode do getLocalDb(path?)
  lib/get-db.ts       — usuń import mock-db jeśli jest
  vitest.config.ts    — setup z in-memory local-db
  __tests__/setup.ts  — global test DB initialization
```

**Kroki:**
1. Sprawdź kto importuje mock-db: `grep -rn 'mock-db' . --include='*.ts'`
2. `getLocalDb(dbPath = './local.db')` — default path, `:memory:` dla testów
3. Update test setup file
4. Usuń mock-db.ts
5. Testy: `npx vitest run`

**Metryka sukcesu:** 0 plików mock-db, testy przechodzą

---

### 1.3 Console cleanup + unused imports
**Problem:** 31x console.log, 8 unused imports, 27 ESLint warnings
**Cel:** 0 warnings

**Zmiany:**
```
lib/local-db.ts      — console.log → console.debug (dev only) lub usuń
lib/context.tsx       — remove debug logs  
components/*.tsx      — remove unused imports
```

**Kroki:**
1. `npx eslint --fix app/ components/ hooks/ lib/` — auto-fix imports
2. Replace `console.log` z `if (process.env.NODE_ENV === 'development') console.debug(...)`
3. Keep `console.error` for actual errors
4. `npx eslint app/ components/ hooks/ lib/ --quiet` → 0 problems

**Metryka sukcesu:** 0 ESLint warnings, 0 console.log (poza error handling)

---

### 1.4 Type safety — eliminate `as any`
**Problem:** 13x `as any` w codebase
**Cel:** 0x `as any`

**Lokalizacje i fixy:**
```
lib/local-db.ts:
  - better-sqlite3 types → import Database from 'better-sqlite3'; type RunResult
  - stmt.get() → stmt.get() as T (generic z proper type)

lib/get-db.ts:
  - (env as any).DB → type assertion z CF binding interface

lib/context.tsx:
  - event handlers → proper React event types

components/swipe/SwipeCard.tsx:
  - (e.target as HTMLImageElement) → OK, to jest valid assertion
```

**Kroki:**
1. `grep -rn 'as any' lib/ app/ components/ hooks/` → lista
2. Każdy case: dodaj proper interface/generic
3. `npx tsc --noEmit` → czysto
4. `npx vitest run` → pass

**Metryka sukcesu:** `grep -c 'as any'` = 0

---

## FAZA 2: Architektura — Context Split (~3h)

### 2.1 Rozbicie God Context na providery
**Problem:** `lib/context.tsx` (257L) to God Object — auth, meals, plan, swipe, settings, theme — jeden useEffect na wszystko, jeden gigantyczny context value.
**Cel:** 5 focused providers, każdy < 80 LOC

**Nowa struktura:**
```
lib/providers/
  AuthProvider.tsx        — tenantToken, isReady, tenantInfo
  MealProvider.tsx        — meals, mealsWithVariants, loading states  
  PlanProvider.tsx        — weeklyPlan, weekOffset, CRUD (add/remove/toggle)
  SwipeProvider.tsx       — shuffledMeals, currentIndex, seenIds, reshuffle
  SettingsProvider.tsx    — settings, updateSettings, scaleFactor, theme
  AppProvider.tsx         — composes all 5 providers + exports useAppContext()
```

**Diagram zależności:**
```
AuthProvider (standalone — no deps)
  └── MealProvider (needs: tenantToken for API auth)
  └── SettingsProvider (needs: tenantToken)
       └── PlanProvider (needs: tenantToken, settings.people)
            └── SwipeProvider (needs: meals, weeklyPlan, settings)
```

**Dla każdego providera:**

#### AuthProvider.tsx (~40 LOC)
```tsx
interface AuthContextType {
  tenantToken: string | null
  isReady: boolean
  tenantInfo: TenantInfo | null
}
// Wraps useTenant() hook
```

#### MealProvider.tsx (~50 LOC)
```tsx
interface MealContextType {
  meals: Meal[]
  mealsWithVariants: MealWithVariants[]
  mealsLoading: boolean
}
// Wraps useMeals() + useMealsWithVariants() hooks
```

#### PlanProvider.tsx (~70 LOC)  
```tsx
interface PlanContextType {
  weeklyPlan: WeeklyPlan
  weekOffset: number
  setWeekOffset: (offset: number) => void
  handleAddMeal: (day: DayKey, meal: Meal) => void
  handleRemoveMeal: (day: DayKey) => void
  handleToggleVacation: (day: DayKey) => void
  allDaysFilled: boolean
}
// Wraps useWeeklyPlan() hook + business logic
```

#### SwipeProvider.tsx (~60 LOC)
```tsx
interface SwipeContextType {
  shuffledMeals: Meal[]
  currentSwipeIndex: number
  seenIds: Set<string>
  setShuffledMeals: (meals: Meal[]) => void
  setCurrentSwipeIndex: (index: number) => void
  resetSwipe: () => void
}
// Wraps useSwipeState() hook
```

#### SettingsProvider.tsx (~60 LOC)
```tsx
interface SettingsContextType {
  settings: AppSettings
  updateSettings: (settings: AppSettings) => void
  scaleFactor: number
  people: number
}
// Wraps useSettings() hook + theme useEffect
```

#### AppProvider.tsx (~30 LOC)
```tsx
export function AppProvider({ children }) {
  return (
    <AuthProvider>
      <MealProvider>
        <SettingsProvider>
          <PlanProvider>
            <SwipeProvider>
              {children}
            </SwipeProvider>
          </PlanProvider>
        </SettingsProvider>
      </MealProvider>
    </AuthProvider>
  )
}

// Convenience hook — backward compatible
export function useAppContext() {
  return {
    ...useAuth(),
    ...useMeals(),
    ...useSettings(),
    ...usePlan(),
    ...useSwipe(),
  }
}
```

**Strategia migracji (zero-downtime):**
1. Utwórz nowe pliki providerów
2. Przenieś logikę z context.tsx → providery (copy-paste + adapt)
3. AppProvider kompozycja + `useAppContext()` backward compat
4. Zamień import w `AppShell.tsx`
5. Testy → pass
6. Stopniowo zamień `useAppContext()` na specific hooks (`useAuth()`, `usePlan()` etc.) w komponentach
7. Usuń stary context.tsx

**Metryka sukcesu:** 
- Żaden provider > 80 LOC
- `useAppContext()` działa jak dotąd (backward compat)
- Testy pass

---

## FAZA 3: Component Decomposition (~4h)

### 3.1 SwipeView.tsx modularyzacja
**Problem:** 460L, 11 useState, 35 hooków, 3 useEffect — zbyt wiele odpowiedzialności
**Cel:** < 150 LOC orchestrator

**Nowa struktura:**
```
hooks/
  useSwipeGestures.ts     — motion values (x, rotate, likeOpacity, nopeOpacity),
                            dragEnd handler, pointer handlers, threshold logic
                            ~80 LOC

  useSwipeNavigation.ts   — currentIndex management, skip, reshuffle,
                            activeMeals computation, compatibility stats
                            ~60 LOC

  useSwipeToast.ts        — showToast, toastText, reshuffleToast,
                            showSuccess, showConfetti, confetti items
                            ~40 LOC

components/swipe/
  CompatibilityBadge.tsx  — green pill with "X POSIŁKI PASUJĄ"
                            ~20 LOC

  SwipeContainer.tsx      — layout: badge + stack + buttons
                            Replaces the return JSX of SwipeView
                            ~80 LOC

components/
  SwipeView.tsx           — orchestrator only: hooks + pass to SwipeContainer
                            ~100 LOC
```

**Podejście:**
1. Extract `useSwipeGestures` — move all framer-motion logic
2. Extract `useSwipeNavigation` — move index/shuffle/skip/reshuffle
3. Extract `useSwipeToast` — move toast/confetti state
4. Extract `CompatibilityBadge` — pure UI
5. SwipeView → thin orchestrator
6. Testy: update imports, run `npx vitest run`

**Metryka sukcesu:** SwipeView.tsx < 150 LOC, każdy hook < 100 LOC

---

### 3.2 Settings page decomposition
**Problem:** 572L, 6 useState, all-in-one page
**Cel:** < 120 LOC page

**Nowa struktura:**
```
components/settings/
  PersonCard.tsx             — avatar, name input, sliders, delete button
                               Props: person, index, onUpdate, onDelete
                               ~120 LOC

  DietSelector.tsx           — 2x2 grid (Brak/Wege/Wegańska/Bezglut.)
                               Props: value, onChange
                               ~40 LOC

  CuisineSelector.tsx        — pill chips with checkmarks
                               Props: selected[], available[], onChange
                               ~50 LOC

  ExcludedIngredients.tsx    — input + autocomplete + chips with ×
                               Props: excluded[], onAdd, onRemove
                               ~80 LOC

  HouseholdSection.tsx       — name, token display, share button
                               Props: name, token, onRename
                               ~60 LOC

  CompatibilityBanner.tsx    — green gradient card "X posiłków pasuje"
                               Props: count, total
                               ~30 LOC

app/[token]/settings/page.tsx — layout + state coordination
                               ~100 LOC
```

**Metryka sukcesu:** settings/page.tsx < 120 LOC

---

### 3.3 CookingView.tsx cleanup
**Problem:** 616L — longest component
**Cel:** < 300 LOC

**Plan:**
```
components/cooking/
  CookingHero.tsx          — hero image + gradient overlay + title + meta pills
                             ~80 LOC

  IngredientsList.tsx      — horizontal scroll ingredient cards with checkboxes
                             ~80 LOC

  RecipeSteps.tsx          — already exists, review and ensure < 150 LOC

  CookingView.tsx          — orchestrator with step navigation logic
                             ~200 LOC
```

---

## FAZA 4: Design System Extraction (~2h)

### 4.1 Reusable UI primitives
**Problem:** 37 className strings >100 chars, duplicated styling patterns
**Cel:** DRY component library

**Nowe komponenty:**
```
components/ui/
  Card.tsx                 — variant: 'surface' | 'elevated' | 'outline'
                             Wraps: bg, rounded, padding, border
                             ~30 LOC

  Pill.tsx                 — variant: 'primary' | 'outline' | 'muted'
                             Sizes: 'sm' | 'md'
                             With optional icon left/right
                             ~40 LOC

  IconButton.tsx           — variant: 'primary' | 'secondary' | 'danger'
                             Sizes: 'sm' (36px) | 'md' (44px) | 'lg' (60px)
                             ~35 LOC

  Section.tsx              — title + optional subtitle + children
                             ~20 LOC

  SliderField.tsx          — label + value display + range input
                             ~40 LOC
```

### 4.2 Design tokens → tailwind.config.js
**Problem:** 41 magic numbers (hardcoded px values)
**Plan:** Extend config:
```js
theme: {
  extend: {
    height: {
      'card': '340px',
      'card-image': '180px', 
      'nav': '64px',
      'header': '48px',
    },
    spacing: {
      'nav-clearance': '160px', // pb-40
      'safe-bottom': '96px',   // floating nav area
    }
  }
}
```

---

## FAZA 5: Performance & Bundle (~3h)

### 5.1 Framer-motion optimization
**Problem:** Cała lib (500KB+) importowana, użyta w 3 plikach
**Opcje:**

**A) Dynamic import (najprostszy):**
```tsx
// SwipeCard.tsx
const { motion } = await import('framer-motion')
```

**B) motion/react subset (best):**
```tsx
import { motion } from 'motion/react' // tree-shakeable, ~50KB
```

**C) CSS animations (radical, eliminates dep):**
- Replace framer-motion drag z native touch events + CSS transforms
- `touch-action: none` + `pointermove` + `transform: translateX(${x}px) rotate(${deg}deg)`
- Estymata: 4h ale saves 500KB

**Rekomendacja:** Opcja B (motion/react) — best balance

### 5.2 Image optimization
**Problem:** `<img>` tags z Unsplash URLs, brak lazy loading, brak blur placeholder
**Plan:**
- Replace `<img>` z `next/image` w SwipeCard, DayCard, CookingView
- Add `blur` placeholder (blurDataURL)
- Configure `images.remotePatterns` w next.config.ts
- Add `loading="lazy"` na non-critical images

### 5.3 React Query optimization
- Stale time na meals: 5min → 15min (meals don't change often)
- Prefetch next page meals
- Dedupe ingredient/cuisine queries

---

## FAZA 6: Testing & Documentation (~3h)

### 6.1 Test refactor (po component split)
- Update imports w __tests__/ po provider split
- Dodaj testy dla nowych hooków (useSwipeGestures, useSwipeNavigation)
- Dodaj testy dla nowych komponentów (PersonCard, DietSelector, etc.)
- Integration test: full swipe→plan→shopping flow
- Target: 600+ testów (z obecnych 512)

### 6.2 E2E stabilization
- Fix flaky swipe-flow.spec.ts
- Add retry logic
- Deterministic seed data for E2E
- Add visual regression testing (Percy/Chromatic lub Playwright screenshots)

### 6.3 Documentation
```
Nowe/zaktualizowane pliki:
  README.md              — setup, arch diagram, contributing
  CLAUDE.md              — AI agent instructions (update po refaktorze)
  docs/
    ARCHITECTURE.md      — provider tree, data flow, component hierarchy
    DESIGN_SYSTEM.md     — tokens, colors, typography, component variants
    API.md               — all API routes, request/response shapes
    TESTING.md           — test strategy, how to write tests
```

---

## Harmonogram realizacji

| Faza | Task | LOE | Deps | PR |
|------|------|-----|------|-----|
| 1.1 | Extract seed data | 1h | - | PR #60 |
| 1.2 | Remove mock-db | 1h | 1.1 | PR #60 |
| 1.3 | Console + imports | 30min | - | PR #60 |
| 1.4 | Type safety | 1h | - | PR #60 |
| **1** | **FAZA 1 MERGE** | **3.5h** | | |
| 2.1 | Context → providers | 3h | - | PR #61 |
| **2** | **FAZA 2 MERGE** | **3h** | | |
| 3.1 | SwipeView split | 2h | 2.1 | PR #62 |
| 3.2 | Settings split | 2h | 2.1 | PR #62 |
| 3.3 | CookingView cleanup | 1h | - | PR #62 |
| **3** | **FAZA 3 MERGE** | **5h** | | |
| 4.1 | UI primitives | 1.5h | 3.x | PR #63 |
| 4.2 | Design tokens | 30min | 4.1 | PR #63 |
| **4** | **FAZA 4 MERGE** | **2h** | | |
| 5.1 | motion/react migration | 2h | 3.1 | PR #64 |
| 5.2 | Image optimization | 1h | - | PR #64 |
| 5.3 | Query optimization | 30min | - | PR #64 |
| **5** | **FAZA 5 MERGE** | **3.5h** | | |
| 6.1 | Test refactor | 2h | 3.x | PR #65 |
| 6.2 | E2E stabilization | 1h | - | PR #65 |
| 6.3 | Documentation | 2h | all | PR #65 |
| **6** | **FAZA 6 MERGE** | **5h** | | |

**TOTAL: ~22h → 6 PRs → profesjonalne repo 10/10**

---

## Metryki docelowe (po refaktorze)

| Metryka | Przed | Po |
|---------|-------|-----|
| Największy plik | 2109 LOC | < 300 LOC |
| `as any` | 13 | 0 |
| console.log | 31 | 0 (poza error) |
| ESLint warnings | 27 | 0 |
| Max useState/component | 11 | 4 |
| Max component LOC | 616 | 200 |
| Context providers | 1 (God) | 5 (focused) |
| Bundle size | ~1.5MB | ~800KB (-47%) |
| Tests | 512 | 600+ |
| Documentation pages | 1 | 6 |

---

## Zasady podczas refaktoru

1. **Każda faza = osobny PR** z code review
2. **Testy muszą przechodzić** po każdym kroku (nie po całej fazie)
3. **Backward compatibility** — useAppContext() działa cały czas
4. **Incremental** — żaden big-bang rewrite
5. **Feature freeze** podczas refaktoru — zero nowych features
6. **Commit often** — jeden commit per logical change
