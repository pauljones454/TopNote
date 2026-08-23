'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { FragranceCard } from '@/components/ui/FragranceCard'
import { CATEGORY_FILTERS, type CategoryFilterValue } from '@/lib/fragrances/categories'
import { SCENT_FAMILIES, type ScentFamily } from '@/lib/fragrances/scent-families'
import type { FragranceSearchResult } from '@/lib/fragrances/search'
import type { Fragrance } from '@/lib/supabase/types'

/** Long enough to absorb a fast typist, short enough to feel immediate. */
const SEARCH_DEBOUNCE_MS = 250

type LoadState = 'idle' | 'searching' | 'loading-more' | 'error'

type Filters = {
  q: string
  category: CategoryFilterValue
  family: ScentFamily | null
}

function buildQueryString(filters: Filters, offset: number): string {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.category !== 'all') params.set('cat', filters.category)
  if (filters.family) params.set('family', filters.family)
  if (offset > 0) params.set('offset', String(offset))
  return params.toString()
}

/** Identity of a result set, so an unchanged filter never refetches. */
function filterKey(filters: Filters): string {
  return buildQueryString(filters, 0)
}

async function fetchPage(
  filters: Filters,
  offset: number,
  signal: AbortSignal
): Promise<FragranceSearchResult> {
  const response = await fetch(`/api/discover?${buildQueryString(filters, offset)}`, { signal })
  if (!response.ok) {
    throw new Error(`Discover search failed with status ${response.status}`)
  }
  return (await response.json()) as FragranceSearchResult
}

