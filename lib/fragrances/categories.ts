import type { Fragrance } from '@/lib/supabase/types'

type FragranceCategory = Fragrance['category']

/** Category tabs shown on Discover, in display order. */
export const CATEGORY_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'designer', label: 'Designer' },
  { value: 'niche', label: 'Niche' },
  { value: 'ultra-niche', label: 'Ultra Niche' },
  { value: 'middle-eastern', label: 'Middle Eastern' },
] as const

export type CategoryFilterValue = (typeof CATEGORY_FILTERS)[number]['value']

/**
 * Which stored `category` values each tab selects. "Niche" deliberately spans
 * `ultra-niche` as well — the narrower tab exists for people who want only that.
 */
const CATEGORY_MEMBERS: Record<CategoryFilterValue, readonly FragranceCategory[] | null> = {
  all: null,
  designer: ['designer'],
  niche: ['niche', 'ultra-niche'],
  'ultra-niche': ['ultra-niche'],
  'middle-eastern': ['middle-eastern'],
}

const VALID_VALUES = new Set<string>(CATEGORY_FILTERS.map(filter => filter.value))

/** Categories a filter selects, or `null` for "no category restriction". */
export function categoriesFor(
  value: CategoryFilterValue
): readonly FragranceCategory[] | null {
  return CATEGORY_MEMBERS[value]
}

/** Resolves a URL parameter to a category tab, falling back to "all". */
export function parseCategoryFilter(value: string | undefined | null): CategoryFilterValue {
  if (value && VALID_VALUES.has(value)) return value as CategoryFilterValue
  return 'all'
}
