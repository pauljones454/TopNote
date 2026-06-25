'use client'
import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LayerCard } from '@/components/ui/LayerCard'
import type { Fragrance } from '@/lib/supabase/types'

export type CommunityCombo = {
  id: string
  name: string | null
  rating: number | null
  saveCount: number
  fragranceA: Fragrance
  fragranceB: Fragrance
}

interface Props {
  combos: CommunityCombo[]
  initialSavedComboIds: string[]
  ownedFragranceIds: string[]
  initialWishlistedFragranceIds: string[]
}

export function CommunityComboList({
  combos,
  initialSavedComboIds,
  ownedFragranceIds,
  initialWishlistedFragranceIds,
}: Props) {
  const supabase = createClient()
  const ownedSet = new Set(ownedFragranceIds)

  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set(initialSavedComboIds))
  const [saveCounts, setSaveCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(combos.map(c => [c.id, c.saveCount]))
  )
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(
    () => new Set(initialWishlistedFragranceIds)
  )
  const [toast, setToast] = useState<string | null>(null)

  const flash = useCallback((msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 2600)
  }, [])

  const toggleSave = useCallback(async (comboId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/auth'; return }

    const wasSaved = savedIds.has(comboId)

    // Optimistic toggle — trigger keeps combos.save_count authoritative server-side.
    setSavedIds(prev => {
      const next = new Set(prev)
      if (wasSaved) next.delete(comboId); else next.add(comboId)
      return next
    })
    setSaveCounts(prev => ({
      ...prev,
      [comboId]: Math.max(0, (prev[comboId] ?? 0) + (wasSaved ? -1 : 1)),
    }))

    const { error } = wasSaved
      ? await supabase.from('combo_saves').delete().eq('user_id', user.id).eq('combo_id', comboId)
      : await supabase.from('combo_saves').insert({ user_id: user.id, combo_id: comboId })

    if (error) {
      // Revert on failure — never leave the UI lying about state.
      setSavedIds(prev => {
        const next = new Set(prev)
        if (wasSaved) next.add(comboId); else next.delete(comboId)
        return next
      })
      setSaveCounts(prev => ({
        ...prev,
        [comboId]: Math.max(0, (prev[comboId] ?? 0) + (wasSaved ? 1 : -1)),
      }))
      flash(wasSaved ? 'Could not unsave that combo.' : 'Could not save that combo.')
    }
  }, [supabase, savedIds, flash])

  const addToWishlist = useCallback(async (fragranceId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/auth'; return }

    setWishlistedIds(prev => new Set(prev).add(fragranceId))

    const { error } = await supabase
      .from('collection')
      .insert({ user_id: user.id, fragrance_id: fragranceId, status: 'wishlist' })

    if (error) {
      setWishlistedIds(prev => {
        const next = new Set(prev)
        next.delete(fragranceId)
        return next
      })
      flash('Could not add to your wishlist.')
    }
  }, [supabase, flash])

  const bottleState = (frag: Fragrance) =>
    ownedSet.has(frag.id)
      ? { owned: true, wishlisted: false }
      : { owned: false, wishlisted: wishlistedIds.has(frag.id) }

  return (
    <div className="space-y-4">
      {combos.map(combo => (
        <LayerCard
          key={combo.id}
          fragranceA={combo.fragranceA}
          fragranceB={combo.fragranceB}
          comboId={combo.id}
          comboName={combo.name}
          rating={combo.rating}
          saveCount={saveCounts[combo.id]}
          isSaved={savedIds.has(combo.id)}
          onSave={() => toggleSave(combo.id)}
          showSave
          variant="community"
          ownership={{ a: bottleState(combo.fragranceA), b: bottleState(combo.fragranceB) }}
          onAddToWishlist={addToWishlist}
        />
      ))}

      {toast && (
        <div
          className="fixed left-1/2 -translate-x-1/2 bottom-24 z-50 px-4 py-2.5 rounded-xl text-[12px] font-medium text-white"
          style={{
            background: 'var(--brand-dark)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}

