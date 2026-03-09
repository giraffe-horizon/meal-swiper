// Notion API client for meals database

const NOTION_API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

function headers(token) {
  return {
    'Authorization': `Bearer ${token}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json',
  };
}

export async function getDatabaseSchema(token, dbId) {
  const res = await fetch(`${NOTION_API}/databases/${dbId}`, {
    headers: headers(token),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Notion GET database failed (${res.status}): ${body}`);
  }
  return res.json();
}

export async function ensureMissingProperties(token, dbId, existingProps) {
  const requiredProps = {
    Trudnosc: { select: { options: [
      { name: 'łatwe', color: 'green' },
      { name: 'średnie', color: 'yellow' },
      { name: 'trudne', color: 'red' },
    ] } },
    Kuchnia: { select: { options: [] } },
    Przepis: { rich_text: {} },
    Bialko_baza: { number: { format: 'number' } },
    Bialko_z_miesem: { number: { format: 'number' } },
  };

  const missing = {};
  for (const [name, config] of Object.entries(requiredProps)) {
    if (!existingProps[name]) {
      missing[name] = config;
    }
  }

  if (Object.keys(missing).length === 0) {
    return;
  }

  console.log(`🔧 Tworzę brakujące pola w Notion: ${Object.keys(missing).join(', ')}`);

  const res = await fetch(`${NOTION_API}/databases/${dbId}`, {
    method: 'PATCH',
    headers: headers(token),
    body: JSON.stringify({ properties: missing }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Notion PATCH database failed (${res.status}): ${body}`);
  }

  console.log('✅ Pola utworzone');
}

export async function getExistingMealNames(token, dbId) {
  const names = [];
  let cursor = undefined;

  while (true) {
    const body = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;

    const res = await fetch(`${NOTION_API}/databases/${dbId}/query`, {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Notion query failed (${res.status}): ${text}`);
    }

    const data = await res.json();
    for (const page of data.results) {
      const title = page.properties?.Name?.title?.[0]?.plain_text;
      if (title) names.push(title);
    }

    if (!data.has_more) break;
    cursor = data.next_cursor;
  }

  return names;
}

function truncateRichText(str, maxLen = 2000) {
  // Notion rich_text has a 2000 char limit per block
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen);
}

export async function createMealPage(token, dbId, meal) {
  const properties = {
    Name: {
      title: [{ text: { content: meal.nazwa } }],
    },
    Opis: {
      rich_text: [{ text: { content: meal.opis || '' } }],
    },
    Czas_przygotowania: {
      number: meal.czas_przygotowania || null,
    },
    Kcal_baza: {
      number: meal.makro?.baza?.kcal || null,
    },
    Kcal_z_miesem: {
      number: meal.makro?.z_miesem?.kcal || null,
    },
    Bialko_baza: {
      number: meal.makro?.baza?.bialko || null,
    },
    Bialko_z_miesem: {
      number: meal.makro?.z_miesem?.bialko || null,
    },
    Skladniki_baza: {
      rich_text: [{ text: { content: truncateRichText(JSON.stringify(meal.skladniki_baza || [])) } }],
    },
    Skladniki_mieso: {
      rich_text: [{ text: { content: truncateRichText(JSON.stringify(meal.skladniki_mieso || [])) } }],
    },
    Przepis: {
      rich_text: [{ text: { content: truncateRichText(JSON.stringify(meal.przepis || {})) } }],
    },
    Tagi: {
      multi_select: (meal.tagi || []).map(tag => ({ name: tag })),
    },
    Trudnosc: {
      select: meal.trudnosc ? { name: meal.trudnosc } : null,
    },
    Kuchnia: {
      select: meal.kuchnia ? { name: meal.kuchnia } : null,
    },
  };

  // Add photo URL if available
  if (meal.photo_url) {
    properties.Zdjecie = { url: meal.photo_url };
  }

  const res = await fetch(`${NOTION_API}/pages`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({
      parent: { database_id: dbId },
      properties,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Notion create page failed (${res.status}): ${body}`);
  }

  return res.json();
}
