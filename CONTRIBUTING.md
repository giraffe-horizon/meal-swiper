# Contributing to Meal Swiper 🦾

Dziękujemy, że chcesz pomóc w rozwoju projektu! Jako część wizji **Giraffe Horizon**, Meal Swiper dąży do bycia wysokiej jakości, nowoczesną aplikacją do planowania posiłków.

## Zasady ogólne

1.  **Issue First**: Zanim zaczniesz pracę, upewnij się, że istnieje odpowiednie Issue. Jeśli nie, stwórz je korzystając z [szablonów](https://github.com/liskeee/meal-swiper/issues/new/choose).
2.  **Spójność ze stylem**: Trzymaj się wytycznych zawartych w `CLAUDE.md`.

## Tech Stack

- **Frontend**: Next.js (App Router), Tailwind CSS
- **Design**: Obsidian/Emerald palette (dark mode primary)
- **Baza danych**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2 (zdjęcia posiłków)
- **Testy**: Vitest + Playwright

## Przygotowanie środowiska

1.  Sklonuj repozytorium: `git clone https://github.com/liskeee/meal-swiper`
2.  Zainstaluj zależności: `npm install`
3.  Skopiuj `.env.example` do `.env` i uzupełnij klucze API.
4.  Uruchom lokalnie: `npm run dev`

## Workflow Pull Requestów

1.  Stwórz nową gałąź z opisową nazwą: `git checkout -b feat/shopping-list-ticktick`
2.  Wprowadź zmiany i upewnij się, że kod jest zgodny ze standardami projektu.
3.  Uruchom testy: `npm test`
4.  Otwórz Pull Request, korzystając z szablonu.
5.  Poczekaj na review od maintainerów projektu.

## Kontakt

W razie pytań lub sugestii, zapraszamy do kontaktu:

- **Email**: contact@giraffehorizon.com
- **Strona WWW**: [giraffehorizon.com](https://giraffehorizon.com)

## Licencja

Projekt jest udostępniony na licencji **MIT**.
