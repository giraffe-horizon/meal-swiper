# Meal Swiper — Plan migracji na Expo (React Native) v3

> Zaktualizowany po sesjach Rady Nadzorczej #1 i #2 (2026-04-04)

## Decyzje produktowe

- ✅ Backend: Cloudflare Workers + D1 — zostaje bez zmian
- ✅ Web version: porzucamy — mobile-only
- ❌ ~~Monorepo Turborepo~~ → Flat structure z TSConfig path aliases
- ✅ Expo Router (file-based routing z tabs)
- ✅ NativeWind v4 (Tailwind CSS for React Native) — zachowujemy Emerald Hearth design tokens
- ✅ Zustand zamiast Context tower (UI state only — React Query jest source of truth dla server data)
- ✅ Nowe Gesture API (`Gesture.Pan()` composable) zamiast legacy `PanGestureHandler`
- ✅ Velocity-based swipe threshold zamiast distance-based
- ✅ 4 taby (Swipe, Plan, Shopping, Settings) — Cooking jako sub-screen Planu
- ✅ URL scheme: `mealswiper://` (skonfigurowane w `app.json` → `expo.scheme`)

## MVP Definition

**MVP jest DONE gdy:** App jest w TestFlight + Google Play Internal Testing, Łukasz i Ala mogą zaplanować tydzień posiłków end-to-end (swipe → plan → lista zakupów) z osobnymi wariantami diety.

**Must-have na launch:**

- ✅ Swipe meals (right = dodaj, left = skip)
- ✅ Plan tygodnia (5 dni, per-day meal assignment)
- ✅ Lista zakupów (pogrupowana, checkable)
- ✅ 2 profile (Łukasz: mięsożerca + Ala: wegetarianka) z osobnymi wariantami
- ✅ Auth flow (tenant token, join household via deep link)
- ✅ Cooking sub-screen (przepis + składniki z poziomu Planu)
- ✅ Delete Account flow (Apple wymaganie)
- ✅ Privacy Policy

**Explicite NIE w MVP:**

- ❌ Offline mode (POST-MVP)
- ❌ Push notifications (POST-MVP)
- ❌ iOS Widget (BACKLOG)
- ❌ Confetti/fancy animacje (POST-MVP)
- ❌ QR code sharing (POST-MVP — deep link wystarczy na start)

## Budżet i wymagania

| Pozycja                               | Koszt                                    |
| ------------------------------------- | ---------------------------------------- |
| Apple Developer Program               | $99/rok                                  |
| Google Play Developer                 | $25 jednorazowo                          |
| EAS Build (free tier: 30 builds/mies) | $0 na start, $15/mies jeśli przekroczymy |
| Cloudflare Workers (istniejące)       | $0 (free tier)                           |
| **TOTAL na start**                    | **~$125**                                |

**Wymagania sprzętowe:**

- Mac nie wymagany — EAS Build w chmurze (iOS build remote)
- Telefon z Expo Go / dev client do testowania
- Łukasz ma iPhone — iOS-first development

## State Management Architecture

**Zasada: React Query = source of truth dla server data. Zustand = UI-only state.**

| Store             | Typ          | Zawartość                                                      | Persistence                   |
| ----------------- | ------------ | -------------------------------------------------------------- | ----------------------------- |
| React Query cache | Server state | meals, plan, settings, shopping, tenant, ingredients, cuisines | In-memory + staleTime         |
| `stores/auth.ts`  | UI state     | tenant token, onboarding status                                | `expo-secure-store`           |
| `stores/swipe.ts` | UI state     | currentIndex, seenIds, currentDay, shuffleOrder                | `AsyncStorage` (seenIds only) |
| `stores/ui.ts`    | UI state     | activeFilters, weekOffset, toasts                              | In-memory only                |

**Zustand NIE cachuje danych z API.** Hooki queries (`useMealsQuery`, `usePlanQuery` etc.) zwracają dane bezpośrednio z RQ cache. Zustand trzyma tylko stan interfejsu (co user zaznaczył, gdzie jest w swipe flow, jakie filtry włączył).

## Architektura docelowa

