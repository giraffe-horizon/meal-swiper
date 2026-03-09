#!/usr/bin/env node

/**
 * Script to update meal photos in Notion using Google Custom Search API
 *
 * Usage: node scripts/update-photos.js
 *
 * Fetches all meals from Notion, searches Google Images for matching food photos,
 * and updates the Zdjecie (photo) field for meals with placeholder images.
 */

import * as dotenv from 'dotenv'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load environment variables from .dev.vars
const devVarsPath = resolve(process.cwd(), '.dev.vars')
const devVars = readFileSync(devVarsPath, 'utf-8')
  .split('\n')
  .filter(line => line.trim() && !line.startsWith('#'))
  .reduce((acc, line) => {
    const [key, ...valueParts] = line.split('=')
    acc[key.trim()] = valueParts.join('=').trim()
    return acc
  }, {})

const NOTION_TOKEN = devVars.NOTION_TOKEN || process.env.NOTION_TOKEN
const MEALS_DB_ID = devVars.MEALS_DB_ID || process.env.NOTION_DATABASE_ID
const GOOGLE_API_KEY = devVars.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY
const GOOGLE_CSE_CX = devVars.GOOGLE_CSE_ID || process.env.GOOGLE_CSE_ID

if (!NOTION_TOKEN || !MEALS_DB_ID) {
  console.error('Missing NOTION_TOKEN or MEALS_DB_ID in .dev.vars')
  process.exit(1)
}

// Sleep utility for rate limiting
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Fetch all meals from Notion
async function fetchAllMeals() {
  console.log('📥 Fetching meals from Notion...')

  const response = await fetch(`https://api.notion.com/v1/databases/${MEALS_DB_ID}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to fetch meals: ${error}`)
  }

  const data = await response.json()

  const meals = data.results.map(page => ({
    id: page.id,
    name: page.properties.Name?.title?.[0]?.plain_text || 'Bez nazwy',
    photoUrl: page.properties.Zdjecie?.url || '',
    photoFiles: page.properties.Zdjecie?.files || []
  }))

  console.log(`✅ Found ${meals.length} meals`)
  return meals
}

// Search Google Images for meal photo
async function searchMealImage(mealName) {
  const searchQuery = `${mealName} danie przepis`
  const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CSE_CX}&q=${encodeURIComponent(searchQuery)}&searchType=image&num=3&imgSize=large&safe=active`

  const response = await fetch(searchUrl)

  if (!response.ok) {
    const error = await response.text()
    console.error(`Google CSE API error for "${mealName}":`, error)
    return null
  }

  const data = await response.json()

  if (!data.items || data.items.length === 0) {
    console.warn(`⚠️  No images found for: ${mealName}`)
    return null
  }

  return data.items[0].link
}

// Update photo in Notion
async function updateMealPhoto(mealId, photoUrl, mealName) {
  const response = await fetch(`https://api.notion.com/v1/pages/${mealId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        Zdjecie: {
          url: photoUrl
        }
      }
    })
  })

  if (!response.ok) {
    const error = await response.text()
    console.error(`Failed to update photo for "${mealName}":`, error)
    return false
  }

  console.log(`✅ Updated photo for: ${mealName}`)
  return true
}

// Determine if photo is placeholder/generic
function isPlaceholderPhoto(photoUrl, photoFiles) {
  if (!photoUrl) return true

  // Check if it's a generic Unsplash placeholder
  if (photoUrl.includes('unsplash.com/photos/random')) return true
  if (photoUrl.includes('placeholder')) return true

  // If photo is from Notion files (uploaded), keep it
  if (photoFiles && photoFiles.length > 0 && photoFiles[0].type === 'file') {
    return false
  }

  // If it's an external URL that looks generic, replace it
  // You can add more heuristics here
  return false // Default: keep existing photos unless obviously placeholder
}

// Main function
async function main() {
  console.log('🚀 Starting photo update process...\n')

  try {
    const meals = await fetchAllMeals()

    let updatedCount = 0
    let skippedCount = 0
    let failedCount = 0

    for (let i = 0; i < meals.length; i++) {
      const meal = meals[i]
      console.log(`\n[${i + 1}/${meals.length}] Processing: ${meal.name}`)

      // Check if photo needs updating
      if (!isPlaceholderPhoto(meal.photoUrl, meal.photoFiles)) {
        console.log(`⏭️  Skipping (has valid photo)`)
        skippedCount++
        continue
      }

      // Search for new photo
      console.log(`🔍 Searching for image...`)
      const imageUrl = await searchMealImage(meal.name)

      if (!imageUrl) {
        failedCount++
        await sleep(1000) // Rate limit even on failure
        continue
      }

      console.log(`📸 Found image: ${imageUrl.substring(0, 60)}...`)

      // Update in Notion
      const success = await updateMealPhoto(meal.id, imageUrl, meal.name)

      if (success) {
        updatedCount++
      } else {
        failedCount++
      }

      // Rate limit: 1 request per second
      await sleep(1000)
    }

    console.log('\n' + '='.repeat(50))
    console.log('📊 Summary:')
    console.log(`   ✅ Updated: ${updatedCount}`)
    console.log(`   ⏭️  Skipped: ${skippedCount}`)
    console.log(`   ❌ Failed: ${failedCount}`)
    console.log(`   📝 Total: ${meals.length}`)
    console.log('='.repeat(50))

  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  }
}

main()
