/**
 * AttributeMetrics
 *
 * Renders fragrance attributes from the raw "Key: Value" string array with
 * three distinct visual treatments:
 *
 *   Scalar bars  — Longevity / Sillage: 4-segment quality bar + precise caption
 *   Tier meter   — Price: 5 filled dollar-sign segments + USD-bracket caption
 *   Text chips   — everything else (Versatility, unknown keys): bordered label
 *
 * Fallback: any value that doesn't resolve to a known level or tier degrades
 * gracefully to a text chip — never an empty or broken bar.
 *
 * Server Component — no client state or browser APIs required.
 */

import {
  formatAttribute,
  formatAttributeValue,
  getScalarLevel,
  getPriceTier,
  SCALAR_METRIC_KEYS,
} from '@/lib/attribute-labels'

interface Props {
  attributes: string[]
}

// ─── Scalar bar row ──────────────────────────────────────────────────────────

function ScalarBar({
  label,
  level,
  max,
  caption,
}: {
  label: string
  level: number
  max: number
  caption: string
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[9px] font-semibold tracking-[0.18em] uppercase text-stone-400 w-20 flex-shrink-0">
        {label}
      </span>
      {/* Segmented bar — visual language matches the note pyramid bars */}
      <div className="flex gap-1">
        {Array.from({ length: max }).map((_, i) => (
          <div
            key={i}
            className="w-5 h-[3px] rounded-full"
            style={{
              background: i < level
                ? 'rgba(58,46,40,0.72)'
                : 'rgba(28,20,16,0.10)',
            }}
          />
        ))}
      </div>
      <span className="text-[11px] text-stone-400 leading-none">
        {caption}
      </span>
    </div>
  )
}

// ─── Price tier row ──────────────────────────────────────────────────────────

function PriceTier({ tier, caption }: { tier: number; caption: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[9px] font-semibold tracking-[0.18em] uppercase text-stone-400 w-20 flex-shrink-0">
        Price
      </span>
      {/* Dollar-sign segments — tier, not quality; 5 possible levels */}
      <div className="flex gap-[1px] items-baseline">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className="text-[12px] font-semibold leading-none"
            style={{
              color: i < tier
                ? 'rgba(58,46,40,0.80)'
                : 'rgba(58,46,40,0.16)',
            }}
          >
            $
          </span>
        ))}
      </div>
      <span className="text-[11px] text-stone-400 leading-none">
        {caption}
      </span>
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export function AttributeMetrics({ attributes }: Props) {
  if (!attributes?.length) return null

  // Classify each attribute into its rendering bucket.
  type ScalarRow = { label: string; level: number; max: number; caption: string }
  const scalarRows: ScalarRow[] = []
  let priceRow: { tier: number; caption: string } | null = null
  // Store as { raw, display } so `raw` is a stable React key.
  const textChips: Array<{ raw: string; display: string }> = []

  for (const raw of attributes) {
    const sep = raw.indexOf(': ')
    if (sep === -1) {
      textChips.push({ raw, display: raw })
      continue
    }

    const key = raw.slice(0, sep)
    const value = raw.slice(sep + 2)

    if (SCALAR_METRIC_KEYS.has(key)) {
      const scalar = getScalarLevel(key, value)
      if (scalar) {
        scalarRows.push({
          label: key,
          level: scalar.level,
          max: scalar.max,
          caption: formatAttributeValue(key, value),
        })
      } else {
        // Unknown value for a known scalar key — degrade to text chip.
        textChips.push({ raw, display: formatAttribute(raw) })
      }
    } else if (key === 'Price') {
      const tier = getPriceTier(value)
      if (tier !== null) {
        priceRow = { tier, caption: formatAttributeValue('Price', value) }
      } else {
        // Unmapped price symbol — degrade to text chip.
        textChips.push({ raw, display: formatAttribute(raw) })
      }
    } else {
      textChips.push({ raw, display: formatAttribute(raw) })
    }
  }

  const hasMetricRows = scalarRows.length > 0 || priceRow !== null

  return (
    <div className="pt-5" style={{ borderTop: '1px solid rgba(28,20,16,0.07)' }}>
      {/* Scalar bars + price tier */}
      {hasMetricRows && (
        <div className="space-y-3">
          {scalarRows.map((row) => (
            <ScalarBar key={row.label} {...row} />
          ))}
          {priceRow && <PriceTier {...priceRow} />}
        </div>
      )}

      {/* Text chips — Versatility and any unmapped fallbacks */}
      {textChips.length > 0 && (
        <div
          className={`flex flex-wrap gap-1.5${hasMetricRows ? ' mt-4 pt-4' : ''}`}
          style={hasMetricRows ? { borderTop: '1px solid rgba(28,20,16,0.05)' } : {}}
        >
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

