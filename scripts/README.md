# Catalog import scripts

## `import-parfumo-catalog.ts` — curated Parfumo catalog top-up

Generates [`supabase/seed-catalog.sql`](../supabase/seed-catalog.sql): an
**idempotent**, additive SQL file that adds a small, curated set of well-rated
fragrances from recognizable houses to the live `fragrances` table, taking the
catalog toward the ~200 target.

The script **never writes to any database**. Its only output is SQL that the
product owner runs by hand in the Supabase SQL editor.

### Why a curated top-up (not a 160-row bulk import)

The live catalog already holds ~185 hand-curated fragrances (confirmed against
topnote.cloud, not the stale ~40 baseline some docs assume). The product north
star is a curated, quiet-luxury catalog, so this adds a modest, recognizable
slice rather than a noisy dump. Source selection follows decision doc
`art_xzsw1Igb` — Parfumo (TidyTuesday) is the agreed free-tier source.

### Schema

**Option A — no schema changes.** Every value targets an existing `fragrances`
column (`lib/supabase/types.ts` `Fragrance`). Provenance (source + upstream id)
lives in this script and in the generated SQL's manifest comments, **not** in any
new DB column. No migration is required.

### Regenerating the seed

```bash
# 1. Download the Parfumo dataset (no scraping — one static CSV).
curl -L -o data/parfumo_data_clean.csv \
  https://raw.githubusercontent.com/rfordatascience/tidytuesday/main/data/2024/2024-12-10/parfumo_data_clean.csv

# 2. Snapshot the live catalog for dedupe (see below) -> data/existing.json

# 3. Generate the SQL.
npx tsx scripts/import-parfumo-catalog.ts
```

Useful flags: `--target=<n>` (net-new rows, default 30), `--per-house=<n>`
(variety cap, default 2), `--min-ratings=<n>` (Parfumo Rating_Count floor,
default 200), `--min-rating=<n>` (rescaled 0–5 quality floor, default 3.5),
`--sample=<path>` (also write the selection as JSON for review).

### Regenerating the dedupe snapshot (`data/existing.json`)

Dedupe runs against a snapshot of the live catalog. The discover page is
server-rendered, so the full catalog ships in the page's RSC payload (public
data, no secrets):

```bash
curl -s https://topnote.cloud/discover -o /tmp/discover.html
node -e '
  const fs=require("fs");
  let s=fs.readFileSync("/tmp/discover.html","utf8").replace(/\\"/g,String.fromCharCode(34)).replace(/\\\\/g,"\\");
  const re=/\{"id":"[^"]+","house":[\s\S]*?"bottle_image_url":(?:null|"[^"]*")(?:,"created_at":"[^"]*")?\}/g;
  const byId=new Map(); let m;
  while((m=re.exec(s))){ try{ const o=JSON.parse(m[0]); byId.set(o.id,o) }catch(e){} }
  fs.writeFileSync("data/existing.json", JSON.stringify([...byId.values()]));
  console.log("existing rows:", byId.size);
'
```

The NOT EXISTS guards in the generated SQL make it safe even if the snapshot is
slightly stale — re-running never inserts duplicates.

### Field mapping

| `fragrances` column | Source |
|---|---|
| `id` | slug of `house + name`, made unique against existing ids |
| `house` | catalog's canonical house display (matched from Parfumo `Brand`) |
| `name` | Parfumo `Name`, with the appended `<Brand> [Year] [Concentration]` tail stripped |
| `type` | top two `Main_Accords` (e.g. "Woody Spicy") |
| `category` | inherited from the house's dominant category in the live catalog |
| `scent_family` | dominant `Main_Accord`, mapped to TopNote's family vocabulary |
| `top_notes` / `heart_notes` / `base_notes` | `Top_Notes` / `Middle_Notes` / `Base_Notes` |
| `avg_rating` | `Rating_Value` rescaled from 0–10 to 0–5 |
| `review_count` | `Rating_Count` |
| `attributes` / `seasons` | `[]` — the dataset has no longevity/sillage/price/season data; nothing is fabricated |
| `bottle_image_url` | `NULL` — no licensed image; the UI falls back to an initial tile |

### Quality gates

Rows must come from a house already in the curated catalog, clear the rating-count
and rating floors, and carry a rich note pyramid (≥5 total notes). Selection
dedupes within the dataset and against the live catalog (including brand-prefixed
and leading-number name variants), then ranks by review count under a per-house
cap. Known near-duplicates that survive automatic dedupe are listed in the
script's `EXCLUDE` set.

### Licensing

Parfumo data is used here **only** as a non-commercial / free-tier demo source.
It must be replaced with a licensed source (e.g. FragDB) or first-party/affiliate
data before any commercial launch. See `art_xzsw1Igb`.

