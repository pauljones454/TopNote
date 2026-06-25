import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getCompatibilityScore, getScoreLabel, getSharedNotes } from '@/lib/layering'
import { SaveComboButton } from '@/components/layers/SaveComboButton'
import { WishlistBottleButton } from '@/components/layers/WishlistBottleButton'
import type { Fragrance } from '@/lib/supabase/types'

function BottleHero({
  fragrance,
  owned,
  wishlisted,
}: {
  fragrance: Fragrance
  owned: boolean
  wishlisted: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-3 flex-1 min-w-0">
      <Link href={`/fragrance/${fragrance.id}`} className="relative w-[112px] h-[148px]">
        {fragrance.bottle_image_url ? (
          <Image
            src={fragrance.bottle_image_url}
            alt={fragrance.name}
            fill
            className="object-contain"
            sizes="112px"
          />
        ) : (
          <div className="w-full h-full rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(28,20,16,0.05)' }}>
            <span className="font-serif text-3xl text-stone-300">{fragrance.house.charAt(0)}</span>
          </div>
        )}
      </Link>
      <div className="text-center px-1 w-full">
        <p className="text-[9px] font-semibold tracking-[0.18em] uppercase text-stone-400 truncate">
          {fragrance.house}
        </p>
        <Link href={`/fragrance/${fragrance.id}`}
          className="font-serif text-[14px] text-stone-800 leading-tight line-clamp-2 block">
          {fragrance.name}
        </Link>
      </div>
      <WishlistBottleButton fragranceId={fragrance.id} owned={owned} initialWishlisted={wishlisted} />
    </div>
  )
}

