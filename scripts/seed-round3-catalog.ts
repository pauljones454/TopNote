#!/usr/bin/env bun
/**
 * Round 3 catalog expansion — idempotent seed.
 *
 * Inserts the audited 370-row dataset from
 * supabase/seed-data/2026-08-26-round3-final-insert.json into `fragrances`,
 * and corrects the Maison Margiela "Replica" line category split (one row
 * was tagged `niche` while the rest of the line is `designer`).
 *
 * Idempotency: existing rows are looked up by primary key `id` before
 * insert, so a row already in the table is counted as "skipped" and never
 * re-inserted or overwritten. The category fix only updates rows that are
 * still wrong, so re-running it touches 0 rows once applied. Safe to run
 * twice in a row.
 *
 * Data contract (already audited upstream — this script does not repair
 * rows, it validates and fails loudly on anything that doesn't match):
 *   - unique, non-colliding `id`
 *   - `category` one of designer | niche | ultra-niche | middle-eastern
 *   - `scent_family` present
 *   - 1-5 notes per pyramid tier (top/heart/base)
 *   - `review_count` === 0
 *   - no `bottle_image_url` / `created_at` keys (DB defaults apply)
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... bun run scripts/seed-round3-catalog.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const DATASET_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'supabase/seed-data/2026-08-26-round3-final-insert.json'
)

const ALLOWED_CATEGORIES = new Set(['designer', 'niche', 'ultra-niche', 'middle-eastern'])
const ALLOWED_GENDERS = new Set(['Masculine', 'Feminine', 'Unisex'])

// The one house with a "Replica" sub-line in this catalog today. All of its
// rows (live + this batch) are Replica products, so the whole house should
// share one category. See CATALOG-R3 PR description for the audit that
// found "By the Fireplace" mistagged `niche` against its `designer` siblings.
const REPLICA_HOUSE = 'Maison Margiela'
const REPLICA_CATEGORY = 'designer'

type FragranceRow = {
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
  price_tier: string | null
  gender: string | null
  release_year: number | null
  perfumer: string | null
}

function assertValidRow(row: FragranceRow, index: number): void {
  const errors: string[] = []
  if (!row.id) errors.push('missing id')
  if (!row.house) errors.push('missing house')
  if (!row.name) errors.push('missing name')
  if (!ALLOWED_CATEGORIES.has(row.category)) errors.push(`invalid category "${row.category}"`)
  if (!row.scent_family) errors.push('missing scent_family')
  for (const [tier, notes] of [
    ['top_notes', row.top_notes],
    ['heart_notes', row.heart_notes],
    ['base_notes', row.base_notes],
  ] as const) {
    if (!Array.isArray(notes) || notes.length < 1 || notes.length > 5) {
      errors.push(`${tier} out of range (${Array.isArray(notes) ? notes.length : 'not an array'})`)
    }
  }
  if (row.review_count !== 0) errors.push(`review_count must be 0, got ${row.review_count}`)
  if (row.gender !== null && !ALLOWED_GENDERS.has(row.gender)) {
    errors.push(`invalid gender "${row.gender}"`)
  }
  if (typeof row.avg_rating !== 'number' || row.avg_rating < 0 || row.avg_rating > 5) {
    errors.push(`avg_rating out of range: ${row.avg_rating}`)
  }
  if ('bottle_image_url' in row) errors.push('bottle_image_url must be absent — DB default applies')
  if ('created_at' in row) errors.push('created_at must be absent — DB default applies')

  if (errors.length > 0) {
    throw new Error(`Row ${index} (id="${row.id ?? '<missing>'}") failed validation: ${errors.join('; ')}`)
  }
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

async function main() {
  const supabaseUrl = requireEnv('SUPABASE_URL')
  const supabaseServiceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

  const raw = readFileSync(DATASET_PATH, 'utf8')
  const rows: FragranceRow[] = JSON.parse(raw)

  console.log(`Loaded ${rows.length} rows from ${path.relative(process.cwd(), DATASET_PATH)}`)

  // Fail loudly, up front, on any row that doesn't match the audited
  // contract — this script delivers pre-validated data, it does not repair it.
  const seenIds = new Set<string>()
  for (const [index, row] of rows.entries()) {
    assertValidRow(row, index)
    if (seenIds.has(row.id)) {
      throw new Error(`Duplicate id within dataset: "${row.id}" (row ${index})`)
    }
    seenIds.add(row.id)
  }
  console.log(`Validated ${rows.length} rows: 0 schema violations, 0 in-batch duplicate ids.`)

  // --- Idempotent insert of the round 3 batch --------------------------
  const batchIds = rows.map((r) => r.id)
  const { data: existing, error: existingError } = await supabase
    .from('fragrances')
    .select('id')
    .in('id', batchIds)
  if (existingError) {
    throw new Error(`Failed to check existing rows: ${existingError.message}`)
  }
  const existingIds = new Set((existing ?? []).map((r) => r.id))
  const toInsert = rows.filter((r) => !existingIds.has(r.id))

  let inserted = 0
  let failed = 0
  const failures: { id: string; error: string }[] = []

  const CHUNK_SIZE = 50
  for (let i = 0; i < toInsert.length; i += CHUNK_SIZE) {
    const chunk = toInsert.slice(i, i + CHUNK_SIZE)
    const { error, data } = await supabase.from('fragrances').insert(chunk).select('id')
    if (!error) {
      inserted += data?.length ?? chunk.length
      continue
    }
    // A chunk failed — fall back to per-row insert so one bad row doesn't
    // mask the other 49 succeeding, and so we can name the exact failure.
    for (const row of chunk) {
      const { error: rowError } = await supabase.from('fragrances').insert(row)
      if (rowError) {
        failed += 1
        failures.push({ id: row.id, error: rowError.message })
      } else {
        inserted += 1
      }
    }
  }

  const skippedExisting = existingIds.size

  // --- Replica category fix ---------------------------------------------
  const { data: fixedRows, error: fixError } = await supabase
    .from('fragrances')
    .update({ category: REPLICA_CATEGORY })
    .eq('house', REPLICA_HOUSE)
    .neq('category', REPLICA_CATEGORY)
    .select('id, name')
  if (fixError) {
    throw new Error(`Replica category fix failed: ${fixError.message}`)
  }

  // --- Summary ------------------------------------------------------------
  console.log('\n=== Seed summary ===')
  console.log(`Inserted:         ${inserted}`)
  console.log(`Skipped existing: ${skippedExisting}`)
  console.log(`Failed:           ${failed}`)
  if (failures.length > 0) {
    console.log('Failures:')
    for (const f of failures) console.log(`  - ${f.id}: ${f.error}`)
  }
  console.log(`Replica category fix: ${fixedRows?.length ?? 0} row(s) corrected to "${REPLICA_CATEGORY}"`)
  if (fixedRows && fixedRows.length > 0) {
    for (const r of fixedRows) console.log(`  - ${r.id} (${r.name})`)
  }

  if (failed > 0) {
    console.error(`\n${failed} row(s) failed to insert. See failures above.`)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('\nSeed failed:', err instanceof Error ? err.message : err)
  process.exit(1)
})
