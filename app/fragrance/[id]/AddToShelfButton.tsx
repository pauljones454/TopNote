'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Check } from 'lucide-react'

export function AddToShelfButton({ fragranceId, fragranceName }: { fragranceId: string; fragranceName: string }) {
  const [owned, setOwned] = useState(false)
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
      className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
        owned
          ? 'bg-green-50 text-green-700 border border-green-200'
          : 'bg-stone-900 text-white hover:bg-stone-800'
      }`}
    >
      {owned ? <Check size={16} /> : <Plus size={16} />}
      {owned ? 'On Your Shelf' : 'Add to Shelf'}
    </button>
  )
}
