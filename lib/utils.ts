import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getBottleUrl(fragrance: { id: string; bottle_image_url: string | null }) {
  if (fragrance.bottle_image_url) return fragrance.bottle_image_url
  return null
}

export function getCategoryPill(category: string) {
  const map: Record<string, { label: string; className: string }> = {
    'ultra-niche': { label: 'Ultra Niche', className: 'bg-purple-950/10 text-purple-950' },
    'niche':       { label: 'Niche',       className: 'bg-violet-100 text-violet-900' },
    'middle-eastern': { label: 'M.Eastern', className: 'bg-amber-100 text-amber-800' },
    'designer':    { label: 'Designer',    className: 'bg-stone-100 text-stone-600' },
  }
  return map[category] ?? map['designer']
}

export function getRankForXP(xp: number) {
  const ranks = [
    { name: 'Curious',     icon: '🌱', min: 0 },
    { name: 'Sampler',     icon: '🧴', min: 100 },
    { name: 'Collector',   icon: '📦', min: 300 },
    { name: 'Connoisseur', icon: '🎩', min: 700 },
    { name: 'Aficionado',  icon: '💎', min: 1500 },
    { name: 'Curator',     icon: '🏛️', min: 3000 },
    { name: 'Nose',        icon: '👃', min: 6000 },
    { name: 'Legendary',   icon: '👑', min: 10000 },
  ]
  for (let i = ranks.length - 1; i >= 0; i--) {
    if (xp >= ranks[i].min) return { ...ranks[i], index: i, next: ranks[i + 1] ?? null }
  }
  return { ...ranks[0], index: 0, next: ranks[1] }
}
