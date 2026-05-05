import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'
import { redirect } from 'next/navigation'
import { getRankForXP } from '@/lib/utils'
import { SignOutButton } from './SignOutButton'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  // Calculate XP
  const [{ count: owned }, { count: reviewCount }, { count: wearCount }, { count: challengeCount }] = await Promise.all([
    supabase.from('collection').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'owned'),
    supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('wears').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('challenge_entries').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
  ])

  const xp = (owned ?? 0) * 10 + (reviewCount ?? 0) * 5 + (wearCount ?? 0) * 2 + (challengeCount ?? 0) * 8
  const rank = getRankForXP(xp)
  const nextXP = rank.next?.min ?? xp
  const pct = rank.next ? Math.round(((xp - rank.min) / (nextXP - rank.min)) * 100) : 100

  return (
    <AppShell>
      <div className="max-w-[700px] mx-auto px-5 md:px-10 py-6">
        {/* Profile header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-stone-900 flex items-center justify-center text-white font-serif text-2xl">
            {(profile?.display_name ?? user.email ?? 'U')[0].toUpperCase()}
          </div>
          <div>
            <h1 className="font-serif text-2xl text-stone-900">{profile?.display_name ?? 'User'}</h1>
            <p className="text-sm text-stone-400">@{profile?.handle ?? 'unknown'}</p>
          </div>
        </div>

        {/* Rank card */}
        <div className="rounded-2xl overflow-hidden mb-6" style={{ background: '#3a2e28' }}>
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
              { num: owned ?? 0, label: 'Owned' },
              { num: reviewCount ?? 0, label: 'Reviews' },
              { num: wearCount ?? 0, label: 'Wears' },
              { num: xp, label: 'XP' },
            ].map(({ num, label }) => (
              <div key={label} className="py-3 text-center border-r border-white/10 last:border-0">
                <p className="text-lg font-bold text-white">{num}</p>
                <p className="text-[9px] uppercase tracking-wide text-white/40">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <SignOutButton />
        </div>
      </div>
    </AppShell>
  )
}
