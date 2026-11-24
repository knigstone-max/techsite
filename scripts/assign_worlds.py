#!/usr/bin/env python3
"""File every post into a world (home / play / techhigh) and a type (reviews / news / comparisons /
recommendations / guides). Deterministic: the rules and hand-checked exceptions live in build.py (classify).

Usage:
  python3 scripts/assign_worlds.py              # dry run: print the mapping and the counts
  python3 scripts/assign_worlds.py --write      # write world/type into content/*/*.md and the CMS (posts table)
  python3 scripts/assign_worlds.py --write --force   # also re-classify posts that already have world/type

Only the `world` and `type` fields change. Titles, bodies and every other field are left alone.
The CMS update signs in as the editor bot from ~/.techsite-supabase-env (see upsert_post.py), so RLS applies.
"""
import collections, json, re, sys, urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "scripts"))
import build  # noqa: E402
import upsert_post as up  # noqa: E402  (sets TECHSITE_NO_SUPABASE before importing build)


def set_fm(path, world, typ):
    text = path.read_text(encoding="utf-8")
    m = re.match(r"^(---\s*\n)(.*?)(\n---\s*(?:\n|$))", text, re.S)
    fm = m.group(2)
    lines = [l for l in fm.split("\n") if not re.match(r"^(world|type):", l)]
    i = next((k for k, l in enumerate(lines) if l.startswith("category:")), len(lines) - 1)
    lines[i + 1:i + 1] = [f"world: {world}", f"type: {typ}"]
    new = m.group(1) + "\n".join(lines) + m.group(3) + text[m.end():]
    if new != text:
        path.write_text(new, encoding="utf-8")
        return True
    return False


def main(argv):
    write, force = "--write" in argv, "--force" in argv
    env = up.load_env()
    token = up.login(env)
    base = env["SUPABASE_URL"] + "/rest/v1/posts"
    rows = []
    while True:
        page = up.call("GET", f"{base}?select=lang,slug,title,category,world,type,status&order=slug&limit=1000&offset={len(rows)}",
                       env["SUPABASE_PUBLISHABLE_KEY"], token=token)
        rows += page
        if len(page) < 1000:
            break
    md = {}
    for lang in ("he", "en"):
        for f in sorted((ROOT / "content" / lang).glob("*.md")):
            meta, _ = build.parse_frontmatter(f.read_text(encoding="utf-8"), f.name)
            md[(lang, meta["slug"])] = (f, meta)
    # one decision per slug, shared by both languages; the English title helps the keyword rules
    info = {}
    for r in rows:
        d = info.setdefault(r["slug"], {"slug": r["slug"]})
        d.setdefault("category", r["category"])
        if r["lang"] == "en":
            d["title_en"] = r["title"]
        if r.get("world") and r.get("type") and not force:
            d.setdefault("fixed", (r["world"], r["type"]))
    for (lang, slug), (f, meta) in md.items():
        d = info.setdefault(slug, {"slug": slug})
        d.setdefault("category", meta["category"])
        if lang == "en":
            d.setdefault("title_en", meta["title"])
        if meta.get("world") in build.WORLD_SLUGS and meta.get("type") in build.TYPE_SLUGS and not force:
            d.setdefault("fixed", (meta["world"], meta["type"]))
    decision = {s: d.get("fixed") or build.classify(d) for s, d in info.items()}

    counts = collections.Counter()
    for r in rows:
        if r["status"] == "published":
            counts[(r["lang"],) + decision[r["slug"]]] += 1
    for k in sorted(counts):
        print(f"{k[0]} {k[1]:9} {k[2]:16} {counts[k]}")
    if not write:
        for s in sorted(decision):
            print(s, *decision[s])
        return
    changed_md = sum(set_fm(f, *decision[slug]) for (lang, slug), (f, _) in md.items())
    groups = collections.defaultdict(list)
    for r in rows:
        if (r.get("world"), r.get("type")) != decision[r["slug"]]:
            groups[decision[r["slug"]]].append(r["slug"])
    n = 0
    for (w, t), slugs in groups.items():
        slugs = sorted(set(slugs))
        for i in range(0, len(slugs), 40):
            part = slugs[i:i + 40]
            q = urllib.parse.quote("in.(" + ",".join(part) + ")", safe="().,")
            out = up.call("PATCH", f"{base}?slug={q}&select=lang,slug", env["SUPABASE_PUBLISHABLE_KEY"],
                          {"world": w, "type": t}, token, prefer="return=representation")
            n += len(out or [])
    print(f"markdown files updated: {changed_md}; CMS rows updated: {n}")


if __name__ == "__main__":
    main(sys.argv[1:])
