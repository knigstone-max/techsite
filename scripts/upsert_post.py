#!/usr/bin/env python3
"""Upsert markdown posts into the Supabase CMS (stdlib only).

Usage:
  python3 scripts/upsert_post.py content/he/my-post.md content/en/my-post.md   # publish these
  python3 scripts/upsert_post.py --all                                          # every post in content/he + content/en
  python3 scripts/upsert_post.py --draft content/he/x.md                       # save as draft instead
  python3 scripts/upsert_post.py --check                                       # only test the login

Credentials live OUTSIDE the repo in ~/.techsite-supabase-env (chmod 600), override with TECHSITE_SUPABASE_ENV:
  SUPABASE_URL=https://<ref>.supabase.co
  SUPABASE_PUBLISHABLE_KEY=sb_publishable_...      (public key)
  CMS_BOT_EMAIL=...   CMS_BOT_PASSWORD=...         (a CMS user with role editor; never commit this file)
The script signs in as that user, so Row Level Security applies; no service_role key is used.
The language comes from the folder (content/he or content/en). `date` becomes published_at.
Never prints keys or tokens.
"""
import json, os, sys, urllib.error, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
os.environ.setdefault("TECHSITE_NO_SUPABASE", "1")  # importing build.py must not fetch anything
import build  # noqa: E402  (reuses the site's frontmatter parser)

FIELDS = ["title", "excerpt", "category", "image", "image_alt", "image_credit", "image_credit_url", "image_position"]


def load_env():
    p = Path(os.environ.get("TECHSITE_SUPABASE_ENV", "~/.techsite-supabase-env")).expanduser()
    if not p.is_file():
        sys.exit(f"missing {p} (see the docstring)")
    env = {}
    for line in p.read_text().splitlines():
        if "=" in line and not line.lstrip().startswith("#"):
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip()
    for k in ("SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "CMS_BOT_EMAIL", "CMS_BOT_PASSWORD"):
        if not env.get(k):
            sys.exit(f"{p}: {k} is empty")
    return env


def call(method, url, key, body=None, token=None, prefer=None):
    h = {"apikey": key, "Content-Type": "application/json", "Authorization": f"Bearer {token or key}"}
    if prefer:
        h["Prefer"] = prefer
    req = urllib.request.Request(url, method=method, headers=h, data=json.dumps(body).encode() if body is not None else None)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            raw = r.read()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        msg = e.read().decode("utf-8", "replace")[:400]
        raise SystemExit(f"HTTP {e.code} on {method} {url.split('?')[0]}: {msg}")


def login(env):
    d = call("POST", env["SUPABASE_URL"] + "/auth/v1/token?grant_type=password", env["SUPABASE_PUBLISHABLE_KEY"],
             {"email": env["CMS_BOT_EMAIL"], "password": env["CMS_BOT_PASSWORD"]})
    return d["access_token"]


def to_row(path, status):
    path = Path(path).resolve()
    lang = path.parent.name
    if lang not in ("he", "en"):
        sys.exit(f"{path}: put the file in content/he or content/en")
    meta, body = build.parse_frontmatter(path.read_text(encoding="utf-8"), path.name)
    for k in ("title", "slug", "category", "date"):
        if not meta.get(k):
            sys.exit(f"{path.name}: missing {k}")
    if meta["category"] not in build.CAT_SLUGS:
        sys.exit(f"{path.name}: unknown category {meta['category']!r}")
    d = meta["date"]
    published_at = d + "T06:00:00+00:00" if len(d) == 10 else d
    src = meta.get("source_links") or []
    row = {"lang": lang, "slug": meta["slug"], "body": body.strip() + "\n",
           "source_links": src if isinstance(src, list) else [src],
           "placeholder": bool(meta.get("placeholder")),
           "status": "draft" if (status == "draft" or meta.get("draft") is True) else "published",
           "published_at": published_at}
    for k in FIELDS:
        row[k] = (meta.get(k) or None) if k != "excerpt" else (meta.get(k) or "")
    return row


def main(argv):
    status = "draft" if "--draft" in argv else "published"
    files = [a for a in argv if not a.startswith("--")]
    if "--all" in argv:
        files = sorted(str(p) for l in ("he", "en") for p in (ROOT / "content" / l).glob("*.md"))
    env = load_env()
    token = login(env)
    if "--check" in argv:
        print("login ok"); return
    if not files:
        sys.exit(__doc__)
    rows = [to_row(f, status) for f in files]
    url = env["SUPABASE_URL"] + "/rest/v1/posts?on_conflict=lang,slug&select=lang,slug,status"
    for i in range(0, len(rows), 20):
        out = call("POST", url, env["SUPABASE_PUBLISHABLE_KEY"], rows[i:i + 20], token,
                   prefer="resolution=merge-duplicates,return=representation")
        for r in out or []:
            print(f"upserted {r['lang']}/{r['slug']} ({r['status']})")


if __name__ == "__main__":
    main(sys.argv[1:])
