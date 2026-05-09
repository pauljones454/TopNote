import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { DailyWearButton } from './DailyWearButton'

export default async function DailyMinimalistPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

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
    supabase.from('challenges').select('*').order('starts_at', { ascending: false }),
    supabase.from('challenge_entries').select('challenge_id').eq('user_id', user.id),
  ])

  const enteredIds = new Set((entries ?? []).map((e: any) => e.challenge_id))
  const todayWear = wears?.find((w: any) => w.worn_at === new Date().toISOString().split('T')[0])

  return (
    <AppShell>
      <div className="max-w-[700px] mx-auto px-5 md:px-10 py-8">

        {/* ── Header ── */}
        <div className="flex items-end justify-between border-b border-stone-900/10 pb-5 mb-10">
          <div>
            <p className="text-[9px] font-semibold tracking-[0.22em] uppercase text-stone-400 mb-1.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
            </p>
            <h1 className="text-[32px] font-semibold text-stone-900 leading-none tracking-tight">Daily</h1>
          </div>
          <p className="text-[11px] text-stone-400 tabular-nums">
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* ── Wear of the Day ── */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-5">
            <p className="text-[9px] font-semibold tracking-[0.22em] uppercase text-stone-400">Wear of the Day</p>
            <div className="flex-1 h-px bg-stone-900/[0.08]" />
          </div>

          {todayWear ? (
            <div className="flex items-center gap-6 py-4 border-b border-stone-900/[0.08]">
              <div className="w-12 h-[60px] relative flex-shrink-0">
                {(todayWear.fragrance as any)?.bottle_image_url ? (
                  <Image
                    src={(todayWear.fragrance as any).bottle_image_url}
                    alt={(todayWear.fragrance as any).name}
                    fill className="object-contain" sizes="48px"
                  />
                ) : (
                  <div className="w-full h-full bg-stone-100 flex items-center justify-center">
                    <span className="text-xs font-medium text-stone-400">
                      {(todayWear.fragrance as any)?.house?.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-semibold tracking-[0.18em] uppercase text-stone-400 mb-0.5">
                  {(todayWear.fragrance as any)?.house}
                </p>
                <p className="text-[17px] font-medium text-stone-900 leading-snug truncate">
                  {(todayWear.fragrance as any)?.name}
                </p>
                {todayWear.note && (
                  <p className="text-[12px] text-stone-400 mt-1 leading-relaxed line-clamp-1">
                    {todayWear.note}
                  </p>
                )}
              </div>
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-stone-900 flex items-center justify-center">
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-[15px] text-stone-500 mb-6">What are you wearing today?</p>
              {owned && owned.length > 0 ? (
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {owned.slice(0, 8).map((item: any) => {
                    const f = item.fragrance as any
                    if (!f) return null
                    return (
                      <DailyWearButton key={item.id} fragranceId={f.id} userId={user.id}>
                        <div className="flex-shrink-0 w-[72px] text-center">
                          <div className="w-[72px] h-[88px] relative mb-2">
                            {f.bottle_image_url ? (
                              <Image src={f.bottle_image_url} alt={f.name} fill
                                className="object-contain" sizes="72px" />
                            ) : (
                              <div className="w-full h-full bg-stone-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-stone-400">{f.house.charAt(0)}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-[10px] text-stone-600 leading-tight line-clamp-2 font-medium">{f.name}</p>
                        </div>
                      </DailyWearButton>
                    )
                  })}
                </div>
              ) : (
                <Link href="/discover"
                  className="inline-flex items-center gap-2 text-[12px] font-semibold text-stone-900 tracking-wide uppercase border-b border-stone-900 pb-px">
                  Add bottles to your shelf
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6H10M7 3L10 6L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              )}
            </div>
          )}
        </section>

        {/* ── Scent Diary ── */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-5">
            <p className="text-[9px] font-semibold tracking-[0.22em] uppercase text-stone-400">Scent Diary</p>
            <div className="flex-1 h-px bg-stone-900/[0.08]" />
            <span className="text-[9px] font-semibold tracking-[0.12em] uppercase text-stone-300">
              {wears?.length ?? 0}
            </span>
          </div>

          {wears && wears.length > 0 ? (
            <div>
              {wears.map((wear: any, i: number) => {
                const f = wear.fragrance as any
                const date = new Date(wear.worn_at + 'T12:00:00')
                const isFirst = i === 0 || wears[i-1].worn_at.slice(0,7) !== wear.worn_at.slice(0,7)
                return (
                  <div key={wear.id}>
                    {isFirst && (
                      <p className="text-[9px] font-semibold tracking-[0.18em] uppercase text-stone-300 pt-6 pb-3">
                        {date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </p>
                    )}
                    <div className="flex items-center gap-4 py-2.5 border-b border-stone-900/[0.06]">
                      <span className="text-[11px] text-stone-300 w-7 flex-shrink-0 tabular-nums font-medium">
                        {String(date.getDate()).padStart(2, '0')}
                      </span>
                      <div className="w-7 h-9 relative flex-shrink-0">
                        {f?.bottle_image_url ? (
                          <Image src={f.bottle_image_url} alt={f?.name ?? ''} fill
                            className="object-contain" sizes="28px" />
                        ) : (
                          <div className="w-full h-full bg-stone-100 flex items-center justify-center">
                            <span className="text-[10px] text-stone-400 font-medium">{f?.house?.charAt(0)}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-stone-900 leading-tight truncate">{f?.name}</p>
                        <p className="text-[10px] text-stone-400 truncate">{f?.house}</p>
                      </div>
                      {wear.note && (
                        <p className="text-[11px] text-stone-400 truncate max-w-[100px] hidden sm:block">{wear.note}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-[13px] text-stone-400 py-8 text-center">
              No wears logged yet.
            </p>
          )}
        </section>

        {/* ── Challenges ── */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <p className="text-[9px] font-semibold tracking-[0.22em] uppercase text-stone-400">Challenges</p>
            <div className="flex-1 h-px bg-stone-900/[0.08]" />
          </div>

          {challenges && challenges.length > 0 ? (
            <div className="space-y-0">
              {challenges.map((c: any) => {
                const done = enteredIds.has(c.id)
                return (
                  <div key={c.id} className="py-5 border-b border-stone-900/[0.06] flex items-start gap-5">
                    <div className={`flex-shrink-0 mt-0.5 w-4 h-4 border flex items-center justify-center
                      ${done ? 'border-stone-900 bg-stone-900' : 'border-stone-300'}`}>
                      {done && (
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                          <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium text-stone-900 mb-1 leading-snug">{c.title}</p>
                      <p className="text-[12px] text-stone-400 leading-relaxed mb-2">{c.description}</p>
                      {!done && (
                        <Link href="/discover"
                          className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.14em] uppercase text-stone-500">
                          Begin
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M1.5 5H8.5M5.5 2L8.5 5L5.5 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-[13px] text-stone-400 py-8 text-center">No active challenges.</p>
          )}
        </section>

      </div>

        {/* ── Design toggle ── */}
        <div className="fixed bottom-24 md:bottom-6 right-5 z-50">
          <a href="/daily"
            className="flex items-center gap-2 px-4 py-2.5 border border-stone-900 text-[11px] font-semibold text-stone-900 bg-[#F7F3EE]">
            <span>View Soft</span>
            <span>→</span>
          </a>
        </div>
    </AppShell>
  )
}
