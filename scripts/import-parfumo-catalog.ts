/**
 * Parfumo (TidyTuesday 2024-12-10) -> TopNote curated catalog top-up.
 *
 * Generates an IDEMPOTENT seed file (supabase/seed-catalog.sql) that adds a
 * small, curated set of net-new fragrances to the live `fragrances` table,
 * taking the catalog from its current size up toward the ~200 target.
 *
 * Why a top-up and not a 160-row bulk import: the live catalog already holds
 * ~185 hand-curated fragrances (confirmed against topnote.cloud, not the stale
 * ~40 baseline). The product north star is a curated, quiet-luxury catalog, so
 * this adds a modest, well-rated, well-known slice rather than a noisy dump.
 * See decision doc art_xzsw1Igb (Parfumo = the agreed free-tier source).
 *
 * SCHEMA: Option A — NO schema changes. Every value targets an EXISTING column
 * (lib/supabase/types.ts `Fragrance`). Provenance lives in this script and in
 * the generated SQL's header/manifest comments, NOT in new DB columns.
 *
 * The script never writes to any database. Its only output is the SQL file the
 * product owner runs by hand in the Supabase SQL editor.
 *
 * Usage:
 *   # 1. Download the dataset (no scraping — a single static CSV):
 *   curl -L -o data/parfumo_data_clean.csv \
 *     https://raw.githubusercontent.com/rfordatascience/tidytuesday/main/data/2024/2024-12-10/parfumo_data_clean.csv
 *
 *   # 2. Snapshot the live catalog for dedupe (public read, no secrets):
 *   #    see scripts/README.md -> "Regenerating the dedupe snapshot".
 *
 *   # 3. Generate the seed SQL:
 *   npx tsx scripts/import-parfumo-catalog.ts
 *
 * Flags:
 *   --file=<path>      CSV path (default: data/parfumo_data_clean.csv)
 *   --existing=<path>  Live-catalog snapshot JSON for dedupe (default: data/existing.json)
 *   --out=<path>       SQL output path (default: supabase/seed-catalog.sql)
 *   --sample=<path>    Also write the selected rows as JSON (default: none)
 *   --target=<n>       Net-new rows to select (default: 30)
 *   --per-house=<n>    Max rows per house, for variety (default: 2)
 *   --min-ratings=<n>  Quality filter on Rating_Count (default: 200)
 *   --batch=<n>        Rows per INSERT statement in the SQL (default: 25)
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SOURCE = 'parfumo_tidytuesday'
const SOURCE_LABEL = 'Parfumo (rfordatascience/tidytuesday, 2024-12-10)'
const DEFAULT_FILE = 'data/parfumo_data_clean.csv'
const DEFAULT_EXISTING = 'data/existing.json'
const DEFAULT_OUT = 'supabase/seed-catalog.sql'
const DEFAULT_TARGET = 30
const DEFAULT_PER_HOUSE = 2
const DEFAULT_MIN_RATINGS = 200 // min Parfumo Rating_Count (community sample size)
const DEFAULT_MIN_RATING = 3.5 // min rescaled 0-5 score (quality floor)
const MIN_NOTES = 5 // min total notes (top+heart+base) for a rich detail page
const DEFAULT_BATCH = 25

/**
 * Manual exclusions: near-duplicates of existing catalog rows that survive the
 * automatic dedupe because the stored names differ too much to match (e.g. a
 * "pour Homme" flanker vs the base name). Keyed by normKey(name, house).
 */
const EXCLUDE = new Set<string>([
  'la yuqawam pour homme|rasasi', // existing catalog already carries "La Yuqawam"
])

/** Tokens the dataset uses to mean "missing". */
const NA_TOKENS = new Set(['', 'NA', 'N/A', 'na', 'None', 'null', 'NULL'])

/** Junk value seen in Main_Accords that is not a real accord. */
const ACCORD_JUNK = new Set(['main accords'])

