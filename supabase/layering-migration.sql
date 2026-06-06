-- ============================================================
-- Top Note — Layering Migration
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Extend combos table with missing layering fields
ALTER TABLE combos
  ADD COLUMN IF NOT EXISTS rating        smallint CHECK (rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS application_order text[],   -- fragrance_ids in apply order
  ADD COLUMN IF NOT EXISTS save_count    integer NOT NULL DEFAULT 0;

-- 2. combo_saves — tracks which users saved which community combos
CREATE TABLE IF NOT EXISTS combo_saves (
  id          uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  combo_id    uuid NOT NULL REFERENCES combos(id)   ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, combo_id)
);

-- 3. RLS on combo_saves
ALTER TABLE combo_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own saves"
  ON combo_saves FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save combos"
  ON combo_saves FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave combos"
  ON combo_saves FOR DELETE
  USING (auth.uid() = user_id);

-- 4. RLS on combos (public read for is_public=true, own write)
ALTER TABLE combos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public combos are readable by all"
  ON combos FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can create their own combos"
  ON combos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own combos"
  ON combos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own combos"
  ON combos FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Function to increment/decrement save_count atomically
CREATE OR REPLACE FUNCTION increment_combo_save_count(combo_id uuid, delta integer)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE combos SET save_count = save_count + delta WHERE id = combo_id;
$$;

-- 6. Trigger to keep save_count in sync automatically
CREATE OR REPLACE FUNCTION sync_combo_save_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE combos SET save_count = save_count + 1 WHERE id = NEW.combo_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE combos SET save_count = GREATEST(0, save_count - 1) WHERE id = OLD.combo_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER combo_saves_count_trigger
  AFTER INSERT OR DELETE ON combo_saves
  FOR EACH ROW EXECUTE FUNCTION sync_combo_save_count();

-- Done. Verify with:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'combos';
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'combo_saves';
