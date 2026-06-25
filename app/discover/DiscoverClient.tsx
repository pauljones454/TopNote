'use client'
import { useState, useMemo } from 'react'
import { Search, X } from 'lucide-react'
import { FragranceCard } from '@/components/ui/FragranceCard'
import type { Fragrance } from '@/lib/supabase/types'

const CATS = [
  { value: 'all',            label: 'All' },
  { value: 'designer',       label: 'Designer' },
  { value: 'niche',          label: 'Niche' },
  { value: 'ultra-niche',    label: 'Ultra Niche' },
  { value: 'middle-eastern', label: 'Middle Eastern' },
]

export function DiscoverClient({ fragrances, initialSearch, initialCat }: {
  fragrances: Fragrance[]
  initialSearch: string
  initialCat: string
}) {
  const [q, setQ]     = useState(initialSearch)
  const [cat, setCat] = useState(initialCat)

  const filtered = useMemo(() => {
    // Filter: for ≤2-char queries, restrict to name + house only — prevents
    // note fragments (e.g. "ch" in "birch" / "patchouli") from matching ahead
    // of brand-name results like Chanel.
    const matches = fragrances.filter(f => {
      if (cat !== 'all') {
        if (cat === 'niche' && !['niche', 'ultra-niche'].includes(f.category)) return false
        if (cat !== 'niche' && f.category !== cat) return false
      }
      if (q) {
        const search = q.toLowerCase()
        const hay = q.length <= 2
          ? [f.name, f.house].join(' ').toLowerCase()
          : [f.name, f.house, f.type, f.category,
             ...f.top_notes, ...f.heart_notes, ...f.base_notes,
            ].join(' ').toLowerCase()
        return hay.includes(search)
      }
      return true
    })

    // Two-tier sort: name/house matches rank above note-only matches.
    // Within each tier, the server's avg_rating DESC order is preserved.
    if (!q) return matches
    const search = q.toLowerCase()
    return [...matches].sort((a, b) => {
      const aNameMatch = `${a.name} ${a.house}`.toLowerCase().includes(search)
      const bNameMatch = `${b.name} ${b.house}`.toLowerCase().includes(search)
      if (aNameMatch && !bNameMatch) return -1
      if (!aNameMatch && bNameMatch) return 1
      return 0
    })
  }, [fragrances, q, cat])

  return (
    <div className="max-w-[1400px] mx-auto">

      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-30 bg-[#F7F3EE]/95 backdrop-blur-md px-5 md:px-10 pt-6 pb-4"
        style={{ borderBottom: '1px solid rgba(28,20,16,0.07)' }}>

        {/* Title row */}
        <div className="flex items-baseline justify-between mb-4">
          <h1 className="font-serif text-3xl text-stone-900 tracking-tight">Discover</h1>
          <span className="text-[11px] text-stone-400">
            {filtered.length} {filtered.length === 1 ? 'fragrance' : 'fragrances'}
          </span>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" strokeWidth={1.5} />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search by name, house, or note…"
            className="w-full pl-10 pr-10 py-3 text-[13px] text-stone-900 placeholder:text-stone-400 outline-none"
            style={{
              background: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(28,20,16,0.10)',
              borderRadius: '10px',
            }}
          />
          {q && (
            <button onClick={() => setQ('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400"
              style={{ transition: 'color 150ms var(--ease-out-expo)' }}>
              <X size={14} strokeWidth={1.5} />
            </button>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {CATS.map(c => (
            <button
              key={c.value}
              onClick={() => setCat(c.value)}
              className="flex-shrink-0 px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.06em]"
              style={{
                borderRadius: '6px',
                transition: 'background 180ms var(--ease-out-expo), color 180ms var(--ease-out-expo)',
                background: cat === c.value ? 'var(--brand-dark)' : 'rgba(28,20,16,0.05)',
                color: cat === c.value ? '#fff' : 'var(--ink-3)',
              }}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grid ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center px-10">
          <p className="font-serif text-2xl text-stone-400 mb-2">Nothing found</p>
          <p className="text-sm text-stone-400">Try searching a note, house, or scent family</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 px-3 md:px-7">
          {filtered.map(f => <FragranceCard key={f.id} fragrance={f} />)}
        </div>
      )}
    </div>
  )
}
