import axios from "axios";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

const notionHeaders = {
  Authorization: `Bearer ${NOTION_TOKEN}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

async function updateMealPhoto(mealId, photoUrl) {
  try {
    await axios.patch(
      `https://api.notion.com/v1/pages/${mealId}`,
      {
        properties: {
          Zdjecie: { url: photoUrl },
        },
      },
      { headers: notionHeaders }
    );
    console.log(`Updated photo for meal ${mealId}`);
  } catch (err) {
    console.error("Error updating Notion:", err.response ? err.response.data : err.message);
  }
}

// Update the pizza flatbread explicitly
updateMealPhoto("31d390cc-e19d-8106-ae86-eb7199e58247", "https://meal-swiper.pages.dev/meals/pizza_flatbread.png");
