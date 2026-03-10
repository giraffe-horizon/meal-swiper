#!/bin/bash
# Migration: Add category column to meals table

echo "🔄 Adding category column to meals table..."

CLOUDFLARE_API_TOKEN=$CLOUDFLARE_API_TOKEN \
CLOUDFLARE_ACCOUNT_ID=$CLOUDFLARE_ACCOUNT_ID \
npx wrangler d1 execute meal-swiper-db --remote --command "ALTER TABLE meals ADD COLUMN category TEXT DEFAULT ''"

echo "✅ Migration complete"
