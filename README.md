# Meal Swiper

Aplikacja do planowania posiłków na tydzień w stylu Tinder — przesuń w prawo, aby dodać danie do planu, w lewo, aby pominąć.

## Funkcje

- **Plan** — kalendarz tygodniowy (Pn–Pt) z podglądem planu, oznaczaniem wolnych dni i menu kontekstowym
- **Swipe** — przeglądaj dania i wybieraj przesunięciem (drag/strzałki klawiaturowe)
- **Lista zakupów** — automatycznie generowana z planu, skalowana na liczbę osób, z checkboxami i udostępnianiem
- **Gotowanie** — przepis dla wybranego dnia z listą składników (skalowanych) i krokami
- **Ustawienia** — konfiguracja liczby osób i celów kalorycznych

## Stack

- **Next.js 15** (App Router) + **TypeScript** (strict mode)
- **Tailwind CSS 3**
- **Framer Motion** (animacje swipe)
- **Cloudflare D1** (SQLite database)
- **Cloudflare R2** (Image storage)
- **@cloudflare/next-on-pages** (edge runtime na Cloudflare Pages)

## Architektura

```
┌─────────────────────────────────────────────┐
│              Cloudflare Pages               │
│  ┌────────────────────────────────────────┐  │
│  │         Next.js 15 (App Router)        │  │
│  │                                        │  │
│  │  /plan  /swipe  /shopping              │  │
│  │  /cooking  /settings                   │  │
│  │                                        │  │
│  │  /api/meals     (edge, D1)             │  │
│  │  /api/plan      (edge, D1)             │  │
│  │  /api/shopping-checked (edge, D1)      │  │
│  └──────────────┬─────────────────────────┘  │
│                 │                             │
│  @cloudflare/next-on-pages + D1 + R2         │
└─────────────────┼─────────────────────────────┘
                  │
    ┌─────────────┴─────────────┐
    │       Cloudflare D1       │
    │  (SQLite database)        │
    └───────────────────────────┘
```

## Env vars

| Zmienna          | Opis                                  |
| ---------------- | ------------------------------------- |
| `DB`             | Cloudflare D1 binding                 |
| `R2_BUCKET`      | Cloudflare R2 bucket binding          |
| `GEMINI_API_KEY` | Google Gemini API key (dla przepisów) |
| `CLOUDFLARE_ID`  | Account ID do operacji na R2          |

## Uruchomienie lokalne

```bash
npm install
cp .dev.vars.example .dev.vars   # uzupełnij env vars
npm run dev
```

Aplikacja dostępna pod `http://localhost:3000`.

## Build & Deploy

```bash
npm run build          # Next.js build (sprawdzenie lokalne)
npm run pages:build    # Build dla Cloudflare Pages
npm run deploy         # Build + wrangler deploy
```

Ustaw env vars w Cloudflare Pages Dashboard → Settings → Environment variables.

## Skrypty

| Skrypt                | Opis                         |
| --------------------- | ---------------------------- |
| `npm run dev`         | Next.js dev server           |
| `npm run build`       | Next.js production build     |
| `npm run pages:build` | Build dla Cloudflare Pages   |
| `npm run deploy`      | Build + deploy na Cloudflare |
| `npm run type-check`  | Sprawdzenie typów TypeScript |
| `npm test`            | Testy Vitest (130+ testów)   |

## Autor

**Giraffe Horizon** — _Building the future, one byte at a time._

- **Email**: contact@giraffehorizon.com
- **Website**: [giraffehorizon.com](https://giraffehorizon.com)

## Licencja

Projekt jest udostępniony na licencji **MIT**.
