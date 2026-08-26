-- ============================================================
-- Top Note — Profile Gender Column Migration
-- Run this in Supabase Dashboard → SQL Editor
--
-- Signup asked "What do you wear?" and stored the answer in profiles.bio,
-- which is the user's free-text bio. This gives that answer its own column
-- and hands bio back to the user.
--
-- Safe to run more than once.
-- ============================================================

-- 1. The column, constrained to exactly the vocabulary the signup flow offers.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS gender text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_gender_check'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_gender_check
      CHECK (gender IS NULL OR gender IN ('masculine', 'feminine', 'both'));
  END IF;
END $$;

-- 2. Backfill: move a gender answer out of bio, and only when bio holds
--    exactly one of those answers. Any real bio text is left untouched.
--    As of this migration the live table holds no such rows — this is written
--    defensively in case a signup lands before the deploy.
UPDATE profiles
SET gender = lower(btrim(bio))
WHERE gender IS NULL
  AND lower(btrim(bio)) IN ('masculine', 'feminine', 'both');

-- 3. Clear only the bio cells that were carrying the gender answer.
UPDATE profiles
SET bio = NULL
WHERE bio IS NOT NULL
  AND lower(btrim(bio)) IN ('masculine', 'feminine', 'both')
  AND gender = lower(btrim(bio));

-- 4. Keep updated_at honest on every profile write (settings edits set it
--    explicitly, but this covers writes from anywhere else).
CREATE OR REPLACE FUNCTION set_profiles_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON profiles;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_profiles_updated_at();
