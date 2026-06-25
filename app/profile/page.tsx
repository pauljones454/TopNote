import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'
import { redirect } from 'next/navigation'
import { getRankForXP } from '@/lib/utils'
import { SignOutButton } from './SignOutButton'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { CollectionItem, Fragrance } from '@/lib/supabase/types'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch XP stats and owned collection in parallel
  const [
    { count: owned },
    { count: reviewCount },
    { count: wearCount },
    { count: challengeCount },
    { data: rawCollection },
  ] = await Promise.all([
    supabase.from('collection').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'owned'),
    supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('wears').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('challenge_entries').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase
      .from('collection')
      .select('*, fragrance:fragrances(*)')
      .eq('user_id', user.id)
      .eq('status', 'owned')
      .order('created_at', { ascending: false }),
  ])

  const collectionItems = (rawCollection ?? []) as CollectionItem[]
  // First 6 bottles for the preview strip
  const previewItems = collectionItems.slice(0, 6)

  // Derive scent signature — aggregate all notes by frequency across owned fragrances
  const noteFreq = new Map<string, number>()
  for (const item of collectionItems) {
    const f = item.fragrance as Fragrance | null
    if (!f) continue
    for (const note of [...f.top_notes, ...f.heart_notes, ...f.base_notes]) {
      const key = note.trim().toLowerCase()
      if (key) noteFreq.set(key, (noteFreq.get(key) ?? 0) + 1)
    }
  }
  const topNotes = [...noteFreq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([note]) => note)

  // Rank / XP
  const xp = (owned ?? 0) * 10 + (reviewCount ?? 0) * 5 + (wearCount ?? 0) * 2 + (challengeCount ?? 0) * 8
  const rank = getRankForXP(xp)
  const nextXP = rank.next?.min ?? xp
  const pct = rank.next ? Math.round(((xp - rank.min) / (nextXP - rank.min)) * 100) : 100

  return (
    <AppShell>
      <div className="max-w-[700px] mx-auto px-5 md:px-10 py-6 space-y-8">

        {/* ── Profile header ── */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-stone-900 flex items-center justify-center text-white font-serif text-2xl flex-shrink-0">
            {(profile?.display_name ?? user.email ?? 'U')[0].toUpperCase()}
          </div>
          <div>
            <h1 className="font-serif text-2xl text-stone-900">{profile?.display_name ?? 'User'}</h1>
            <p className="text-sm text-stone-400">@{profile?.handle ?? 'unknown'}</p>
          </div>
        </div>

        {/* ── Rank card ── */}
        <div className="rounded-2xl overflow-hidden" style={{ background: '#3a2e28' }}>
          <div className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[9px] font-bold tracking-[2px] uppercase text-white/40 mb-1">Your Rank</p>
                <p className="font-serif text-2xl text-white">{rank.icon} {rank.name}</p>
              </div>
              <span className="text-3xl">{rank.icon}</span>
            </div>
            <div className="flex justify-between text-[10px] text-white/40 mb-1.5">
              <span>{xp} XP</span>
              <span>{rank.next ? `${nextXP} XP to ${rank.next.name}` : 'Max Rank'}</span>
            </div>
            <div className="h-1 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-white/70 transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div className="grid grid-cols-4 border-t border-white/10">
            {[
              { num: owned ?? 0,       label: 'Owned' },
              { num: reviewCount ?? 0, label: 'Reviews' },
              { num: wearCount ?? 0,   label: 'Wears' },
              { num: xp,               label: 'XP' },
            ].map(({ num, label }) => (
              <div key={label} className="py-3 text-center border-r border-white/10 last:border-0">
                <p className="text-lg font-bold text-white">{num}</p>
                <p className="text-[9px] uppercase tracking-wide text-white/40">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Collection preview strip ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[9px] font-bold tracking-[2px] uppercase text-stone-400">Your Shelf</p>
            {previewItems.length > 0 && (
              <Link
                href="/collection"
                className="text-[11px] text-stone-400 hover:text-stone-700 transition-colors duration-200"
                style={{ transitionTimingFunction: 'var(--ease-out-expo)' }}
              >
                View all →
              </Link>
            )}
          </div>

          {previewItems.length === 0 ? (
            <div
              className="rounded-2xl bg-white/50 py-8 text-center"
              style={{ border: '1px solid rgba(0,0,0,0.06)' }}
            >
              <p className="text-2xl mb-2">🧴</p>
              <p className="font-serif text-sm text-stone-500">Nothing on your shelf yet</p>
              <Link
                href="/discover"
                className="text-[11px] text-stone-400 mt-1.5 inline-block hover:text-stone-700 transition-colors duration-200"
                style={{ transitionTimingFunction: 'var(--ease-out-expo)' }}
              >
                Discover fragrances →
              </Link>
            </div>
          ) : (
            /* Negative horizontal margin so bottles bleed to page edge on mobile */
            <div
              className="flex gap-3 overflow-x-auto pb-1 -mx-5 px-5 md:-mx-10 md:px-10"
              style={{ scrollbarWidth: 'none' }}
            >
              {previewItems.map(item => {
                const f = item.fragrance as Fragrance | null
                if (!f) return null
                return (
                  <Link key={item.id} href={`/fragrance/${f.id}`} className="flex-none group">
                    <div
                      className="w-14 h-[72px] relative rounded-xl overflow-hidden"
                      style={{ background: '#F7F3EE' }}
                    >
                      {f.bottle_image_url ? (
                        <Image
                          src={f.bottle_image_url}
                          alt={f.name}
                          fill
                          className="object-contain p-1"
                          sizes="56px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="font-serif text-base text-stone-400">
                            {f.house.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="mt-1.5 font-serif text-[10px] text-stone-600 text-center w-14 truncate">
                      {f.name}
                    </p>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {/* ── Scent signature ── */}
        <section>
          <p className="text-[9px] font-bold tracking-[2px] uppercase text-stone-400 mb-2.5">
            Scent Signature
          </p>
          {topNotes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {topNotes.map(note => (
                <span
                  key={note}
                  className="px-3 py-1 rounded-full text-[11px] capitalize text-stone-700"
                  style={{
                    background: 'rgba(255,255,255,0.7)',
                    border: '1px solid rgba(0,0,0,0.07)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  }}
                >
                  {note}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-stone-400 italic leading-relaxed">
              Add fragrances to your shelf to reveal your scent signature.
            </p>
          )}
        </section>

        {/* ── Account section — Settings link + Sign Out ── */}
        <section>
          <p className="text-[9px] font-bold tracking-[2px] uppercase text-stone-400 mb-2.5">Account</p>
          <div
            className="rounded-2xl bg-white/60 overflow-hidden"
            style={{
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)',
            }}
          >
            <Link
              href="/settings"
              className="flex items-center justify-between px-5 py-4 hover:bg-stone-50/80 transition-colors duration-200"
              style={{
                borderBottom: '1px solid rgba(0,0,0,0.06)',
                transitionTimingFunction: 'var(--ease-out-expo)',
              }}
            >
              <span className="text-sm text-stone-700">Settings</span>
              <ChevronRight size={14} className="text-stone-300" strokeWidth={1.5} />
            </Link>
            <SignOutButton />
          </div>
        </section>

      </div>
    </AppShell>
  )
}

