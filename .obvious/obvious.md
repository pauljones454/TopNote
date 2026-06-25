# Repo guidance

## Codebase Map

See `.obvious/codebase-map.md`.

## Rules

<!-- synthesized from: AGENTS.md, CLAUDE.md — agent-relevant rules only -->

- **Next.js 16 breaking changes:** APIs, conventions, and file structure differ from training data. Read `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices. The `middleware` file convention is deprecated — use `proxy` instead.
- **Design skills (MANDATORY for UI work):** Read all three skill files before writing or modifying any frontend component:
  1. `skills/soft-skill/SKILL.md` — Visual language: typography, color, spacing, shadow, motion. Definitive style guide for Top Note.
  2. `skills/taste-skill/SKILL.md` — Engineering discipline: component architecture, Tailwind v4 rules, Next.js 16 patterns, strict anti-patterns.
  3. `skills/output-skill/SKILL.md` — Output completeness: no stubs, no truncation, no placeholder code.
- **Design north star:** Quiet luxury. Editorial, warm, airy — like a high-end fragrance house, not a social app.
- **Env vars** are set in Vercel dashboard. For local dev, create `.env.local` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`.

## Local Verification

> **Warning:** Running full-repo typecheck may OOM or timeout in the sandbox for large repos.

### Verified Commands

- **Typecheck:** `npx tsc --noEmit` — verified (no errors)
- **Lint:** not_discovered — no lint scripts defined in package.json
- **Test:** not_discovered — no test scripts defined in package.json
- **Build:** `bun run build` — not verified in sandbox (requires valid Supabase credentials)

### Scoped Workflow

No scoped lint or test commands configured. For typecheck:

1. **Typecheck:** `npx tsc --noEmit`

## Sandbox Snapshot

- **Snapshot ID:** `jprspcqizkbvqfuptrgo:default`
- **Captured:** `2026-06-25T18:29:32.872Z`
- **Dev stack healthy:** yes

## Product Atlas

7 nodes upserted (0 reused, 7 created) during autobuild-setup scan:

| Slug | Type | Description |
|---|---|---|
| `topnote` | system | TopNote app root |
| `topnote-supabase` | integration | Supabase Auth & Database |
| `topnote-cloudinary` | integration | Cloudinary Image Hosting |
| `topnote-vercel` | infrastructure | Vercel Deployment |
| `topnote-discovery` | feature | Fragrance Discovery |
| `topnote-layering` | feature | Fragrance Layering |
| `topnote-collection` | feature | Collection & Profile |

## Security Scan

> **Status:** security_scan_queued — the scan runs asynchronously. Results will appear in Product Atlas when complete.

## Runbooks

[Populated by autobuild-runbooks skill when requested. See `.obvious/runbooks/` after that skill runs.]

