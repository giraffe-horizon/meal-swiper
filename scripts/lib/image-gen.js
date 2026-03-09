// Image generation via nano-banana-pro wrapper

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import fs from 'node:fs';

const execFileAsync = promisify(execFile);

const NANO_BANANA_SCRIPT = path.join(
  process.env.HOME,
  '.npm-global/lib/node_modules/openclaw/skills/nano-banana-pro/scripts/generate_image.py'
);

const IMAGES_DIR = path.join(import.meta.dirname, '..', 'generated-images');

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function generateImage(meal, apiKey) {
  // Ensure output directory exists
  fs.mkdirSync(IMAGES_DIR, { recursive: true });

  const dateStr = new Date().toISOString().slice(0, 10);
  const slug = slugify(meal.nazwa);
  const filename = `${dateStr}-${slug}.png`;
  const outputPath = path.join(IMAGES_DIR, filename);

  const prompt = `${meal.prompt_zdjecia}, food photography, appetizing, high quality`;

  console.log(`📸 Generuję zdjęcie: ${meal.nazwa}...`);

  try {
    const { stdout, stderr } = await execFileAsync(
      'python3',
      [NANO_BANANA_SCRIPT, '--prompt', prompt, '--filename', outputPath],
      {
        env: { ...process.env, GEMINI_API_KEY: apiKey },
        timeout: 120000,
      }
    );

    if (stdout) console.log(stdout.trim());
    if (stderr) console.error(stderr.trim());

    if (fs.existsSync(outputPath)) {
      console.log(`✅ Zdjęcie zapisane: ${outputPath}`);
      return outputPath;
    } else {
      console.warn(`⚠️ Zdjęcie nie zostało wygenerowane dla: ${meal.nazwa}`);
      return null;
    }
  } catch (err) {
    console.warn(`⚠️ Błąd generowania zdjęcia dla "${meal.nazwa}": ${err.message}`);
    return null;
  }
}
