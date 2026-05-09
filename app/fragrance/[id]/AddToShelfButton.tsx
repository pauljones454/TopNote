'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function AddToShelfButton({ fragranceId, fragranceName }: { fragranceId: string; fragranceName: string }) {
  const [owned, setOwned]     = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data } = await supabase.from('collection')
        .select('id').eq('user_id', user.id).eq('fragrance_id', fragranceId).eq('status', 'owned').maybeSingle()
      setOwned(!!data)
      setLoading(false)
    }
    check()
  }, [fragranceId])

  async function toggle() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/auth'; return }
    setLoading(true)
    if (owned) {
      await supabase.from('collection').delete()
        .eq('user_id', user.id).eq('fragrance_id', fragranceId).eq('status', 'owned')
      setOwned(false)
    } else {
      await supabase.from('collection').insert({ user_id: user.id, fragrance_id: fragranceId, status: 'owned' })
      setOwned(true)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-semibold disabled:opacity-40"
      style={{
        borderRadius: '10px',
        transition: 'background 220ms var(--ease-out-expo), color 220ms var(--ease-out-expo)',
        background: owned ? 'rgba(28,20,16,0.06)' : 'var(--brand-dark)',
        color: owned ? 'var(--ink-3)' : '#fff',
        border: owned ? '1px solid rgba(28,20,16,0.12)' : 'none',
      }}>
      {loading ? (
        <span className="w-4 h-4 rounded-full border border-current border-t-transparent animate-spin" />
      ) : owned ? (
        <>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 7L5.5 10.5L12 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          On Your Shelf
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2V12M2 7H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Add to Shelf
        </>
      )}
    </button>
  )
}
