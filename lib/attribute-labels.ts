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
 * that are commonly observed are included defensively. Price tiers cover $
 * through $$$$$ to ensure no raw symbol string reaches the UI.
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
    '$':      'under $50',
    '$$':     '$50–$100',
    '$$$':    '$100–$250',
    '$$$$':   '$250–$400',
    '$$$$$':  '$400+',
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

/**
 * Returns the mapped display value for a given key+value pair, or the raw
 * value if no mapping exists. Unlike formatAttribute, this omits the
 * "Key: " prefix — useful when the label is rendered separately.
 */
export function formatAttributeValue(key: string, value: string): string {
  const trimmed = value.trim()
  const valueMap = ATTRIBUTE_VALUES[key]
  if (!valueMap) return trimmed
  return valueMap[trimmed] ?? trimmed
}

// ─── Spec rows ───────────────────────────────────────────────────────────────

/**
 * Attribute keys that render as rows in the detail page's spec table, in the
 * order they appear there. Price is appended by the renderer because it comes
 * from its own column rather than the `attributes` array.
 *
 * These four all share the "Key: Value" shape and get one identical treatment.
 * The previous SCALAR_METRIC_KEYS set singled out Longevity and Sillage for
 * segmented meters and left Versatility as an orphan chip — a code decision
 * with no backing in the data, since none of these values carry a magnitude.
 */
export const SPEC_ATTRIBUTE_KEYS: readonly string[] = ['Longevity', 'Sillage', 'Versatility']

// ─── Price tier ──────────────────────────────────────────────────────────────

/** Maps a raw Price value ($–$$$$$) to a 1-based tier index (1–5). */
const PRICE_TIERS: Record<string, number> = {
  '$': 1, '$$': 2, '$$$': 3, '$$$$': 4, '$$$$$': 5,
}

/**
 * Returns the price tier (1–5) for a raw price value, or null if unmapped.
 * Used to confirm a stored tier is one we recognise before it reaches the UI;
 * the tier symbols themselves are what the detail page displays.
 */
export function getPriceTier(value: string): number | null {
  return PRICE_TIERS[value.trim()] ?? null
}

