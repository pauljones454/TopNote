-- Discover server-side search: supporting indexes.
--
-- Search filters `fragrances` with case-insensitive POSIX regex (`~*`, exposed by
-- PostgREST as `imatch`) on the text columns and with array overlap (`&&`) on the
-- note columns. pg_trgm's GIN opclass accelerates regex and ILIKE matching; the
-- default array GIN opclass accelerates overlap.
--
-- Run once against the project database (SQL editor or `supabase db execute`).
-- Safe to re-run: every statement is IF NOT EXISTS.

create extension if not exists pg_trgm;

create index if not exists fragrances_name_trgm_idx
  on public.fragrances using gin (name gin_trgm_ops);

create index if not exists fragrances_house_trgm_idx
  on public.fragrances using gin (house gin_trgm_ops);

create index if not exists fragrances_scent_family_trgm_idx
  on public.fragrances using gin (scent_family gin_trgm_ops);

create index if not exists fragrances_type_trgm_idx
  on public.fragrances using gin (type gin_trgm_ops);

create index if not exists fragrances_top_notes_idx
  on public.fragrances using gin (top_notes);

create index if not exists fragrances_heart_notes_idx
  on public.fragrances using gin (heart_notes);

create index if not exists fragrances_base_notes_idx
  on public.fragrances using gin (base_notes);

-- Browse and paging order: avg_rating desc, id asc, optionally narrowed by category.
create index if not exists fragrances_category_rating_idx
  on public.fragrances (category, avg_rating desc, id);

create index if not exists fragrances_rating_idx
  on public.fragrances (avg_rating desc, id);

analyze public.fragrances;
