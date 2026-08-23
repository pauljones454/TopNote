import type { SupabaseClient } from '@supabase/supabase-js'
import type { Fragrance } from '@/lib/supabase/types'
import { categoriesFor, type CategoryFilterValue } from './categories'
import { getNoteVocabulary, matchNotes } from './note-vocabulary'
import type { ScentFamily } from './scent-families'
import { buildAccentTolerantPattern, toPostgrestArrayLiteral } from './text'

/**
 * Server-side Discover retrieval.
 *
 * Every filter runs in Postgres, so the browser only holds the page it is showing
 * and the reported total is the real match count — not the length of a
 * client-filtered array.
 *
 * Ranking preserves the behaviour Discover has always had: rows matching on name
 * or house come first, rows matching only on family/type/notes come after, and
 * within each tier the catalog's `avg_rating DESC` order holds. The tiers are
 * disjoint by construction (the second negates the first), so paging across the
 * boundary is a concatenation and no row can appear twice.
 */

export const DISCOVER_PAGE_SIZE = 48

/**
 * Below this length only name and house are searched. Short fragments otherwise
 * drown brand matches — "ch" would pull in every birch and patchouli note.
 */
const MIN_BROAD_QUERY_LENGTH = 3

const PRIMARY_COLUMNS = ['name', 'house'] as const
const SECONDARY_TEXT_COLUMNS = ['scent_family', 'type'] as const
const NOTE_COLUMNS = ['top_notes', 'heart_notes', 'base_notes'] as const

export type FragranceSearchRequest = {
  q: string
  category: CategoryFilterValue
  family: ScentFamily | null
  offset: number
  limit: number
}

export type FragranceSearchResult = {
  fragrances: Fragrance[]
  /** True number of rows matching in Postgres, across all pages. */
  total: number
}

type Tier = 'primary' | 'secondary'

type SearchPlan = {
  /** Accent-tolerant regex for the text columns, or `null` when the query is empty. */
  pattern: string | null
  /** Whether the query is long enough to search beyond name and house. */
  includeSecondary: boolean
  /** Concrete note values the query resolves to; empty when notes are not searched. */
  noteMatches: string[]
}

async function buildSearchPlan(supabase: SupabaseClient, query: string): Promise<SearchPlan> {
  const trimmed = query.trim()
  const pattern = trimmed ? buildAccentTolerantPattern(trimmed) : null

  if (!pattern || trimmed.length < MIN_BROAD_QUERY_LENGTH) {
    return { pattern, includeSecondary: false, noteMatches: [] }
  }

  const vocabulary = await getNoteVocabulary(supabase)
  return { pattern, includeSecondary: true, noteMatches: matchNotes(vocabulary, trimmed) }
}

/**
 * Filter values inside `or()` are double-quoted: PostgREST then treats brackets
 * and spaces in the regex as data rather than grammar. (Top-level `.not()` values
 * must NOT be quoted — quoting there makes the quotes part of the pattern.)
 */
function secondaryOrFilter(pattern: string, noteMatches: readonly string[]): string {
  const textFilters = SECONDARY_TEXT_COLUMNS.map(column => `${column}.imatch."${pattern}"`)
  if (noteMatches.length === 0) return textFilters.join(',')

  const literal = toPostgrestArrayLiteral(noteMatches)
  return [...textFilters, ...NOTE_COLUMNS.map(column => `${column}.ov.${literal}`)].join(',')
}

