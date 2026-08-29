/**
 * AttributeMetrics
 *
 * The technical tail of the fragrance profile: Longevity, Sillage, Versatility
 * and Price, rendered in one shared spec-row treatment — stored term first
 * (Long / Strong / Versatile / $$$$$), mapped detail beside it (8–10 hrs /
 * fills the room / All seasons, day & night / $400+).
 *
 * Previously Longevity and Sillage drew 4-segment meters, Price drew a
 * dollar-sign meter, and Versatility fell through to an orphan chip below a
 * divider — three encodings for four values of identical "Key: Value" shape.
 * The split came from a hardcoded key set, not from the data, so it is gone.
 *
 * Fallbacks, all still plain text and never a broken row:
 *   known key + unmapped value ("Longevity: Insane") → row with the raw value
 *   unknown key ("Vibe: Cozy") or no "Key: Value" shape → text chip
 *
 * Server Component — no client state or browser APIs required.
 */

import {
  formatAttribute,
  formatAttributeValue,
  getPriceTier,
  SPEC_ATTRIBUTE_KEYS,
} from '@/lib/attribute-labels'

interface Props {
  attributes: string[]
  /**
   * Structured price tier ($ – $$$$$) from the fragrances.price_tier column.
   * This is the source of truth for the price row — the legacy "Price: $$$"
   * string is no longer stored in `attributes`. Kept optional for defensive
   * rendering against any row that predates backfill.
   */
  priceTier?: string | null
}

/** One spec row: the stored term, plus its mapped detail when one exists. */
type SpecRow = { key: string; term: string; detail: string | null }

type TextChip = { raw: string; display: string }

/**
 * Sorts the raw attribute strings into ordered spec rows and leftover chips.
 * Pure — no rendering concerns — so the bucketing rules stay readable and the
 * component below is only layout.
 */
function buildAttributeRows(
  attributes: string[],
  priceTier: string | null,
): { specRows: SpecRow[]; textChips: TextChip[] } {
  const specByKey = new Map<string, SpecRow>()
  const textChips: TextChip[] = []

  const priceFromColumn = priceTier?.trim() ?? ''
  if (priceFromColumn && getPriceTier(priceFromColumn) !== null) {
    specByKey.set('Price', {
      key: 'Price',
      term: priceFromColumn,
      detail: formatAttributeValue('Price', priceFromColumn),
    })
  }

  for (const raw of attributes) {
    const sep = raw.indexOf(': ')
    if (sep === -1) {
      textChips.push({ raw, display: raw })
      continue
    }

    const key = raw.slice(0, sep)
    const value = raw.slice(sep + 2).trim()

    if (key === 'Price') {
      // Legacy "Price: $$$" rows predate the price_tier backfill; the column
      // wins when both are present, and an unreadable tier still shows as text.
      if (!specByKey.has('Price')) {
        if (getPriceTier(value) !== null) {
          specByKey.set('Price', {
            key: 'Price',
            term: value,
            detail: formatAttributeValue('Price', value),
          })
        } else {
          textChips.push({ raw, display: formatAttribute(raw) })
        }
      }
      continue
    }

    if (SPEC_ATTRIBUTE_KEYS.includes(key)) {
      const detail = formatAttributeValue(key, value)
      specByKey.set(key, { key, term: value, detail: detail === value ? null : detail })
      continue
    }

    textChips.push({ raw, display: formatAttribute(raw) })
  }

  const specRows = [...SPEC_ATTRIBUTE_KEYS, 'Price']
    .map((key) => specByKey.get(key))
    .filter((row): row is SpecRow => row !== undefined)

  return { specRows, textChips }
}

export function AttributeMetrics({ attributes, priceTier }: Props) {
  const { specRows, textChips } = buildAttributeRows(attributes ?? [], priceTier ?? null)

  if (specRows.length === 0 && textChips.length === 0) return null

  return (
    <div className="pt-6" style={{ borderTop: '1px solid rgba(28,20,16,0.07)' }}>
      {specRows.length > 0 && (
        <dl>
          {specRows.map((row, i) => (
            <div
              key={row.key}
              className="flex items-baseline gap-4 py-2.5"
              style={i === 0 ? undefined : { borderTop: '1px solid rgba(28,20,16,0.05)' }}
            >
              <dt className="text-[9px] font-semibold tracking-[0.18em] uppercase text-stone-400 w-[76px] flex-shrink-0">
                {row.key}
              </dt>
              <dd className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                <span className="text-[12px] font-medium text-stone-700">{row.term}</span>
                {row.detail && <span className="text-[11px] text-stone-400">{row.detail}</span>}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {/* Anything outside the known spec keys still surfaces, verbatim. */}
      {textChips.length > 0 && (
        <div className={`flex flex-wrap gap-1.5${specRows.length > 0 ? ' mt-4' : ''}`}>
          {textChips.map(({ raw, display }) => (
            <span
              key={raw}
              className="text-[10px] text-stone-400 px-2.5 py-1"
              style={{ border: '1px solid rgba(28,20,16,0.10)', borderRadius: '4px' }}
            >
              {display}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
