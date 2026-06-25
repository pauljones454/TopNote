'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  comboId: string
  initialSaved: boolean
  initialSaveCount: number
}

/**
 * Toggles a combo_saves row for the signed-in user. Optimistic; the DB
 * trigger keeps combos.save_count authoritative. Reverts on error so the
 * button never lies about state, and a brief migration lag is a no-op toast.
 */
export function SaveComboButton({ comboId, initialSaved, initialSaveCount }: Props) {
  const supabase = createClient()
  const [saved, setSaved] = useState(initialSaved)
  const [count, setCount] = useState(initialSaveCount)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function toggle() {
    if (busy) return
    setBusy(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/auth'; return }

    const wasSaved = saved
    setSaved(!wasSaved)
    setCount(c => Math.max(0, c + (wasSaved ? -1 : 1)))

    const { error: dbError } = wasSaved
      ? await supabase.from('combo_saves').delete().eq('user_id', user.id).eq('combo_id', comboId)
      : await supabase.from('combo_saves').insert({ user_id: user.id, combo_id: comboId })

    if (dbError) {
      setSaved(wasSaved)
      setCount(c => Math.max(0, c + (wasSaved ? 1 : -1)))
      setError(wasSaved ? 'Could not unsave — try again.' : 'Could not save — try again.')
    }
    setBusy(false)
  }

  return (
    <div>
      <button
        onClick={toggle}
        disabled={busy}
        className="w-full flex items-center justify-center gap-2 py-4 text-[14px] font-semibold disabled:opacity-50"
        style={{
          borderRadius: '12px',
          background: saved ? 'rgba(28,20,16,0.06)' : 'var(--brand-dark)',
          color: saved ? 'var(--brand-dark)' : '#fff',
          border: saved ? '1px solid rgba(28,20,16,0.12)' : 'none',
          transition: 'background 220ms var(--ease-out-expo), color 220ms var(--ease-out-expo)',
        }}
      >
        <svg width="15" height="15" viewBox="0 0 13 13" fill={saved ? 'currentColor' : 'none'}>
          <path d="M6.5 11.5L1.5 6.5C1.5 4.5 3 3 4.5 3C5.3 3 6 3.4 6.5 4C7 3.4 7.7 3 8.5 3C10 3 11.5 4.5 11.5 6.5L6.5 11.5Z"
            stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {saved ? 'Saved' : 'Save combo'}
        {count > 0 && (
          <span className="text-[12px] font-medium" style={{ opacity: 0.7 }}>· {count}</span>
        )}
      </button>
      {error && (
        <p className="text-[11px] text-stone-400 text-center mt-2">{error}</p>
      )}
    </div>
  )
}

