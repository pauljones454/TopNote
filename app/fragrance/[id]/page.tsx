import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getCategoryPill } from '@/lib/utils'
import { ChevronLeft } from 'lucide-react'
import { AddToShelfButton } from './AddToShelfButton'
import { AttributeMetrics } from './AttributeMetrics'
import { WhereToBuy } from './WhereToBuy'

export default async function FragrancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: fragrance }, { data: reviews }] = await Promise.all([
    supabase.from('fragrances').select('*').eq('id', id).single(),
    supabase.from('reviews').select('*, profiles(display_name, handle)')
      .eq('fragrance_id', id).order('created_at', { ascending: false }).limit(10),
  ])

  if (!fragrance) notFound()
  const pill = getCategoryPill(fragrance.category)

  return (
    <AppShell>
      <div className="max-w-[900px] mx-auto">

        {/* ── Back ── */}
        <div className="px-5 md:px-10 pt-6 pb-0">
          <Link href="/discover"
            className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-[0.1em] uppercase text-stone-400"
            style={{ transition: 'color 200ms var(--ease-out-expo)' }}>
            <ChevronLeft size={14} strokeWidth={1.5} />
            Discover
          </Link>
        </div>

        <div className="px-5 md:px-10 pb-10">
          <div className="md:grid md:grid-cols-[260px_1fr] md:gap-14 md:pt-10">

            {/* ── Bottle rail ──
                A framed panel of fixed proportion, sized and styled identically
                whether it holds a photo or the house monogram (97.9% of the
                catalog has no photo, so the monogram is the default case), paired
                with the one action that belongs to the object itself. Sticky on
                desktop, where it releases as the grid ends at the reviews section.
                On mobile the grid collapses to block flow and this same markup
                falls in above the identity block — one node, one information
                architecture across both breakpoints. */}
            <div className="flex flex-col gap-3.5 pt-8 md:pt-0 md:self-start md:sticky md:top-8">
              <div
                className="w-full max-w-[236px] md:max-w-none mx-auto aspect-[4/5] rounded-3xl flex items-center justify-center p-7"
                style={{
                  background: 'rgba(28,20,16,0.035)',
                  border: '1px solid rgba(28,20,16,0.06)',
                }}
              >
                {fragrance.bottle_image_url ? (
                  <div className="relative w-full h-full">
                    <Image src={fragrance.bottle_image_url} alt={fragrance.name} fill
                      className="object-contain" sizes="(min-width: 768px) 260px, 236px" />
                  </div>
                ) : (
                  <span className="font-serif text-6xl text-stone-300 leading-none">
                    {fragrance.house.charAt(0)}
                  </span>
                )}
              </div>
              <div className="w-full max-w-[236px] md:max-w-none mx-auto">
                <AddToShelfButton fragranceId={fragrance.id} fragranceName={fragrance.name} emphasis="secondary" />
              </div>
            </div>

            {/* ── Info column ── */}
            <div>
              {/* Category */}
              <span className={`inline-block text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 mb-4 ${pill.className}`}
                style={{ borderRadius: '2px' }}>
                {pill.label}
              </span>

              {/* House + Name */}
              <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-stone-400 mb-1">
                {fragrance.house}
              </p>
              <h1 className="font-serif text-4xl md:text-5xl text-stone-900 leading-tight tracking-tight mb-3">
                {fragrance.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="w-2.5 h-2.5 rounded-sm"
                      style={{ background: i < Math.round(fragrance.avg_rating) ? '#c9a227' : 'rgba(28,20,16,0.10)' }} />
                  ))}
                </div>
                <span className="text-[12px] font-semibold text-stone-700">{fragrance.avg_rating}</span>
                <span className="text-[11px] text-stone-400">
                  {fragrance.review_count?.toLocaleString()} ratings
                </span>
              </div>

              <p className="text-[12px] text-stone-400 mb-8">
                {fragrance.type}
                {fragrance.seasons?.length > 0 && <> · {fragrance.seasons.join(' · ')}</>}
              </p>

              {/* Buy CTA — the page's primary action, right under the name.
                  Add to Shelf now lives with the bottle in the rail, so this is
                  a single module rather than two stacked full-width banners. */}
              <WhereToBuy fragrance={fragrance} />

              {/* Notes — flat tier lists.
                  The old per-note bar width was a function of array index and
                  array length alone; top_notes/heart_notes/base_notes are plain
                  string[] with no intensity data, and their order reflects
                  catalog-entry typing, not olfactive dominance. Every note and
                  every tier still renders — Top → Heart → Base is now carried by
                  type weight and tone, which is a claim the data supports. */}
              <div className="space-y-5 mb-8">
                {[
                  { label: 'Top',   notes: fragrance.top_notes,   noteClass: 'text-[15px] text-stone-800' },
                  { label: 'Heart', notes: fragrance.heart_notes, noteClass: 'text-[14px] text-stone-700' },
                  { label: 'Base',  notes: fragrance.base_notes,  noteClass: 'text-[13px] text-stone-500' },
                ].map(({ label, notes, noteClass }) => notes?.length > 0 && (
                  <div key={label}>
                    <p className="text-[9px] font-semibold tracking-[0.2em] uppercase text-stone-400 mb-1.5">
                      {label} Notes
                    </p>
                    <p className={`${noteClass} leading-relaxed`}>
                      {(notes as string[]).join('  ·  ')}
                    </p>
                  </div>
                ))}
              </div>

              {/* Attributes — bars for scalar metrics, tier meter for price, chips for the rest */}
              <AttributeMetrics
                attributes={fragrance.attributes ?? []}
                priceTier={fragrance.price_tier}
              />
            </div>
          </div>

          {/* ── Reviews ── */}
          {reviews && reviews.length > 0 && (
            <section className="mt-14 pt-10" style={{ borderTop: '1px solid rgba(28,20,16,0.07)' }}>
              <h2 className="font-serif text-2xl text-stone-900 mb-8 tracking-tight">Reviews</h2>
              <div className="space-y-6">
                {reviews.map((r: any) => (
                  <div key={r.id} style={{ borderBottom: '1px solid rgba(28,20,16,0.06)' }}
                    className="pb-6 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold text-white"
                        style={{ background: 'var(--brand-dark)' }}>
                        {(r.profiles?.display_name ?? 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold text-stone-800">
                          {r.profiles?.display_name ?? 'Anonymous'}
                        </p>
                        <div className="flex gap-0.5 mt-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="w-2 h-2 rounded-sm"
                              style={{ background: i < r.rating ? '#c9a227' : 'rgba(28,20,16,0.10)' }} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-[13px] text-stone-500 leading-relaxed italic">
                      &ldquo;{r.body}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </AppShell>
  )
}
