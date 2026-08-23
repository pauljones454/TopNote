import type { SupabaseClient } from '@supabase/supabase-js'
import { foldAccents } from './text'

/**
 * PostgREST cannot pattern-match inside a `text[]` column — there is no `ilike`
 * for arrays. The only usable array operator is overlap (`ov`), which needs whole
 * note values, not substrings.
 *
 * So the note vocabulary is loaded once per server process and cached: a substring
 * query is resolved against it to the concrete note strings it matches, and those
 * are handed to `ov`. The payload is a few hundred KB at catalog scale, is fetched
 * server-side only, and never reaches the browser.
 */

const VOCABULARY_TTL_MS = 15 * 60 * 1000
/** PostgREST caps rows per response (1,000 by default), so the load is ranged. */
const FETCH_PAGE_SIZE = 1000
/** Keeps the generated filter — and therefore the request URL — bounded. */
const MAX_NOTE_MATCHES = 60

const NOTE_COLUMNS = ['top_notes', 'heart_notes', 'base_notes'] as const

type NoteRow = Record<(typeof NOTE_COLUMNS)[number], string[] | null>

type CachedVocabulary = {
  notes: string[]
  expiresAt: number
}

let cached: CachedVocabulary | null = null
let inFlight: Promise<string[]> | null = null

async function loadVocabulary(supabase: SupabaseClient): Promise<string[]> {
  const notes = new Set<string>()

  for (let offset = 0; ; offset += FETCH_PAGE_SIZE) {
    const { data, error } = await supabase
      .from('fragrances')
      .select(NOTE_COLUMNS.join(','))
      .order('id', { ascending: true })
      .range(offset, offset + FETCH_PAGE_SIZE - 1)

    if (error) {
      throw new Error(`Failed to load fragrance note vocabulary: ${error.message}`)
    }

    const rows = (data ?? []) as unknown as NoteRow[]
    for (const row of rows) {
      for (const column of NOTE_COLUMNS) {
        for (const note of row[column] ?? []) {
          const trimmed = note.trim()
          if (trimmed) notes.add(trimmed)
        }
      }
    }

    if (rows.length < FETCH_PAGE_SIZE) break
  }

  return Array.from(notes)
}

/** Every distinct note in the catalog, cached per server process. */
export async function getNoteVocabulary(supabase: SupabaseClient): Promise<string[]> {
  if (cached && cached.expiresAt > Date.now()) return cached.notes
  if (inFlight) return inFlight

  inFlight = loadVocabulary(supabase)
    .then(notes => {
      cached = { notes, expiresAt: Date.now() + VOCABULARY_TTL_MS }
      return notes
    })
    .finally(() => {
      inFlight = null
    })

  return inFlight
}

/**
 * Notes whose text contains `query`, accent- and case-insensitively.
 * Prefix matches rank first ("van" puts "Vanilla" above "Bourbon Vanilla"), then
 * shorter notes, so truncating at the cap keeps the most literal matches.
 */
export function matchNotes(
  vocabulary: readonly string[],
  query: string,
  limit: number = MAX_NOTE_MATCHES
): string[] {
  const needle = foldAccents(query.trim())
  if (!needle) return []

  return vocabulary
    .map(note => ({ note, folded: foldAccents(note) }))
    .filter(({ folded }) => folded.includes(needle))
    .sort((a, b) => {
      const aPrefix = a.folded.startsWith(needle)
      const bPrefix = b.folded.startsWith(needle)
      if (aPrefix !== bPrefix) return aPrefix ? -1 : 1
      if (a.folded.length !== b.folded.length) return a.folded.length - b.folded.length
      return a.folded.localeCompare(b.folded)
    })
    .slice(0, limit)
    .map(({ note }) => note)
}

/** Test seam — drops the process-level cache. */
export function resetNoteVocabularyCache(): void {
  cached = null
  inFlight = null
}