```
meal-swiper/
├── app/                           # Expo Router
│   ├── _layout.tsx                # Root layout + QueryClient + Zustand hydration
│   ├── index.tsx                  # Redirect → tabs (lub onboarding jeśli brak tokenu)
│   ├── onboarding.tsx             # Utwórz / dołącz do household
│   ├── join/[token].tsx           # Deep link: join household
│   └── (tabs)/
│       ├── _layout.tsx            # Tab navigator (4 taby)
│       ├── plan/
│       │   ├── index.tsx          # Plan tygodnia
│       │   └── cook/[mealId].tsx  # Cooking sub-screen
│       ├── swipe.tsx              # Swipe view
│       ├── shopping.tsx           # Lista zakupów
│       └── settings.tsx           # Ustawienia
│
├── components/
│   ├── swipe/
│   │   ├── SwipeCard.tsx          # Reanimated + new Gesture API
│   │   ├── SwipeStack.tsx
│   │   ├── SwipeActions.tsx       # PRIMARY a11y path — pełnoprawne przyciski Like/Nope/Info
│   │   ├── CategoryFilter.tsx
│   │   ├── CompatibilityIndicator.tsx
│   │   └── FridgeModeFilter.tsx
│   ├── plan/
│   │   ├── DayCard.tsx
│   │   └── CalendarView.tsx
│   ├── cooking/
│   │   ├── CookingView.tsx
│   │   ├── CookingHero.tsx
│   │   ├── CookingProgressBar.tsx
│   │   ├── IngredientRow.tsx
│   │   ├── IngredientSection.tsx
│   │   └── RecipeSteps.tsx
│   ├── settings/
│   │   ├── DietSelector.tsx
│   │   ├── HouseholdSection.tsx
│   │   ├── IngredientExcluder.tsx
│   │   ├── PersonCard.tsx
│   │   ├── PreferenceEditor.tsx
│   │   └── DeleteAccountButton.tsx
│   ├── shopping/
│   │   └── ShoppingListView.tsx
│   ├── MealModal.tsx              # Bottom sheet (@gorhom/bottom-sheet)
│   └── ui/
│       ├── Card.tsx
│       ├── IconButton.tsx
│       ├── LoadingSpinner.tsx
│       ├── Pill.tsx
│       ├── Section.tsx
│       ├── SliderField.tsx
│       ├── AmountBadge.tsx
│       ├── DaySelector.tsx
│       └── MealImagePlaceholder.tsx
│
├── stores/                        # Zustand — UI state ONLY
│   ├── auth.ts                    # Tenant token (expo-secure-store)
│   ├── swipe.ts                   # UI: current index, seen IDs, current day
│   └── ui.ts                      # UI: filters, week offset, toasts
│
├── hooks/
│   ├── queries/                   # React Query — server state (source of truth)
│   │   ├── useCuisinesQuery.ts
│   │   ├── useIngredientsQuery.ts
│   │   ├── useMealsQuery.ts
│   │   ├── useMealsWithVariantsQuery.ts
│   │   ├── usePlanQuery.ts
│   │   ├── useSettingsQuery.ts
│   │   ├── useShoppingCheckedQuery.ts
│   │   └── useTenantQuery.ts
│   ├── useSwipeGestures.ts        # Reanimated + Gesture.Pan()
│   ├── useSwipeNavigation.ts
│   ├── useSwipeToast.ts
│   ├── useMeals.ts
│   ├── useSettings.ts
│   ├── useWeekDates.ts
│   ├── useWeeklyPlan.ts
│   └── useCookingData.ts
│
├── lib/                           # Business logic (przeniesione z web ~bez zmian)
│   ├── api.ts                     # Klient API (base URL z expo-constants)
│   ├── storage.ts                 # AsyncStorage adapter
│   ├── meal-filter.ts
│   ├── shopping.ts
│   ├── scaling.ts
│   ├── amounts.ts
│   ├── fridge.ts
│   ├── recipe.ts
│   ├── ingredients.ts
│   ├── meal-convert.ts
│   ├── meal-placeholder.ts
│   └── utils.ts
│
├── types/
│   └── index.ts
│
├── api/                           # Cloudflare Workers (standalone)
│   ├── src/
│   │   ├── routes/
│   │   │   ├── meals.ts
│   │   │   ├── plan.ts
│   │   │   ├── settings.ts
│   │   │   ├── shopping-checked.ts
│   │   │   ├── tenant.ts
│   │   │   ├── ingredients.ts
│   │   │   ├── cuisines.ts
│   │   │   └── account.ts         # DELETE /account (Apple requirement)
│   │   ├── db.ts
│   │   ├── middleware.ts          # API key via wrangler secret, rate limiting
│   │   └── index.ts              # Hono router
│   ├── wrangler.toml
│   ├── schema.sql
│   └── package.json
│
├── docs/
│   ├── GESTURE_MAP.md
│   └── ACCESSIBILITY_CHECKLIST.md
│
├── data/
│   ├── seed-meals.json
│   ├── seed-ingredients.json
│   └── schema.sql
│
├── design-reference/
├── assets/                        # App icons, splash screen
├── app.json                       # Expo config (scheme: "mealswiper")
├── eas.json                       # EAS Build: dev/preview/production + autoIncrement + channels
├── tailwind.config.js             # Emerald Hearth tokens
├── global.css
├── tsconfig.json                  # Path aliases (@/ → root)
└── package.json
```

