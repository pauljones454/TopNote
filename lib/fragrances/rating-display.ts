/**
 * Decides whether to render a community rating for a fragrance, and what.
 *
 * `fragrances.avg_rating` / `review_count` are scraped or estimated
 * third-party aggregates backfilled onto catalog rows — some in the
 * millions (Dior J'adore reads `avg_rating: 4.8`, `review_count: 4,960,000`)
 * while the `reviews` table, where a real Top Note rating would live, has
 * zero rows. They are a legitimate popularity/quality signal internally —
 * Discover and Layers may keep sorting and ranking by `avg_rating` — but
 * they were never a Top Note community rating, and rendering them as
 * `4.8 · 4,960,000 ratings` reads as exactly that: counterfeit social proof
 * on an app whose premise is community taste.
 *
 * Every rating display on the site should render through this function
 * rather than reading `avg_rating` / `review_count` directly, so that when
 * `reviews` starts filling with real, attributable ratings, wiring a genuine
 * aggregate (count + average of `reviews.rating` for the fragrance) through
 * here is the only change needed to switch the display back on everywhere
 * at once.
 */
export type RatingDisplay =
  | { show: false }
  | { show: true; average: number; count: number }

export function getRatingDisplay(): RatingDisplay {
  return { show: false }
}
