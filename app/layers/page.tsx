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
    { data: owned, error: ownedError },
    { data: myCombos, error: myCombosError },
    { data: community, error: communityError },
  ] = await Promise.all([
    // User's shelf — bottles the user owns. `collection_status` only has
    // owned/wishlist/tried; there is no 'sample' member, so filtering on it
    // used to make Postgres reject the whole query (22P02) and silently
    // read back as an empty shelf.
    supabase
      .from('collection')
      .select('*, fragrance:fragrances(*)')
      .eq('user_id', user.id)
      .eq('status', 'owned')
      .order('created_at', { ascending: false }),

    // User's saved combos — `fragrance_ids` is a text[] column, not a
    // foreign-key relation, so it cannot be embedded via PostgREST select
    // syntax. Fetch the combo rows here; fragrances are resolved separately
    // below (same pattern as the community combos further down).
    supabase
      .from('combos')
      .select('*')
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

  if (ownedError) {
    console.error('[layers] shelf query failed for user', user.id, ownedError)
  }
  if (myCombosError) {
    console.error('[layers] my-combos query failed for user', user.id, myCombosError)
  }
  if (communityError) {
    console.error('[layers] community combos query failed', communityError)
  }

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

  // Fetch full fragrance data for the user's own combos. Collect the union
  // of fragrance_ids across every combo up front so this is one `.in()`
  // query instead of one round-trip per combo.
  const myComboFragranceIds = Array.from(
    new Set((myCombos ?? []).flatMap((combo: Combo) => combo.fragrance_ids ?? []))
  )
  const { data: myComboFragranceRows, error: myComboFragrancesError } =
    myComboFragranceIds.length > 0
      ? await supabase.from('fragrances').select('*').in('id', myComboFragranceIds)
      : { data: [] as Fragrance[], error: null }
  if (myComboFragrancesError) {
    console.error('[layers] my-combos fragrance lookup failed for user', user.id, myComboFragrancesError)
  }
  const fragranceById = new Map((myComboFragranceRows ?? []).map(f => [f.id, f]))

  const myCombosWithFragrances = (myCombos ?? [])
    .map((combo: Combo) => {
      const ids = combo.fragrance_ids ?? []
      const frags = ids.map(id => fragranceById.get(id)).filter(Boolean) as Fragrance[]
      if (frags.length < 2) return null
      // application_order holds fragrance IDs, not names — reorder the
      // resolved rows to match it so the card shows the right bottle first.
      const order = combo.application_order ?? []
      const orderedFrags = order
        .map(id => frags.find(f => f.id === id))
        .filter(Boolean) as Fragrance[]
      const [fragranceA, fragranceB] = orderedFrags.length === 2 ? orderedFrags : frags
      return { ...combo, fragranceA, fragranceB }
    })
    .filter(Boolean) as Array<Combo & { fragranceA: Fragrance; fragranceB: Fragrance }>

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

        {/* Shelf fetch failed — distinct from a genuinely empty shelf */}
        {ownedError && (
          <section className="mb-12">
            <div className="py-12 text-center rounded-2xl"
              style={{ background: 'rgba(28,20,16,0.03)', border: '1px solid rgba(28,20,16,0.06)' }}>
              <p className="font-serif text-xl text-stone-500 mb-2">Your shelf couldn't load</p>
              <p className="text-[13px] text-stone-400 mb-6 leading-relaxed">
                Something went wrong reaching your shelf. Refresh to try again.
              </p>
            </div>
          </section>
        )}

        {/* Empty shelf state — only shown once we know the fetch actually succeeded */}
        {!ownedError && suggestions.length === 0 && shelfFragrances.length < 2 && (
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
        {/* Fetch failed — distinct from the user genuinely having no combos yet */}
        {myCombosError && (
          <section className="mb-12">
            <div className="py-12 text-center rounded-2xl"
              style={{ background: 'rgba(28,20,16,0.03)', border: '1px solid rgba(28,20,16,0.06)' }}>
              <p className="font-serif text-xl text-stone-500 mb-2">Your combos couldn't load</p>
              <p className="text-[13px] text-stone-400 mb-6 leading-relaxed">
                Something went wrong reaching your saved combos. Refresh to try again.
              </p>
            </div>
          </section>
        )}

        {!myCombosError && myCombosWithFragrances.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-5">
              <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-stone-400">
                Your combos
              </p>
              <div className="flex-1 h-px" style={{ background: 'rgba(28,20,16,0.08)' }} />
              <span className="text-[10px] text-stone-300 font-semibold">{myCombosWithFragrances.length}</span>
            </div>
            <div className="space-y-4">
              {myCombosWithFragrances.map(combo => (
                <LayerCard
                  key={combo.id}
                  fragranceA={combo.fragranceA}
                  fragranceB={combo.fragranceB}
                  comboId={combo.id}
                  comboName={combo.name}
                  rating={combo.rating}
                  variant="saved"
                />
              ))}
            </div>
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
              {communityError ? (
                <p className="text-[13px] text-stone-400">
                  Community combos couldn't load right now. Refresh to try again.
                </p>
              ) : (
                <>
                  <p className="text-[13px] text-stone-400">
                    Community combos appear here as people share their layers.
                  </p>
                  <Link href="/layers/create"
                    className="inline-block mt-4 text-[11px] font-semibold tracking-[0.1em] uppercase text-stone-600 border-b border-stone-300 pb-px">
                    Be the first to share →
                  </Link>
                </>
              )}
            </div>
          </section>
        )}

      </div>
    </AppShell>
  )
}