## Gesture Map

| Ekran     | Gesture                      | Akcja                                                                 | Kolizja / Rozwiązanie                                                                                                                      |
| --------- | ---------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Swipe     | Pan horizontal               | Like/Nope (velocity > 800 LUB distance > 40% screen width)            | iOS swipe-back: `gestureEnabled: false`. Android predictive back: `BackHandler` intercept + `android:enableOnBackInvokedCallback` handling |
| Swipe     | Tap card                     | Otwórz MealModal (bottom sheet)                                       | Brak                                                                                                                                       |
| Swipe     | Tap buttons (Like/Nope/Info) | **PRIMARY a11y path** — pełnoprawna alternatywa gestów, nie backup    | Brak                                                                                                                                       |
| Plan      | Tap DayCard                  | Otwórz bottom sheet (Gotuj / Usuń / Zamień)                           | Brak                                                                                                                                       |
| Plan      | Pan horizontal               | Week navigation (prev/next week)                                      | Brak — inny kontekst niż Swipe                                                                                                             |
| Shopping  | Tap checkbox                 | Toggle checked                                                        | Brak                                                                                                                                       |
| Shopping  | Tap expand icon              | Pokaż ilość/details (expandable row)                                  | ~~Long press~~ zamienione na expand icon (a11y-friendly)                                                                                   |
| MealModal | Pan vertical                 | Expand/collapse/dismiss                                               | @gorhom obsługuje                                                                                                                          |
| Cooking   | Scroll vertical              | Przewijaj przepis                                                     | Brak                                                                                                                                       |
| Wszystkie | Tab bar tap                  | Switch tab                                                            | Brak                                                                                                                                       |
| Wszystkie | iOS edge swipe               | WYŁĄCZONY na Swipe tab, aktywny na reszcie                            | Per-screen config                                                                                                                          |
| Wszystkie | Android back                 | Standard back na wszystkich tabech, intercept na Swipe (confirm exit) | `BackHandler`                                                                                                                              |

**A11y principle:** Każdy gesture ma button equivalent. Buttons (SwipeActions) to PRIMARY interaction path, gesty to enhancement. VoiceOver/TalkBack users używają wyłącznie buttonów.

## Accessibility Baseline

Per komponent (od Fazy 1):

- `accessibilityLabel` na każdym interaktywnym elemencie
- `accessibilityRole` (button, checkbox, tab, image, header, text, adjustable)
- `accessibilityHint` dla niestandardowych gestów (swipe card)
- `accessibilityState` (selected, checked, disabled)
- `accessibilityActions` na SwipeCard: [{name: 'like'}, {name: 'skip'}, {name: 'details'}]
- Respektuj `reduceMotion` (`useReducedMotion()` z Reanimated) → wyłącz animacje swipe, użyj snap/fade
- Dynamic Type / font scaling — nie hardcodować font sizes w px, użyć Tailwind RN responsive units
- Minimum touch target 44x44pt (Apple HIG) / 48x48dp (Material)
- Expandable rows zamiast long press (VoiceOver nie wspiera long press dobrze)
- Test z VoiceOver (iOS) przed każdym release
- Switch Control compatibility: buttons jako primary path gwarantuje

## Fazy realizacji

### Faza 0 — API extraction + project setup (~2 dni)

