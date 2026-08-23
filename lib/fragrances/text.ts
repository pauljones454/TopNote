/**
 * Text helpers shared by the Discover search path.
 *
 * Search runs in Postgres via PostgREST, so a query string has to survive two
 * hops: PostgREST's filter grammar and a POSIX regex (`imatch` / `~*`). Both are
 * handled here so callers never hand-build patterns.
 */

/** Accented variants folded onto each base letter, matching the catalog's spellings. */
const ACCENT_VARIANTS: Record<string, string> = {
  a: 'àáâãäåā',
  c: 'çćč',
  e: 'èéêëē',
  i: 'ìíîïī',
  n: 'ñń',
  o: 'òóôõöøō',
  s: 'śš',
  u: 'ùúûüū',
  y: 'ýÿ',
  z: 'žź',
}

/**
 * Characters removed from a query before it becomes a regex. Dropping beats
 * escaping here: a backslash inside a PostgREST-quoted filter value is itself an
 * escape, so an escaped pattern would need double-escaping to survive the trip.
 * None of these carry meaning in a fragrance name.
 */
const UNSAFE_CHARACTERS = /[\\^$.|?*+()[\]{}"]/g

/** Lowercases and strips diacritics — "Hermès" and "hermes" fold to the same key. */
export function foldAccents(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

/**
 * Builds an unanchored, accent-tolerant POSIX pattern for `imatch`.
 * "hermes" and "hermès" both become `h[eèéêëē]rm[eèéêëē]s`, which matches the
 * stored "Hermès". Case-insensitivity comes from the operator, not the pattern.
 *
 * `unaccent()` is unavailable inline in PostgREST filters, so the tolerance has
 * to live in the pattern itself.
 *
 * Returns `null` when nothing searchable survives sanitising.
 */
export function buildAccentTolerantPattern(query: string): string | null {
  const folded = foldAccents(query).replace(UNSAFE_CHARACTERS, ' ').trim().replace(/\s+/g, ' ')
  if (!folded) return null

  return Array.from(folded)
    .map(character => {
      if (character === ' ') return '[[:space:]]+'
      const variants = ACCENT_VARIANTS[character]
      return variants ? `[${character}${variants}]` : character
    })
    .join('')
}

/**
 * Renders values as a Postgres array literal for the `ov` (overlap) operator —
 * `{"Vanilla","Tonka Bean"}`. Each element is quoted so spaces and commas inside
 * a note survive PostgREST's filter grammar.
 */
export function toPostgrestArrayLiteral(values: readonly string[]): string {
  const elements = values.map(value => `"${value.replace(/["\\]/g, '')}"`)
  return `{${elements.join(',')}}`
}
