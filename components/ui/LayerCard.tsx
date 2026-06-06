'use client'
import Image from 'next/image'
import Link from 'next/link'
import type { Fragrance } from '@/lib/supabase/types'
import type { CompatibilityResult } from '@/lib/layering'
import { getScoreLabel } from '@/lib/layering'

interface LayerCardProps {
  fragranceA: Fragrance
  fragranceB: Fragrance
  compatibility?: CompatibilityResult
  comboId?: string
  comboName?: string | null
  rating?: number | null
  saveCount?: number
  isSaved?: boolean
  onSave?: () => void
  showSave?: boolean
  variant?: 'suggestion' | 'saved' | 'community'
}

export function LayerCard({
  fragranceA,
  fragranceB,
  compatibility,
  comboId,
  comboName,
  rating,
  saveCount,
  isSaved,
  onSave,
  showSave = false,
  variant = 'suggestion',
}: LayerCardProps) {
  const scoreInfo = compatibility ? getScoreLabel(compatibility.score) : null

  const CardContent = (
    <div
      className="relative overflow-hidden rounded-2xl p-5"
      style={{
        background: 'rgba(255,255,255,0.55)',
        border: '1px solid rgba(28,20,16,0.08)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 6px 20px rgba(0,0,0,0.05)',
      }}
    >
      {/* Bottles side by side */}
      <div className="flex items-end justify-center gap-2 mb-5" style={{ height: 140 }}>
        {/* Bottle A */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative w-[80px] h-[104px]">
            {fragranceA.bottle_image_url ? (
              <Image
                src={fragranceA.bottle_image_url}
                alt={fragranceA.name}
                fill
                className="object-contain"
                sizes="80px"
              />
            ) : (
              <div className="w-full h-full rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(28,20,16,0.05)' }}>
                <span className="font-serif text-xl text-stone-300">{fragranceA.house.charAt(0)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Plus indicator */}
        <div className="flex-shrink-0 mb-4">
          <div className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(28,20,16,0.07)' }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 2V10M2 6H10" stroke="rgba(28,20,16,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        {/* Bottle B */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative w-[80px] h-[104px]">
            {fragranceB.bottle_image_url ? (
              <Image
                src={fragranceB.bottle_image_url}
                alt={fragranceB.name}
                fill
                className="object-contain"
                sizes="80px"
              />
            ) : (
              <div className="w-full h-full rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(28,20,16,0.05)' }}>
                <span className="font-serif text-xl text-stone-300">{fragranceB.house.charAt(0)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Combo name or auto-generated */}
      <div className="mb-3">
        {comboName ? (
          <p className="font-serif text-[17px] text-stone-900 leading-snug">{comboName}</p>
        ) : (
          <p className="font-serif text-[15px] text-stone-700 leading-snug">
            {fragranceA.name.split(' ').slice(-1)[0]} + {fragranceB.name.split(' ').slice(-1)[0]}
          </p>
        )}
        <p className="text-[10px] text-stone-400 mt-0.5">
          {fragranceA.house} · {fragranceB.house}
        </p>
      </div>

      {/* Compatibility / score */}
      {scoreInfo && compatibility && (
        <div className="flex items-center gap-2 mb-3">
          <div className="h-1 flex-1 rounded-full" style={{ background: 'rgba(28,20,16,0.07)' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${compatibility.score}%`,
                background: scoreInfo.color,
                transition: 'width 600ms cubic-bezier(0.16,1,0.3,1)',
              }}
            />
          </div>
          <span className="text-[10px] font-semibold flex-shrink-0" style={{ color: scoreInfo.color }}>
            {scoreInfo.label}
          </span>
        </div>
      )}

      {/* Application order hint */}
      {compatibility && (
        <p className="text-[11px] text-stone-400 leading-relaxed mb-3">
          Apply{' '}
          <span className="text-stone-600 font-medium">
            {compatibility.applicationOrder[0] === fragranceA.id ? fragranceA.name : fragranceB.name}
          </span>{' '}
          first · {compatibility.reason}
        </p>
      )}

      {/* Rating dots */}
      {rating && (
        <div className="flex gap-1 mb-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full"
              style={{ background: i < rating ? 'var(--brand-dark)' : 'rgba(28,20,16,0.12)' }} />
          ))}
        </div>
      )}

      {/* Bottom row */}
      <div className="flex items-center justify-between pt-3"
        style={{ borderTop: '1px solid rgba(28,20,16,0.06)' }}>
        {comboId ? (
          <Link href={`/layers/${comboId}`}
            className="text-[11px] font-semibold tracking-[0.1em] uppercase text-stone-500">
            View combo →
          </Link>
        ) : (
          <Link href="/layers/create"
            className="text-[11px] font-semibold tracking-[0.1em] uppercase text-stone-500">
            Try this →
          </Link>
        )}

        {showSave && onSave && (
          <button
            onClick={e => { e.preventDefault(); onSave() }}
            className="flex items-center gap-1.5 text-[11px] font-semibold"
            style={{
              color: isSaved ? 'var(--brand-dark)' : 'rgba(28,20,16,0.35)',
              transition: 'color 200ms var(--ease-out-expo)',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill={isSaved ? 'currentColor' : 'none'}>
              <path d="M6.5 11.5L1.5 6.5C1.5 4.5 3 3 4.5 3C5.3 3 6 3.4 6.5 4C7 3.4 7.7 3 8.5 3C10 3 11.5 4.5 11.5 6.5L6.5 11.5Z"
                stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {saveCount ? saveCount : 'Save'}
          </button>
        )}
      </div>
    </div>
  )

  return CardContent
}
