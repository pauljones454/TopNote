/**
 * Top Note — Layer Compatibility Engine
 *
 * Rule-based pairing logic for launch. As combo_saves grows,
 * community data will supplement these rules.
 *
 * Accord families and their compatible pairings are based on
 * established fragrance layering conventions.
 */

import type { Fragrance } from './supabase/types'

// ── Accord families ───────────────────────────────────────────────────────────

const ACCORD_FAMILIES: Record<string, string[]> = {
  woody:     ['woody', 'smoky', 'leather', 'earthy', 'mossy'],
  citrus:    ['citrus', 'fresh', 'aquatic', 'green', 'aromatic'],
  floral:    ['floral', 'powdery', 'fruity', 'sweet'],
  oriental:  ['oriental', 'spicy', 'amber', 'vanilla', 'gourmand', 'balsamic'],
  chypre:    ['chypre', 'mossy', 'woody', 'leather', 'fruity'],
  fougere:   ['fougere', 'aromatic', 'woody', 'lavender', 'coumarin'],
  aquatic:   ['aquatic', 'citrus', 'fresh', 'ozonic', 'green'],
  gourmand:  ['gourmand', 'vanilla', 'sweet', 'amber', 'woody'],
  leather:   ['leather', 'smoky', 'woody', 'tobacco', 'oriental'],
  musk:      ['musk', 'powdery', 'floral', 'woody', 'amber'],
}

// Notes that work as bridges between families
const BRIDGE_NOTES = ['musk', 'amber', 'sandalwood', 'vanilla', 'cedar', 'bergamot', 'vetiver', 'patchouli']

// ── Compatibility score ───────────────────────────────────────────────────────

export type CompatibilityResult = {
  score: number          // 0–100
  reason: string         // short human-readable explanation
  applicationOrder: [string, string]  // [apply_first_id, apply_second_id] — heavier base first
}

export function getCompatibilityScore(a: Fragrance, b: Fragrance): CompatibilityResult {
  let score = 0
  const reasons: string[] = []

  const aFamily = (a.scent_family ?? '').toLowerCase()
  const bFamily = (b.scent_family ?? '').toLowerCase()

  const aAllNotes = [...(a.top_notes ?? []), ...(a.heart_notes ?? []), ...(a.base_notes ?? [])].map(n => n.toLowerCase())
  const bAllNotes = [...(b.top_notes ?? []), ...(b.heart_notes ?? []), ...(b.base_notes ?? [])].map(n => n.toLowerCase())

  // 1. Shared note overlap (+5 per shared note, max 30)
  const sharedNotes = aAllNotes.filter(n => bAllNotes.includes(n))
  const overlapScore = Math.min(sharedNotes.length * 5, 30)
  score += overlapScore
  if (sharedNotes.length > 0) {
    reasons.push(`shares ${sharedNotes.slice(0,2).map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(' & ')}`)
  }

  // 2. Compatible accord families (+25 if compatible, +10 if same family)
  if (aFamily && bFamily) {
    if (aFamily === bFamily) {
      score += 10
      reasons.push(`both ${aFamily}`)
    } else {
      const aCompatible = ACCORD_FAMILIES[aFamily] ?? []
      const bCompatible = ACCORD_FAMILIES[bFamily] ?? []
      if (aCompatible.includes(bFamily) || bCompatible.includes(aFamily)) {
        score += 25
        reasons.push(`${aFamily} + ${bFamily} complement each other`)
      }
    }
  }

  // 3. Bridge notes (+15 if either fragrance has a known bridge note)
  const aBridge = aAllNotes.some(n => BRIDGE_NOTES.some(b => n.includes(b)))
  const bBridge = bAllNotes.some(n => BRIDGE_NOTES.some(b => n.includes(b)))
  if (aBridge && bBridge) {
    score += 15
    reasons.push('both have bridging notes')
  } else if (aBridge || bBridge) {
    score += 8
  }

  // 4. Complementary contrast bonus (+15 if light + heavy pairing)
  const lightFamilies = ['citrus', 'aquatic', 'fresh', 'green']
  const heavyFamilies = ['oriental', 'leather', 'gourmand', 'woody', 'chypre']
  const aLight = lightFamilies.some(f => aFamily.includes(f))
  const bHeavy = heavyFamilies.some(f => bFamily.includes(f))
  const aHeavy = heavyFamilies.some(f => aFamily.includes(f))
  const bLight = lightFamilies.some(f => bFamily.includes(f))
  if ((aLight && bHeavy) || (aHeavy && bLight)) {
    score += 15
    reasons.push('light + heavy contrast')
  }

  // Cap at 100
  score = Math.min(score, 100)

  // Application order: heavier/oriental/woody goes first as the base layer,
  // lighter/citrus goes on top
  const aIsHeavy = heavyFamilies.some(f => aFamily.includes(f))
  const applicationOrder: [string, string] = aIsHeavy ? [a.id, b.id] : [b.id, a.id]

  const reason = reasons.length > 0
    ? reasons.slice(0, 2).join(', ')
    : 'experimentally compatible'

  return { score, reason, applicationOrder }
}

// ── Get all compatible pairs from a shelf ─────────────────────────────────────

export type LayerSuggestion = {
  fragranceA: Fragrance
  fragranceB: Fragrance
  compatibility: CompatibilityResult
}

export function getSuggestions(fragrances: Fragrance[], topN = 6): LayerSuggestion[] {
  const pairs: LayerSuggestion[] = []

  for (let i = 0; i < fragrances.length; i++) {
    for (let j = i + 1; j < fragrances.length; j++) {
      const compatibility = getCompatibilityScore(fragrances[i], fragrances[j])
      if (compatibility.score >= 25) {  // minimum threshold
        pairs.push({
          fragranceA: fragrances[i],
          fragranceB: fragrances[j],
          compatibility,
        })
      }
    }
  }

  // Sort by score descending, take top N
  return pairs
    .sort((a, b) => b.compatibility.score - a.compatibility.score)
    .slice(0, topN)
}

// ── Shared notes ──────────────────────────────────────────────────────────────

/**
 * Returns the notes both fragrances share, capitalized and de-duplicated.
 * Read-only helper used by the combo detail page to make the
 * "why these layer" reasoning explicit. Does not affect scoring.
 */
export function getSharedNotes(a: Fragrance, b: Fragrance): string[] {
  const aAll = [...(a.top_notes ?? []), ...(a.heart_notes ?? []), ...(a.base_notes ?? [])]
    .map(n => n.toLowerCase())
  const bAll = new Set(
    [...(b.top_notes ?? []), ...(b.heart_notes ?? []), ...(b.base_notes ?? [])]
      .map(n => n.toLowerCase())
  )
  const seen = new Set<string>()
  const shared: string[] = []
  for (const note of aAll) {
    if (bAll.has(note) && !seen.has(note)) {
      seen.add(note)
      shared.push(note.charAt(0).toUpperCase() + note.slice(1))
    }
  }
  return shared
}

// ── Score label ───────────────────────────────────────────────────────────────

export function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 75) return { label: 'Excellent match',  color: '#5a7a5a' }
  if (score >= 55) return { label: 'Good pairing',     color: '#7a7a5a' }
  if (score >= 35) return { label: 'Worth trying',     color: '#8a6a4a' }
  return              { label: 'Experimental',          color: '#9a8a7a' }
}
