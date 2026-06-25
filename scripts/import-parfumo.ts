/**
 * Parfumo (TidyTuesday 2024-12-10) -> TopNote catalog import.
 *
 * Phase 1 of the catalog expansion (see decision doc art_xzsw1Igb, Section 6).
 * Maps the open Parfumo dataset onto the EXISTING `fragrances` schema
 * (Option A — no typed-column migration) so the shipped Discover search and
 * detail-page chip renderer keep working unchanged.
 *
 * The only schema change this relies on is the additive provenance migration
 * in supabase/parfumo-import-migration.sql (`source`, `source_id` + unique
 * index). Run that FIRST.
 *
 * Usage:
 *   # 1. Download the dataset (no scraping — a single static CSV):
 *   curl -L -o data/parfumo_data_clean.csv \
 *     https://raw.githubusercontent.com/rfordatascience/tidytuesday/main/data/2024/2024-12-10/parfumo_data_clean.csv
 *
 *   # 2. Dry run — transform + dedupe + stats, no database writes:
 *   npx tsx scripts/import-parfumo.ts --dry-run
 *
 *   # 3. Live import (idempotent; safe to re-run):
 *   #    Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in the
 *   #    environment (the anon key is blocked by RLS for writes).
 *   SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/import-parfumo.ts
 *
 * Flags:
 *   --file=<path>     CSV path (default: data/parfumo_data_clean.csv)
 *   --dry-run         Transform only; never touch the database.
 *   --min-ratings=<n> Quality filter on Rating_Count (default: 5).
 *   --limit=<n>       Cap the number of rows imported (testing).
 *   --batch=<n>       Upsert batch size (default: 500).
 *   --out=<path>      Write a JSON sample of transformed rows (default: none).
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SOURCE = 'parfumo_tidytuesday'
const DEFAULT_FILE = 'data/parfumo_data_clean.csv'
const DEFAULT_MIN_RATINGS = 5
const DEFAULT_BATCH = 500

/** Tokens the dataset uses to mean "missing". */
const NA_TOKENS = new Set(['', 'NA', 'N/A', 'na', 'None', 'null', 'NULL'])

/** Junk value seen in Main_Accords that is not a real accord. */
const ACCORD_JUNK = new Set(['main accords'])

/**
 * `fragrances.category` is a constrained enum. Parfumo carries no
 * designer/niche classification, so imported rows default to 'designer'
 * (also the renderer's fallback). Documented as a Phase-1 limitation.
 */
const DEFAULT_CATEGORY = 'designer'

// ---------------------------------------------------------------------------
// Row shape written to Supabase (matches lib/supabase/types.ts Fragrance,
// minus the DB-generated `id`).
// ---------------------------------------------------------------------------

type FragranceInsert = {
  name: string
  house: string
  type: string
  category: string
  scent_family: string
  top_notes: string[]
  heart_notes: string[]
  base_notes: string[]
  attributes: string[]
  seasons: string[]
  avg_rating: number
  review_count: number
  bottle_image_url: string | null
  source: string
  source_id: string
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/** True when a raw cell is empty or a dataset "missing" sentinel. */
function isMissing(value: string | undefined): boolean {
  return NA_TOKENS.has((value ?? '').trim())
}

/** Trim and collapse internal whitespace; '' if missing. */
function clean(value: string | undefined): string {
  if (isMissing(value)) return ''
  return value!.replace(/\s+/g, ' ').trim()
}

/** Parse a numeric cell, or null when missing/non-numeric. */
function num(value: string | undefined): number | null {
  if (isMissing(value)) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

/**
 * Normalization key for dedupe: lowercase, strip diacritics and punctuation,
 * collapse whitespace. Used to compare name+house across the dataset and
 * against existing seeded rows.
 */
function normKey(...parts: string[]): string {
  return parts
    .join(' ')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Split a comma-separated note/accord cell into a trimmed, de-duped array. */
function splitList(value: string | undefined): string[] {
  if (isMissing(value)) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of value!.split(',')) {
    const item = raw.replace(/\s+/g, ' ').trim()
    if (!item || isMissing(item)) continue
    const key = item.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(item)
  }
  return out
}

/**
 * Minimal RFC-4180 CSV parser: handles quoted fields, embedded commas/newlines,
 * and escaped double-quotes. Returns an array of string rows. Dependency-free
 * so the import has no extra install footprint.
 */
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let field = ''
  let row: string[] = []
  let inQuotes = false
  // Strip a leading BOM if present.
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1)
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ }
        else inQuotes = false
      } else field += c
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field); field = ''
    } else if (c === '\n') {
      row.push(field); field = ''
      rows.push(row); row = []
    } else if (c === '\r') {
      // ignore; \n handles the row break
    } else {
      field += c
    }
  }
  // Flush trailing field/row (file may not end in a newline).
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

