import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSuggestions } from '@/lib/layering'
import { LayerCard } from '@/components/ui/LayerCard'
import { CommunityComboList, type CommunityCombo } from '@/components/layers/CommunityComboList'
import type { Fragrance } from '@/lib/supabase/types'

type ComboRow = {
  id: string
  name: string | null
  rating: number | null
  save_count: number | null
  fragrance_ids: string[] | null
}

export default async function LayersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const [
    { data: collection },
    { data: myCombos },
    { data: community },
    { data: saves },
  ] = await Promise.all([
    // Full collection — used for shelf suggestions and own-vs-missing indicators
    supabase
      .from('collection')
      .select('*, fragrance:fragrances(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),

    // User's saved combos
    supabase
      .from('combos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),

    // Community combos — public, most saved
    supabase
      .from('combos')
      .select('*, profile:profiles(display_name, handle)')
      .eq('is_public', true)
      .neq('user_id', user.id)
      .order('save_count', { ascending: false })
      .limit(12),

    // Which community combos this user has already saved.
    // Returns null (handled gracefully) if the migration is briefly behind.
    supabase
      .from('combo_saves')
      .select('combo_id')
      .eq('user_id', user.id),
  ])

  const collectionRows: { status: string; fragrance_id: string; fragrance?: Fragrance }[] =
    collection ?? []

  const shelfFragrances: Fragrance[] = collectionRows
    .filter(item => item.status === 'owned' || item.status === 'sample')
    .map(item => item.fragrance)
    .filter((f): f is Fragrance => Boolean(f))

  const ownedFragranceIds = shelfFragrances.map(f => f.id)
  const wishlistedFragranceIds = collectionRows
    .filter(item => item.status === 'wishlist')
    .map(item => item.fragrance_id)

  const savedComboIds = (saves ?? []).map((s: { combo_id: string }) => s.combo_id)

  const suggestions = getSuggestions(shelfFragrances, 6)

  // Resolve fragrance rows for every combo in one query, then map by id.
  const myComboRows: ComboRow[] = myCombos ?? []
  const communityRows: ComboRow[] = community ?? []
  const comboFragranceIds = Array.from(
    new Set([...myComboRows, ...communityRows].flatMap(c => c.fragrance_ids ?? []))
  )
  const { data: comboFragrances } = comboFragranceIds.length
    ? await supabase.from('fragrances').select('*').in('id', comboFragranceIds)
    : { data: [] as Fragrance[] }
  const fragranceById = new Map<string, Fragrance>(
    (comboFragrances ?? []).map((f: Fragrance) => [f.id, f])
  )

  function resolvePair(combo: ComboRow): [Fragrance, Fragrance] | null {
    const ids = combo.fragrance_ids ?? []
    const a = fragranceById.get(ids[0])
    const b = fragranceById.get(ids[1])
    if (!a || !b) return null
    return [a, b]
  }

  const myCombosResolved = myComboRows
    .map(combo => {
      const pair = resolvePair(combo)
      return pair ? { combo, a: pair[0], b: pair[1] } : null
    })
    .filter((x): x is { combo: ComboRow; a: Fragrance; b: Fragrance } => x !== null)

  const communityCombos: CommunityCombo[] = communityRows
    .map(combo => {
      const pair = resolvePair(combo)
      if (!pair) return null
      return {
        id: combo.id,
        name: combo.name,
        rating: combo.rating,
        saveCount: combo.save_count ?? 0,
        fragranceA: pair[0],
        fragranceB: pair[1],
      }
    })
    .filter((c): c is CommunityCombo => c !== null)

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
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-5">
            <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-stone-400">
              Your combos
            </p>
            <div className="flex-1 h-px" style={{ background: 'rgba(28,20,16,0.08)' }} />
            {myCombosResolved.length > 0 && (
              <span className="text-[10px] text-stone-300 font-semibold">{myCombosResolved.length}</span>
            )}
          </div>

          {myCombosResolved.length > 0 ? (
            <div className="space-y-4">
              {myCombosResolved.map(({ combo, a, b }) => (
                <LayerCard
                  key={combo.id}
                  fragranceA={a}
                  fragranceB={b}
                  comboId={combo.id}
                  comboName={combo.name}
                  rating={combo.rating}
                  variant="saved"
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center rounded-2xl"
              style={{ background: 'rgba(28,20,16,0.03)', border: '1px solid rgba(28,20,16,0.06)' }}>
              <p className="font-serif text-xl text-stone-500 mb-2">No combos yet</p>
              <p className="text-[13px] text-stone-400 mb-6 leading-relaxed">
                Pair two bottles from your shelf and save the blend to find it here.
              </p>
              <Link href="/layers/create"
                className="inline-block px-5 py-2.5 text-[12px] font-semibold text-white"
                style={{ background: 'var(--brand-dark)', borderRadius: '8px' }}>
                Build your first combo →
              </Link>
            </div>
          )}
        </section>

        {/* ── Community ── */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-stone-400">
              Popular combos
            </p>
            <div className="flex-1 h-px" style={{ background: 'rgba(28,20,16,0.08)' }} />
          </div>

          {communityCombos.length > 0 ? (
            <CommunityComboList
              combos={communityCombos}
              initialSavedComboIds={savedComboIds}
              ownedFragranceIds={ownedFragranceIds}
              initialWishlistedFragranceIds={wishlistedFragranceIds}
            />
          ) : (
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
          )}
        </section>

      </div>
    </AppShell>
  )
}
