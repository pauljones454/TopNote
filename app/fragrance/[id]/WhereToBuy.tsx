/**
 * WhereToBuy
 *
 * Outbound retailer links for a fragrance profile page. Server Component —
 * links are computed at request time from env-configured affiliate IDs
 * (see lib/affiliates.ts); no client state or browser APIs required.
 *
 * FTC disclosure is mandatory and ships alongside the first link, per the
 * monetization research (art_nR9HbmgF §7) — not an optional footnote.
 */

import { ExternalLink } from 'lucide-react'
import { getWhereToBuyLinks, hasActiveAffiliateLinks, type WhereToBuyLink } from '@/lib/affiliates'
import type { Fragrance } from '@/lib/supabase/types'

function RetailerLink({ link }: { link: WhereToBuyLink }) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="flex items-center justify-between gap-3 px-4 py-3.5 group border border-[rgba(28,20,16,0.10)] hover:border-[rgba(28,20,16,0.18)]"
      style={{
        borderRadius: '10px',
        transition: 'border-color 200ms var(--ease-out-expo)',
      }}
    >
      <span className="text-[13px] font-semibold text-stone-800">
        Shop at {link.label}
      </span>
      <ExternalLink
        size={14}
        strokeWidth={1.5}
        className="text-stone-400 flex-shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        style={{ transition: 'transform 200ms var(--ease-out-expo)' }}
      />
    </a>
  )
}

export function WhereToBuy({ fragrance }: { fragrance: Pick<Fragrance, 'house' | 'name'> }) {
  const links = getWhereToBuyLinks(fragrance)
  if (!links.length) return null

  return (
    <section className="mt-10 pt-8" style={{ borderTop: '1px solid rgba(28,20,16,0.07)' }}>
      <p className="text-[9px] font-semibold tracking-[0.2em] uppercase text-stone-400 mb-3">
        Where to Buy
      </p>
      <div className="space-y-2">
        {links.map((link) => (
          <RetailerLink key={link.id} link={link} />
        ))}
      </div>
      {hasActiveAffiliateLinks(links) && (
        <p className="text-[10px] text-stone-400 leading-relaxed mt-3">
          Top Note may earn a commission on purchases made through these links, at no extra cost to you.
        </p>
      )}
    </section>
  )
}
