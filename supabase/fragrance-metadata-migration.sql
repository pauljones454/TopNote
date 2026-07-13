-- Adds structured metadata fields to the fragrances table.
-- Run this once in the Supabase SQL Editor.
--
-- price_tier: extracted from the existing "Price: $$$" strings jammed into
--   the attributes array (agent will backfill via REST + strip the
--   redundant "Price: ..." entries from attributes after this runs).
-- gender: Masculine / Feminine / Unisex
-- release_year: year the fragrance launched
-- perfumer: nose credited with the composition (nullable -- not always public)

ALTER TABLE fragrances
  ADD COLUMN IF NOT EXISTS price_tier text,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS release_year integer,
  ADD COLUMN IF NOT EXISTS perfumer text;

-- Optional but recommended: constrain gender to known values
ALTER TABLE fragrances
  ADD CONSTRAINT fragrances_gender_check
  CHECK (gender IS NULL OR gender IN ('Masculine', 'Feminine', 'Unisex'));

ALTER TABLE fragrances
  ADD CONSTRAINT fragrances_price_tier_check
  CHECK (price_tier IS NULL OR price_tier IN ('$', '$$', '$$$', '$$$$', '$$$$$'));