// ---------------------------------------------------------------------------
// Mapping
// ---------------------------------------------------------------------------

type RawRow = Record<string, string>

/**
 * Map one Parfumo record to a TopNote insert row, or null if it fails the
 * quality filter (no name, or no olfactory content, or too few ratings).
 *
 * Parfumo's Rating_Value is on a 0-10 scale; TopNote renders a 5-star scale
 * (Math.round(avg_rating) over 5 stars), so ratings are halved here.
 */
function mapRow(raw: RawRow, minRatings: number): FragranceInsert | null {
  const name = clean(raw.Name)
  if (!name) return null

  const accords = splitList(raw.Main_Accords).filter(
    (a) => !ACCORD_JUNK.has(a.toLowerCase()),
  )
  const top = splitList(raw.Top_Notes)
  const heart = splitList(raw.Middle_Notes)
  const base = splitList(raw.Base_Notes)

  // Require olfactory content so detail pages are not empty shells.
  if (accords.length === 0 && top.length === 0 && heart.length === 0 && base.length === 0) {
    return null
  }

  const ratingValue = num(raw.Rating_Value)
  const ratingCount = num(raw.Rating_Count)
  // Quality filter: enough community ratings for a reliable score.
  if (ratingCount === null || ratingCount < minRatings || ratingValue === null) {
    return null
  }

  const house = clean(raw.Brand) || 'Unknown'
  // Parfumo 0-10 -> TopNote 0-5, one decimal.
  const avgRating = Math.round((ratingValue / 2) * 10) / 10

  return {
    name,
    house,
    type: clean(raw.Concentration), // concentration (EdP/EdT/...) or '' — release year has no column in Option A
    category: DEFAULT_CATEGORY,
    scent_family: accords[0] ?? '', // dominant accord
    top_notes: top,
    heart_notes: heart,
    base_notes: base,
    attributes: [], // dataset has no longevity/sillage/price/versatility — do not fabricate
    seasons: [], // dataset has no season votes
    avg_rating: avgRating,
    review_count: Math.round(ratingCount),
    bottle_image_url: null, // imported rows have no local bottle asset; card renders an initial fallback
    source: SOURCE,
    source_id: clean(raw.Number) || normKey(name, house),
  }
}

/**
 * Transform the whole CSV: header -> objects, map+filter, dedupe within the
 * dataset by source_id and by normalized name+house (keeping the most-rated
 * variant on a name+house collision).
 */
function transform(
  table: string[][],
  minRatings: number,
): { rows: FragranceInsert[]; stats: Record<string, number> } {
  const header = table[0]
  const idx = new Map(header.map((h, i) => [h.trim(), i]))

  let total = 0
  let filtered = 0
  let dupSourceId = 0
  let dupNameHouse = 0

  const bySourceId = new Map<string, FragranceInsert>()
  for (let r = 1; r < table.length; r++) {
    const cells = table[r]
    if (cells.length === 1 && cells[0] === '') continue // trailing blank line
    total++
    const raw: RawRow = {}
    for (const [col, i] of idx) raw[col] = cells[i] ?? ''
    const mapped = mapRow(raw, minRatings)
    if (!mapped) { filtered++; continue }
    if (bySourceId.has(mapped.source_id)) { dupSourceId++; continue }
    bySourceId.set(mapped.source_id, mapped)
  }

  // Dedupe by normalized name+house, keeping the highest review_count.
  const byNameHouse = new Map<string, FragranceInsert>()
  for (const row of bySourceId.values()) {
    const key = normKey(row.name, row.house)
    const existing = byNameHouse.get(key)
    if (existing) {
      dupNameHouse++
      if (row.review_count > existing.review_count) byNameHouse.set(key, row)
    } else {
      byNameHouse.set(key, row)
    }
  }

  const rows = [...byNameHouse.values()]
  return {
    rows,
    stats: {
      totalDataRows: total,
      filteredOut: filtered,
      dupBySourceId: dupSourceId,
      dupByNameHouse: dupNameHouse,
      kept: rows.length,
    },
  }
}

