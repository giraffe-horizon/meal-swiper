// Image generation via nano-banana-pro + upload to Imgur (anonymous)

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import path from 'node:path'
import fs from 'node:fs'

const execFileAsync = promisify(execFile)

const NANO_BANANA = path.join(
  process.env.HOME,
  '.npm-global/lib/node_modules/openclaw/skills/nano-banana-pro/scripts/generate_image.py'
)

const IMAGES_DIR = path.join(import.meta.dirname, '..', 'generated-images')

// Imgur anonymous upload client ID (public, for anonymous uploads)
const IMGUR_CLIENT_ID = '546c25a59c58ad7'

function slugify(str) {
  return str.toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

async function uploadToImgur(filePath) {
  const imageBuffer = fs.readFileSync(filePath)
  const base64Image = imageBuffer.toString('base64')

  const formData = new URLSearchParams()
  formData.append('image', base64Image)
  formData.append('type', 'base64')

  const response = await fetch('https://api.imgur.com/3/image', {
    method: 'POST',
    headers: {
      'Authorization': `Client-ID ${IMGUR_CLIENT_ID}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Imgur upload failed (${response.status}): ${err.slice(0, 200)}`)
  }

  const data = await response.json()
  if (!data.success || !data.data?.link) {
    throw new Error(`Imgur: brak URL w odpowiedzi`)
  }

  return data.data.link
}

export async function generateImage(meal, geminiApiKey) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true })

  const slug = slugify(meal.nazwa)
  const filename = `${new Date().toISOString().slice(0, 10)}-${slug}.png`
  const outputPath = path.join(IMAGES_DIR, filename)

  const prompt = `${meal.prompt_zdjecia || meal.nazwa}, food photography, appetizing, high quality, natural light`

  console.log(`📸 Generuję: ${meal.nazwa.slice(0, 50)}...`)

  // 1. Generuj zdjęcie lokalnie
  try {
    await execFileAsync('python3', [NANO_BANANA, '--prompt', prompt, '--filename', outputPath], {
      env: { ...process.env, GEMINI_API_KEY: geminiApiKey },
      timeout: 90000,
    })
  } catch (err) {
    console.warn(`   ⚠️  Błąd generowania: ${(err.stderr || err.message || '').toString().slice(0, 100)}`)
    return null
  }

  if (!fs.existsSync(outputPath)) {
    console.warn(`   ⚠️  Plik nie istnieje po generowaniu`)
    return null
  }

  const sizeKB = Math.round(fs.statSync(outputPath).size / 1024)
  console.log(`   ✅ Zdjęcie wygenerowane (${sizeKB}KB)`)

  // 2. Upload do Imgur
  try {
    const url = await uploadToImgur(outputPath)
    console.log(`   ✅ Imgur: ${url}`)
    return url
  } catch (err) {
    console.warn(`   ⚠️  Imgur upload failed: ${err.message}`)
    return null
  }
}
