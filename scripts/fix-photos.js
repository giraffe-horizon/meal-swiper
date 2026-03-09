import axios from "axios";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DATABASE_ID = process.env.NOTION_DATABASE_ID;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;

const notionHeaders = {
  Authorization: `Bearer ${NOTION_TOKEN}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

async function searchImage(query) {
  try {
    const response = await axios.get("https://www.googleapis.com/customsearch/v1", {
      params: {
        key: GOOGLE_API_KEY,
        cx: GOOGLE_CSE_ID,
        q: `${query} potrawa przepis`,
        searchType: "image",
        num: 1,
      },
    });
    return response.data.items && response.data.items[0] ? response.data.items[0].link : null;
  } catch (error) {
    console.error(`Search error for ${query}:`, error.message);
    return null;
  }
}

async function fixPhotos() {
  console.log("Starting Notion sync via axios...");
  try {
    const response = await axios.post(
      `https://api.notion.com/v1/databases/${DATABASE_ID}/query`,
      {},
      { headers: notionHeaders }
    );
    
    const meals = response.data.results;
    console.log(`Checking ${meals.length} meals...`);

    for (const meal of meals) {
      // Correcting property path to "Name" based on inspection
      const nameProp = meal.properties.Name || meal.properties.name || meal.properties.Nazwa;
      if (!nameProp || !nameProp.title || !nameProp.title[0]) {
          console.log(`Skipping meal with missing name: ${meal.id}`);
          continue;
      }
      
      const name = nameProp.title[0].plain_text;
      console.log(`Processing: ${name}`);

      const newPhoto = await searchImage(name);
      if (newPhoto) {
        console.log(`Found photo: ${newPhoto}`);
        await axios.patch(
          `https://api.notion.com/v1/pages/${meal.id}`,
          {
            properties: {
              Zdjecie: { url: newPhoto },
            },
          },
          { headers: notionHeaders }
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  } catch (err) {
    console.error("Notion Error:", err.response ? err.response.data : err.message);
  }
  console.log("Done fixing photos!");
}

fixPhotos();