function buildQuery(
  supabase: SupabaseClient,
  request: FragranceSearchRequest,
  plan: SearchPlan,
  tier: Tier | null,
  options: { head: boolean }
) {
  let query = supabase
    .from('fragrances')
    .select(options.head ? 'id' : '*', { count: 'exact', head: options.head })

  const categories = categoriesFor(request.category)
  if (categories) query = query.in('category', [...categories])

  // `ilike` without wildcards is case-insensitive equality — it matches the
  // canonical family even for rows still storing a case-drifted spelling.
  if (request.family) query = query.ilike('scent_family', request.family)

  if (plan.pattern && tier === 'primary') {
    query = query.or(PRIMARY_COLUMNS.map(column => `${column}.imatch."${plan.pattern}"`).join(','))
  }

  if (plan.pattern && tier === 'secondary') {
    // NOT (name OR house), expanded to per-column negations. Both columns are
    // NOT NULL, so no row is silently dropped by three-valued logic.
    for (const column of PRIMARY_COLUMNS) {
      query = query.not(column, 'imatch', plan.pattern)
    }
    query = query.or(secondaryOrFilter(plan.pattern, plan.noteMatches))
  }

  return query.order('avg_rating', { ascending: false }).order('id', { ascending: true })
}

/**
 * Rows for one tier over an explicit range. The caller checks the range against
 * the tier's count first: PostgREST answers an out-of-range request with 416
 * rather than an empty page.
 */
async function fetchTierRows(
  supabase: SupabaseClient,
  request: FragranceSearchRequest,
  plan: SearchPlan,
  tier: Tier | null,
  offset: number,
  limit: number
): Promise<Fragrance[]> {
  const { data, error } = await buildQuery(supabase, request, plan, tier, { head: false }).range(
    offset,
    offset + limit - 1
  )

  if (error) {
    throw new Error(`Fragrance search failed (${tier ?? 'browse'} tier): ${error.message}`)
  }

  return (data ?? []) as unknown as Fragrance[]
}

async function countTier(
  supabase: SupabaseClient,
  request: FragranceSearchRequest,
  plan: SearchPlan,
  tier: Tier | null
): Promise<number> {
  const { count, error } = await buildQuery(supabase, request, plan, tier, { head: true })

  if (error) {
    throw new Error(`Fragrance count failed (${tier ?? 'browse'} tier): ${error.message}`)
  }

  return count ?? 0
}

/** The slice of `[offset, offset + limit)` that falls inside a tier of `total` rows. */
function rangeWithin(
  total: number,
  offset: number,
  limit: number
): { offset: number; limit: number } | null {
  if (offset >= total || limit <= 0) return null
  return { offset, limit: Math.min(limit, total - offset) }
}

/**
 * One page of Discover results plus the honest total match count.
 * Throws on any Postgres error — a silently empty grid would read as "no results".
 */
export async function searchFragrances(
  supabase: SupabaseClient,
  request: FragranceSearchRequest
): Promise<FragranceSearchResult> {
  const offset = Math.max(0, Math.trunc(request.offset))
  const limit = Math.max(1, Math.trunc(request.limit))
  const plan = await buildSearchPlan(supabase, request.q)

  if (!plan.pattern) {
    const total = await countTier(supabase, request, plan, null)
    const range = rangeWithin(total, offset, limit)
    const fragrances = range
      ? await fetchTierRows(supabase, request, plan, null, range.offset, range.limit)
      : []
    return { fragrances, total }
  }

  // Counts come first so each tier is only asked for a range it actually has, and
  // so paging can cross the tier boundary without a gap or a repeat.
  const [primaryTotal, secondaryTotal] = await Promise.all([
    countTier(supabase, request, plan, 'primary'),
    plan.includeSecondary ? countTier(supabase, request, plan, 'secondary') : Promise.resolve(0),
  ])

  const primaryRange = rangeWithin(primaryTotal, offset, limit)
  const primaryRows = primaryRange
    ? await fetchTierRows(supabase, request, plan, 'primary', primaryRange.offset, primaryRange.limit)
    : []

  const secondaryRange = rangeWithin(
    secondaryTotal,
    Math.max(0, offset - primaryTotal),
    limit - primaryRows.length
  )
  const secondaryRows = secondaryRange
    ? await fetchTierRows(
        supabase,
        request,
        plan,
        'secondary',
        secondaryRange.offset,
        secondaryRange.limit
      )
    : []

  return {
    fragrances: [...primaryRows, ...secondaryRows],
    total: primaryTotal + secondaryTotal,
  }
}
