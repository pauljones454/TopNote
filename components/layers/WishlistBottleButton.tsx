'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  fragranceId: string
  owned: boolean
  initialWishlisted: boolean
}

/**
 * Per-bottle ownership affordance for the combo detail page.
 * Owned → quiet "On your shelf" chip. Missing → add-to-wishlist action
 * that reuses the collection table (status 'wishlist').
 */
export function WishlistBottleButton({ fragranceId, owned, initialWishlisted }: Props) {
  const supabase = createClient()
  const [wishlisted, setWishlisted] = useState(initialWishlisted)
  const [busy, setBusy] = useState(false)

  if (owned) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-stone-500">
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
          <path d="M2.5 6.2L4.8 8.5L9.5 3.5" stroke="rgba(58,46,40,0.55)" strokeWidth="1.4"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        On your shelf
      </span>
    )
  }

  if (wishlisted) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-stone-400">
        <svg width="11" height="11" viewBox="0 0 13 13" fill="currentColor">
          <path d="M6.5 11L1.8 6.3C1.8 4.5 3.1 3.1 4.5 3.1C5.3 3.1 6 3.5 6.5 4.1C7 3.5 7.7 3.1 8.5 3.1C9.9 3.1 11.2 4.5 11.2 6.3L6.5 11Z" />
        </svg>
        Wishlisted
      </span>
    )
  }

  async function add() {
    if (busy) return
    setBusy(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/auth'; return }

    setWishlisted(true)
    const { error } = await supabase
      .from('collection')
      .insert({ user_id: user.id, fragrance_id: fragranceId, status: 'wishlist' })
    if (error) setWishlisted(false)
    setBusy(false)
  }

  return (
    <button
      onClick={add}
      disabled={busy}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-stone-600 disabled:opacity-50"
      style={{
        background: 'rgba(255,255,255,0.6)',
        border: '1px solid rgba(28,20,16,0.10)',
        transition: 'background 200ms var(--ease-out-expo)',
      }}
    >
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
        <path d="M6 2.2V9.8M2.2 6H9.8" stroke="rgba(58,46,40,0.7)" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      Add to wishlist
    </button>
  )
}

