#!/usr/bin/env python3
"""
Top Note — Bottle Image Generator
==================================
Generates flat-lay overhead bottle images for fragrances missing a bottle_image_url.

Usage:
    python3 scripts/generate_bottles.py [--limit N] [--dry-run] [--slug SLUG] [--id ID]

Steps per fragrance:
  1. Query Supabase for all fragrances with no bottle_image_url
  2. Deduplicate by (house, name) — one generation covers all duplicate DB rows
  3. Generate image via OpenAI gpt-image-1
  4. Save PNG to public/bottles/<slug>.png
  5. Upload to Cloudinary under topnote/bottles/<slug>
  6. Patch bottle_image_url on all matching Supabase rows

Env required (in .env.local or OS env):
  NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
  OPENAI_API_KEY   <-- real sk-... key (set in .env.local)
"""

import os, re, json, time, base64, hashlib, urllib.request, urllib.parse, argparse
from pathlib import Path
from collections import defaultdict

# ── Config ────────────────────────────────────────────────────────────────────

REPO_ROOT     = Path(__file__).parent.parent
BOTTLES_DIR   = REPO_ROOT / "public" / "bottles"
ENV_FILE      = REPO_ROOT / ".env.local"
IMAGE_SIZE    = "1024x1024"
IMAGE_QUALITY = "high"
SLEEP_BETWEEN = 4  # seconds between generations (rate-limit courtesy)

# ── Helpers ───────────────────────────────────────────────────────────────────

def load_env() -> dict:
    env = {}
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text().splitlines():
            line = line.strip()
            if "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip()
    for k, v in os.environ.items():
        if k not in env:
            env[k] = v
    return env

def slugify(text: str) -> str:
    chars = [
        ("\u2019",""),("'",""),("\u00e9","e"),("\u00e8","e"),("\u00ea","e"),
        ("\u00e2","a"),("\u00f4","o"),("\u00fb","u"),("\u00e0","a"),("\u00ee","i"),
        ("\u00e7","c"),("\u00ef","i"),("\u00fc","u"),("\u00f6","o"),("\u00e4","a"),
        ("&","and"),(",",""),(".",""),("(",""),(")",""),('"',""),
    ]
    text = text.lower()
    for s, d in chars:
        text = text.replace(s, d)
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    return re.sub(r"-+", "-", text).strip("-")

def make_slug(house: str, name: str) -> str:
    h, n = slugify(house), slugify(name)
    return n if n.startswith(h + "-") else f"{h}-{n}"

def build_prompt(house: str, name: str) -> str:
    return (
        f"Professional luxury product photography of the '{name}' fragrance by {house}. "
        "Pure flat-lay overhead shot — camera directly above, bird's-eye view. "
        "Bottle stands upright, cap on top, perfectly centered, generous padding all sides. "
        "One soft shadow falls to a single side, fully within the frame. "
        "Background: flat, smooth, warm neutral (#F7F3EE off-white parchment). "
        "No text overlays, no other objects, no hands. "
        "Clean, minimal, high-end editorial fragrance style."
    )

# ── Supabase ──────────────────────────────────────────────────────────────────

def sb(env, method, path, body=None):
    url = env["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/") + "/rest/v1/" + path.lstrip("/")
    key = env.get("SUPABASE_SERVICE_ROLE_KEY") or env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, method=method, headers={
        "apikey": key, "Authorization": f"Bearer {key}",
        "Content-Type": "application/json", "Prefer": "return=representation",
    })
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"Supabase {method} {path}: HTTP {e.code} {e.read()[:200]}")

def get_missing(env) -> list:
    rows = sb(env, "GET", "fragrances?select=id,house,name,bottle_image_url&order=house")
    groups = defaultdict(list)
    for r in rows:
        if not r.get("bottle_image_url"):
            groups[(r["house"].strip(), r["name"].strip())].append(r["id"])
    return [{"house": h, "name": n, "ids": ids} for (h, n), ids in sorted(groups.items())]

def update_url(env, ids, url):
    for fid in ids:
        sb(env, "PATCH", f"fragrances?id=eq.{fid}", {"bottle_image_url": url})

# ── OpenAI ────────────────────────────────────────────────────────────────────

