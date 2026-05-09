'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export function DailyWearButton({
  fragranceId,
  userId,
  children,
}: {
  fragranceId: string
  userId: string
  children: React.ReactNode
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function logWear() {
    setLoading(true)
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('wears').upsert(
      { user_id: userId, fragrance_id: fragranceId, worn_at: today, is_public: true },
      { onConflict: 'user_id,worn_at' }
    )
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={logWear}
      disabled={loading}
      className="text-left disabled:opacity-50"
      style={{ transition: 'opacity 200ms cubic-bezier(0.16,1,0.3,1)' }}
    >
      {children}
    </button>
  )
}
