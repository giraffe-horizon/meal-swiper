/**
 * Meal image placeholder utilities.
 * Provides category-based gradient colours and emoji icons
 * to use as fallbacks when a photo fails to load or is absent.
 */

interface CategoryStyle {
  /** Tailwind gradient classes */
  gradient: string
  /** Emoji icon representing the category */
  emoji: string
  /** Human-readable label (Polish) */
  label: string
}

const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  makaron: {
    gradient: 'from-amber-400 to-orange-500',
    emoji: '🍝',
    label: 'Makaron',
  },
  pasta: {
    gradient: 'from-amber-400 to-orange-500',
    emoji: '🍝',
    label: 'Makaron',
  },
  zupa: {
    gradient: 'from-orange-300 to-red-400',
    emoji: '🥣',
    label: 'Zupa',
  },
  soup: {
    gradient: 'from-orange-300 to-red-400',
    emoji: '🥣',
    label: 'Zupa',
  },
  sałatka: {
    gradient: 'from-green-400 to-emerald-600',
    emoji: '🥗',
    label: 'Sałatka',
  },
  salad: {
    gradient: 'from-green-400 to-emerald-600',
    emoji: '🥗',
    label: 'Sałatka',
  },
  ryż: {
    gradient: 'from-yellow-300 to-amber-400',
    emoji: '🍚',
    label: 'Ryż',
  },
  rice: {
    gradient: 'from-yellow-300 to-amber-400',
    emoji: '🍚',
    label: 'Ryż',
  },
  kurczak: {
    gradient: 'from-yellow-400 to-orange-400',
    emoji: '🍗',
    label: 'Kurczak',
  },
  chicken: {
    gradient: 'from-yellow-400 to-orange-400',
    emoji: '🍗',
    label: 'Kurczak',
  },
  ryba: {
    gradient: 'from-cyan-400 to-blue-500',
    emoji: '🐟',
    label: 'Ryba',
  },
  fish: {
    gradient: 'from-cyan-400 to-blue-500',
    emoji: '🐟',
    label: 'Ryba',
  },
  burger: {
    gradient: 'from-yellow-500 to-red-500',
    emoji: '🍔',
    label: 'Burger',
  },
  pizza: {
    gradient: 'from-red-400 to-orange-400',
    emoji: '🍕',
    label: 'Pizza',
  },
  kanapka: {
    gradient: 'from-amber-300 to-yellow-500',
    emoji: '🥪',
    label: 'Kanapka',
  },
  sandwich: {
    gradient: 'from-amber-300 to-yellow-500',
    emoji: '🥪',
    label: 'Kanapka',
  },
  stir: {
    gradient: 'from-emerald-400 to-teal-500',
    emoji: '🥘',
    label: 'Stir-fry',
  },
  'stir-fry': {
    gradient: 'from-emerald-400 to-teal-500',
    emoji: '🥘',
    label: 'Stir-fry',
  },
  wegetariańskie: {
    gradient: 'from-green-300 to-lime-500',
    emoji: '🥦',
    label: 'Wegetariańskie',
  },
  wegetarianski: {
    gradient: 'from-green-300 to-lime-500',
    emoji: '🥦',
    label: 'Wegetariańskie',
  },
  sniadanie: {
    gradient: 'from-sky-300 to-blue-400',
    emoji: '🍳',
    label: 'Śniadanie',
  },
  śniadanie: {
    gradient: 'from-sky-300 to-blue-400',
    emoji: '🍳',
    label: 'Śniadanie',
  },
  breakfast: {
    gradient: 'from-sky-300 to-blue-400',
    emoji: '🍳',
    label: 'Śniadanie',
  },
  kasza: {
    gradient: 'from-lime-400 to-green-500',
    emoji: '🌾',
    label: 'Kasza',
  },
  grains: {
    gradient: 'from-lime-400 to-green-500',
    emoji: '🌾',
    label: 'Kasza',
  },
}

const DEFAULT_STYLE: CategoryStyle = {
  gradient: 'from-slate-400 to-slate-600',
  emoji: '🍽️',
  label: 'Posiłek',
}

/**
 * Returns the visual style (gradient + emoji) for a meal category.
 * Matching is case-insensitive and strips diacritics for robustness.
 */
export function getCategoryStyle(category?: string | null): CategoryStyle {
  if (!category) return DEFAULT_STYLE

  const normalised = category
    .toLowerCase()
    .trim()
    // Replace common Polish diacritics for looser matching
    .replace(/ą/g, 'a')
    .replace(/ć/g, 'c')
    .replace(/ę/g, 'e')
    .replace(/ł/g, 'l')
    .replace(/ń/g, 'n')
    .replace(/ó/g, 'o')
    .replace(/ś/g, 's')
    .replace(/ź|ż/g, 'z')

  // Direct match first
  if (CATEGORY_STYLES[category.toLowerCase().trim()]) {
    return CATEGORY_STYLES[category.toLowerCase().trim()]
  }

  // Normalised direct match
  if (CATEGORY_STYLES[normalised]) {
    return CATEGORY_STYLES[normalised]
  }

  // Partial / keyword match
  for (const [key, style] of Object.entries(CATEGORY_STYLES)) {
    if (normalised.includes(key) || key.includes(normalised)) {
      return style
    }
  }

  return DEFAULT_STYLE
}
