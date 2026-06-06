'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppShell } from '@/components/layout/AppShell'
import { LayerCard } from '@/components/ui/LayerCard'
import { getCompatibilityScore } from '@/lib/layering'
import Image from 'next/image'
import Link from 'next/link'
import type { Fragrance } from '@/lib/supabase/types'

type Step = 'pick-a' | 'pick-b' | 'details' | 'done'

export default function CreateComboPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep]               = useState<Step>('pick-a')
  const [shelf, setShelf]             = useState<Fragrance[]>([])
  const [fragranceA, setFragranceA]   = useState<Fragrance | null>(null)
  const [fragranceB, setFragranceB]   = useState<Fragrance | null>(null)
  const [name, setName]               = useState('')
  const [instructions, setInstructions] = useState('')
  const [rating, setRating]           = useState(0)
  const [isPublic, setIsPublic]       = useState(true)
  const [saving, setSaving]           = useState(false)

  useEffect(() => {
    async function loadShelf() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      const { data } = await supabase
        .from('collection')
        .select('*, fragrance:fragrances(*)')
        .eq('user_id', user.id)
        .in('status', ['owned', 'sample'])
        .order('created_at', { ascending: false })
      setShelf((data ?? []).map((d: any) => d.fragrance).filter(Boolean))
    }
    loadShelf()
  }, [])

  const compatibility = fragranceA && fragranceB
    ? getCompatibilityScore(fragranceA, fragranceB)
    : null

  async function save() {
    if (!fragranceA || !fragranceB) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }

    const appOrder = compatibility?.applicationOrder ?? [fragranceA.id, fragranceB.id]

    await supabase.from('combos').insert({
      user_id: user.id,
      fragrance_ids: [fragranceA.id, fragranceB.id],
      application_order: appOrder,
      name: name || null,
      instructions: instructions || null,
      rating: rating || null,
      is_public: isPublic,
      occasions: [],
    })

    setSaving(false)
    setStep('done')
  }

  const availableForB = shelf.filter(f => f.id !== fragranceA?.id)

  return (
    <AppShell>
      <div className="max-w-[700px] mx-auto px-5 md:px-10 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/layers"
            className="text-[11px] font-semibold tracking-[0.1em] uppercase text-stone-400">
            ← Layers
          </Link>
        </div>
        <h1 className="font-serif text-3xl text-stone-900 tracking-tight mb-8">New Combo</h1>

        {/* ── Step: pick-a ── */}
        {step === 'pick-a' && (
          <div>
            <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-stone-400 mb-4">
              Step 1 — First bottle
            </p>
            <p className="text-[14px] text-stone-500 mb-6">
              Pick the fragrance you apply first — usually the heavier, base-forward one.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {shelf.map(f => (
                <button key={f.id} onClick={() => { setFragranceA(f); setStep('pick-b') }}
                  className="text-left p-3 rounded-xl group"
                  style={{
                    border: '1px solid rgba(28,20,16,0.08)',
                    background: 'rgba(255,255,255,0.5)',
                    transition: 'box-shadow 200ms var(--ease-out-expo)',
                  }}>
                  <div className="relative w-full aspect-[3/4] mb-2">
                    {f.bottle_image_url ? (
                      <Image src={f.bottle_image_url} alt={f.name} fill className="object-contain" sizes="120px" />
                    ) : (
                      <div className="w-full h-full rounded-lg flex items-center justify-center"
                        style={{ background: 'rgba(28,20,16,0.05)' }}>
                        <span className="font-serif text-xl text-stone-300">{f.house.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[9px] font-semibold tracking-widest uppercase text-stone-400 truncate">{f.house}</p>
                  <p className="font-serif text-[12px] text-stone-800 leading-tight line-clamp-2">{f.name}</p>
                </button>
              ))}
            </div>
            {shelf.length === 0 && (
              <div className="text-center py-12">
                <p className="text-stone-400 text-[14px] mb-4">Your shelf is empty.</p>
                <Link href="/discover" className="text-[12px] font-semibold tracking-widest uppercase text-stone-600 border-b border-stone-300 pb-px">
                  Add fragrances →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ── Step: pick-b ── */}
        {step === 'pick-b' && fragranceA && (
          <div>
            <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-stone-400 mb-4">
              Step 2 — Second bottle
            </p>
            {/* Selected A preview */}
            <div className="flex items-center gap-3 p-3 rounded-xl mb-6"
              style={{ background: 'rgba(28,20,16,0.04)', border: '1px solid rgba(28,20,16,0.07)' }}>
              <div className="relative w-10 h-12 flex-shrink-0">
                {fragranceA.bottle_image_url ? (
                  <Image src={fragranceA.bottle_image_url} alt={fragranceA.name} fill className="object-contain" sizes="40px" />
                ) : (
                  <div className="w-full h-full rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(28,20,16,0.05)' }}>
                    <span className="font-serif text-sm text-stone-400">{fragranceA.house.charAt(0)}</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] uppercase tracking-widest text-stone-400">{fragranceA.house}</p>
                <p className="font-serif text-[13px] text-stone-800 truncate">{fragranceA.name}</p>
              </div>
              <button onClick={() => { setFragranceA(null); setStep('pick-a') }}
                className="text-[10px] text-stone-400 font-medium">Change</button>
            </div>
            <p className="text-[14px] text-stone-500 mb-5">Now pick the second fragrance.</p>
            <div className="grid grid-cols-3 gap-3">
              {availableForB.map(f => (
                <button key={f.id} onClick={() => { setFragranceB(f); setStep('details') }}
                  className="text-left p-3 rounded-xl"
                  style={{ border: '1px solid rgba(28,20,16,0.08)', background: 'rgba(255,255,255,0.5)' }}>
                  <div className="relative w-full aspect-[3/4] mb-2">
                    {f.bottle_image_url ? (
                      <Image src={f.bottle_image_url} alt={f.name} fill className="object-contain" sizes="120px" />
                    ) : (
                      <div className="w-full h-full rounded-lg flex items-center justify-center"
                        style={{ background: 'rgba(28,20,16,0.05)' }}>
                        <span className="font-serif text-xl text-stone-300">{f.house.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[9px] font-semibold tracking-widest uppercase text-stone-400 truncate">{f.house}</p>
                  <p className="font-serif text-[12px] text-stone-800 leading-tight line-clamp-2">{f.name}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step: details ── */}
        {step === 'details' && fragranceA && fragranceB && compatibility && (
          <div>
            <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-stone-400 mb-6">
              Step 3 — Name & rate
            </p>

            {/* Preview card */}
            <div className="mb-8">
              <LayerCard
                fragranceA={fragranceA}
                fragranceB={fragranceB}
                compatibility={compatibility}
              />
            </div>

            {/* Name */}
            <div className="mb-5">
              <label className="text-[10px] font-semibold tracking-[0.18em] uppercase text-stone-400 block mb-2">
                Combo name <span className="text-stone-300 normal-case tracking-normal font-normal">optional</span>
              </label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={`${fragranceA.name.split(' ').slice(-1)[0]} + ${fragranceB.name.split(' ').slice(-1)[0]}`}
                className="w-full px-4 py-3 text-[14px] text-stone-900 outline-none"
                style={{
                  background: 'rgba(255,255,255,0.7)',
                  border: '1px solid rgba(28,20,16,0.10)',
                  borderRadius: '10px',
                }}
              />
            </div>

            {/* Instructions */}
            <div className="mb-5">
              <label className="text-[10px] font-semibold tracking-[0.18em] uppercase text-stone-400 block mb-2">
                Application notes <span className="text-stone-300 normal-case tracking-normal font-normal">optional</span>
              </label>
              <textarea
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
                placeholder="e.g. Apply Sauvage to chest, wait 30s, then spray Baccarat Rouge on wrists."
                rows={3}
                className="w-full px-4 py-3 text-[14px] text-stone-900 outline-none resize-none"
                style={{
                  background: 'rgba(255,255,255,0.7)',
                  border: '1px solid rgba(28,20,16,0.10)',
                  borderRadius: '10px',
                }}
              />
            </div>

            {/* Rating */}
            <div className="mb-5">
              <label className="text-[10px] font-semibold tracking-[0.18em] uppercase text-stone-400 block mb-3">
                Your rating
              </label>
              <div className="flex gap-2">
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setRating(n)}
                    className="w-10 h-10 rounded-full text-[13px] font-semibold"
                    style={{
                      background: rating >= n ? 'var(--brand-dark)' : 'rgba(28,20,16,0.06)',
                      color: rating >= n ? '#fff' : 'rgba(28,20,16,0.4)',
                      transition: 'background 180ms var(--ease-out-expo)',
                    }}>
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Public toggle */}
            <div className="flex items-center justify-between py-4 mb-6"
              style={{ borderTop: '1px solid rgba(28,20,16,0.07)', borderBottom: '1px solid rgba(28,20,16,0.07)' }}>
              <div>
                <p className="text-[13px] font-medium text-stone-800">Share with community</p>
                <p className="text-[11px] text-stone-400">Others can discover and save this combo</p>
              </div>
              <button onClick={() => setIsPublic(!isPublic)}
                className="w-11 h-6 rounded-full relative flex-shrink-0"
                style={{
                  background: isPublic ? 'var(--brand-dark)' : 'rgba(28,20,16,0.15)',
                  transition: 'background 200ms var(--ease-out-expo)',
                }}>
                <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full"
                  style={{
                    left: isPublic ? 'calc(100% - 22px)' : '2px',
                    transition: 'left 200ms var(--ease-out-expo)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                  }} />
              </button>
            </div>

            {/* Save button */}
            <button onClick={save} disabled={saving}
              className="w-full py-4 text-[14px] font-semibold text-white"
              style={{
                background: 'var(--brand-dark)',
                borderRadius: '12px',
                opacity: saving ? 0.6 : 1,
                transition: 'opacity 200ms var(--ease-out-expo)',
              }}>
              {saving ? 'Saving…' : 'Save combo'}
            </button>
          </div>
        )}

        {/* ── Step: done ── */}
        {step === 'done' && fragranceA && fragranceB && (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: 'var(--brand-dark)' }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 10L8 14L16 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="font-serif text-2xl text-stone-900 mb-2">Combo saved</h2>
            <p className="text-[14px] text-stone-400 mb-8">
              {fragranceA.name} + {fragranceB.name}
            </p>
            <div className="flex flex-col gap-3">
              <Link href="/layers"
                className="block py-3 text-[13px] font-semibold text-white text-center"
                style={{ background: 'var(--brand-dark)', borderRadius: '10px' }}>
                Back to Layers
              </Link>
              <button onClick={() => { setStep('pick-a'); setFragranceA(null); setFragranceB(null); setName(''); setRating(0); setInstructions('') }}
                className="py-3 text-[13px] font-semibold text-stone-600 text-center"
                style={{ border: '1px solid rgba(28,20,16,0.12)', borderRadius: '10px' }}>
                Create another
              </button>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  )
}
