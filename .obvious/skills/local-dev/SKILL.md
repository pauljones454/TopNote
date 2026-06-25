---
name: local-dev
version: 1.0.0
description: Bring TopNote's local development environment up from scratch.
category: local-dev
triggers:
  - local dev setup
  - run repo locally
  - start dev server
  - bring up local stack
author: autobuild-setup
created: 2026-06-25
---

## Prerequisites

- **Bun:** 1.3.14 (`bun --version` to verify)
- **Node:** v20.20.2 (available in PATH, used by Next.js internals)
- **No Docker required** — Supabase is cloud-hosted
- **No local DB** — all data lives in Supabase cloud

## Install

Dependencies are managed with Bun and are already installed in the sandbox snapshot.
If node_modules is missing or stale:

```bash
bun install
```

## Environment

Create `.env.local` in the repo root with the following variables. Get values from the Vercel dashboard or the repo owner:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
```

- `NEXT_PUBLIC_SUPABASE_URL` — **required secret** — Supabase project URL. Stub OK for server start, but all data fetches will fail.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — **required secret** — Supabase anon JWT. Same caveat.
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` — **optional** — for image optimization. App starts without it; images degrade to direct URLs.

**Note:** `.env.local` is gitignored. Do not commit it.

## Start

```bash
bun run dev
```

- **Port:** 3000 (observed: `http://localhost:3000`)
- **Startup time:** ~340–410ms (Turbopack)
- **Deprecation notice:** `middleware` file convention is deprecated in Next.js 16 — ignore or migrate to `proxy` convention when ready

## Verify Primary User Flow

With stub Supabase credentials:

1. Open `http://localhost:3000/` — should return HTTP 200 with layout and sidebar
2. Sidebar navigation shows: Home, Discover, Collection, Layers, Profile
3. "Trending" and "Niche Picks" sections render (empty with stub credentials — expected)
4. Navigate to `/discover` — HTTP 200, search layout visible
5. Navigate to `/auth` — HTTP 200, auth flow renders

With real Supabase credentials:

1. Sign in at `/auth`
2. Browse fragrances at `/discover`
3. Add fragrance to collection at `/collection`
4. Create a fragrance layer at `/layers`

Evidence screenshots from setup run (stub credentials):
- Homepage: artifact `fl_cNKKTPtN`
- Discover: artifact `fl_FCWQr2Qb`

## Verified Commands

- Typecheck: `npx tsc --noEmit` — verified, no errors
- Lint: not_discovered (no lint scripts in package.json)
- Test: not_discovered (no test scripts in package.json)

## Sandbox Snapshot

- snapshotId: `jprspcqizkbvqfuptrgo:default` — restoring this snapshot reproduces the verified-healthy state from install.
- Captured: `2026-06-25T18:29:32.872Z`

## Known Blockers / Workarounds

- **missing_secret (non-fatal):** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` were stubbed during setup. The dev server starts and routes load correctly, but all Supabase data fetches fail silently. To validate with real data, obtain credentials from Vercel dashboard.
- **missing_secret (non-fatal):** `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` was stubbed. Images served from Cloudinary will fail to optimize; non-Cloudinary content unaffected.
- **middleware deprecation:** Next.js 16 shows `⚠ The "middleware" file convention is deprecated` on startup. App functions normally; migrate `middleware.ts` to `proxy` convention when refactoring auth.

