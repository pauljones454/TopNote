'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type ShelfStatus = 'owned' | 'sample' | null

export function AddToShelfButton({ fragranceId, fragranceName }: { fragranceId: string; fragranceName: string }) {
  const [status, setStatus]   = useState<ShelfStatus>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data } = await supabase.from('collection')
        .select('status').eq('user_id', user.id).eq('fragrance_id', fragranceId)
        .in('status', ['owned', 'sample']).limit(1)
      setStatus((data?.[0]?.status as ShelfStatus) ?? null)
      setLoading(false)
    }
    check()
  }, [fragranceId])

  // Owned and sample are mutually exclusive shelf states; both count for
  // layering. Switching between them replaces the row, never duplicates it,
  // and leaves any wishlist row untouched.
  async function setShelf(next: ShelfStatus) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/auth'; return }
    setLoading(true)
    await supabase.from('collection').delete()
      .eq('user_id', user.id).eq('fragrance_id', fragranceId).in('status', ['owned', 'sample'])
    if (next) {
      await supabase.from('collection').insert({ user_id: user.id, fragrance_id: fragranceId, status: next })
    }
    setStatus(next)
    setLoading(false)
  }

  if (loading) {
    return (
      <button disabled
        className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-semibold opacity-40"
        style={{ borderRadius: '10px', background: 'var(--brand-dark)', color: '#fff' }}>
        <span className="w-4 h-4 rounded-full border border-current border-t-transparent animate-spin" />
      </button>
    )
  }

  if (status === 'owned') {
    return (
      <button
        onClick={() => setShelf(null)}
        className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-semibold"
        style={{
          borderRadius: '10px',
          transition: 'background 220ms var(--ease-out-expo)',
          background: 'rgba(28,20,16,0.06)',
          color: 'var(--ink-3)',
          border: '1px solid rgba(28,20,16,0.12)',
        }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 7L5.5 10.5L12 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        On Your Shelf
      </button>
    )
  }

  if (status === 'sample') {
    return (
      <div className="w-full">
        <button
          onClick={() => setShelf(null)}
          className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-semibold"
          style={{
            borderRadius: '10px',
            transition: 'background 220ms var(--ease-out-expo)',
            background: 'rgba(28,20,16,0.06)',
            color: 'var(--ink-3)',
            border: '1px solid rgba(28,20,16,0.12)',
          }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 7L5.5 10.5L12 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Sample on Your Shelf
        </button>
        <button
          onClick={() => setShelf('owned')}
          className="w-full text-center mt-2 text-[11px] font-semibold tracking-[0.08em] uppercase text-stone-500">
          I own the full bottle
        </button>
      </div>
    )
  }

  return (
    <div className="flex gap-2 w-full">
      <button
        onClick={() => setShelf('owned')}
        className="flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold text-white"
        style={{
          borderRadius: '10px',
          transition: 'opacity 220ms var(--ease-out-expo)',
          background: 'var(--brand-dark)',
        }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 2V12M2 7H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        Add to Shelf
      </button>
      <button
        onClick={() => setShelf('sample')}
        className="px-4 py-3.5 text-sm font-semibold text-stone-600"
        style={{
          borderRadius: '10px',
          transition: 'background 220ms var(--ease-out-expo)',
          background: 'rgba(255,255,255,0.6)',
          border: '1px solid rgba(28,20,16,0.12)',
        }}>
        Sample
      </button>
    </div>
  )
}
