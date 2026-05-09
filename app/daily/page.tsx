import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { DailyWearButton } from './DailyWearButton'

export default async function DailyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  // Fetch everything in parallel
  const [
    { data: wears },
    { data: owned },
    { data: challenges },
    { data: entries },
  ] = await Promise.all([
    supabase
      .from('wears')
      .select('*, fragrance:fragrances(*)')
      .eq('user_id', user.id)
      .order('worn_at', { ascending: false })
      .limit(30),
    supabase
      .from('collection')
      .select('*, fragrance:fragrances(*)')
      .eq('user_id', user.id)
      .eq('status', 'owned')
      .order('created_at', { ascending: false }),
    supabase
      .from('challenges')
      .select('*')
      .order('starts_at', { ascending: false }),
    supabase
      .from('challenge_entries')
      .select('challenge_id')
      .eq('user_id', user.id),
  ])

  const enteredIds = new Set((entries ?? []).map((e: any) => e.challenge_id))
  const todayWear = wears?.find((w: any) => w.worn_at === new Date().toISOString().split('T')[0])

  return (
    <AppShell>
      <div className="max-w-[700px] mx-auto px-5 md:px-10 py-8">

        {/* ── Header ── */}
        <div className="mb-10">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-stone-400 mb-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="font-serif text-4xl text-stone-900 leading-none tracking-tight">Daily</h1>
        </div>

        {/* ── Wear of the Day ── */}
        <section className="mb-12">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-stone-400 mb-4">
            Wear of the Day
          </p>

          {todayWear ? (
            <div className="flex items-center gap-5 p-5 rounded-2xl bg-white/60 border border-stone-900/[0.06]"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)' }}>
              <div className="w-16 h-20 relative flex-shrink-0">
                {(todayWear.fragrance as any)?.bottle_image_url ? (
                  <Image
                    src={(todayWear.fragrance as any).bottle_image_url}
                    alt={(todayWear.fragrance as any).name}
                    fill className="object-contain" sizes="64px"
                  />
                ) : (
                  <div className="w-full h-full bg-stone-100 rounded-xl flex items-center justify-center">
                    <span className="font-serif text-xl text-stone-400">
                      {(todayWear.fragrance as any)?.house?.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-0.5">
                  {(todayWear.fragrance as any)?.house}
                </p>
                <p className="font-serif text-xl text-stone-900 leading-tight mb-1">
                  {(todayWear.fragrance as any)?.name}
                </p>
                {todayWear.note && (
                  <p className="text-sm text-stone-400 leading-relaxed line-clamp-2 italic">
                    &ldquo;{todayWear.note}&rdquo;
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div>
              <p className="font-serif text-lg text-stone-500 mb-5 leading-relaxed">
                What are you wearing today?
              </p>
              {owned && owned.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                  {owned.slice(0, 8).map((item: any) => {
                    const f = item.fragrance as any
                    if (!f) return null
                    return (
                      <DailyWearButton key={item.id} fragranceId={f.id} userId={user.id}>
                        <div className="flex-shrink-0 w-[80px] text-center">
                          <div className="w-[80px] h-[96px] relative mb-2">
                            {f.bottle_image_url ? (
                              <Image src={f.bottle_image_url} alt={f.name} fill
                                className="object-contain" sizes="80px" />
                            ) : (
                              <div className="w-full h-full bg-stone-100 rounded-xl flex items-center justify-center">
                                <span className="font-serif text-lg text-stone-400">{f.house.charAt(0)}</span>
                              </div>
                            )}
                          </div>
                          <p className="font-serif text-[11px] text-stone-800 leading-tight line-clamp-2">{f.name}</p>
                        </div>
                      </DailyWearButton>
                    )
                  })}
                </div>
              ) : (
                <Link href="/discover"
                  className="inline-block px-6 py-3 rounded-xl bg-stone-900 text-white text-sm font-semibold"
                  style={{ transition: 'opacity 200ms cubic-bezier(0.16,1,0.3,1)' }}>
                  Add bottles to your shelf first →
                </Link>
              )}
            </div>
          )}
        </section>

        {/* ── Scent Diary ── */}
        <section className="mb-12">
          <div className="flex items-baseline justify-between mb-4">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-stone-400">Scent Diary</p>
            <span className="text-[11px] text-stone-400">{wears?.length ?? 0} wears</span>
          </div>

          {wears && wears.length > 0 ? (
            <div className="space-y-px">
              {wears.map((wear: any, i: number) => {
                const f = wear.fragrance as any
                const date = new Date(wear.worn_at + 'T12:00:00')
                const isFirst = i === 0 || wears[i-1].worn_at.slice(0,7) !== wear.worn_at.slice(0,7)
                return (
                  <div key={wear.id}>
                    {isFirst && (
                      <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-stone-300 pt-4 pb-2">
                        {date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </p>
                    )}
                    <div className="flex items-center gap-4 py-3 border-b border-stone-900/[0.05] group">
                      <p className="text-[11px] text-stone-400 w-8 flex-shrink-0 tabular-nums">
                        {date.getDate()}
                      </p>
                      <div className="w-8 h-10 relative flex-shrink-0">
                        {f?.bottle_image_url ? (
                          <Image src={f.bottle_image_url} alt={f.name} fill
                            className="object-contain" sizes="32px" />
                        ) : (
                          <div className="w-full h-full rounded-lg bg-stone-100 flex items-center justify-center">
                            <span className="font-serif text-xs text-stone-400">{f?.house?.charAt(0)}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-serif text-sm text-stone-900 leading-tight truncate">{f?.name}</p>
                        {wear.note && (
                          <p className="text-[11px] text-stone-400 truncate mt-0.5 italic">{wear.note}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-stone-400 py-8 text-center font-serif italic">
              Your diary is empty. Log your first wear above.
            </p>
          )}
        </section>

        {/* ── Challenges ── */}
        <section>
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-stone-400 mb-4">Challenges</p>
          {challenges && challenges.length > 0 ? (
            <div className="space-y-3">
              {challenges.map((c: any) => {
                const done = enteredIds.has(c.id)
                return (
                  <div key={c.id}
                    className="p-5 rounded-2xl border border-stone-900/[0.06] bg-white/40"
                    style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-serif text-base text-stone-900 mb-1">{c.title}</p>
                        <p className="text-[12px] text-stone-400 leading-relaxed">{c.description}</p>
                      </div>
                      <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs
                        ${done
                          ? 'bg-stone-900 text-white'
                          : 'border border-stone-300 text-stone-300'
                        }`}>
                        {done ? '✓' : ''}
                      </div>
                    </div>
                    {!done && (
                      <div className="mt-4 pt-4 border-t border-stone-900/[0.05]">
                        <p className="text-[11px] text-stone-400 italic mb-3">&ldquo;{c.prompt}&rdquo;</p>
                        <Link href={`/discover`}
                          className="text-[11px] font-semibold text-stone-900 tracking-wide uppercase">
                          Start challenge →
                        </Link>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-stone-400 font-serif italic text-center py-8">
              No active challenges right now.
            </p>
          )}
        </section>

      </div>

        {/* ── Design toggle ── */}
        <div className="fixed bottom-24 md:bottom-6 right-5 z-50">
          <a href="/daily/minimalist"
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-[11px] font-semibold text-white"
            style={{ background: '#3a2e28', boxShadow: '0 4px 16px rgba(0,0,0,0.18)' }}>
            <span>View Minimalist</span>
            <span>→</span>
          </a>
        </div>
    </AppShell>
  )
}
