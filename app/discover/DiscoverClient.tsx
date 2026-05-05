'use client'
import { useState, useMemo } from 'react'
import { Search, X } from 'lucide-react'
import { FragranceCard } from '@/components/ui/FragranceCard'
import type { Fragrance } from '@/lib/supabase/types'

const CATS = [
  { value: 'all', label: 'All' },
  { value: 'designer', label: 'Designer' },
  { value: 'niche', label: 'Niche' },
  { value: 'ultra-niche', label: 'Ultra Niche' },
  { value: 'middle-eastern', label: 'Middle Eastern' },
]

export function DiscoverClient({ fragrances, initialSearch, initialCat }: {
  fragrances: Fragrance[]
  initialSearch: string
  initialCat: string
}) {
  const [q, setQ] = useState(initialSearch)
  const [cat, setCat] = useState(initialCat)

  const filtered = useMemo(() => {
    return fragrances.filter(f => {
      // Category filter
      if (cat !== 'all') {
        if (cat === 'niche' && !['niche','ultra-niche'].includes(f.category)) return false
        if (cat !== 'niche' && f.category !== cat) return false
      }
      // Text search
      if (q) {
        const search = q.toLowerCase()
        const hay = [f.name, f.house, f.type, f.category,
          ...f.top_notes, ...f.heart_notes, ...f.base_notes
        ].join(' ').toLowerCase()
        return hay.includes(search)
      }
      return true
    })
  }, [fragrances, q, cat])

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Search bar */}
      <div className="sticky top-0 z-30 bg-[#F7F3EE]/95 backdrop-blur px-5 md:px-10 pt-5 pb-3 border-b border-stone-100">
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search fragrances, houses, notes…"
            className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-stone-200 bg-white text-sm text-stone-900 outline-none focus:border-stone-400 placeholder:text-stone-400"
          />
          {q && (
            <button onClick={() => setQ('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700">
              <X size={16} />
            </button>
          )}
        </div>
        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATS.map(c => (
            <button
              key={c.value}
              onClick={() => setCat(c.value)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                cat === c.value
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <div className="px-5 md:px-10 py-3 text-xs text-stone-400 font-medium">
        {q ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''} for "${q}"` : `${filtered.length} fragrances`}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center px-10">
          <p className="text-4xl mb-4">🔍</p>
          <p className="font-serif text-xl text-stone-700 mb-2">No results for &ldquo;{q}&rdquo;</p>
          <p className="text-sm text-stone-400">Try a note name, house, or scent family</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 px-3 md:px-8">
          {filtered.map(f => <FragranceCard key={f.id} fragrance={f} />)}
        </div>
      )}
    </div>
  )
}