/** Concentration phrases Parfumo appends to the Name field, longest first. */
const CONCENTRATIONS = [
  'Eau de Toilette Intense', 'Eau de Parfum Intense', 'Eau de Cologne',
  'Eau de Toilette', 'Eau de Parfum', 'Eau Fraiche', 'Eau Fra\u00eeche',
  'Extrait de Parfum', 'Parfum Cologne', 'Body Spray',
  'Extrait', 'Elixir', 'Cologne', 'Parfum', 'Perfume', 'Oil',
]

/**
 * Map a Parfumo dominant accord to TopNote's `scent_family` vocabulary
 * (the families already used by the live catalog). Unknown accords fall back
 * to Title Case so nothing is dropped.
 */
const FAMILY_BY_ACCORD: Record<string, string> = {
  floral: 'Floral', spicy: 'Spicy', sweet: 'Sweet', woody: 'Woody',
  fresh: 'Fresh', fruity: 'Fruity', citrus: 'Citrus', green: 'Fresh',
  powdery: 'Powdery', oriental: 'Oriental', gourmand: 'Gourmand',
  creamy: 'Sweet', resinous: 'Oriental', aquatic: 'Aquatic',
  smoky: 'Woody', leathery: 'Leather', earthy: 'Woody', animal: 'Musky',
  fougere: 'Aromatic', chypre: 'Chypre',
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

/** Lowercase, strip diacritics, collapse to single spaces. */
function fold(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Dedupe key for name+house comparison across the dataset and live catalog. */
function normKey(name: string, house: string): string {
  return `${fold(name)}|${fold(house)}`
}

/**
 * All folded name forms that should collide for dedupe, so a clean candidate
 * name matches a messier stored one:
 *   - the name itself
 *   - the name with a leading house prefix removed ("Guerlain Vetiver" -> "vetiver")
 *   - each of those with a leading number removed ("1 Million" -> "million")
 */
function nameVariants(name: string, house: string): string[] {
  const hf = fold(house)
  const base = new Set<string>([fold(name)])
  for (const v of [...base]) {
    if (hf && v.startsWith(`${hf} `)) base.add(v.slice(hf.length).trim())
  }
  for (const v of [...base]) base.add(v.replace(/^\d+\s+/, ''))
  return [...base].filter(Boolean)
}

/** Every dedupe key (name variant x house) for a row. */
function dedupeKeys(name: string, house: string): string[] {
  const hf = fold(house)
  return nameVariants(name, house).map((v) => `${v}|${hf}`)
}

/** URL/id slug: diacritic-free, lowercase, hyphenated. */
function slugify(value: string): string {
  return fold(value).replace(/\s+/g, '-')
}

/** Title Case a single token ("WOODY" / "woody" -> "Woody"). */
function titleCase(token: string): string {
  return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase()
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
 * Parfumo's Name field appends "<Display> <Brand> [Year] [Concentration]".
 * Strip that tail — anchored on the BRAND token so we never amputate a real
 * name that happens to end in a concentration word (e.g. the flanker
 * "La Vie est Belle L'Eau de Parfum", whose brand is not in the tail, is left
 * intact). "Million Paco Rabanne 2008 Eau de Toilette" -> "Million".
 */
function cleanName(rawName: string, brand: string): string {
  const name = clean(rawName)
  if (!brand) return name
  const conc = CONCENTRATIONS.map(escapeRegExp).join('|')
  // <space> brand [ <year> ] [ <concentration> ] <end>
  const tail = new RegExp(
    `\\s+${escapeRegExp(brand.trim())}(?:\\s+\\d{4})?(?:\\s+(?:${conc}))?\\s*$`,
    'i',
  )
  const stripped = name
    .replace(tail, '')
    // Collapse an adjacent duplicated token ("M7 M7 Oud Absolu" -> "M7 Oud Absolu").
    .replace(/\b(\S+)\s+\1\b/i, '$1')
    .replace(/\s+/g, ' ')
    .trim()
  return stripped || name
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Map a dominant accord token to TopNote's scent_family vocabulary. */
function familyForAccord(accord: string): string {
  return FAMILY_BY_ACCORD[fold(accord)] ?? titleCase(accord)
}

/**
 * Minimal RFC-4180 CSV parser: handles quoted fields, embedded commas/newlines,
 * and escaped double-quotes. Dependency-free so the import has no install footprint.
 */
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let field = ''
  let row: string[] = []
  let inQuotes = false
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
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows
}



// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A live-catalog row, as snapshotted from topnote.cloud (public read). */
type ExistingRow = { id: string; name: string; house: string; category: string }

/** A candidate insert row — matches the existing `fragrances` columns exactly. */
type Candidate = {
  id: string
  house: string
  name: string
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
  // Provenance — emitted as SQL comments only, never as DB columns.
  source: string
  source_id: string
  source_name: string
  source_url: string
}

// ---------------------------------------------------------------------------
// Live-catalog snapshot -> house/category map + dedupe keys
// ---------------------------------------------------------------------------

type Catalog = {
  /** normalized house -> canonical display + dominant category */
  houses: Map<string, { display: string; category: string }>
  /** existing name+house dedupe keys */
  keys: Set<string>
  /** existing ids, to avoid primary-key collisions */
  ids: Set<string>
  /** existing names grouped by normalized house, for near-duplicate review */
  namesByHouse: Map<string, string[]>
  size: number
}

function buildCatalog(rows: ExistingRow[]): Catalog {
  const catCounts = new Map<string, Record<string, number>>()
  const display = new Map<string, string>()
  const keys = new Set<string>()
  const ids = new Set<string>()
  const namesByHouse = new Map<string, string[]>()

  for (const r of rows) {
    const hk = fold(r.house)
    if (!catCounts.has(hk)) catCounts.set(hk, {})
    const counts = catCounts.get(hk)!
    counts[r.category] = (counts[r.category] ?? 0) + 1
    display.set(hk, r.house)
    for (const k of dedupeKeys(r.name, r.house)) keys.add(k)
    ids.add(r.id)
    if (!namesByHouse.has(hk)) namesByHouse.set(hk, [])
    namesByHouse.get(hk)!.push(r.name)
  }

  const houses = new Map<string, { display: string; category: string }>()
  for (const [hk, counts] of catCounts) {
    const category = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
    houses.set(hk, { display: display.get(hk)!, category })
  }
  return { houses, keys, ids, namesByHouse, size: rows.length }
}

// ---------------------------------------------------------------------------
// Mapping + selection
// ---------------------------------------------------------------------------

type RawRow = Record<string, string>

/**
 * Map one Parfumo record to a Candidate, or null if it fails a quality gate:
 * unknown house, too few ratings, or no olfactory content. Houses are limited
 * to those already in the curated catalog so categories are accurate and the
 * additions read as recognizable flankers rather than noise.
 */
function mapRow(
  raw: RawRow,
  catalog: Catalog,
  opts: { minRatings: number; minRating: number },
): Candidate | null {
  const brand = clean(raw.Brand)
  if (!brand) return null
  const house = catalog.houses.get(fold(brand))
  if (!house) return null // not a known, curated house

  const name = cleanName(raw.Name, brand)
  if (!name) return null
  if (EXCLUDE.has(normKey(name, house.display))) return null

  const ratingValue = num(raw.Rating_Value)
  const ratingCount = num(raw.Rating_Count)
  if (ratingValue === null || ratingCount === null || ratingCount < opts.minRatings) return null
  const avgRating = Math.round((ratingValue / 2) * 10) / 10 // Parfumo 0-10 -> TopNote 0-5
  if (avgRating < opts.minRating) return null // quality floor

  const accords = splitList(raw.Main_Accords).filter((a) => !ACCORD_JUNK.has(a.toLowerCase()))
  const top = splitList(raw.Top_Notes)
  const heart = splitList(raw.Middle_Notes)
  const base = splitList(raw.Base_Notes)
  // Require a rich note pyramid so detail pages are substantial, not stubs.
  if (accords.length === 0 || top.length + heart.length + base.length < MIN_NOTES) return null

  return {
    id: '', // assigned later, after dedupe, to guarantee uniqueness
    house: house.display,
    name,
    type: accords.slice(0, 2).map(titleCase).join(' '), // top accords, e.g. "Woody Spicy"
    category: house.category,
    scent_family: familyForAccord(accords[0]),
    top_notes: top,
    heart_notes: heart,
    base_notes: base,
    attributes: [], // dataset has no longevity/sillage/price/versatility — do not fabricate
    seasons: [], // dataset has no season votes — do not fabricate
    avg_rating: avgRating,
    review_count: Math.round(ratingCount),
    bottle_image_url: null, // no licensed image; the UI falls back gracefully on null
    source: SOURCE,
    source_id: clean(raw.Number) || normKey(name, house.display),
    source_name: clean(raw.Name),
    source_url: clean(raw.URL),
  }
}

/**
 * Build the curated selection: map + quality-filter every row, dedupe within the
 * dataset (highest review_count wins) and against the live catalog, then rank by
 * review_count and take the most-rated rows under a per-house cap for variety.
 */
function select(
  table: string[][],
  catalog: Catalog,
  opts: { target: number; perHouse: number; minRatings: number; minRating: number },
): { rows: Candidate[]; stats: Record<string, number> } {
  const header = table[0].map((h) => h.trim())
  const idx = new Map(header.map((h, i) => [h, i]))

  let total = 0
  let mapped = 0
  let dupInDataset = 0
  let dupVsCatalog = 0

  const byKey = new Map<string, Candidate>()
  for (let r = 1; r < table.length; r++) {
    const cells = table[r]
    if (cells.length <= 1) continue
    total++
    const raw: RawRow = {}
    for (const [col, i] of idx) raw[col] = cells[i] ?? ''
    const cand = mapRow(raw, catalog, { minRatings: opts.minRatings, minRating: opts.minRating })
    if (!cand) continue
    mapped++
    if (dedupeKeys(cand.name, cand.house).some((k) => catalog.keys.has(k))) {
      dupVsCatalog++
      continue
    }
    const key = normKey(cand.name, cand.house)
    const existing = byKey.get(key)
    if (existing) {
      dupInDataset++
      if (cand.review_count > existing.review_count) byKey.set(key, cand)
    } else {
      byKey.set(key, cand)
    }
  }

  const ranked = [...byKey.values()].sort((a, b) => b.review_count - a.review_count)
  const perHouse = new Map<string, number>()
  const picked: Candidate[] = []
  for (const cand of ranked) {
    if (picked.length >= opts.target) break
    const hk = fold(cand.house)
    const used = perHouse.get(hk) ?? 0
    if (used >= opts.perHouse) continue
    perHouse.set(hk, used + 1)
    picked.push(cand)
  }

  assignIds(picked, catalog.ids)
  return {
    rows: picked,
    stats: {
      dataRows: total,
      passedFilters: mapped,
      dupInDataset,
      dupVsCatalog,
      eligibleNetNew: byKey.size,
      selected: picked.length,
    },
  }
}

/** Assign a unique slug id to each picked row (house-prefixed; never collides). */
function assignIds(rows: Candidate[], taken: Set<string>): void {
  const used = new Set(taken)
  for (const row of rows) {
    let base = slugify(`${row.house} ${row.name}`)
    if (!base) base = `${SOURCE}-${slugify(row.source_id)}`
    let id = base
    let n = 2
    while (used.has(id)) id = `${base}-${n++}`
    used.add(id)
    row.id = id
  }
}


// ---------------------------------------------------------------------------
// SQL emission
// ---------------------------------------------------------------------------

/** Single-quoted SQL string literal with quote-doubling. */
function sqlStr(value: string): string {
  return `'${value.replace(/'/g, "''")}'`
}

/** SQL text[] literal: ARRAY['a','b']::text[] (empty -> ARRAY[]::text[]). */
function sqlArr(values: string[]): string {
  if (values.length === 0) return 'ARRAY[]::text[]'
  return `ARRAY[${values.map(sqlStr).join(',')}]::text[]`
}

/** One VALUES tuple for a candidate row, column order fixed by COLUMNS. */
function rowTuple(c: Candidate): string {
  const fields = [
    sqlStr(c.id),
    sqlStr(c.house),
    sqlStr(c.name),
    sqlStr(c.type),
    sqlStr(c.category),
    sqlStr(c.scent_family),
    sqlArr(c.top_notes),
    sqlArr(c.heart_notes),
    sqlArr(c.base_notes),
    sqlArr(c.attributes),
    sqlArr(c.seasons),
    String(c.avg_rating),
    String(c.review_count),
    c.bottle_image_url === null ? 'NULL' : sqlStr(c.bottle_image_url),
  ]
  return `    (${fields.join(', ')})`
}

const COLUMNS =
  'id, house, name, type, category, scent_family, top_notes, heart_notes, ' +
  'base_notes, attributes, seasons, avg_rating, review_count, bottle_image_url'

/** Emit one idempotent, batched INSERT statement (VALUES + name+house anti-join). */
function batchStatement(batch: Candidate[]): string {
  const values = batch.map(rowTuple).join(',\n')
  return (
    `WITH seed (${COLUMNS}) AS (\n  VALUES\n${values}\n)\n` +
    `INSERT INTO fragrances (${COLUMNS})\n` +
    `SELECT ${COLUMNS.split(', ').map((c) => `s.${c}`).join(', ')}\n` +
    `FROM seed s\n` +
    `WHERE NOT EXISTS (\n` +
    `  SELECT 1 FROM fragrances f\n` +
    `  WHERE lower(f.name) = lower(s.name) AND lower(f.house) = lower(s.house)\n` +
    `);`
  )
}

function emitSql(rows: Candidate[], catalog: Catalog, batchSize: number): string {
  const houses = [...new Set(rows.map((r) => r.house))].sort()
  const manifest = rows
    .map(
      (r, i) =>
        `--   ${String(i + 1).padStart(3)}. ${r.house} \u2014 ${r.name}  ` +
        `[${r.category} / ${r.scent_family} / \u2605${r.avg_rating} \u00b7 ${r.review_count} ratings]  ` +
        `(${r.source_url || `${SOURCE} #${r.source_id}`})`,
    )
    .join('\n')

  const header = [
    '-- ============================================================',
    '-- Top Note \u2014 Curated catalog top-up (Parfumo, free-tier source)',
    '-- ============================================================',
    `-- WHAT: adds ${rows.length} net-new, well-rated fragrances from recognizable`,
    `--       houses, taking the live catalog from ${catalog.size} toward the ~200 target.`,
    '--       This is a CURATED top-up, not a bulk dump \u2014 the catalog is',
    '--       intentionally kept editorial and quiet-luxury.',
    '--',
    `-- SOURCE: ${SOURCE_LABEL}.`,
    '--   Generated by scripts/import-parfumo-catalog.ts (see scripts/README.md).',
    '--',
    '-- LICENSING: Parfumo data is used here ONLY as a non-commercial / free-tier',
    '--   demo source. It must be replaced with a licensed source (e.g. FragDB) or',
    '--   first-party/affiliate data before any commercial launch. See art_xzsw1Igb.',
    '--',
    '-- SCHEMA: Option A \u2014 NO schema changes. Every value targets an existing',
    '--   `fragrances` column. Provenance (source + upstream id) lives in the',
    '--   manifest comments below, NOT in any DB column. avg_rating is rescaled',
    '--   from Parfumo\u2019s 0\u201310 to TopNote\u2019s 0\u20135; review_count is the rating count.',
    '--   attributes/seasons are intentionally empty: the dataset carries no',
    '--   longevity/sillage/price/season data and nothing is fabricated. New rows',
    '--   have bottle_image_url = NULL (the UI falls back to an initial tile).',
    '--',
    '-- HOW TO RUN: paste this file into the Supabase Dashboard \u2192 SQL Editor and run.',
    '--   It is ADDITIVE and IDEMPOTENT \u2014 every row is guarded by NOT EXISTS on',
    '--   lower(name)+lower(house), so re-running inserts nothing new and never',
    '--   duplicates. No migration is required; the file is inert until run.',
    '--',
    `-- HOUSES (${houses.length}): ${houses.join(', ')}`,
    '--',
    '-- MANIFEST (provenance for each added row):',
    manifest,
    '-- ============================================================',
    '',
  ].join('\n')

  const batches: string[] = []
  for (let i = 0; i < rows.length; i += batchSize) {
    batches.push(batchStatement(rows.slice(i, i + batchSize)))
  }

  const verify = [
    '',
    '-- ============================================================',
    '-- VERIFY AFTER RUNNING',
    '-- ============================================================',
    '-- Total catalog size (expect prior count + the rows added above):',
    'SELECT count(*) AS total_fragrances FROM fragrances;',
    '',
    '-- Spot-check the newly added rows by id:',
    'SELECT id, house, name, category, scent_family, avg_rating, review_count',
    'FROM fragrances',
    `WHERE id IN (\n${rows.map((r) => `  ${sqlStr(r.id)}`).join(',\n')}\n)`,
    'ORDER BY review_count DESC;',
    '',
  ].join('\n')

  return `${header}\n${batches.join('\n\n')}\n${verify}`
}

// ---------------------------------------------------------------------------
// CLI + main
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]) {
  const opt = (name: string, fallback?: string) => {
    const hit = argv.find((a) => a.startsWith(`--${name}=`))
    return hit ? hit.split('=').slice(1).join('=') : fallback
  }
  return {
    file: opt('file', DEFAULT_FILE)!,
    existing: opt('existing', DEFAULT_EXISTING)!,
    out: opt('out', DEFAULT_OUT)!,
    sample: opt('sample'),
    target: Number(opt('target', String(DEFAULT_TARGET))),
    perHouse: Number(opt('per-house', String(DEFAULT_PER_HOUSE))),
    minRatings: Number(opt('min-ratings', String(DEFAULT_MIN_RATINGS))),
    minRating: Number(opt('min-rating', String(DEFAULT_MIN_RATING))),
    batch: Number(opt('batch', String(DEFAULT_BATCH))),
  }
}

function main(): void {
  const args = parseArgs(process.argv.slice(2))

  if (!existsSync(args.file)) {
    console.error(`CSV not found at ${args.file}. Download it first (see scripts/README.md):`)
    console.error(
      '  curl -L -o data/parfumo_data_clean.csv \\\n    https://raw.githubusercontent.com/rfordatascience/tidytuesday/main/data/2024/2024-12-10/parfumo_data_clean.csv',
    )
    process.exit(1)
  }
  if (!existsSync(args.existing)) {
    console.error(`Live-catalog snapshot not found at ${args.existing}.`)
    console.error('Regenerate it from topnote.cloud \u2014 see scripts/README.md.')
    process.exit(1)
  }

  const existing = JSON.parse(readFileSync(args.existing, 'utf8')) as ExistingRow[]
  const catalog = buildCatalog(existing)
  console.log(`Live catalog: ${catalog.size} rows across ${catalog.houses.size} houses.`)

  const table = parseCsv(readFileSync(args.file, 'utf8'))
  console.log(`Parsed ${table.length - 1} Parfumo rows.`)

  const { rows, stats } = select(table, catalog, {
    target: args.target,
    perHouse: args.perHouse,
    minRatings: args.minRatings,
    minRating: args.minRating,
  })

  console.log('Selection stats:')
  for (const [k, v] of Object.entries(stats)) console.log(`  ${k}: ${v}`)
  console.log(`  -> catalog after run: ${catalog.size} + ${rows.length} = ${catalog.size + rows.length}`)

  if (rows.length < args.target) {
    console.warn(`WARNING: selected ${rows.length} < target ${args.target} (loosen filters?).`)
  }

  writeFileSync(args.out, emitSql(rows, catalog, args.batch))
  console.log(`Wrote ${rows.length} rows -> ${args.out}`)

  if (args.sample) {
    writeFileSync(args.sample, JSON.stringify(rows, null, 2))
    console.log(`Wrote selection sample -> ${args.sample}`)
  }
}

main()
