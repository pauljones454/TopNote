/**
 * One-off verification script for the spray-guidance feature — NOT part of the
 * app build. Exercises getConcentrationTier/getSprayGuidance/getCompatibilityScore
 * against real production `type` values (including the dirty ones) and prints
 * the exact tip copy LayerCard would render. Run with:
 *   npx tsx scripts/verify-spray-guidance.ts
 */
import { getConcentrationTier, getSprayGuidance, getCompatibilityScore } from '../lib/layering'
import type { Fragrance } from '../lib/supabase/types'

function frag(partial: Partial<Fragrance> & { id: string; name: string; house: string; type: string; scent_family: string }): Fragrance {
  return {
    top_notes: [], heart_notes: [], base_notes: [], attributes: [], seasons: [],
    avg_rating: 0, review_count: 0, bottle_image_url: null, price_tier: null,
    gender: null, release_year: null, perfumer: null, category: 'designer',
    ...partial,
  }
}

console.log('=== getConcentrationTier across the real production spread ===')
const typeSamples = [
  'EDP', 'EDT', 'Parfum', 'Extrait de Parfum', 'EDC', 'Cologne', 'Attar', 'Perfume',
  'Extrait', 'Parfum Intense', 'Perfume Extract', 'Parfum Cologne', 'Fine Fragrance Mist',
  // dirty rows — scent family stored in `type` instead of a concentration
  'Floral Oriental', 'Aromatic Woody', 'Citrus Aromatic', 'Woody Musky', 'designer',
  '', null, undefined,
]
for (const t of typeSamples) {
  console.log(`  ${JSON.stringify(t)?.padEnd(24) ?? 'undefined'.padEnd(24)} -> ${getConcentrationTier(t as any)}`)
}

console.log('\n=== getSprayGuidance across tier combinations ===')
for (const anchor of ['Attar', 'EDP', 'EDT']) {
  for (const lift of ['Attar', 'EDP', 'EDT']) {
    const g = getSprayGuidance(anchor, lift)
    console.log(`  anchor=${anchor.padEnd(4)} lift=${lift.padEnd(4)} -> anchor:${g.anchorSprays} lift:${g.liftSprays} total:${g.anchorSprays + g.liftSprays}`)
  }
}

console.log('\n=== Real fragrance pairs (from production Supabase rows) ===')
const dahnAlOud = frag({ id: 'ajmal-dahn-al-oud', name: 'Dahn Al Oud Maliki', house: 'Ajmal', type: 'Attar', scent_family: 'oriental' })
const bleuParfum = frag({ id: 'chanel-bleu-parfum', name: 'Bleu de Chanel Parfum', house: 'Chanel', type: 'Parfum', scent_family: 'woody' })
const leMaleAviator = frag({ id: 'jpg-aviator', name: 'Le Male Aviator', house: 'Jean Paul Gaultier', type: 'EDT', scent_family: 'fougere' })
const chloeEdp = frag({ id: 'chloe-edp', name: 'Eau de Parfum', house: 'Chloé', type: 'EDP', scent_family: 'floral' })
const dohaCologne = frag({ id: 'dior-homme-cologne', name: 'Dior Homme Cologne', house: 'Dior', type: 'Cologne', scent_family: 'citrus' })
const twistedPeppermint = frag({ id: 'bbw-twisted-peppermint', name: 'Twisted Peppermint', house: 'Bath & Body Works', type: 'Fine Fragrance Mist', scent_family: 'gourmand' })
const blackOrchid = frag({ id: 'black-orchid', name: 'Black Orchid', house: 'Tom Ford', type: 'Floral Oriental', scent_family: 'oriental' }) // dirty type
const defyParfum = frag({ id: 'ck-defy-parfum', name: 'Defy Parfum', house: 'Calvin Klein', type: 'designer', scent_family: 'woody' }) // dirty type
const cliveX = frag({ id: 'clive-christian-x', name: 'X', house: 'Clive Christian', type: 'Extrait de Parfum', scent_family: 'oriental' })
const rojaAmberAoud = frag({ id: 'roja-amber-aoud', name: 'Amber Aoud', house: 'Roja Parfums', type: 'Parfum Cologne', scent_family: 'oriental' })

function printTip(a: Fragrance, b: Fragrance) {
  const c = getCompatibilityScore(a, b)
  const anchor = c.applicationOrder[0] === a.id ? a : b
  const lift = anchor === a ? b : a
  const anchorSprays = c.sprayGuidance.anchorSprays
  const liftSprays = c.sprayGuidance.liftSprays
  const s = (n: number) => `${n} spray${n === 1 ? '' : 's'}`
  console.log(`  [${a.type} + ${b.type}] "${anchor.name}" first, ${s(anchorSprays)} · then "${lift.name}", ${s(liftSprays)}  (reason: ${c.reason})`)
}

printTip(dahnAlOud, chloeEdp)          // Attar (concentrated) + EDP (moderate)
printTip(bleuParfum, leMaleAviator)    // Parfum (concentrated) + EDT (light)
printTip(dohaCologne, twistedPeppermint) // Cologne (light) + Fine Fragrance Mist (light)
printTip(blackOrchid, defyParfum)      // dirty "Floral Oriental" + dirty "designer" — both should resolve to moderate/EDP-equivalent
printTip(cliveX, rojaAmberAoud)        // Extrait de Parfum + Parfum Cologne (ambiguous compound -> falls back to moderate)
printTip(chloeEdp, leMaleAviator)      // EDP + EDT — the catalog-typical pairing
