const { Client } = require("@notionhq/client");
const axios = require("axios");

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DATABASE_ID = process.env.NOTION_DATABASE_ID;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;

const notion = new Client({ auth: NOTION_TOKEN });

async function searchImage(query) {
  try {
    const response = await axios.get("https://www.googleapis.com/customsearch/v1", {
      params: {
        key: GOOGLE_API_KEY,
        cx: GOOGLE_CSE_ID,
        q: `${query} danie przepis`,
        searchType: "image",
        num: 1,
      },
    });
    return response.data.items[0].link;
  } catch (error) {
    console.error(`Search error for ${query}:`, error.message);
    return null;
  }
}

async function verifyImage(dishName, imageUrl) {
  try {
    const prompt = `Czy to zdjęcie przedstawia potrawę: "${dishName}"? Odpowiedz tylko TAK lub NIE. Jeśli nie jesteś pewien, odpowiedz NIE.`;
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_API_KEY}`,
      {
        contents: [
          {
            parts: [
              { text: prompt },
              { inline_data: { mime_type: "image/jpeg", data: await getBase64(imageUrl) } },
            ],
          },
        ],
      }
    );
    const text = response.data.candidates[0].content.parts[0].text.trim().toUpperCase();
    return text.includes("TAK");
  } catch (error) {
    console.error(`Verification error for ${dishName}:`, error.message);
    return true; // Default to true if verification fails
  }
}

async function getBase64(url) {
  const response = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(response.data, "binary").toString("base64");
}

async function fixPhotos() {
  const response = await notion.databases.query({ database_id: DATABASE_ID });
  const meals = response.results;

  console.log(`Checking ${meals.length} meals...`);

  for (const meal of meals) {
    const name = meal.properties.Nazwa.title[0].plain_text;
    const currentPhoto = meal.properties.Zdjecie.url;

    console.log(`Checking: ${name}`);

    // Skip if photo exists and we trust it (optional)
    // For now, let's verify all if they look generic or just search for everything that was problematic
    
    const newPhoto = await searchImage(name);
    if (newPhoto && newPhoto !== currentPhoto) {
      console.log(`Updating ${name} with new photo: ${newPhoto}`);
      await notion.pages.update({
        page_id: meal.id,
        properties: {
          Zdjecie: { url: newPhoto },
        },
      });
    }

    // Sleep to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  console.log("Done fixing photos!");
}

fixPhotos();
