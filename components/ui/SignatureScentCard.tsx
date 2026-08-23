import Image from 'next/image'
import Link from 'next/link'
import type { Fragrance } from '@/lib/supabase/types'
import type { SignatureScent } from '@/lib/celebrity-scents'

/**
 * Editorial, typography-led card for the home page "Signature Scents" row.
 *
 * Most entries in the dataset have no bottle photography (`bottle_image_url`
 * is null for the majority of sourced pairings) — the card is designed to
 * read as complete on the celebrity name and sourced line alone. A bottle
 * thumbnail is a small accent shown only when art exists; its absence is
 * never treated as an error state or filled with a placeholder monogram,
 * since a row of repeated placeholders would look broken rather than
 * intentional.
 */
export function SignatureScentCard({
  scent,
  fragrance,
}: {
  scent: SignatureScent
  fragrance: Fragrance
}) {
  return (
    <Link
      href={`/fragrance/${fragrance.id}`}
      className="group block w-[220px] md:w-[248px] flex-shrink-0 p-6 rounded-2xl"
      style={{
        background: 'rgba(255,255,255,0.55)',
        border: '1px solid var(--border)',
        transition: 'border-color 220ms var(--ease-out-expo), background 220ms var(--ease-out-expo)',
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-5">
        <p className="text-[9px] font-semibold tracking-[0.18em] uppercase text-stone-400">
          Signature Scent
        </p>
        {fragrance.bottle_image_url && (
          <div className="relative w-6 h-9 flex-shrink-0">
            <Image
              src={fragrance.bottle_image_url}
              alt={fragrance.name}
              fill
              className="object-contain object-top opacity-90"
              sizes="32px"
            />
          </div>
        )}
      </div>

      <p className="font-serif text-[21px] text-stone-900 leading-tight tracking-tight mb-3">
        {scent.celebrity}
      </p>

      <p className="text-[13px] text-stone-500 leading-relaxed mb-6">
        {scent.note}
      </p>

      <div className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
        <p className="text-[9px] font-semibold tracking-[0.16em] uppercase text-stone-400 truncate mb-0.5">
          {fragrance.house}
        </p>
        <p className="font-serif text-[14px] text-stone-800 leading-snug">
          {fragrance.name}
        </p>
      </div>
    </Link>
  )
}
