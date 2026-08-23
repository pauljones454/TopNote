/**
 * "Where to buy" outbound retailer links.
 *
 * Every fragrance gets the same set of retailer links, built from a plain
 * search-URL template (house + name as the query) — no per-fragrance product
 * URL is stored, matching the launch-scope decision in the monetization
 * strategy (art_4bgXofpu §1, Phase 1).
 *
 * Each retailer link degrades gracefully: if its affiliate env vars aren't
 * set, we still emit a plain, non-affiliate outbound link so the feature
 * works before Paul is approved for any program. Once approved, set the env
 * vars below (server-only, no NEXT_PUBLIC_ prefix — these are tracking IDs,
 * not secrets, but the link is always built server-side) and links start
 * carrying tracking automatically, with no further code changes.
 *
 *   AFFILIATE_FRAGRANCEX_ID   — Rakuten Advertising publisher/affiliate ID
 *   AFFILIATE_FRAGRANCEX_MID  — Rakuten Advertising merchant ID for FragranceX
 *                               (shown on FragranceX's advertiser profile page
 *                               once the Rakuten application is approved)
 *   AFFILIATE_AMAZON_TAG      — Amazon Associates tracking tag (e.g. "topnote-20")
 *
 * Retailer sources: Top Note Monetization Strategy (art_4bgXofpu §1) and
 * Fragrance Affiliate & Commerce Landscape (art_nR9HbmgF §2, §7) — FragranceX
 * and Amazon Associates are the two self-serve, no-negotiation programs.
 */

import type { Fragrance } from './supabase/types'

export type WhereToBuyLink = {
  id: 'fragrancex' | 'amazon'
  label: string
  url: string
  isAffiliate: boolean
}

type FragranceQuery = Pick<Fragrance, 'house' | 'name'>

function searchQuery(fragrance: FragranceQuery): string {
  return `${fragrance.house} ${fragrance.name}`
}

// FragranceX's on-site search endpoint (confirmed against the site's own
// search form, which posts `k` to /widgets/topmenu/search.html and redirects
// here). Rakuten Advertising deep links wrap this URL in `murl` once the
// affiliate ID and merchant ID are known — see
// https://pubhelp.rakutenadvertising.com/hc/en-us/articles/11459139039373
function buildFragranceXLink(fragrance: FragranceQuery): WhereToBuyLink {
  const searchUrl = `https://www.fragrancex.com/search/search_results?stext=${encodeURIComponent(searchQuery(fragrance))}`

  const affiliateId = process.env.AFFILIATE_FRAGRANCEX_ID
  const merchantId = process.env.AFFILIATE_FRAGRANCEX_MID
  if (affiliateId && merchantId) {
    const url = `https://click.linksynergy.com/deeplink?id=${encodeURIComponent(affiliateId)}&mid=${encodeURIComponent(merchantId)}&murl=${encodeURIComponent(searchUrl)}`
    return { id: 'fragrancex', label: 'FragranceX', url, isAffiliate: true }
  }

  return { id: 'fragrancex', label: 'FragranceX', url: searchUrl, isAffiliate: false }
}

// Amazon Associates tracking is a single `tag` query param appended to any
// amazon.com URL — no deep-link service required.
function buildAmazonLink(fragrance: FragranceQuery): WhereToBuyLink {
  const searchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(searchQuery(fragrance))}`

  const tag = process.env.AFFILIATE_AMAZON_TAG
  if (tag) {
    return { id: 'amazon', label: 'Amazon', url: `${searchUrl}&tag=${encodeURIComponent(tag)}`, isAffiliate: true }
  }

  return { id: 'amazon', label: 'Amazon', url: searchUrl, isAffiliate: false }
}

/** Builds the full "Where to buy" retailer link set for a fragrance. */
export function getWhereToBuyLinks(fragrance: FragranceQuery): WhereToBuyLink[] {
  return [buildFragranceXLink(fragrance), buildAmazonLink(fragrance)]
}

/** True if any link in the set carries live affiliate tracking. */
export function hasActiveAffiliateLinks(links: WhereToBuyLink[]): boolean {
  return links.some((link) => link.isAffiliate)
}