export default async function ComboDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // RLS returns the row only when public or owned by the viewer.
  const { data: combo } = await supabase
    .from('combos')
    .select('*, profile:profiles(display_name, handle)')
    .eq('id', id)
    .maybeSingle()

  if (!combo) notFound()

  const ids: string[] = combo.fragrance_ids ?? []
  const { data: frags } = ids.length
    ? await supabase.from('fragrances').select('*').in('id', ids)
    : { data: [] as Fragrance[] }
  const fragById = new Map<string, Fragrance>((frags ?? []).map((f: Fragrance) => [f.id, f]))

  const a = fragById.get(ids[0])
  const b = fragById.get(ids[1])
  if (!a || !b) notFound()

  const compatibility = getCompatibilityScore(a, b)
  const scoreInfo = getScoreLabel(compatibility.score)
  const sharedNotes = getSharedNotes(a, b)

  // Application order — prefer the creator's saved order, else the engine's.
  const savedOrder = combo.application_order
  const orderIds: [string, string] =
    Array.isArray(savedOrder) && savedOrder.length === 2
      ? [savedOrder[0], savedOrder[1]]
      : compatibility.applicationOrder
  const firstFrag = fragById.get(orderIds[0]) ?? a
  const secondFrag = firstFrag.id === a.id ? b : a

  // Viewer ownership + save state.
  const ownedIds = new Set<string>()
  const wishlistedIds = new Set<string>()
  let initialSaved = false
  if (user) {
    const [{ data: coll }, { data: save }] = await Promise.all([
      supabase.from('collection').select('fragrance_id, status').eq('user_id', user.id).in('fragrance_id', ids),
      supabase.from('combo_saves').select('id').eq('user_id', user.id).eq('combo_id', combo.id).maybeSingle(),
    ])
    for (const row of (coll ?? []) as { fragrance_id: string; status: string }[]) {
      if (row.status === 'owned' || row.status === 'sample') ownedIds.add(row.fragrance_id)
      else if (row.status === 'wishlist') wishlistedIds.add(row.fragrance_id)
    }
    initialSaved = Boolean(save)
  }

  const comboTitle = combo.name
    ?? `${a.name.split(' ').slice(-1)[0]} + ${b.name.split(' ').slice(-1)[0]}`
  const creatorName = combo.profile?.display_name ?? combo.profile?.handle ?? null
  const rating: number | null = combo.rating

  return (
    <AppShell>
      <div className="max-w-[700px] mx-auto px-5 md:px-10 py-8">

        {/* Back */}
        <div className="mb-6">
          <Link href="/layers"
            className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-[0.1em] uppercase text-stone-400"
            style={{ transition: 'color 200ms var(--ease-out-expo)' }}>
            <ChevronLeft size={14} strokeWidth={1.5} />
            Layers
          </Link>
        </div>

        {/* Bottles hero */}
        <div className="rounded-2xl p-6 mb-7"
          style={{
            background: '#F7F3EE',
            border: '1px solid rgba(28,20,16,0.06)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 28px rgba(0,0,0,0.05)',
          }}>
          <div className="flex items-start justify-center gap-3">
            <BottleHero fragrance={a} owned={ownedIds.has(a.id)} wishlisted={wishlistedIds.has(a.id)} />
            <div className="flex-shrink-0 self-center mt-1">
              <div className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(28,20,16,0.07)' }}>
                <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                  <path d="M6 2V10M2 6H10" stroke="rgba(28,20,16,0.5)" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>
            <BottleHero fragrance={b} owned={ownedIds.has(b.id)} wishlisted={wishlistedIds.has(b.id)} />
          </div>
        </div>

        {/* Title + attribution */}
        <div className="mb-5">
          <h1 className="font-serif text-3xl text-stone-900 tracking-tight leading-tight">
            {comboTitle}
          </h1>
          <p className="text-[12px] text-stone-400 mt-1.5">
            {a.house} · {b.house}
            {creatorName && <> · shared by {creatorName}</>}
          </p>
          {rating ? (
            <div className="flex items-center gap-1.5 mt-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full"
                  style={{ background: i < rating ? 'var(--brand-dark)' : 'rgba(28,20,16,0.12)' }} />
              ))}
              <span className="text-[11px] text-stone-400 ml-1">{rating}/5</span>
            </div>
          ) : null}
        </div>

        {/* Compatibility */}
        <section className="mb-7">
          <div className="flex items-center gap-3 mb-3">
            <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-stone-400">
              Compatibility
            </p>
            <div className="flex-1 h-px" style={{ background: 'rgba(28,20,16,0.08)' }} />
            <span className="text-[11px] font-semibold" style={{ color: scoreInfo.color }}>
              {scoreInfo.label}
            </span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-1.5 flex-1 rounded-full" style={{ background: 'rgba(28,20,16,0.07)' }}>
              <div className="h-full rounded-full"
                style={{
                  width: `${compatibility.score}%`,
                  background: scoreInfo.color,
                  transition: 'width 600ms cubic-bezier(0.16,1,0.3,1)',
                }} />
            </div>
            <span className="text-[12px] font-semibold flex-shrink-0" style={{ color: scoreInfo.color }}>
              {compatibility.score}
            </span>
          </div>
          <p className="text-[13px] text-stone-500 leading-relaxed capitalize">
            {compatibility.reason}.
          </p>

          {sharedNotes.length > 0 && (
            <div className="mt-4">
              <p className="text-[9px] font-semibold tracking-[0.2em] uppercase text-stone-400 mb-2">
                Shared notes
              </p>
              <div className="flex flex-wrap gap-1.5">
                {sharedNotes.map(note => (
                  <span key={note} className="text-[11px] text-stone-600 px-2.5 py-1"
                    style={{ background: 'rgba(28,20,16,0.05)', borderRadius: '6px' }}>
                    {note}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Application order */}
        <section className="mb-7">
          <div className="flex items-center gap-3 mb-4">
            <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-stone-400">
              How to layer
            </p>
            <div className="flex-1 h-px" style={{ background: 'rgba(28,20,16,0.08)' }} />
          </div>
          <ol className="space-y-3">
            {[
              { n: 1, label: 'Apply first', frag: firstFrag, hint: 'the base layer — let it settle for ~30s' },
              { n: 2, label: 'Layer on top', frag: secondFrag, hint: 'spray over the base to finish the blend' },
            ].map(({ n, label, frag, hint }) => (
              <li key={n} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-semibold text-white"
                  style={{ background: 'var(--brand-dark)' }}>
                  {n}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] text-stone-800">
                    <span className="text-stone-400">{label} · </span>
                    <span className="font-medium">{frag.name}</span>
                  </p>
                  <p className="text-[11px] text-stone-400 mt-0.5">{hint}</p>
                </div>
              </li>
            ))}
          </ol>

          {combo.instructions && (
            <div className="mt-4 p-4 rounded-xl"
              style={{ background: 'rgba(28,20,16,0.03)', border: '1px solid rgba(28,20,16,0.06)' }}>
              <p className="text-[9px] font-semibold tracking-[0.2em] uppercase text-stone-400 mb-1.5">
                Maker's notes
              </p>
              <p className="text-[13px] text-stone-600 leading-relaxed">{combo.instructions}</p>
            </div>
          )}
        </section>

        {/* Save */}
        <SaveComboButton
          comboId={combo.id}
          initialSaved={initialSaved}
          initialSaveCount={combo.save_count ?? 0}
        />
      </div>
    </AppShell>
  )
}

