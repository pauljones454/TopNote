'use client'
import Image from 'next/image'
import Link from 'next/link'
import { getCategoryPill } from '@/lib/utils'
import type { Fragrance } from '@/lib/supabase/types'

export function FragranceCard({ fragrance }: { fragrance: Fragrance }) {
  const pill = getCategoryPill(fragrance.category)

  return (
    <Link href={`/fragrance/${fragrance.id}`} className="group block">
      <div className="p-2">
        {/* Bottle image */}
        <div className="w-full aspect-[3/4] flex items-end justify-center mb-3 relative">
          {fragrance.bottle_image_url ? (
            <Image
              src={fragrance.bottle_image_url}
              alt={fragrance.name}
              fill
              className="object-contain object-bottom"
              sizes="(max-width: 768px) 33vw, 20vw"
            />
          ) : (
            <div className="w-3/4 h-4/5 bg-stone-100 rounded-xl flex items-center justify-center">
              <span className="font-serif text-2xl text-stone-400">
                {fragrance.house.charAt(0)}
              </span>
            </div>
          )}
        </div>
        {/* Info */}
        <div className="px-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400 truncate mb-0.5">
            {fragrance.house}
          </p>
          <p className="font-serif text-[13px] text-stone-900 leading-tight mb-1.5 line-clamp-2">
            {fragrance.name}
          </p>
          <span className={`inline-block text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${pill.className}`}>
            {pill.label}
          </span>
        </div>
      </div>
    </Link>
  )
}
