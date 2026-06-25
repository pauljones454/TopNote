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