**Cel:** Standalone API + Expo project gotowy do developmentu.

1. **API extraction:**
   - Przenieś `app/api/` routes → `api/src/routes/` jako standalone Hono app
   - Przenieś `lib/db.ts`, `lib/get-db.ts`, `lib/tenant.ts` → `api/src/`
   - Dodaj middleware: API key validation via `wrangler secret put MEAL_SWIPER_API_KEY` (od dnia 0, zero hardcodu)
   - Dodaj rate limiting (Cloudflare built-in)
   - Dodaj `DELETE /account` endpoint (Apple requirement — kasuje tenant + dane)
   - Przenieś `wrangler.toml`
   - Deploy + smoke test: wszystkie endpointy odpowiadają
2. **Expo project init:**
   - `npx create-expo-app@latest . --template tabs` (w nowym branchu)
   - TSConfig path aliases (`@/` → root)
   - Przenieś `types/index.ts`, `lib/` (pure logic), `hooks/queries/`
   - `lib/api.ts` — base URL z `expo-constants` / app config
   - `app.json`: `expo.scheme: "mealswiper"` (deep links)
3. **EAS setup:**
   - `eas.json` z dev/preview/production profiles
   - `autoIncrement: true` na buildNumber/versionCode
   - Channels: `development`, `preview`, `production`
   - `eas build --profile dev` — pierwszy dev client build
   - Potwierdzenie że builduje na iOS i Android
   - Skonfiguruj `expo-updates` z runtime version policy (`appVersion`)

**Deliverable:** API deployed standalone z wrangler secrets, Expo dev client działa na telefonie, EAS skonfigurowany

### Faza 1 — Core infra: stores + auth + UI primitives (~2 dni)

**Cel:** Fundament apki — state management, auth, podstawowe komponenty.

1. **State management:**
   - React Query client z `staleTime: 5min`, `gcTime: 30min`
   - Zustand stores (UI-only):
     - `stores/auth.ts` — tenant token w `expo-secure-store`
     - `stores/swipe.ts` — currentIndex, seenIds, currentDay
     - `stores/ui.ts` — activeFilters, weekOffset, toasts
   - Jasna granica: RQ = server data, Zustand = UI state
2. **Auth flow:**
   - Onboarding screen: generuj token lub wpisz istniejący
   - Deep link `mealswiper://join/TOKEN` → dołącz do household
   - Token persisted w SecureStore
   - API calls z headerem `X-Tenant-Token` + `X-API-Key`
3. **NativeWind setup:**
   - Tailwind config z Emerald Hearth tokens
   - Global styles
4. **UI primitives (z a11y od dnia 1):**
   - Card, Pill, IconButton, Section, LoadingSpinner, SliderField, AmountBadge, DaySelector, MealImagePlaceholder
   - Każdy primitive z `accessibilityRole` + `accessibilityLabel`
   - Ikony: `@expo/vector-icons` MaterialCommunityIcons (zamiast Material Symbols)
5. **Tab navigator:**
   - 4 taby: Swipe | Plan | Lista | Ustawienia
   - Bottom tab bar w stylu Emerald Hearth (ciemny, rounded, blur via `expo-blur`)

**Deliverable:** App z 4 pustymi tabami, działającym auth, state management, accessible UI kit

### Faza 2 — Swipe flow (~4 dni)

**Cel:** Core mechanic apki — swipe meals.

> ⚠️ Pierwsze spotkanie z Reanimated + Gesture API. Ekstra czas na learning curve.

1. **SwipeCard:**
   - `Gesture.Pan()` z `react-native-gesture-handler` v2.9+
   - `react-native-reanimated` shared values
   - Velocity-based threshold: `velocityX > 800` LUB `translationX > screenWidth * 0.4`
   - Animacje: rotate (max ±18°), opacity badges LIKE/NOPE
   - `expo-haptics` impact on threshold cross
   - `useReducedMotion()` → snap bez animacji
   - `accessibilityActions`: like, skip, details
   - `accessibilityHint="Przesuń w prawo aby dodać, w lewo aby pominąć"`
