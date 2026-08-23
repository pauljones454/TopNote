import { parseCategoryFilter } from './categories'
import { parseScentFamily } from './scent-families'
import { DISCOVER_PAGE_SIZE, type FragranceSearchRequest } from './search'

/** Raw Discover query parameters, from a URL or from Next's `searchParams`. */
export type DiscoverParams = {
  q?: string
  cat?: string
  family?: string
  offset?: string
}

/**
 * Longest query we turn into a regex. Long enough for any house + name, short
 * enough that a pathological input cannot bloat the pattern or the request URL.
 */
const MAX_QUERY_LENGTH = 80

function parseOffset(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

/**
 * Normalises untrusted URL parameters into a search request. Unknown categories
 * and families fall back to "no filter" rather than erroring — a stale or
 * hand-edited link should still render Discover.
 */
export function parseDiscoverParams(params: DiscoverParams): FragranceSearchRequest {
  return {
    q: (params.q ?? '').trim().slice(0, MAX_QUERY_LENGTH),
    category: parseCategoryFilter(params.cat),
    family: parseScentFamily(params.family),
    offset: parseOffset(params.offset),
    limit: DISCOVER_PAGE_SIZE,
  }
}
