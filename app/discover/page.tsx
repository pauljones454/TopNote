import { AppShell } from '@/components/layout/AppShell'
import { createClient } from '@/lib/supabase/server'
import { parseDiscoverParams } from '@/lib/fragrances/params'
import { searchFragrances, type FragranceSearchResult } from '@/lib/fragrances/search'
import { DiscoverClient } from './DiscoverClient'

type DiscoverSearchParams = {
  q?: string
  cat?: string
  family?: string
}

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<DiscoverSearchParams>
}) {
  const params = await searchParams
  // The first page always starts at offset 0; deeper pages are fetched client-side.
  const request = parseDiscoverParams({ ...params, offset: undefined })
  const supabase = await createClient()

  let page: FragranceSearchResult | null = null
  try {
    page = await searchFragrances(supabase, request)
  } catch (error) {
    // Render the shell with a retryable error rather than a blank or "no results"
    // grid — the distinction matters when the catalog is simply unreachable.
    console.error('[discover] initial search failed', error)
  }

  return (
    <AppShell>
      <DiscoverClient
        initialFragrances={page?.fragrances ?? []}
        initialTotal={page?.total ?? 0}
        initialFailed={page === null}
        initialSearch={request.q}
        initialCategory={request.category}
        initialFamily={request.family}
      />
    </AppShell>
  )
}
