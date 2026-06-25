-- ============================================================
-- Top Note — Editorial Starter Combos (community seed)
-- ============================================================
-- WHAT: ~12 curated, two-bottle community combos so the Layering
--       pillar launches with real, high-quality content instead of
--       an empty shelf. Every fragrance id below is a PRODUCTION id
--       pulled from the live `fragrances` table, so foreign keys are
--       guaranteed valid. Each pair was scored with the app's own
--       compatibility engine (lib/layering.ts, getCompatibilityScore)
--       and ordered with its rule: the heavier / oriental / woody /
--       gourmand / leather family is layered FIRST as the base. When
--       neither bottle is a heavy family (a tie the engine breaks
--       arbitrarily), the richer / deeper bottle is placed first to
--       honour the same intent. Every pair scores >= 60 (well past the
--       engine's 25 suggestion threshold).
--
-- ORDER OF OPERATIONS:
--   1. Run supabase/layering-migration.sql FIRST. This file depends on
--      combos.rating, combos.application_order and combos.save_count,
--      which that migration adds.
--   2. Run this file. The curator is resolved automatically by email
--      (see CURATOR below) — no edits required.
--
-- CURATOR (resolved automatically — no edit required):
--   Community combos need combos.user_id -> profiles(id). This file
--   resolves the curator by email in the `curator` CTE below, mapping
--   profiles.id to auth.users.id (1:1 in standard Supabase). It is set
--   to the project owner, paul.jones@flatfile.io, so the file runs
--   cleanly with no manual edits.
--
--   Pre-flight check (should return exactly one row before you run):
--       SELECT p.id, p.handle, p.display_name
--       FROM profiles p
--       JOIN auth.users u ON u.id = p.id
--       WHERE u.email = 'paul.jones@flatfile.io';
--
--   Manual override: to attribute to a different account, see the
--   commented fallback line inside the `curator` CTE below.
--
-- IDEMPOTENT: safe to re-run. Each combo is guarded by NOT EXISTS on
--   (name, user_id), so re-running inserts nothing new and never
--   duplicates. There is no unique constraint relied upon.
--
-- VERIFY AFTER RUNNING:
--   SELECT count(*) FROM combos WHERE is_public = true;     -- +12
--   SELECT c.name, c.occasions, c.rating, c.application_order,
--          f1.name AS base_bottle, f2.name AS top_bottle
--   FROM combos c
--   JOIN fragrances f1 ON f1.id = c.application_order[1]
--   JOIN fragrances f2 ON f2.id = c.application_order[2]
--   WHERE c.user_id = (SELECT id FROM profiles
--                      WHERE id = (SELECT id FROM auth.users
--                                  WHERE email = 'paul.jones@flatfile.io'))
--   ORDER BY c.created_at;
-- ============================================================

WITH curator AS (
  -- Resolves the curator automatically by email — no manual edit required.
  -- profiles.id maps 1:1 to auth.users.id in standard Supabase.
  SELECT id FROM profiles
  WHERE id = (SELECT id FROM auth.users WHERE email = 'paul.jones@flatfile.io')
  LIMIT 1
  -- Manual override (optional): comment out the three lines above and
  -- uncomment the line below, replacing the handle, to attribute to a
  -- different account.
  -- SELECT id FROM profiles WHERE handle = 'REPLACE_WITH_CURATOR_HANDLE' LIMIT 1
),
seed (name, description, fragrance_ids, application_order, instructions, occasions, rating) AS (
  VALUES
    -- Khamrah (Lattafa) → then Atomic Rose (Initio Parfums Privés) | engine score 70, apply heavier base first
    ('Saffron Hours',
     'Two readings of saffron and rose, stacked for depth. Khamrah lays a boozy amber-vanilla base; Atomic Rose lifts the rose until it glows. For cold nights and candlelight.',
     ARRAY['lattafa-khamrah','initio-atomic']::text[], ARRAY['lattafa-khamrah','initio-atomic']::text[],
     'Spray Khamrah twice to the chest and let it settle a minute, then one spray of Atomic Rose to each wrist. Cooler air carries the oud best.',
     ARRAY['evening','cool-weather','special-occasion']::text[], 5),
    -- Black Phantom (Kilian) → then Love, Don't Be Shy (Kilian) | engine score 70, apply heavier base first
    ('After Dinner',
     'Espresso and dark rum underneath, marshmallow and neroli on top — a dessert you wear. Built for late tables and the slow walk home.',
     ARRAY['kilian-black','kilian-love']::text[], ARRAY['kilian-black','kilian-love']::text[],
     'One spray of Black Phantom to each side of the neck, then a single light spray of Love, Don''t Be Shy across both. Go easy; the caramel amplifies.',
     ARRAY['evening','date-night','cool-weather']::text[], 5),
    -- Halfeti (Penhaligon's) → then Memo Paris Irish Leather (Memo Paris) | engine score 70, apply heavier base first
    ('Black Rose, Soft Leather',
     'Halfeti''s smoky oud and black rose meet the suede-bright cardamom of Irish Leather. Composed, a touch severe, unmistakably grown-up.',
     ARRAY['penhaligons-halfeti','memo-paris-irish-leather']::text[], ARRAY['penhaligons-halfeti','memo-paris-irish-leather']::text[],
     'Lay down Halfeti, two sprays to the chest. Once it dries, add one spray of Irish Leather to a wrist to sharpen the edges. Wear it after dark.',
     ARRAY['evening','cool-weather','special-occasion']::text[], 5),
    -- 9PM (Afnan) → then 1 Million (Paco Rabanne) | engine score 70, apply heavier base first
    ('The Late Hour',
     'Cinnamon, leather and amber doubled down, with a citrus-mint snap from 1 Million cutting through the warmth. Loud in the best way — save it for the night.',
     ARRAY['afnan-9pm','million']::text[], ARRAY['afnan-9pm','million']::text[],
     'Two sprays of 9PM to the torso as the base, then one spray of 1 Million to the neck for lift. Both project; keep it to three sprays total.',
     ARRAY['evening','cool-weather']::text[], 4),
    -- Najdia (Lattafa) → then Elysium (Roja Parfums) | engine score 70, apply heavier base first
    ('Grapefruit at Noon',
     'Two grapefruit-and-vetiver fresheners layered for staying power. Najdia''s musky woods hold Elysium''s sparkling citrus in place well past lunch.',
     ARRAY['lattafa-najdia','roja-elysium']::text[], ARRAY['lattafa-najdia','roja-elysium']::text[],
     'Najdia first, two sprays to the chest for grip, then Elysium one spray to each wrist for the citrus top. Best in warm weather and daylight.',
     ARRAY['daytime','warm-weather','office']::text[], 4),
    -- Yves Saint Laurent La Nuit de L'Homme (YSL) → then Danger (Roja Parfums) | engine score 70, apply heavier base first
    ('Cardamom, After Dark',
     'La Nuit de L''Homme''s cardamom-rose softness, deepened by Danger''s nutmeg and geranium. Quiet, spiced, dressed-up without trying.',
     ARRAY['yves-saint-laurent-la','roja-danger']::text[], ARRAY['yves-saint-laurent-la','roja-danger']::text[],
     'One or two sprays of La Nuit to the neck as the base, then a single spray of Danger to the chest. Restrained sprays — this one leans in close.',
     ARRAY['evening','office','cool-weather']::text[], 5),
    -- Yara (Lattafa) → then Do Son (Diptyque) | engine score 70, apply heavier base first
    ('Tuberose Hour',
     'Yara''s fruity rose underneath, Do Son''s tuberose and orange blossom on top — a big, bright white-floral bouquet. For spring afternoons and good news.',
     ARRAY['lattafa-yara','diptyque-do']::text[], ARRAY['lattafa-yara','diptyque-do']::text[],
     'Two sprays of Yara to the chest and a mist through the hair, then one spray of Do Son to each wrist. Let the tuberose open in the warmth.',
     ARRAY['daytime','warm-weather','special-occasion']::text[], 4),
    -- Intense Cafe (Montale) → then Badee Al Oud Amethyst (Lattafa) | engine score 70, apply heavier base first
    ('Coffee, Oud, Rose',
     'A single rose threads through both. Intense Cafe brings coffee and vanilla; Badee Al Oud answers with tobacco and incense. Deep, resinous, made for the cold.',
     ARRAY['montale-intense','lattafa-badee-al-oud']::text[], ARRAY['montale-intense','lattafa-badee-al-oud']::text[],
     'Intense Cafe to the chest, two sprays, as the sweet base. Add one spray of Badee Al Oud to the collar for smoke. Winter and candlelight.',
     ARRAY['evening','cool-weather','special-occasion']::text[], 5),
    -- Chanel Pour Monsieur (Chanel) → then Neroli Portofino (Tom Ford) | engine score 65, apply heavier base first
    ('Citrus, Pressed',
     'Two colognes in conversation — Pour Monsieur''s lavender-lemon backbone holds Neroli Portofino''s blossom in place. Clean and tailored, the scent of a fresh shirt.',
     ARRAY['chanel-pour-monsieur-chanel','neroli']::text[], ARRAY['chanel-pour-monsieur-chanel','neroli']::text[],
     'Pour Monsieur first, two sprays to the chest. Refresh with Neroli Portofino, one spray to each wrist. Reapply at midday in heat; citrus is fleeting.',
     ARRAY['office','warm-weather','daytime']::text[], 4),
    -- Daim Blond (Serge Lutens) → then Kenzo Flower by Kenzo (Kenzo) | engine score 60, apply heavier base first
    ('Iris & Suede',
     'Powdery iris and violet run through both. Daim Blond lays a base of warm suede and almond; Kenzo Flower''s clean rose settles on top. Soft-spoken, a little nostalgic.',
     ARRAY['serge-daim','kenzo-flower-by-kenzo']::text[], ARRAY['serge-daim','kenzo-flower-by-kenzo']::text[],
     'Two sprays of Daim Blond to the chest, then one spray of Kenzo Flower to a wrist. Powdery and close — ideal worn under a coat.',
     ARRAY['office','cool-weather','daytime']::text[], 4),
    -- Asad (Lattafa) → then MYSLF (Yves Saint Laurent) | engine score 60, apply heavier base first
    ('Cedar, Day to Night',
     'Two ambroxan-forward woods that read clean by day and warm after dark. Asad''s pepper-vetiver base sits under MYSLF''s bright cardamom. The reliable everyday stack.',
     ARRAY['lattafa-asad','ysl-myslf']::text[], ARRAY['lattafa-asad','ysl-myslf']::text[],
     'Asad to the chest, two sprays, then MYSLF one spray to the neck. Office to evening with no need to reapply.',
     ARRAY['daytime','evening','office']::text[], 5),
    -- Shadow for Him (Ajmal) → then Hawas (Rasasi) | engine score 60, apply heavier base first
    ('Open Air',
     'A fresh, aromatic pairing — Shadow''s lavender and cedar ground Hawas''s airy ambroxan and pepper. Bright and breezy; the warm-weather workhorse.',
     ARRAY['ajmal-shadow','rasasi-hawas']::text[], ARRAY['ajmal-shadow','rasasi-hawas']::text[],
     'Two sprays of Shadow for Him to the chest, then Hawas one spray to each side of the neck. Daytime, warmer months; reapply after noon.',
     ARRAY['daytime','warm-weather','office']::text[], 4)
)
INSERT INTO combos
  (user_id, name, description, fragrance_ids, application_order,
   instructions, occasions, rating, is_public, save_count)
SELECT c.id, s.name, s.description, s.fragrance_ids, s.application_order,
       s.instructions, s.occasions, s.rating, true, 0
FROM seed s CROSS JOIN curator c
WHERE NOT EXISTS (
  SELECT 1 FROM combos x
  WHERE x.name = s.name AND x.user_id = c.id
);
