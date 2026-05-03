import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getCategoryPill } from '@/lib/utils'
import { ChevronLeft, Star } from 'lucide-react'
import { AddToShelfButton } from './AddToShelfButton'

export default async function FragrancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: fragrance } = await supabase
    .from('fragrances')
    .select('*')
    .eq('id', id)
    .single()

  if (!fragrance) notFound()

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*, profiles(display_name, handle)')
    .eq('fragrance_id', id)
    .order('created_at', { ascending: false })
    .limit(10)

  const pill = getCategoryPill(fragrance.category)

  return (
    <AppShell>
      <div className="max-w-[900px] mx-auto px-5 md:px-10 py-6">
        {/* Back */}
        <Link href="/discover" className="inline-flex items-center gap-1 text-sm text-stone-400 hover:text-stone-700 mb-6">
          <ChevronLeft size={16} /> Discover
        </Link>

        <div className="md:grid md:grid-cols-[280px_1fr] md:gap-12">
          {/* ── Bottle ── */}
          <div className="flex flex-col items-center mb-8 md:mb-0">
            <div className="relative w-48 h-64 md:w-64 md:h-80 mb-6">
              {fragrance.bottle_image_url ? (
                <Image src={fragrance.bottle_image_url} alt={fragrance.name} fill className="object-contain" sizes="280px" />
              ) : (
                <div className="w-full h-full bg-stone-100 rounded-2xl flex items-center justify-center">
                  <span className="font-serif text-4xl text-stone-400">{fragrance.house.charAt(0)}</span>
                </div>
              )}
            </div>
            <AddToShelfButton fragranceId={fragrance.id} fragranceName={fragrance.name} />
          </div>

          {/* ── Info ── */}
          <div>
            <span className={`inline-block text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-full mb-3 ${pill.className}`}>
              {pill.label}
            </span>
            <p className="text-sm font-semibold text-stone-400 uppercase tracking-wide mb-1">{fragrance.house}</p>
            <h1 className="font-serif text-4xl text-stone-900 mb-2">{fragrance.name}</h1>
            <div className="flex items-center gap-2 mb-4">
              <Star size={14} fill="#c9a227" stroke="none" />
              <span className="text-sm font-semibold text-stone-700">{fragrance.avg_rating}</span>
              <span className="text-xs text-stone-400">({fragrance.review_count?.toLocaleString()} ratings)</span>
            </div>
            <p className="text-sm text-stone-500 mb-6">{fragrance.type} · {fragrance.seasons?.join(' · ')}</p>

            {/* Notes */}
            {[
              { label: 'Top Notes', notes: fragrance.top_notes },
              { label: 'Heart Notes', notes: fragrance.heart_notes },
              { label: 'Base Notes', notes: fragrance.base_notes },
            ].map(({ label, notes }) => notes?.length > 0 && (
              <div key={label} className="mb-4">
                <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-2">{label}</p>
                <div className="flex flex-wrap gap-2">
                  {(notes as string[]).map((n: string) => (
                    <span key={n} className="text-xs bg-stone-100 text-stone-600 px-3 py-1 rounded-full">{n}</span>
                  ))}
                </div>
              </div>
            ))}

            {/* Attributes */}
            {fragrance.attributes?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-stone-100">
                <div className="flex flex-wrap gap-2">
                  {fragrance.attributes.map((a: string) => (
                    <span key={a} className="text-xs text-stone-500 bg-stone-50 border border-stone-200 px-3 py-1 rounded-full">{a}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Reviews ── */}
        {reviews && reviews.length > 0 && (
          <section className="mt-12 pt-8 border-t border-stone-100">
            <h2 className="font-serif text-2xl text-stone-900 mb-6">Reviews</h2>
            <div className="space-y-4">
              {reviews.map((r: any) => (
                <div key={r.id} className="bg-white rounded-xl p-4 border border-stone-100">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center text-white text-xs font-bold">
                      {(r.profiles?.display_name ?? 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-stone-800">{r.profiles?.display_name ?? 'Anonymous'}</p>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={10} fill={i < r.rating ? '#c9a227' : 'none'} stroke={i < r.rating ? 'none' : '#d4c8bc'} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-stone-600 italic">&ldquo;{r.body}&rdquo;</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  )
}
