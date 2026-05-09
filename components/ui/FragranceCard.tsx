'use client'
import Image from 'next/image'
import Link from 'next/link'
import { getCategoryPill } from '@/lib/utils'
import type { Fragrance } from '@/lib/supabase/types'

export function FragranceCard({ fragrance }: { fragrance: Fragrance }) {
  const pill = getCategoryPill(fragrance.category)

  return (
    <Link href={`/fragrance/${fragrance.id}`} className="group block p-2">
      {/* Bottle */}
      <div className="w-full aspect-[3/4] relative mb-3 overflow-hidden"
        style={{ transition: 'transform 300ms var(--ease-out-expo)' }}>
        {fragrance.bottle_image_url ? (
          <Image
            src={fragrance.bottle_image_url}
            alt={fragrance.name}
            fill
            className="object-contain object-bottom"
            style={{ transition: 'transform 400ms var(--ease-out-expo)' }}
            sizes="(max-width: 768px) 33vw, 20vw"
          />
        ) : (
          <div className="w-3/4 h-4/5 mx-auto bg-stone-100/80 rounded-2xl flex items-center justify-center">
            <span className="font-serif text-2xl text-stone-300">
              {fragrance.house.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-1">
        <p className="text-[9px] font-semibold tracking-[0.18em] uppercase text-stone-400 truncate mb-0.5">
          {fragrance.house}
        </p>
        <p className="font-serif text-[13px] text-stone-900 leading-snug mb-2 line-clamp-2">
          {fragrance.name}
        </p>
        <span className={`inline-block text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 ${pill.className}`}
          style={{ borderRadius: '2px' }}>
          {pill.label}
        </span>
      </div>
    </Link>
  )
}