2. **SwipeStack** — stack z kartami (top 3 rendered)
3. **SwipeActions** — **PRIMARY interaction buttons** Like/Nope/Info (nie backup dla gestów!)
4. **CategoryFilter** — filtrowanie po kuchni/kategorii
5. **FridgeModeFilter** — tryb "co mam w lodówce"
6. **CompatibilityIndicator** — badge czy pasuje do obu diet
7. **MealModal** — `@gorhom/bottom-sheet` z detalami posiłku
8. **Gesture conflict resolution:**
   - iOS: `gestureEnabled: false` na Swipe screen
   - Android: `BackHandler` intercept, predictive back handling

**Deliverable:** Pełny swipe flow z prawdziwymi danymi, haptic feedback, accessible

### Faza 3 — Plan + Shopping + Cooking (~4 dni)

> ⚠️ 3 ekrany z ~15 komponentami. Cooking to 6 komponentów sam w sobie.

1. **Plan view:**
   - CalendarView z week navigation (pan horizontal)
   - DayCard (tap → bottom sheet z opcjami: Pokaż przepis / Usuń / Zamień)
   - DaySelector (Mon-Fri)
   - Vacation toggle per day
   - "Gotuj" button na DayCard → nawigacja do `plan/cook/[mealId]`
2. **Cooking sub-screen** (`app/(tabs)/plan/cook/[mealId].tsx`):
   - CookingHero z meal image (`expo-image`)
   - IngredientSection + IngredientRow (z wariantem per osoba)
   - RecipeSteps z step-by-step progress
   - CookingProgressBar
   - `expo-keep-awake` — ekran nie gaśnie
3. **Shopping list:**
   - Pogrupowana po kategoriach (mięso, warzywa, nabiał...)
   - Checkbox per składnik z sync do API
   - Expandable rows (tap expand icon → pokaż details) — zamiast long press
   - Ilości przeskalowane wg settings
   - Pull-to-refresh

**Deliverable:** Wszystkie ekrany MVP działają end-to-end

### Faza 4 — Settings + polish (~2 dni)

1. **Settings screen:**
   - HouseholdSection (osoby w gospodarstwie)
   - PersonCard z DietSelector, PreferenceEditor, IngredientExcluder
   - SliderField (kcal, białko, posiłki/dzień)
   - Household sharing: "Zaproś" → generuj deep link → Share sheet
   - **Delete Account** button → potwierdź → `DELETE /account` → wyczyść SecureStore → onboarding
2. **Polish:**
   - Loading states (skeleton screens)
   - Error states (retry)
   - Empty states ("Brak posiłków na ten dzień")
   - Toast notifications (swipe result)
   - App icon + splash screen (Emerald Hearth branding)

**Deliverable:** Settings kompletne, apka wygląda profesjonalnie

### Faza 5 — Testing + Deploy + OTA (~2 dni)

1. **Testy:**
   - Unit: Vitest dla `lib/` pure logic (przeniesione z web)
   - Component: React Native Testing Library (kluczowe: SwipeCard, DayCard, ShoppingListView)
   - E2E: Maestro (smoke test: swipe → plan → shopping)
2. **OTA Updates setup:**
   - Skonfiguruj `expo-updates` z `eas update`
   - Channel `production` — hotfixy bez App Store review
   - Channel `preview` — preview builds na PR-y
   - Test OTA flow: `eas update --channel production --message "test"`
3. **Pre-submission checklist:**
   - Privacy Policy URL (hosted na CF Pages)
   - Delete Account flow zaimplementowany w Fazie 4
   - App Store screenshots (6.7", 6.1")
   - App description PL/EN
   - Purpose strings dla permissions (jeśli potrzebne)
4. **Deploy:**
   - `eas build --profile production` (iOS + Android)
   - TestFlight → internal testing (Łukasz + Ala)
   - Google Play → Internal Testing track
   - Smoke test na obu platformach
   - Po walidacji → App Store + Google Play submission

**Deliverable:** App w TestFlight + Google Play Internal Testing, OTA pipeline gotowy

---

## POST-MVP Backlog (iteracje po launch)

| Feature                                           | Estymacja | Priorytet |
| ------------------------------------------------- | --------- | --------- |
| Animacje polish (transitions, micro-interactions) | 1-2 dni   | 🟡        |
| Push notifications ("Czas planować!")             | 1 dzień   | 🟡        |
| Offline mode (expo-sqlite + sync)                 | 3-5 dni   | 🟡        |
| QR code sharing (join household)                  | 0.5 dnia  | 🟢        |
| iOS Widget (dzisiejszy posiłek)                   | 3-5 dni   | 🟢        |
| Shared element transitions                        | 1-2 dni   | 🟢        |
| Confetti on plan complete                         | 0.5 dnia  | 🟢        |

