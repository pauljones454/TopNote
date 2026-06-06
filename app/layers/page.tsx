import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSuggestions } from '@/lib/layering'
import { LayerCard } from '@/components/ui/LayerCard'
import type { Fragrance, Combo } from '@/lib/supabase/types'

export default async function LayersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const [
    { data: owned },
    { data: myCombos },
    { data: community },
  ] = await Promise.all([
    // User's shelf — owned + samples
    supabase
      .from('collection')
      .select('*, fragrance:fragrances(*)')
      .eq('user_id', user.id)
      .in('status', ['owned', 'sample'])
      .order('created_at', { ascending: false }),

    // User's saved combos
    supabase
      .from('combos')
      .select('*, fragrances:fragrance_ids')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),

    // Community combos — public, most saved
    supabase
      .from('combos')
      .select('*, profile:profiles(display_name, handle)')
      .eq('is_public', true)
      .neq('user_id', user.id)
      .order('save_count', { ascending: false })
      .limit(12),
  ])

  const shelfFragrances: Fragrance[] = (owned ?? [])
    .map((item: any) => item.fragrance)
    .filter(Boolean)

  const suggestions = getSuggestions(shelfFragrances, 6)

  // Fetch full fragrance data for community combos
  const communityWithFragrances = await Promise.all(
    (community ?? []).map(async (combo: any) => {
      const ids: string[] = combo.fragrance_ids ?? []
      if (ids.length < 2) return null
      const { data: frags } = await supabase
        .from('fragrances')
        .select('*')
        .in('id', ids)
      return { ...combo, fragrancesData: frags ?? [] }
    })
  ).then(results => results.filter(Boolean))

  return (
    <AppShell>
      <div className="max-w-[700px] mx-auto px-5 md:px-10 py-8">

        {/* ── Header ── */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-stone-400 mb-1">
              Top Note
            </p>
            <h1 className="font-serif text-4xl text-stone-900 tracking-tight leading-none">
              Layers
            </h1>
          </div>
          <Link
            href="/layers/create"
            className="flex items-center gap-2 px-4 py-2.5 text-[12px] font-semibold text-white"
            style={{
              background: 'var(--brand-dark)',
              borderRadius: '10px',
              transition: 'opacity 200ms var(--ease-out-expo)',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1V11M1 6H11" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            New combo
          </Link>
        </div>

        {/* ── Suggestions from your shelf ── */}
        {suggestions.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-5">
              <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-stone-400">
                From your shelf
              </p>
              <div className="flex-1 h-px" style={{ background: 'rgba(28,20,16,0.08)' }} />
            </div>
            <div className="space-y-4">
              {suggestions.map((s, i) => (
                <LayerCard
                  key={`${s.fragranceA.id}-${s.fragranceB.id}`}
                  fragranceA={s.fragranceA}
                  fragranceB={s.fragranceB}
                  compatibility={s.compatibility}
                  showSave={false}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty shelf state */}
        {suggestions.length === 0 && shelfFragrances.length < 2 && (
          <section className="mb-12">
            <div className="py-12 text-center rounded-2xl"
              style={{ background: 'rgba(28,20,16,0.03)', border: '1px solid rgba(28,20,16,0.06)' }}>
              <p className="font-serif text-xl text-stone-500 mb-2">Your shelf needs more bottles</p>
              <p className="text-[13px] text-stone-400 mb-6 leading-relaxed">
                Add at least two fragrances to your shelf to get pairing suggestions.
              </p>
              <Link href="/discover"
                className="inline-block px-5 py-2.5 text-[12px] font-semibold text-white"
                style={{ background: 'var(--brand-dark)', borderRadius: '8px' }}>
                Browse fragrances →
              </Link>
            </div>
          </section>
        )}

        {/* ── My combos ── */}
        {myCombos && myCombos.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-5">
              <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-stone-400">
                Your combos
              </p>
              <div className="flex-1 h-px" style={{ background: 'rgba(28,20,16,0.08)' }} />
              <span className="text-[10px] text-stone-300 font-semibold">{myCombos.length}</span>
            </div>
            <p className="text-[13px] text-stone-400 italic text-center py-6">
              Run the Supabase migration to load your saved combos.
            </p>
          </section>
        )}

        {/* ── Community ── */}
        {communityWithFragrances.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-5">
              <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-stone-400">
                Popular combos
              </p>
              <div className="flex-1 h-px" style={{ background: 'rgba(28,20,16,0.08)' }} />
            </div>
            <div className="space-y-4">
              {communityWithFragrances.map((combo: any) => {
                const frags: Fragrance[] = combo.fragrancesData
                if (frags.length < 2) return null
                return (
                  <LayerCard
                    key={combo.id}
                    fragranceA={frags[0]}
                    fragranceB={frags[1]}
                    comboId={combo.id}
                    comboName={combo.name}
                    saveCount={combo.save_count}
                    rating={combo.rating}
                    showSave
                    variant="community"
                  />
                )
              })}
            </div>
          </section>
        )}

        {communityWithFragrances.length === 0 && suggestions.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-5">
              <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-stone-400">
                Popular combos
              </p>
              <div className="flex-1 h-px" style={{ background: 'rgba(28,20,16,0.08)' }} />
            </div>
            <div className="py-10 text-center rounded-2xl"
              style={{ background: 'rgba(28,20,16,0.03)', border: '1px solid rgba(28,20,16,0.06)' }}>
              <p className="text-[13px] text-stone-400">
                Community combos appear here as people share their layers.
              </p>
              <Link href="/layers/create"
                className="inline-block mt-4 text-[11px] font-semibold tracking-[0.1em] uppercase text-stone-600 border-b border-stone-300 pb-px">
                Be the first to share →
              </Link>
            </div>
          </section>
        )}

      </div>
    </AppShell>
  )
}
