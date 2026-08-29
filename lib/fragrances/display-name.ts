/**
 * Display-name helpers for fragrances whose `name` column is correct catalog
 * data but doesn't identify the product on its own.
 *
 * Some houses name a flanker literally "Eau de Parfum" (e.g. Chloé's 2010
 * EDP, distinct from the original Chloé EDT) — `house` + `name` together are
 * the real, normalized identity, and renaming the row would duplicate the
 * house into `name` and break sorting/matching/search. So the fix lives here,
 * at render time, for the handful of call sites that show a fragrance name
 * with no house label already sitting next to it.
 */

import { foldAccents } from './text'
import type { Fragrance } from '../supabase/types'

/**
 * Generic concentration/format terms used industry-wide, never as a
 * brand-specific product identity. Exact, normalized match only — no fuzzy
 * heuristics. A false positive here would misname a real product (there is
 * a Thierry Mugler fragrance literally called "Cologne"), but prefixing a
 * true positive or a false positive alike with the house never makes the
 * name wrong, only redundant in the rare miss — so the set leans inclusive.
 */
const BARE_CONCENTRATION_NAMES = new Set([
  'eau de parfum',
  'eau de toilette',
  'eau de cologne',
  'eau de cologne concentree',
  'parfum',
  'parfum intense',
  'extrait de parfum',
  'extrait',
  'pure parfum',
  'eau fraiche',
  'eau legere',
  'cologne',
  'perfume',
])

function normalize(name: string): string {
  return foldAccents(name).trim().replace(/\s+/g, ' ')
}

/** True when `name` alone is a generic concentration/format term, not a product identity. */
export function isBareConcentrationName(name: string): boolean {
  return BARE_CONCENTRATION_NAMES.has(normalize(name))
}

type NamedFragrance = Pick<Fragrance, 'house' | 'name'>

/**
 * The name to show wherever a fragrance is identified standalone — layering
 * tips, wear log rows, combo titles. Composes `house + name` only for the
 * bare-concentration case; every other row (the overwhelming majority, e.g.
 * "Sauvage", "Baccarat Rouge 540") renders exactly as before.
 *
 * Do not use this where the house is already shown directly adjacent to the
 * name (e.g. the fragrance detail page header, or a card with a house label
 * sitting right above/below the name) — composing there would double up as
 * "Chloé Chloé Eau de Parfum".
 */
export function getDisplayName(fragrance: NamedFragrance): string {
  return isBareConcentrationName(fragrance.name)
    ? `${fragrance.house} ${fragrance.name}`
    : fragrance.name
}

/**
 * Short label for auto-generated combo titles, which otherwise take the
 * last word of the name (e.g. "Sauvage + Aventus"). A bare concentration has
 * no meaningful last word — "Eau de Parfum" alone would shorten to "Parfum" —
 * so it falls back to the full composed display name instead.
 */
export function getComboNameFragment(fragrance: NamedFragrance): string {
  if (isBareConcentrationName(fragrance.name)) return getDisplayName(fragrance)
  return fragrance.name.trim().split(/\s+/).slice(-1)[0]
}
