/**
 * Fragrance attribute chip display mappings.
 *
 * Attributes are stored as "Key: Value" strings in the `attributes` column
 * (e.g. "Longevity: Long", "Sillage: Strong"). This module maps each raw
 * qualitative label to a precise, human-readable display value while
 * keeping the key prefix intact.
 *
 * Fallback: any string not covered by a mapping renders verbatim — no crash,
 * no blank chip.
 *
 * Value spellings are inferred from Fragrantica community conventions (no seed
 * file exists in the repo — data lives in Supabase cloud). Alternate spellings
 * that are commonly observed are included defensively.
 */

type ValueMap = Record<string, string>

/** Per-key lookup tables. Keys must match the stored prefix exactly. */
const ATTRIBUTE_VALUES: Record<string, ValueMap> = {
  Longevity: {
    'Weak':      '2–4 hrs',
    'Poor':      '2–4 hrs',      // alternate spelling
    'Moderate':  '5–7 hrs',
    'Average':   '5–7 hrs',      // alternate spelling
    'Long':      '8–10 hrs',
    'Very Long': '10–12 hrs',
    'Eternal':   '12+ hrs',
    'Immortal':  '12+ hrs',      // alternate superlative
  },
  Sillage: {
    'Intimate': 'skin-close',
    'Soft':     'skin-close',
    'Moderate': "arm's reach",
    'Strong':   'fills the room',
    'Heavy':    'fills the room', // alternate spelling
    'Enormous': 'projects broadly',
    'Beast':    'projects broadly',
  },
  Price: {
    '$':    'under $50',
    '$$':   '$50–$100',
    '$$$':  '$100–$250',
    '$$$$': '$250+',
  },
  Versatility: {
    'Occasion-specific': '1–2 occasions',
    'Niche':             '1–2 occasions',  // alternate phrasing
    'Seasonal':          '1–2 seasons',
    'Moderate':          '2–3 seasons',
    'Versatile':         'All seasons, day & night',
    'Universal':         'Any occasion',
  },
}

/**
 * Parses a "Key: Value" attribute string and returns a precise display label.
 * Returns the original string unchanged if the key or value has no mapping.
 */
export function formatAttribute(raw: string): string {
  const sep = raw.indexOf(': ')
  if (sep === -1) return raw

  const key = raw.slice(0, sep)
  const value = raw.slice(sep + 2).trim()

  const valueMap = ATTRIBUTE_VALUES[key]
  if (!valueMap) return raw

  const mapped = valueMap[value]
  return mapped !== undefined ? `${key}: ${mapped}` : raw
}

