import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getCategoryPill } from '@/lib/utils'
import { ChevronLeft } from 'lucide-react'
import { AddToShelfButton } from './AddToShelfButton'
import { formatAttribute } from '@/lib/attribute-labels'

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

        {/* ── Mobile: bottle full-bleed top ── */}
        <div className="md:hidden flex justify-center pt-8 pb-4 px-10">
          {fragrance.bottle_image_url ? (
            <div className="relative w-44 h-56">
              <Image src={fragrance.bottle_image_url} alt={fragrance.name} fill
                className="object-contain" sizes="180px" />
            </div>
          ) : (
            <div className="w-44 h-56 rounded-3xl flex items-center justify-center"
              style={{ background: 'rgba(28,20,16,0.04)' }}>
              <span className="font-serif text-5xl text-stone-300">{fragrance.house.charAt(0)}</span>
            </div>
          )}
        </div>

        <div className="px-5 md:px-10 pb-10">
          <div className="md:grid md:grid-cols-[260px_1fr] md:gap-14 md:pt-10">

            {/* ── Desktop: bottle column ── */}
            <div className="hidden md:flex flex-col items-center gap-6">
              {fragrance.bottle_image_url ? (
                <div className="relative w-56 h-72">
                  <Image src={fragrance.bottle_image_url} alt={fragrance.name} fill
                    className="object-contain" sizes="224px" />
                </div>
              ) : (
                <div className="w-56 h-72 rounded-3xl flex items-center justify-center"
                  style={{ background: 'rgba(28,20,16,0.04)' }}>
                  <span className="font-serif text-6xl text-stone-300">{fragrance.house.charAt(0)}</span>
                </div>
              )}
              <AddToShelfButton fragranceId={fragrance.id} fragranceName={fragrance.name} />
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

              {/* Notes — bar pyramid */}
              <div className="space-y-6 mb-8">
                {[
                  { label: 'Top',   notes: fragrance.top_notes,   baseOpacity: 0.95 },
                  { label: 'Heart', notes: fragrance.heart_notes, baseOpacity: 0.72 },
                  { label: 'Base',  notes: fragrance.base_notes,  baseOpacity: 0.52 },
                ].map(({ label, notes, baseOpacity }) => notes?.length > 0 && (
                  <div key={label}>
                    <p className="text-[9px] font-semibold tracking-[0.2em] uppercase text-stone-400 mb-3">
                      {label} Notes
                    </p>
                    <div className="space-y-2">
                      {(notes as string[]).map((n: string, i: number) => {
                        // First note = dominant, taper down. Max 5 visible bars, min 30% width.
                        const total = (notes as string[]).length
                        const pct = Math.round(100 - (i / Math.max(total, 1)) * 62)
                        const barOpacity = baseOpacity * (1 - (i / Math.max(total, 1)) * 0.35)
                        return (
                          <div key={n} className="flex items-center gap-3">
                            {/* Note name */}
                            <span className="text-[12px] text-stone-700 font-medium w-28 flex-shrink-0 truncate">
                              {n}
                            </span>
                            {/* Bar track */}
                            <div className="flex-1 h-[3px] rounded-full"
                              style={{ background: 'rgba(28,20,16,0.07)' }}>
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${pct}%`,
                                  background: `rgba(58,46,40,${barOpacity})`,
                                  transition: 'width 600ms cubic-bezier(0.16,1,0.3,1)',
                                }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Attributes — qualitative labels mapped to precise display values */}
              {fragrance.attributes?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-5"
                  style={{ borderTop: '1px solid rgba(28,20,16,0.07)' }}>
                  {fragrance.attributes.map((a: string) => (
                    <span key={a}
                      className="text-[10px] text-stone-400 px-2.5 py-1"
                      style={{ border: '1px solid rgba(28,20,16,0.10)', borderRadius: '4px' }}>
                      {formatAttribute(a)}
                    </span>
                  ))}
                </div>
              )}

              {/* Mobile: Add to shelf */}
              <div className="md:hidden mt-8">
                <AddToShelfButton fragranceId={fragrance.id} fragranceName={fragrance.name} />
              </div>
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
