import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseDiscoverParams } from '@/lib/fragrances/params'
import { searchFragrances } from '@/lib/fragrances/search'

/**
 * GET /api/discover — one page of catalog results.
 *
 * Discover's first page is rendered on the server; this handler serves every
 * subsequent search, filter change, and "load more" without shipping the catalog
 * to the browser.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const supabase = await createClient()

  try {
    const result = await searchFragrances(
      supabase,
      parseDiscoverParams({
        q: searchParams.get('q') ?? undefined,
        cat: searchParams.get('cat') ?? undefined,
        family: searchParams.get('family') ?? undefined,
        offset: searchParams.get('offset') ?? undefined,
      })
    )

    return NextResponse.json(result)
  } catch (error) {
    // Surfaced to the client as a retryable error state — never an empty grid,
    // which would read as "no results".
    console.error('[discover] search failed', error)
    return NextResponse.json({ error: 'Search is unavailable right now.' }, { status: 502 })
  }
}
