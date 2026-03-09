// Deduplication — check new meals against existing Notion entries

function normalize(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function deduplicateMeals(newMeals, existingNames) {
  const existingSet = new Set(existingNames.map(normalize));
  const accepted = [];
  const rejected = [];

  for (const meal of newMeals) {
    const normalized = normalize(meal.nazwa);
    if (existingSet.has(normalized)) {
      rejected.push(meal.nazwa);
    } else {
      accepted.push(meal);
      existingSet.add(normalized); // prevent dupes within batch
    }
  }

  if (rejected.length > 0) {
    console.log(`🔄 Odrzucono duplikaty: ${rejected.join(', ')}`);
  }

  return accepted;
}