def generate(env, prompt) -> str:
    api_key = env.get("OPENAI_API_KEY", "")
    if not api_key.startswith("sk-"):
        raise RuntimeError(
            "OPENAI_API_KEY missing or invalid.\n"
            "Add OPENAI_API_KEY=sk-... to .env.local then re-run."
        )
    payload = json.dumps({
        "model": "gpt-image-1", "prompt": prompt, "n": 1,
        "size": IMAGE_SIZE, "quality": IMAGE_QUALITY, "output_format": "png",
    }).encode()
    req = urllib.request.Request(
        "https://api.openai.com/v1/images/generations", data=payload,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            data = json.loads(r.read())
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"OpenAI {e.code}: {e.read()[:300]}")
    item = data["data"][0]
    if "b64_json" in item:
        return item["b64_json"]
    with urllib.request.urlopen(item["url"]) as r:
        return base64.b64encode(r.read()).decode()

# ── Cloudinary ────────────────────────────────────────────────────────────────

def upload(env, b64: str, slug: str) -> str:
    cloud, api_key, api_secret = (
        env["NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME"],
        env["CLOUDINARY_API_KEY"],
        env["CLOUDINARY_API_SECRET"],
    )
    ts  = str(int(time.time()))
    pid = f"topnote/bottles/{slug}"
    sig = hashlib.sha256(f"overwrite=true&public_id={pid}&timestamp={ts}{api_secret}".encode()).hexdigest()
    form = urllib.parse.urlencode({
        "file": f"data:image/png;base64,{b64}", "api_key": api_key,
        "timestamp": ts, "public_id": pid, "overwrite": "true", "signature": sig,
    }).encode()
    req = urllib.request.Request(
        f"https://api.cloudinary.com/v1_1/{cloud}/image/upload", data=form,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read())["secure_url"]
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"Cloudinary {e.code}: {e.read()[:300]}")

# ── Process one fragrance ─────────────────────────────────────────────────────

def process(env, frag, dry_run=False):
    house, name, ids = frag["house"], frag["name"], frag["ids"]
    slug = make_slug(house, name)
    local = BOTTLES_DIR / f"{slug}.png"
    pfx = "[DRY RUN] " if dry_run else ""

    print(f"\n{pfx}▶  {house} — {name}")
    print(f"   slug : {slug}")
    print(f"   ids  : {ids}")
    print(f"   prompt: {build_prompt(house, name)[:90]}...")

    if dry_run:
        return None

    print("   → Generating via OpenAI gpt-image-1...")
    b64 = generate(env, build_prompt(house, name))
    print(f"   ✓ Generated ({len(b64)//1024} KB b64)")

    BOTTLES_DIR.mkdir(parents=True, exist_ok=True)
    local.write_bytes(base64.b64decode(b64))
    print(f"   ✓ Saved   → public/bottles/{slug}.png")

    cdn = upload(env, b64, slug)
    print(f"   ✓ CDN     → {cdn}")

    update_url(env, ids, cdn)
    print(f"   ✓ DB      → {len(ids)} row(s) updated")

    return cdn

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    p = argparse.ArgumentParser(description="Generate Top Note bottle images")
    p.add_argument("--limit",   type=int, help="Max fragrances to process")
    p.add_argument("--dry-run", action="store_true", help="Print plan, call no APIs")
    p.add_argument("--slug",    help="Process only this slug")
    p.add_argument("--id",      help="Process only this Supabase fragrance ID")
    args = p.parse_args()

    env = load_env()
    print("=" * 60)
    print("Top Note — Bottle Image Generator")
    print("=" * 60)

    fragrances = get_missing(env)
    print(f"\n{len(fragrances)} unique fragrances need bottle images")

    if args.id:
        fragrances = [f for f in fragrances if args.id in f["ids"]]
    if args.slug:
        fragrances = [f for f in fragrances if make_slug(f["house"], f["name"]) == args.slug]
    if args.limit:
        fragrances = fragrances[:args.limit]

    if not fragrances:
        print("Nothing to process.")
        return

    if args.dry_run:
        print(f"\nDRY RUN — {len(fragrances)} fragrance(s):\n")
        for f in fragrances:
            print(f"  {f['house']} — {f['name']}  [{make_slug(f['house'], f['name'])}]")
        return

    ok, fail = [], []
    for i, frag in enumerate(fragrances, 1):
        print(f"\n[{i}/{len(fragrances)}]", end="")
        try:
            process(env, frag)
            ok.append(frag["name"])
        except Exception as e:
            print(f"\n   ✗ FAILED: {e}")
            fail.append((frag["name"], str(e)))
        if i < len(fragrances):
            time.sleep(SLEEP_BETWEEN)

    print("\n" + "=" * 60)
    print(f"Done: {len(ok)} succeeded, {len(fail)} failed")
    if fail:
        print("\nFailed:")
        for name, err in fail:
            print(f"  ✗ {name}: {err}")

if __name__ == "__main__":
    main()
