import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'
import { FragranceCard } from '@/components/ui/FragranceCard'
import Link from 'next/link'
import Image from 'next/image'

export default async function HomePage() {
  const supabase = await createClient()

  const [
    { data: featured },
    { data: trending },
    { data: nichePicks },
    { data: ultraNiche },
  ] = await Promise.all([
    supabase.from('fragrances').select('*').eq('category', 'niche')
      .order('avg_rating', { ascending: false }).limit(1).single(),
    supabase.from('fragrances').select('*')
      .order('avg_rating', { ascending: false }).limit(8),
    supabase.from('fragrances').select('*').eq('category', 'niche')
      .order('avg_rating', { ascending: false }).limit(8),
    supabase.from('fragrances').select('*').eq('category', 'ultra-niche')
      .order('avg_rating', { ascending: false }).limit(6),
  ])

  return (
    <AppShell>
      <div className="max-w-[1400px] mx-auto">

        {/* ── Hero ── */}
        {featured && (
          <Link href={`/fragrance/${featured.id}`}
            className="block mx-5 md:mx-10 mt-6 mb-8 rounded-3xl overflow-hidden relative group"
            style={{
              background: 'linear-gradient(135deg, #3a2e28 0%, #2a2018 60%, #1a1208 100%)',
              minHeight: '260px',
            }}>

            <div className="relative z-10 p-8 md:p-10 flex flex-col justify-between h-full" style={{ minHeight: '260px' }}>
              <p className="text-[9px] font-semibold tracking-[0.22em] uppercase text-white/40">
                Scent of the Week
              </p>
              <div className="mt-auto">
                <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-white/40 mb-2">
                  {featured.house}
                </p>
                <h1 className="font-serif text-4xl md:text-5xl text-white leading-tight tracking-tight mb-4">
                  {featured.name}
                </h1>
                <div className="flex items-center gap-4">
                  <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-white/60 border-b border-white/20 pb-px"
                    style={{ transition: 'color 220ms var(--ease-out-expo)' }}>
                    Explore →
                  </span>
                </div>
              </div>
            </div>

            {featured.bottle_image_url && (
              <div className="absolute right-0 bottom-0 w-44 h-52 md:w-56 md:h-64"
                style={{ transition: 'transform 400ms var(--ease-out-expo)' }}>
                <Image src={featured.bottle_image_url} alt={featured.name} fill
                  className="object-contain object-bottom opacity-90" sizes="220px" />
              </div>
            )}
          </Link>
        )}

        {/* ── Trending ── */}
        <Section title="Trending" href="/discover">
          {trending?.map(f => (
            <div key={f.id} className="w-[130px] md:w-[150px] flex-shrink-0">
              <FragranceCard fragrance={f} />
            </div>
          ))}
        </Section>

        {/* ── Niche Picks ── */}
        <Section title="Niche Picks" href="/discover?cat=niche">
          {nichePicks?.map(f => (
            <div key={f.id} className="w-[130px] md:w-[150px] flex-shrink-0">
              <FragranceCard fragrance={f} />
            </div>
          ))}
        </Section>

        {/* ── Ultra Niche ── */}
        {ultraNiche && ultraNiche.length > 0 && (
          <Section title="Ultra Niche" href="/discover?cat=ultra-niche">
            {ultraNiche.map(f => (
              <div key={f.id} className="w-[130px] md:w-[150px] flex-shrink-0">
                <FragranceCard fragrance={f} />
              </div>
            ))}
          </Section>
        )}

        <div className="h-8" />
      </div>
    </AppShell>
  )
}

function Section({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <div className="flex items-baseline justify-between px-5 md:px-10 mb-4">
        <h2 className="font-serif text-2xl text-stone-900 tracking-tight">{title}</h2>
        <Link href={href}
          className="text-[10px] font-semibold tracking-[0.14em] uppercase text-stone-400 border-b border-stone-300 pb-px"
          style={{ transition: 'color 200ms var(--ease-out-expo)' }}>
          See all
        </Link>
      </div>
      <div className="flex overflow-x-auto px-5 md:px-10 pb-2 gap-0">
        {children}
      </div>
    </section>
  )
}
