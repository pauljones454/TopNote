/**
 * WhereToBuy
 *
 * Outbound retailer links for a fragrance profile page. Server Component —
 * links are computed at request time from env-configured affiliate IDs
 * (see lib/affiliates.ts); no client state or browser APIs required.
 *
 * Rendered as the page's primary buy CTA, directly under the fragrance name —
 * the first retailer carries the dominant, filled treatment; any additional
 * retailers sit beneath it as a lighter secondary option, so there is one
 * obvious action rather than a lineup of equal choices.
 *
 * FTC disclosure is mandatory and ships alongside the links, per the
 * monetization research (art_nR9HbmgF §7) — not an optional footnote.
 */

import { ExternalLink } from 'lucide-react'
import { getWhereToBuyLinks, hasActiveAffiliateLinks, type WhereToBuyLink } from '@/lib/affiliates'
import type { Fragrance } from '@/lib/supabase/types'

function PrimaryRetailerLink({ link }: { link: WhereToBuyLink }) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="flex items-center justify-between gap-3 w-full px-6 py-5 group"
      style={{
        borderRadius: '14px',
        background: 'var(--brand-dark)',
        transition: 'opacity 200ms var(--ease-out-expo)',
      }}
    >
      <span className="text-[16px] font-semibold text-white">
        Shop at {link.label}
      </span>
      <ExternalLink
        size={16}
        strokeWidth={1.5}
        className="text-white/70 flex-shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        style={{ transition: 'transform 200ms var(--ease-out-expo)' }}
      />
    </a>
  )
}

function SecondaryRetailerLink({ link }: { link: WhereToBuyLink }) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="inline-flex items-center gap-1.5 text-[12px] font-medium text-stone-500 hover:text-stone-800"
      style={{ transition: 'color 200ms var(--ease-out-expo)' }}
    >
      Also at {link.label}
      <ExternalLink size={11} strokeWidth={1.5} className="flex-shrink-0" />
    </a>
  )
}

export function WhereToBuy({ fragrance }: { fragrance: Pick<Fragrance, 'house' | 'name'> }) {
  const links = getWhereToBuyLinks(fragrance)
  if (!links.length) return null
  const [primary, ...secondary] = links

  return (
    <section className="mb-8">
      <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-stone-400 mb-3">
        Bring It Home
      </p>
      <PrimaryRetailerLink link={primary} />
      {secondary.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 px-1">
          {secondary.map((link) => (
            <SecondaryRetailerLink key={link.id} link={link} />
          ))}
        </div>
      )}
      {hasActiveAffiliateLinks(links) && (
        <p className="text-[10px] text-stone-400 leading-relaxed mt-3">
          Top Note may earn a commission on purchases made through these links, at no extra cost to you.
        </p>
      )}
    </section>
  )
}
