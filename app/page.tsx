import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'
import { FragranceCard } from '@/components/ui/FragranceCard'
import Link from 'next/link'
import Image from 'next/image'

export default async function HomePage() {
  const supabase = await createClient()

  // Featured (top rated niche)
  const { data: featured } = await supabase
    .from('fragrances')
    .select('*')
    .eq('category', 'niche')
    .order('avg_rating', { ascending: false })
    .limit(1)
    .single()

  // Trending (top rated overall)
  const { data: trending } = await supabase
    .from('fragrances')
    .select('*')
    .order('avg_rating', { ascending: false })
    .limit(8)

  // Niche picks
  const { data: nichePicks } = await supabase
    .from('fragrances')
    .select('*')
    .in('category', ['niche', 'ultra-niche'])
    .order('avg_rating', { ascending: false })
    .limit(8)

  return (
    <AppShell>
      <div className="max-w-[1400px] mx-auto">

        {/* ── Hero ── */}
        {featured && (
          <Link href={`/fragrance/${featured.id}`}
            className="block mx-5 md:mx-10 mt-6 mb-6 rounded-2xl overflow-hidden bg-stone-900 relative min-h-[220px] md:min-h-[280px]">
            <div className="p-8 md:p-10 relative z-10">
              <p className="text-[9px] font-bold tracking-[2px] uppercase text-stone-400 mb-2">Scent of the Week</p>
              <h1 className="font-serif text-4xl md:text-5xl text-white mb-1">{featured.name}</h1>
              <p className="text-stone-400 text-sm mb-6">{featured.house} · {featured.type}</p>
              <span className="inline-block bg-white/10 text-white text-xs font-semibold px-4 py-2 rounded-full border border-white/20">
                Explore →
              </span>
            </div>
            {featured.bottle_image_url && (
              <div className="absolute right-6 bottom-0 w-40 h-48 md:w-52 md:h-60">
                <Image src={featured.bottle_image_url} alt={featured.name} fill className="object-contain object-bottom opacity-80" sizes="200px" />
              </div>
            )}
          </Link>
        )}

        {/* ── Trending ── */}
        <section className="mb-8">
          <div className="flex items-baseline justify-between px-5 md:px-10 mb-3">
            <h2 className="font-serif text-2xl text-stone-900">Trending</h2>
            <Link href="/discover" className="text-xs text-stone-400 font-medium hover:text-stone-700">See all</Link>
          </div>
          <div className="flex gap-0 overflow-x-auto px-5 md:px-10 pb-2">
            {trending?.map(f => (
              <div key={f.id} className="w-[140px] md:w-[160px] flex-shrink-0">
                <FragranceCard fragrance={f} />
              </div>
            ))}
          </div>
        </section>

        {/* ── Niche Picks ── */}
        <section className="mb-8">
          <div className="flex items-baseline justify-between px-5 md:px-10 mb-3">
            <h2 className="font-serif text-2xl text-stone-900">Niche Picks</h2>
            <Link href="/discover?cat=niche" className="text-xs text-stone-400 font-medium hover:text-stone-700">See all</Link>
          </div>
          <div className="flex gap-0 overflow-x-auto px-5 md:px-10 pb-2">
            {nichePicks?.map(f => (
              <div key={f.id} className="w-[140px] md:w-[160px] flex-shrink-0">
                <FragranceCard fragrance={f} />
              </div>
            ))}
          </div>
        </section>

      </div>
    </AppShell>
  )
}
