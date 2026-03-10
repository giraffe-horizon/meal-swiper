// Shared amount parsing and formatting utilities

export interface ParsedAmount {
  value: number
  unit: string
  gramsHint?: number // Optional hint from parentheses, e.g., "2 ząbki (16g)" or "6 łyżki (60ml)"
  hintUnit?: 'g' | 'ml' // Unit of the hint (defaults to 'g')
}

const UNIT_ALIASES: Record<string, string> = {
  g: 'g',
  gram: 'g',
  gramów: 'g',
  gramy: 'g',
  kg: 'kg',
  ml: 'ml',
  l: 'l',
  litr: 'l',
  litry: 'l',
  litrów: 'l',
  szt: 'szt',
  'szt.': 'szt',
  sztuka: 'szt',
  sztuki: 'szt',
  sztuk: 'szt',
  łyżka: 'łyżki',
  łyżki: 'łyżki',
  łyżek: 'łyżki',
  łyżeczka: 'łyżeczki',
  łyżeczki: 'łyżeczki',
  łyżeczek: 'łyżeczki',
  opakowanie: 'opakowania',
  opakowania: 'opakowania',
  opakowań: 'opakowania',
  puszka: 'puszki',
  puszki: 'puszki',
  puszek: 'puszki',
  szklanka: 'szklanki',
  szklanki: 'szklanki',
  szklankę: 'szklanki',
  szczypta: 'szczypty',
  szczypty: 'szczypty',
  szczypt: 'szczypty',
  ząbek: 'ząbki',
  ząbki: 'ząbki',
  ząbków: 'ząbki',
  plaster: 'plastry',
  plastry: 'plastry',
  plastrów: 'plastry',
}

export function parseAmount(amount: string): ParsedAmount | null {
  const trimmed = amount.trim()

  // Match patterns with optional grams/ml hints in parentheses:
  // "2 ząbki (16g)" → value: 2, unit: ząbki, gramsHint: 16, hintUnit: 'g'
  // "2 ząbki (ok. 16g)" → value: 2, unit: ząbki, gramsHint: 16, hintUnit: 'g'
  // "6 łyżki (60ml)" → value: 6, unit: łyżki, gramsHint: 60, hintUnit: 'ml'
  // "200g" → value: 200, unit: g
  // "2 łyżki" → value: 2, unit: łyżki
  const matchWithHint = trimmed.match(
    /^([\d.,½¼¾⅓⅔]+)\s+([^(]+?)\s*\((?:ok\.\s*)?(\d+(?:[.,]\d+)?)\s*(g|ml)\)$/i
  )
  if (matchWithHint) {
    const valueStr = matchWithHint[1]
    let unit = matchWithHint[2].trim().toLowerCase()
    const hintStr = matchWithHint[3]
    const hintUnit = matchWithHint[4].toLowerCase() as 'g' | 'ml'

    const fractions: Record<string, number> = {
      '½': 0.5,
      '¼': 0.25,
      '¾': 0.75,
      '⅓': 0.333,
      '⅔': 0.667,
    }

    let value: number
    if (fractions[valueStr]) {
      value = fractions[valueStr]
    } else {
      value = parseFloat(valueStr.replace(',', '.'))
    }

    if (isNaN(value)) return null

    const gramsHint = parseFloat(hintStr.replace(',', '.'))
    unit = UNIT_ALIASES[unit] || unit

    return {
      value,
      unit,
      gramsHint: isNaN(gramsHint) ? undefined : gramsHint,
      hintUnit: isNaN(gramsHint) ? undefined : hintUnit,
    }
  }

  // Standard pattern: "200g", "2 łyżki", "½ szklanki", also handles fractions "1/2 szklanki"
  // First try fraction pattern
  const fractionMatch = trimmed.match(/^(\d+)\/(\d+)\s*(.*)$/)
  if (fractionMatch) {
    const value = parseInt(fractionMatch[1]) / parseInt(fractionMatch[2])
    let unit = fractionMatch[3].trim().toLowerCase()
    unit = UNIT_ALIASES[unit] || unit
    return { value, unit }
  }

  const match = trimmed.match(/^([\d.,½¼¾⅓⅔]+)\s*(.*)$/)
  if (!match) return null

  const valueStr = match[1]
  let unit = match[2].trim().toLowerCase()

  // Handle fractions
  const fractions: Record<string, number> = {
    '½': 0.5,
    '¼': 0.25,
    '¾': 0.75,
    '⅓': 0.333,
    '⅔': 0.667,
  }
  let value: number
  if (fractions[valueStr]) {
    value = fractions[valueStr]
  } else {
    value = parseFloat(valueStr.replace(',', '.'))
  }

  if (isNaN(value)) return null

  // Normalize unit
  unit = UNIT_ALIASES[unit] || unit

  return { value, unit }
}

export function formatNumber(n: number): string {
  // Format common fractions for better readability
  const FRACTIONS: Array<[number, string]> = [
    [1 / 4, '1/4'],
    [1 / 3, '1/3'],
    [1 / 2, '1/2'],
    [2 / 3, '2/3'],
    [3 / 4, '3/4'],
  ]
  const TOLERANCE = 0.02
  for (const [val, str] of FRACTIONS) {
    if (Math.abs(n - val) <= TOLERANCE) return str
  }
  if (Number.isInteger(n)) return n.toString()
  // Round to 1 decimal, remove trailing zero
  return n.toFixed(1).replace(/\.0$/, '')
}

export function formatAmount(
  value: number,
  unit: string,
  gramsHint?: number,
  hintUnit: 'g' | 'ml' = 'g'
): string {
  let result: string
  if (unit === 'g' && value >= 1000) {
    const kg = value / 1000
    result = `${formatNumber(kg)} kg`
  } else if (unit === 'ml' && value >= 1000) {
    const l = value / 1000
    result = `${formatNumber(l)} l`
  } else {
    result = unit ? `${formatNumber(value)} ${unit}` : formatNumber(value)
  }

  // Append hint if present
  if (gramsHint !== undefined && gramsHint > 0) {
    result += ` (ok. ${formatNumber(gramsHint)}${hintUnit})`
  }

  return result
}
