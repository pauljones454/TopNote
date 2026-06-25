-- ============================================================
-- Top Note — Parfumo Catalog Import: provenance columns
-- Run this in Supabase Dashboard -> SQL Editor BEFORE running
-- scripts/import-parfumo.ts against the live database.
--
-- ADDITIVE ONLY. This migration does not alter, rename, or drop
-- any existing column. The two new columns are nullable, so the
-- ~40 hand-seeded rows are unaffected (they keep source = NULL).
-- ============================================================

-- 1. Provenance columns on the existing fragrances table.
--    source    — dataset tag, e.g. 'parfumo_tidytuesday'
--    source_id — the upstream Parfumo "Number" id, used for idempotent re-imports
ALTER TABLE fragrances
  ADD COLUMN IF NOT EXISTS source    text,
  ADD COLUMN IF NOT EXISTS source_id text;

-- 2. Unique index on source_id powers the idempotent upsert
--    (ON CONFLICT (source_id)). Existing seeded rows have
--    source_id = NULL; Postgres treats NULLs as distinct, so any
--    number of NULL rows coexist. Every imported row carries a
--    distinct upstream id, so re-running the import updates in
--    place instead of inserting duplicates.
CREATE UNIQUE INDEX IF NOT EXISTS ux_fragrances_source_id
  ON fragrances (source_id);

-- Verify with:
-- SELECT column_name, data_type, is_nullable
--   FROM information_schema.columns
--  WHERE table_name = 'fragrances' AND column_name IN ('source','source_id');
-- SELECT source, count(*) FROM fragrances GROUP BY source;