// ---------------------------------------------------------------------------
// Env + CLI
// ---------------------------------------------------------------------------

/** Lightweight .env.local loader (no dotenv dependency). */
function loadEnvLocal(): void {
  if (!existsSync('.env.local')) return
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  }
}

function parseArgs(argv: string[]) {
  const opt = (name: string, fallback?: string) => {
    const hit = argv.find((a) => a.startsWith(`--${name}=`))
    return hit ? hit.split('=').slice(1).join('=') : fallback
  }
  return {
    file: opt('file', DEFAULT_FILE)!,
    dryRun: argv.includes('--dry-run'),
    minRatings: Number(opt('min-ratings', String(DEFAULT_MIN_RATINGS))),
    limit: opt('limit') ? Number(opt('limit')) : undefined,
    batch: Number(opt('batch', String(DEFAULT_BATCH))),
    out: opt('out'),
  }
}

// ---------------------------------------------------------------------------
// Live load
// ---------------------------------------------------------------------------

/** Fetch normalized name+house keys for every existing row, paged past 1000. */
async function fetchExistingKeys(sb: SupabaseClient): Promise<Set<string>> {
  const keys = new Set<string>()
  const pageSize = 1000
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await sb
      .from('fragrances')
      .select('name, house')
      .range(from, from + pageSize - 1)
    if (error) throw new Error(`Failed reading existing rows: ${error.message}`)
    if (!data || data.length === 0) break
    for (const r of data) keys.add(normKey(r.name ?? '', r.house ?? ''))
    if (data.length < pageSize) break
  }
  return keys
}

async function load(rows: FragranceInsert[], batchSize: number): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || url.includes('placeholder')) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is missing or a placeholder.')
  }
  if (!serviceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is required for the bulk load (the anon key is blocked by RLS). ' +
        'Re-run with it set, or use --dry-run.',
    )
  }
  const sb = createClient(url, serviceKey, { auth: { persistSession: false } })

  console.log('Reading existing rows for name+house dedupe...')
  const existing = await fetchExistingKeys(sb)
  console.log(`  existing rows: ${existing.size}`)

  const toLoad = rows.filter((r) => !existing.has(normKey(r.name, r.house)))
  console.log(`Skipping ${rows.length - toLoad.length} rows that collide with existing fragrances.`)
  console.log(`Upserting ${toLoad.length} rows in batches of ${batchSize}...`)

  let done = 0
  for (let i = 0; i < toLoad.length; i += batchSize) {
    const batch = toLoad.slice(i, i + batchSize)
    const { error } = await sb
      .from('fragrances')
      .upsert(batch, { onConflict: 'source_id', ignoreDuplicates: false })
    if (error) throw new Error(`Upsert failed at offset ${i}: ${error.message}`)
    done += batch.length
    console.log(`  upserted ${done}/${toLoad.length}`)
  }
  console.log('Live load complete.')
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv.slice(2))
  loadEnvLocal()

  if (!existsSync(args.file)) {
    console.error(`CSV not found at ${args.file}. Download it first:`)
    console.error(
      '  curl -L -o data/parfumo_data_clean.csv \\\n    https://raw.githubusercontent.com/rfordatascience/tidytuesday/main/data/2024/2024-12-10/parfumo_data_clean.csv',
    )
    process.exit(1)
  }

  console.log(`Parsing ${args.file} ...`)
  const table = parseCsv(readFileSync(args.file, 'utf8'))
  console.log(`  ${table.length - 1} data rows, ${table[0].length} columns`)

  let { rows, stats } = transform(table, args.minRatings)
  if (args.limit !== undefined) rows = rows.slice(0, args.limit)

  console.log('Transform stats:')
  for (const [k, v] of Object.entries(stats)) console.log(`  ${k}: ${v}`)
  console.log(`  minRatings filter: ${args.minRatings}`)
  if (args.limit !== undefined) console.log(`  limited to: ${rows.length}`)

  if (args.out) {
    writeFileSync(args.out, JSON.stringify(rows.slice(0, 30), null, 2))
    console.log(`Wrote 30-row sample to ${args.out}`)
  }

  if (args.dryRun) {
    console.log('\nDry run — no database writes. Sample rows:')
    for (const r of rows.slice(0, 3)) console.log(JSON.stringify(r))
    return
  }

  await load(rows, args.batch)
}

main().catch((err) => {
  console.error('\nImport failed:', err.message)
  process.exit(1)
})

