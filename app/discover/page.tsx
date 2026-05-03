import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'
import { FragranceCard } from '@/components/ui/FragranceCard'
import { DiscoverClient } from './DiscoverClient'

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase.from('fragrances').select('*').order('avg_rating', { ascending: false })

  if (params.cat && params.cat !== 'all') {
    if (params.cat === 'niche') {
      query = query.in('category', ['niche', 'ultra-niche'])
    } else {
      query = query.eq('category', params.cat)
    }
  }

  const { data: fragrances } = await query.limit(200)

  return (
    <AppShell>
      <DiscoverClient fragrances={fragrances ?? []} initialSearch={params.q ?? ''} initialCat={params.cat ?? 'all'} />
    </AppShell>
  )
}
