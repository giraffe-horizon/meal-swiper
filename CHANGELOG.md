# [1.1.0](https://github.com/liskeee/meal-swiper/compare/v1.0.0...v1.1.0) (2026-03-10)

### Features

- persist settings in D1, remove desktop nav border ([02b2b16](https://github.com/liskeee/meal-swiper/commit/02b2b16393ff88de8ce8c42bffcb6aaba61a8309))

# 1.0.0 (2026-03-10)

### Bug Fixes

- add flex flex-col to view container for proper layout ([3518a98](https://github.com/liskeee/meal-swiper/commit/3518a982a1dff9c83db8559d8c0a5bfedd510351))
- add pages:build script for Cloudflare Pages deployment ([72805c9](https://github.com/liskeee/meal-swiper/commit/72805c93c521a63260c5f9b1adb7f91104e76969))
- background swipe cards show full info (opis, kcal, counter) matching top card ([2e2ac34](https://github.com/liskeee/meal-swiper/commit/2e2ac34439503f4719660f6fa8c0ab73c5bbedfc))
- desktop sidebar nav items full width ([75d0dec](https://github.com/liskeee/meal-swiper/commit/75d0dece4950a64cdbd1386afdbe9b9ad840ff0d))
- domyślny dzień w SwipeView — pierwszy pusty zamiast null ([391b3df](https://github.com/liskeee/meal-swiper/commit/391b3df57330d0b730f3bff0ff059a7c30cf6f3c))
- LoadingSpinner overflow — use flex-1 instead of min-h-screen ([c4436b5](https://github.com/liskeee/meal-swiper/commit/c4436b5e350faef6d68245380962a052eebc7cc6))
- make background swipe cards show full info consistent with top card ([e28baa8](https://github.com/liskeee/meal-swiper/commit/e28baa8c9ad03cae680a4980ad42098b46859b06))
- mobile layout — compact nav, smaller cards, shorter date format, hero cooking 30vh ([55e5c92](https://github.com/liskeee/meal-swiper/commit/55e5c923f46cbbde6c4db8c2367461bc3fc3af33))
- prevent duplicate meals in weekly plan — filter already selected ([0e3ac5d](https://github.com/liskeee/meal-swiper/commit/0e3ac5d94f92950280e3b01450962977dabad80e))
- prevent swipe reshuffle on meal selection + add person names in settings ([0e41036](https://github.com/liskeee/meal-swiper/commit/0e410368f2b8b8920da36d5aeb84a6e491e4b4db))
- proper tinder-like swipe + remove header ([691aac7](https://github.com/liskeee/meal-swiper/commit/691aac7a41447017a880e37f22fb1f98e11d5fdb))
- remove unsupported [build] section from wrangler.toml ([36110ae](https://github.com/liskeee/meal-swiper/commit/36110aef31f165ce952175498eaa3c9b5cefae8b))
- replace react-tinder-card with custom swipe implementation ([3f67731](https://github.com/liskeee/meal-swiper/commit/3f67731b766c0f23b44e374c5dbe90624f3acc58))
- restore h-full on CalendarView root, add stopPropagation to vacation menu ([3043e8c](https://github.com/liskeee/meal-swiper/commit/3043e8c4f084b2b157e22f6b182e9f27a1852ae3))
- rollback Next.js 16→15.5.2 (cloudflare/next-on-pages nie wspiera Next 16 jeszcze) ([032ae32](https://github.com/liskeee/meal-swiper/commit/032ae32b3355eb6b7a44930165e9f693eb393160))
- scroll, menus, swipe progress, food photos, tests ([448483a](https://github.com/liskeee/meal-swiper/commit/448483a607f7c02772834aec4274cdf9ea685740))
- smooth swipe animations — proper x reset timing ([820d83f](https://github.com/liskeee/meal-swiper/commit/820d83ff7940b711e7380194e9119db58476cd6f))
- SwipeView card height, husky prettier+tests, ESLint config cleanup ([c425d52](https://github.com/liskeee/meal-swiper/commit/c425d52f221936d1f823faaccb64d8442834eb67))
- update test 2 to use data-testid for consistency ([31d3bbf](https://github.com/liskeee/meal-swiper/commit/31d3bbfd8fb1a1b6f648dc0fef99b97c99e1acfa))
- urlop nie blokuje swipu, setMeal czyści \_free, gratulacje po wypełnieniu tygodnia ([74169ee](https://github.com/liskeee/meal-swiper/commit/74169eec122366bf1daca37617133b0e0c980518))
- use flex-1 on CalendarView root for proper flex layout ([9f9fc45](https://github.com/liskeee/meal-swiper/commit/9f9fc450e35f0ccb69e0326c5670ea096d072c79))
- wyraźniejszy highlight aktywnego dnia w SwipeView ([c2caa3e](https://github.com/liskeee/meal-swiper/commit/c2caa3e11de29f99ca2ac8c7c38774592f8786eb))

### Features

- API routes /meals i /image-search (edge runtime) ([c1af45c](https://github.com/liskeee/meal-swiper/commit/c1af45c78d1c2d73c1ba00e8fb68d429d0ddd5ff))
- custom hooks (useMeals, useWeeklyPlan, useWeekDates, useSwipe) ([52e0781](https://github.com/liskeee/meal-swiper/commit/52e078120a2269cb04c007d11dc2ab979345c28d))
- D1 database abstraction layer ([3a09f48](https://github.com/liskeee/meal-swiper/commit/3a09f481d725c8d5422e6e97cab3686e917f50c9))
- deploy config, .dev.vars template, gitignore updates ([ae45fa4](https://github.com/liskeee/meal-swiper/commit/ae45fa4fd88ad68a67c427cce2707484ebc8ae21))
- dynamic ingredient scaling based on number of people ([bda9177](https://github.com/liskeee/meal-swiper/commit/bda9177018b2f60412b12777ff68ab910d9d82a5))
- enrich recipe steps with ingredient amounts ([2a8bfa7](https://github.com/liskeee/meal-swiper/commit/2a8bfa7e14b97fcfb4000e8a22cf8e1123fa9991))
- flat lista zakupów + inteligentne sumowanie składników ([28211c2](https://github.com/liskeee/meal-swiper/commit/28211c2f0ab4d649cc3653484a223b0db129c6f1))
- initial Meal Swiper app ([d3cd419](https://github.com/liskeee/meal-swiper/commit/d3cd419cdd35214e695499de42a22b15c2e80e10))
- inline recipe amounts as styled badges with Polish stemming ([4d7b270](https://github.com/liskeee/meal-swiper/commit/4d7b2703ed0a92c3bebb0a67e62bbb3309bc5cf5))
- interactive day selector in SwipeView replacing static day banner ([1a9bd95](https://github.com/liskeee/meal-swiper/commit/1a9bd95a0f65e227feb7bc2bce1ac49cbfcd84d3))
- komponenty (Navigation, CalendarView, SwipeView, ShoppingListView) ([6067cf2](https://github.com/liskeee/meal-swiper/commit/6067cf2c2007b4e09d174956f0d999808e5e207b))
- losowe tasowanie dań w SwipeView (Fisher-Yates shuffle) ([399fe32](https://github.com/liskeee/meal-swiper/commit/399fe32285afb1a7dfbb60ee8bbac90fe60fb559))
- migrate API routes from Notion+KV to D1 ([dd13b58](https://github.com/liskeee/meal-swiper/commit/dd13b5862eb4024a3f779d73660d0fce996740be))
- Next.js 15 + @cloudflare/next-on-pages setup ([7ec7dc0](https://github.com/liskeee/meal-swiper/commit/7ec7dc0305151fc2ac8b25bd3529f98d3450b078))
- nowe typy (Trudnosc, Kuchnia, Przepis, Bialko), pagination Notion, fix build ([c5a9e9c](https://github.com/liskeee/meal-swiper/commit/c5a9e9c57db2fb29decb5bdf93387830cff910a6))
- playwright screenshots and visual fixes ([cc554a9](https://github.com/liskeee/meal-swiper/commit/cc554a9bd94ee4e5fe951f212f6e748a80ac3337))
- przenieś wybór tygodnia do globalnego headera ([6ab4c13](https://github.com/liskeee/meal-swiper/commit/6ab4c133716fddd01c52b4a754f4c7449ceaba9c))
- przyciski ❌/❤️ jako absolute na tle karty w SwipeView ([edcd72d](https://github.com/liskeee/meal-swiper/commit/edcd72d0b887f0f9890c95634c350a41991dddd9))
- R2 image uploads, semantic-release, version display in settings ([14345a8](https://github.com/liskeee/meal-swiper/commit/14345a8031906418d77f24109632e25b96789957))
- reusable DaySelector, add day switching to cooking view ([08d7a2e](https://github.com/liskeee/meal-swiper/commit/08d7a2ee23381c10ba79401195bd2625ef8b2d76))
- routing URL dla widoków (/plan, /swipe, /shopping) ([26f0a19](https://github.com/liskeee/meal-swiper/commit/26f0a1934a047d91313c2c4507d4b3a61284fc7e))
- scale kcal and shopping list based on settings ([1d757e5](https://github.com/liskeee/meal-swiper/commit/1d757e55ea4070818428a754ccf92b25a272e555))
- server-side storage (Cloudflare KV), noindex robots.txt, fix localStorage SSR ([454a8a8](https://github.com/liskeee/meal-swiper/commit/454a8a81c63cc95703d99799f5a62c55a14631e0))
- settings page for configuring people and nutrition goals ([8c2a62f](https://github.com/liskeee/meal-swiper/commit/8c2a62fad12143031c853f6c1bc6a01b4302267c))
- show info screen when week is full in swipe view ([92ff526](https://github.com/liskeee/meal-swiper/commit/92ff526c89965df589dd9db80444500b64f4364f))
- show week selector on all views, remove duplicate "Pomiń wszystkie" from header ([e35a555](https://github.com/liskeee/meal-swiper/commit/e35a555213b79b9ec7b05b2cba2df56d6e728c17))
- stable swipe order using context state ([a6c3619](https://github.com/liskeee/meal-swiper/commit/a6c3619f76f8b67f3efe0d96a5db87a7835c9f2d))
- stały header + footer, scrollowany content ([8a5b1b5](https://github.com/liskeee/meal-swiper/commit/8a5b1b51403ea886c3fb4b755a72757f483a1437))
- stitch design system, calendar UI, 100 meals ([a7cdd22](https://github.com/liskeee/meal-swiper/commit/a7cdd22e706b21673f15c42fc8ca2233cfd61ad1))
- strona główna z pełną logiką aplikacji ([2ac868a](https://github.com/liskeee/meal-swiper/commit/2ac868a861725cb55a70b44f9d17a3f057869a00))
- tab Gotowanie — przepis na dziś, składniki z checklistą, kroki numerowane, wskazówki ([ec3fe12](https://github.com/liskeee/meal-swiper/commit/ec3fe12b78f3e5abe0e6687e0cd52ed68454fbe9))
- testy E2E + jednostkowe (59 testów), fix photo_url bug, zdjęcia posiłków, pre-commit config ([67aaea3](https://github.com/liskeee/meal-swiper/commit/67aaea38105d4394348d2a8f7fb3d0cc91c9483b))
- Tinder UI, header z datą, lista zakupów (filtr staples, lepsze sumowanie), fix startsWith bug ([203138e](https://github.com/liskeee/meal-swiper/commit/203138ebb4dd4938337fa14ea748c5503fa64654))
- Tinder-style SwipeView z framer-motion ([e743d36](https://github.com/liskeee/meal-swiper/commit/e743d368de569628ba35e520ec1eca5ba1d6b670))
- types, notion lib, storage helpers, utils ([b444a06](https://github.com/liskeee/meal-swiper/commit/b444a06878837d5f7c0d075a3fdb30c2a4762ad2))
- upgrade Next.js 16.1.6 + React 19, ESLint flat config, fix confetti Math.random, linter w pre-commit ([f33cabd](https://github.com/liskeee/meal-swiper/commit/f33cabdd830876e585adc35e9887655b50f4f5c1))

# Changelog

All notable changes to Meal Swiper will be documented in this file.

This project uses [Semantic Release](https://github.com/semantic-release/semantic-release) for automated versioning.

## [2.0.0] - 2026-03-10

### 🚀 Features

- Migration from Notion + KV to Cloudflare D1 (SQLite)
- Recipe enrichment with inline scaled amounts and AmountBadge components
- Polish stemming for ingredient matching
- Dynamic scaling of kcal/protein/shopping list by person count
- Person names in settings
- Desktop sidebar navigation with full-width items
- DaySelector reusable component
- Swipe state persistence across tab switches

### 🐛 Bug Fixes

- Background swipe cards now show full info (opis, kcal, counter)
- Swipe cards no longer reshuffle after meal selection
- LoadingSpinner fix
- Swipe animation fix
- Duplicate meal prevention in swipe deck

### 🏗️ Refactoring

- Split oversized components (SwipeCard, SwipeStack, SwipeActions, DayCard)
- Settings moved from 5th tab to header gear icon (4 tabs + ⚙️)
- Removed unused files and Notion dependency
