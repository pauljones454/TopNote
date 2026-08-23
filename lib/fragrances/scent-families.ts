/**
 * The canonical scent-family vocabulary all catalog data conforms to.
 *
 * The column has historically drifted (110+ distinct values, including lowercase
 * duplicates), so the filter UI is driven off this list rather than off whatever
 * distinct values happen to be in the table. Matching is case-insensitive, which
 * keeps the filter correct for rows still awaiting normalisation.
 */
export const SCENT_FAMILIES = [
  'Floral',
  'White Floral',
  'Fruity Floral',
  'Floral Woody',
  'Floral Gourmand',
  'Citrus',
  'Citrus Aromatic',
  'Aromatic Fougère',
  'Aromatic Fresh',
  'Aquatic',
  'Green',
  'Woody',
  'Woody Aromatic',
  'Woody Spicy',
  'Woody Amber',
  'Leather',
  'Oriental',
  'Oriental Spicy',
  'Oriental Woody',
  'Amber Vanilla',
  'Gourmand',
  'Musk',
  'Powdery',
  'Chypre',
  'Oud',
] as const

export type ScentFamily = (typeof SCENT_FAMILIES)[number]

const BY_LOWERCASE = new Map<string, ScentFamily>(
  SCENT_FAMILIES.map(family => [family.toLowerCase(), family])
)

/** Resolves a URL parameter to a canonical family, or `null` when unrecognised. */
export function parseScentFamily(value: string | undefined | null): ScentFamily | null {
  if (!value) return null
  return BY_LOWERCASE.get(value.trim().toLowerCase()) ?? null
}
