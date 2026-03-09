import axios from "axios";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

const notionHeaders = {
  Authorization: `Bearer ${NOTION_TOKEN}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

// Map meal keywords to photo filenames
const photoMap = {
  pierogi: "/meals/pierogi_ruskie.png",
  bigos: "/meals/bigos.png",
  kotlet: "/meals/kotlet_schabowy.png",
  schabowy: "/meals/kotlet_schabowy.png",
  pasta: "/meals/pasta_pomidorowa.png",
  pomidorowa: "/meals/pasta_pomidorowa.png",
  curry: "/meals/curry_kurczak.png",
  "pad thai": "/meals/pad_thai.png",
  shakshuka: "/meals/shakshuka.png",
  gyros: "/meals/gyros.png",
  "chana masala": "/meals/chana_masala.png",
  risotto: "/meals/risotto.png",
};

async function updateLocalPhotos() {
  console.log("Updating Notion with local photos...");
  try {
    const response = await axios.post(
      `https://api.notion.com/v1/databases/${DATABASE_ID}/query`,
      {},
      { headers: notionHeaders }
    );

    const meals = response.data.results;
    console.log(`Checking ${meals.length} meals...`);

    let updated = 0;
    for (const meal of meals) {
      const nameProp = meal.properties.Name || meal.properties.name || meal.properties.Nazwa;
      if (!nameProp || !nameProp.title || !nameProp.title[0]) {
        console.log(`Skipping meal with missing name: ${meal.id}`);
        continue;
      }

      const name = nameProp.title[0].plain_text.toLowerCase();
      console.log(`Processing: ${name}`);

      // Find matching photo
      let photoUrl = null;
      for (const [keyword, url] of Object.entries(photoMap)) {
        if (name.includes(keyword)) {
          photoUrl = url;
          break;
        }
      }

      if (photoUrl) {
        console.log(`Updating with: ${photoUrl}`);
        await axios.patch(
          `https://api.notion.com/v1/pages/${meal.id}`,
          {
            properties: {
              Zdjecie: { url: photoUrl },
            },
          },
          { headers: notionHeaders }
        );
        updated++;
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    console.log(`Done! Updated ${updated} meals.`);
  } catch (err) {
    console.error("Notion Error:", err.response ? err.response.data : err.message);
  }
}

updateLocalPhotos();