export function DiscoverClient({
  initialFragrances,
  initialTotal,
  initialFailed,
  initialSearch,
  initialCategory,
  initialFamily,
}: {
  initialFragrances: Fragrance[]
  initialTotal: number
  initialFailed: boolean
  initialSearch: string
  initialCategory: CategoryFilterValue
  initialFamily: ScentFamily | null
}) {
  const router = useRouter()

  const [filters, setFilters] = useState<Filters>({
    q: initialSearch,
    category: initialCategory,
    family: initialFamily,
  })
  const [fragrances, setFragrances] = useState(initialFragrances)
  const [total, setTotal] = useState(initialTotal)
  const [state, setState] = useState<LoadState>(initialFailed ? 'error' : 'idle')

  /** The filter set currently rendered — guards against refetching it. */
  const loadedKey = useRef(initialFailed ? null : filterKey(filters))

  const runSearch = useCallback(
    async (next: Filters, signal: AbortSignal) => {
      setState('searching')
      try {
        const page = await fetchPage(next, 0, signal)
        if (signal.aborted) return
        setFragrances(page.fragrances)
        setTotal(page.total)
        loadedKey.current = filterKey(next)
        setState('idle')
      } catch (error) {
        if (signal.aborted) return
        console.error('[discover] search failed', error)
        setState('error')
      }
    },
    []
  )

  // Debounced search whenever the filters diverge from what is on screen.
  // The in-flight request is aborted on every change, so a slow early response
  // can never overwrite a later one.
  useEffect(() => {
    if (filterKey(filters) === loadedKey.current) return

    const controller = new AbortController()
    const timer = setTimeout(() => {
      const queryString = buildQueryString(filters, 0)
      router.replace(queryString ? `/discover?${queryString}` : '/discover', { scroll: false })
      void runSearch(filters, controller.signal)
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [filters, router, runSearch])

  const loadMore = useCallback(async () => {
    if (state === 'searching' || state === 'loading-more') return

    const controller = new AbortController()
    setState('loading-more')
    try {
      const page = await fetchPage(filters, fragrances.length, controller.signal)
      setFragrances(previous => [...previous, ...page.fragrances])
      setTotal(page.total)
      setState('idle')
    } catch (error) {
      console.error('[discover] load more failed', error)
      setState('error')
    }
  }, [filters, fragrances.length, state])

  const retry = useCallback(() => {
    const controller = new AbortController()
    void runSearch(filters, controller.signal)
  }, [filters, runSearch])

  const isSearching = state === 'searching'
  const hasMore = fragrances.length < total
  const showEmpty = state !== 'error' && !isSearching && fragrances.length === 0

  return (
    <div className="max-w-[1400px] mx-auto">

      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-30 bg-[#F7F3EE]/95 backdrop-blur-md px-5 md:px-10 pt-6 pb-4"
        style={{ borderBottom: '1px solid rgba(28,20,16,0.07)' }}>

        {/* Title row */}
        <div className="flex items-baseline justify-between mb-4">
          <h1 className="font-serif text-3xl text-stone-900 tracking-tight">Discover</h1>
          <span className="text-[11px] text-stone-400" aria-live="polite">
            {state === 'error'
              ? '—'
              : `${total.toLocaleString()} ${total === 1 ? 'fragrance' : 'fragrances'}`}
          </span>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" strokeWidth={1.5} />
          <input
            value={filters.q}
            onChange={e => setFilters(current => ({ ...current, q: e.target.value }))}
            placeholder="Search by name, house, or note…"
            className="w-full pl-10 pr-10 py-3 text-[13px] text-stone-900 placeholder:text-stone-400 outline-none"
            style={{
              background: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(28,20,16,0.10)',
              borderRadius: '10px',
            }}
          />
          {filters.q && (
            <button onClick={() => setFilters(current => ({ ...current, q: '' }))}
              aria-label="Clear search"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400"
              style={{ transition: 'color 150ms var(--ease-out-expo)' }}>
              <X size={14} strokeWidth={1.5} />
            </button>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {CATEGORY_FILTERS.map(c => (
            <button
              key={c.value}
              onClick={() => setFilters(current => ({ ...current, category: c.value }))}
              className="flex-shrink-0 px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.06em]"
              style={{
                borderRadius: '6px',
                transition: 'background 180ms var(--ease-out-expo), color 180ms var(--ease-out-expo)',
                background: filters.category === c.value ? 'var(--brand-dark)' : 'rgba(28,20,16,0.05)',
                color: filters.category === c.value ? '#fff' : 'var(--ink-3)',
              }}>
              {c.label}
            </button>
          ))}
        </div>

        {/* Scent family filter — driven by the canonical vocabulary, not by whatever
            distinct values happen to be stored in the column. */}
        <div className="flex gap-1.5 overflow-x-auto pt-2 pb-0.5">
          {[null, ...SCENT_FAMILIES].map(family => {
            const isActive = filters.family === family
            return (
              <button
                key={family ?? 'all-families'}
                onClick={() => setFilters(current => ({ ...current, family }))}
                className="flex-shrink-0 px-3 py-1 text-[11px] tracking-[0.02em]"
                style={{
                  borderRadius: '999px',
                  transition: 'background 180ms var(--ease-out-expo), color 180ms var(--ease-out-expo), border-color 180ms var(--ease-out-expo)',
                  border: `1px solid ${isActive ? 'rgba(28,20,16,0.28)' : 'rgba(28,20,16,0.10)'}`,
                  background: isActive ? 'rgba(28,20,16,0.06)' : 'transparent',
                  color: isActive ? 'var(--ink-1)' : 'var(--ink-3)',
                }}>
                {family ?? 'All families'}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Results ── */}
      {state === 'error' ? (
        <div className="flex flex-col items-center justify-center py-24 text-center px-10">
          <p className="font-serif text-2xl text-stone-400 mb-2">Something went wrong</p>
          <p className="text-sm text-stone-400 mb-5">The catalog could not be reached.</p>
          <button
            onClick={retry}
            className="px-5 py-2 text-[11px] font-semibold tracking-[0.06em] text-white"
            style={{ background: 'var(--brand-dark)', borderRadius: '6px' }}>
            Try again
          </button>
        </div>
      ) : showEmpty ? (
        <div className="flex flex-col items-center justify-center py-24 text-center px-10">
          <p className="font-serif text-2xl text-stone-400 mb-2">Nothing found</p>
          <p className="text-sm text-stone-400">Try searching a note, house, or scent family</p>
        </div>
      ) : (
        <>
          <div
            aria-busy={isSearching}
            className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 px-3 md:px-7"
            style={{
              opacity: isSearching ? 0.45 : 1,
              transition: 'opacity 240ms var(--ease-out-expo)',
            }}>
            {fragrances.map(f => <FragranceCard key={f.id} fragrance={f} />)}
          </div>

          {hasMore && (
            <div className="flex justify-center py-12">
              <button
                onClick={loadMore}
                disabled={state === 'loading-more' || isSearching}
                className="px-6 py-2.5 text-[11px] font-semibold tracking-[0.08em] uppercase disabled:opacity-50"
                style={{
                  border: '1px solid rgba(28,20,16,0.14)',
                  borderRadius: '999px',
                  color: 'var(--ink-2)',
                  transition: 'background 200ms var(--ease-out-expo), border-color 200ms var(--ease-out-expo)',
                }}>
                {state === 'loading-more' ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
