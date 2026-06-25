# Top Note — Next.js

Fragrance discovery app built with Next.js 16 + Supabase + Tailwind.

## Environment Variables (set in Vercel dashboard)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
```

The following are server-only (no `NEXT_PUBLIC_` prefix — they never reach the browser bundle).
Set them in the Vercel dashboard under **Settings → Environment Variables** for both **Production** and **Preview**.
For local development, add them to `.env.local` (never commit this file).

```
OBVIOUS_API_KEY=       # Obvious workspace API key — generate at Settings → Workspace → Integrations → External Access
OBVIOUS_PROJECT_ID=    # Target Obvious project ID — from the project's workspace URL
```

See `.env.example` for the full list of required and optional variables.

## Dev

```bash
bun install
bun run dev
```

## Catalog import — Parfumo (Phase 1)

The catalog can be expanded from the ~40 hand-seeded fragrances to ~23.5K using
the open **Parfumo** dataset published by the [TidyTuesday](https://github.com/rfordatascience/tidytuesday/blob/main/data/2024/2024-12-10/readme.md)
project (2024-12-10). This is **Phase 1** of the data-sourcing plan: it keeps the
existing `fragrances` schema ("Option A") so the shipped Discover search and the
detail-page chip renderer keep working unchanged.

> No scraping. The import reads a single static CSV downloaded from the
> TidyTuesday GitHub repo. The CSV is **not** committed (`/data/*.csv` is
> git-ignored).

### One-time schema migration (additive, non-breaking)

Run `supabase/parfumo-import-migration.sql` in the Supabase **SQL Editor** first.
It adds two nullable provenance columns (`source`, `source_id`) and a unique
index on `source_id`. Existing rows are untouched (`source` stays `NULL`).

### Run the import

```bash
# 1. Download the dataset (~12 MB, ~59k rows)
curl -L -o data/parfumo_data_clean.csv \
  https://raw.githubusercontent.com/rfordatascience/tidytuesday/main/data/2024/2024-12-10/parfumo_data_clean.csv

# 2. Dry run — transform, dedupe and print stats, no DB writes
npx tsx scripts/import-parfumo.ts --dry-run

# 3. Live import — idempotent, safe to re-run
#    Requires a SERVICE-ROLE key (the anon key is blocked by RLS for writes).
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<service-role-key> \
  npx tsx scripts/import-parfumo.ts
```

Re-running is safe: rows upsert on `source_id`, so the second run updates in
place instead of inserting duplicates. Imported rows are also deduped against
existing fragrances by normalized `name + house`, so the seeded set (Creed
Aventus, etc.) is never duplicated.

Flags: `--file=<path>`, `--min-ratings=<n>` (default 5), `--limit=<n>`,
`--batch=<n>` (default 500), `--out=<path>` (writes a 30-row JSON sample).

### Column mapping (Parfumo → TopNote)

| Parfumo column | TopNote field | Transform |
|---|---|---|
| `Name` | `name` | trim; row dropped if empty |
| `Brand` | `house` | trim + collapse whitespace; `Unknown` if missing |
| `Concentration` | `type` | as-is (e.g. `Eau de Parfum`) or `''` |
| `Main_Accords` | `scent_family` | first/dominant accord |
| `Top_Notes` | `top_notes[]` | split on `,`, trim, de-dupe |
| `Middle_Notes` | `heart_notes[]` | split on `,`, trim, de-dupe |
| `Base_Notes` | `base_notes[]` | split on `,`, trim, de-dupe |
| `Rating_Value` | `avg_rating` | **rescaled 0–10 → 0–5** (`value / 2`, 1 dp) |
| `Rating_Count` | `review_count` | integer |
| `Number` | `source_id` | upstream id (idempotency key) |
| — | `source` | constant `parfumo_tidytuesday` |
| — | `attributes` | `[]` — dataset has no longevity/sillage/price/versatility; not fabricated |
| — | `seasons` | `[]` — dataset has no season votes |
| — | `category` | `designer` — Parfumo carries no designer/niche split (Phase-3 concern) |
| — | `bottle_image_url` | `null` — imported rows have no local bottle asset; card shows an initial fallback |

`Release_Year` and `Perfumers` have no home in the current schema (Option A) and
are intentionally dropped; they belong to the Phase-3 typed-column migration.

### Quality filter & row counts

The raw CSV has **59,325** rows, many of them sparse stubs. A row is kept only
if it has a name, at least one accord or note, and **`Rating_Count >= 5`**
(a reliable community score). Result of the latest dry run:

| Stage | Rows |
|---|---|
| Raw data rows | 59,325 |
| Filtered out (no notes/accords or `< 5` ratings) | 35,306 |
| Deduped within dataset (by `source_id`) | 477 |
| Deduped within dataset (by `name + house`) | 22 |
| **Kept for import** | **23,520** |

Lower the bar with `--min-ratings=1` to import the full long tail (~29k).
