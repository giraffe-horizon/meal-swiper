# Meal Swiper

Mobilna aplikacja do planowania posiłków na tydzień w stylu Tinder — przesuń w prawo, aby dodać danie do planu, w lewo, aby pominąć. Zbudowana w Expo/React Native.

## Stack

- **Expo SDK 53** + **React Native** + **TypeScript**
- **NativeWind v4** (Tailwind CSS for React Native)
- **Zustand** (UI state) + **React Query** (server state)
- **React Native Reanimated** + **Gesture Handler** (gesture-based swipe)
- **Expo Router** (file-based routing)
- **Cloudflare Workers** (API — Hono) + **D1** (SQLite)

## Getting Started

```bash
npm install
npx expo start
```

API (standalone Cloudflare Worker):

```bash
cd api
npm install
npm run dev
```

## Architektura

Aplikacja ma 4 taby:

| Tab | Opis |
|-----|------|
| **Swipe** | Przeglądaj dania gestem (swipe right = dodaj, left = skip). Velocity-based threshold + button fallback dla a11y. |
| **Plan** | Kalendarz tygodniowy (Pn–Pt) z podglądem planu. Tap → bottom sheet z opcjami (Gotuj / Usuń / Zamień). Cooking jako sub-screen. |
| **Lista zakupów** | Automatycznie generowana z planu, skalowana na liczbę osób, pogrupowana po składnikach z checkboxami. |
| **Ustawienia** | Profile osób (kcal, białko, dieta), excluded ingredients, household management, delete account. |

### State Management

- **React Query** = source of truth dla server data (meals, plan, settings, shopping)
- **Zustand** = UI-only state (filters, week offset, swipe index, toasts, auth token)

### API

Standalone Cloudflare Worker w `api/` z własnym `package.json` i `wrangler.toml`. Hono router z middleware (API key auth, tenant extraction). Database: Cloudflare D1 (SQLite).

## Scripts

| Script | Opis |
|--------|------|
| `npm run dev` | Expo dev server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm test` | Vitest (unit tests) |
| `npm run test:coverage` | Vitest z coverage |

## Autor

**Giraffe Horizon** — _Building the future, one byte at a time._

- **Email**: contact@giraffehorizon.com
- **Website**: [giraffehorizon.com](https://giraffehorizon.com)

## Licencja

Projekt jest udostępniony na licencji **MIT**.
