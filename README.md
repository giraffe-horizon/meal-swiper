# Meal Swiper 🍽️

A Tinder-like weekly meal planner built with React, Vite, Tailwind CSS, and Cloudflare Pages.

## Features

- **Swipe UI**: Tinder-style card swiper for browsing meal options
- **Weekly Planner**: Visual Mon-Fri meal planning grid
- **Shopping List**: Auto-generated grocery list from selected meals
- **Notion Integration**: All data stored in Notion databases
- **Mobile-First**: Optimized for grocery shopping on the go

## Tech Stack

- React + Vite
- Tailwind CSS
- react-tinder-card
- Cloudflare Pages + Functions
- Notion API

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
   - Copy `.env.example` to `.dev.vars`
   - Add your Notion credentials (already done if you ran setup)

3. Run development server:
```bash
npm run dev
```

4. Run with Cloudflare Pages dev server (includes API functions):
```bash
npm run pages:dev
```

## Notion Setup

The databases have been created with the following IDs:
- **Meals Database**: `31d390cc-e19d-8165-9af4-e3a7f6c4ec67`
- **Weekly Plan Database**: `31d390cc-e19d-815c-9e86-eb59a29def67`

## Deployment

Deploy to Cloudflare Pages:

```bash
npm run build
npm run pages:deploy
```

Or connect your GitHub repo to Cloudflare Pages dashboard for automatic deployments.

### Environment Variables (Cloudflare Pages)

Set these in your Cloudflare Pages dashboard:
```
NOTION_TOKEN=your_notion_integration_token
MEALS_DB_ID=31d390cc-e19d-8165-9af4-e3a7f6c4ec67
WEEKLY_PLAN_DB_ID=31d390cc-e19d-815c-9e86-eb59a29def67
```

## Project Structure

```
meal-swiper/
├── src/
│   ├── components/
│   │   ├── SwipeView.jsx       # Tinder-style meal browser
│   │   ├── WeeklyPlanView.jsx  # Weekly meal planner
│   │   └── ShoppingListView.jsx # Auto-generated shopping list
│   ├── App.jsx                  # Main app component
│   ├── main.jsx                 # Entry point
│   └── index.css                # Global styles
├── functions/
│   └── api/
│       ├── meals.js             # GET /api/meals
│       └── weekly.js            # GET/POST /api/weekly
├── scripts/
│   └── setup-notion.js          # Database setup script
└── public/                      # Static assets
```

## Usage

1. **Browse Meals**: Swipe right to add meals to your week, left to skip
2. **Plan Week**: View and manage your Mon-Fri meal plan
3. **Shopping List**: Auto-generated from selected meals, grouped by category

## License

MIT
