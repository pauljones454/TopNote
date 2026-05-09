'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const SCREENS = [
  { label: 'Home',       href: '/',                   note: 'Hero + rows' },
  { label: 'Discover',   href: '/discover',            note: 'Search + grid' },
  { label: 'Daily',      href: '/daily',               note: 'Soft-skill variant' },
  { label: 'Collection', href: '/collection',          note: 'Requires auth' },
  { label: 'Profile',    href: '/profile',             note: 'Rank card' },
  { label: 'Fragrance',  href: '/fragrance',           note: 'Detail page' },
]

export default function PreviewPage() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [email, setEmail]   = useState('')
  const [pass, setPass]     = useState('')
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setAuthed(!!user))
  }, [])

  async function signIn() {
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email, password: pass })
    if (err) { setError(err.message); setLoading(false); return }
    setAuthed(true); setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#F7F3EE]">
      <div className="max-w-[500px] mx-auto px-6 py-12">

        {/* Header */}
        <div className="mb-10">
          <p className="text-[9px] font-semibold tracking-[0.22em] uppercase text-stone-400 mb-1">Top Note</p>
          <h1 className="font-serif text-4xl text-stone-900 tracking-tight">Preview</h1>
          <p className="text-sm text-stone-400 mt-1">Jump directly to any screen</p>
        </div>

        {/* Auth status */}
        {authed === false && (
          <div className="mb-8 p-5 rounded-2xl bg-amber-50 border border-amber-100">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-600 mb-3">
              Sign in to preview auth-gated screens
            </p>
            <input value={email} onChange={e => setEmail(e.target.value)}
              type="email" placeholder="your@email.com"
              className="w-full px-3.5 py-2.5 rounded-lg border border-stone-200 text-sm mb-2 outline-none bg-white" />
            <input value={pass} onChange={e => setPass(e.target.value)}
              type="password" placeholder="Password"
              className="w-full px-3.5 py-2.5 rounded-lg border border-stone-200 text-sm mb-3 outline-none bg-white" />
            {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
            <button onClick={signIn} disabled={loading}
              className="w-full py-2.5 rounded-lg bg-stone-900 text-white text-sm font-semibold disabled:opacity-50">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </div>
        )}

        {authed === true && (
          <div className="mb-8 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <p className="text-[12px] text-stone-500">Signed in — all screens accessible</p>
          </div>
        )}

        {/* Screen links */}
        <div className="space-y-1">
          {SCREENS.map(s => (
            <Link key={s.href} href={s.href}
              className="flex items-center justify-between py-4 group"
              style={{ borderBottom: '1px solid rgba(28,20,16,0.07)' }}>
              <div>
                <p className="text-[15px] font-medium text-stone-900">{s.label}</p>
                <p className="text-[11px] text-stone-400">{s.note}</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-stone-300">
                <path d="M3 8H13M9 4L13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          ))}
        </div>

        <p className="text-[10px] text-stone-300 text-center mt-10">
          /preview · Not linked from main nav · Dev only
        </p>
      </div>
    </div>
  )
}