## Zależności kluczowe

| Pakiet                                      | Zastępuje            | Cel                                 |
| ------------------------------------------- | -------------------- | ----------------------------------- |
| `expo-router`                               | Next.js App Router   | File-based routing                  |
| `nativewind` v4                             | Tailwind CSS         | Style w RN                          |
| `react-native-reanimated`                   | framer-motion        | Animacje 60fps                      |
| `react-native-gesture-handler` v2.9+        | DOM touch events     | Gesture.Pan() composable API        |
| `zustand`                                   | React Context tower  | UI-only state management            |
| `@tanstack/react-query`                     | (bez zmian)          | Server state (source of truth)      |
| `@react-native-async-storage/async-storage` | localStorage         | Persistent UI state                 |
| `expo-secure-store`                         | localStorage (token) | Secure token storage                |
| `expo-image`                                | next/image           | Optimized images                    |
| `expo-haptics`                              | —                    | Haptic feedback on swipe            |
| `expo-keep-awake`                           | —                    | Screen on during cooking            |
| `expo-updates`                              | —                    | OTA updates (hotfixy bez App Store) |
| `expo-blur`                                 | CSS backdrop-blur    | Tab bar blur effect                 |
| `@gorhom/bottom-sheet`                      | custom modal         | Native bottom sheet                 |
| `@expo/vector-icons`                        | Material Symbols     | Ikony (MaterialCommunityIcons)      |
| `hono`                                      | Next.js API routes   | Lightweight API framework           |

## Estymacja (z 30% buforem + RN learning overhead)

| Faza                          | Bazowa     | Z buforem 30%              | Priorytet |
| ----------------------------- | ---------- | -------------------------- | --------- |
| 0 — API extraction + setup    | 2 dni      | 2.5 dni                    | 🔴 MVP    |
| 1 — Core infra + auth         | 2 dni      | 2.5 dni                    | 🔴 MVP    |
| 2 — Swipe flow                | **4 dni**  | **5 dni**                  | 🔴 MVP    |
| 3 — Plan + Shopping + Cooking | **4 dni**  | **5 dni**                  | 🔴 MVP    |
| 4 — Settings + polish         | 2 dni      | 2.5 dni                    | 🔴 MVP    |
| 5 — Testing + deploy + OTA    | 2 dni      | 2.5 dni                    | 🔴 MVP    |
| **RN learning overhead**      | **+3 dni** | **(rozproszone po F1-F3)** | 📚        |
| **TOTAL MVP**                 | **19 dni** | **~23 dni**                |           |

**Przy part-time (~4-5h/dzień): ~5-6 tygodni**
**Przy full-time focus: ~3.5-4 tygodnie**

## Ryzyka

| #   | Ryzyko                                               | Prawdopod. | Impact | Mitigation                                                            |
| --- | ---------------------------------------------------- | ---------- | ------ | --------------------------------------------------------------------- |
| 1   | NativeWind v4 edge cases                             | Średnie    | Średni | Fallback: StyleSheet.create per component                             |
| 2   | Material Symbols → MaterialCommunityIcons — brak 1:1 | Niskie     | Niski  | Mapowanie ikon w Fazie 1, custom SVG jako fallback                    |
| 3   | EAS Build queue (free tier)                          | Średnie    | Niski  | Upgrade do $15/mies jeśli bottleneck                                  |
| 4   | App Store rejection                                  | Średnie    | Wysoki | Delete Account, Privacy Policy, purpose strings — zrobione w planie   |
| 5   | First RN project — learning curve                    | Wysokie    | Średni | +3 dni learning overhead w estymacji, Reanimated/Gesture docs upfront |
| 6   | Android predictive back conflict ze swipe            | Niskie     | Średni | BackHandler intercept, testować na Android 13+ w Fazie 2              |
| 7   | Deep link scheme conflict                            | Niskie     | Niski  | Sprawdzić `mealswiper://` unikalność, dodać universal links POST-MVP  |
