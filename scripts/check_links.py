#!/usr/bin/env python3
"""Check internal links in dist/: every href/src that points inside the site must resolve to a file.
Also checks that every page has a language-switch link and an hreflang pair.
Usage: python3 scripts/check_links.py [dist_dir] [base_path]"""
import re, sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse, unquote

DIST = Path(sys.argv[1] if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent / "dist")
BASE = "/" + (sys.argv[2] if len(sys.argv) > 2 else "/").strip("/") + "/"
BASE = BASE.replace("//", "/")

class P(HTMLParser):
    def __init__(self):
        super().__init__(); self.links = []; self.switch = False; self.hreflang = set(); self.ids = set()
    def handle_starttag(self, tag, a):
        a = dict(a)
        if "id" in a: self.ids.add(a["id"])
        for k in ("href", "src"):
            if a.get(k): self.links.append(a[k])
        if tag == "a" and "lang-switch" in (a.get("class") or ""): self.switch = True
        if tag == "link" and a.get("rel") == "alternate" and a.get("hreflang"): self.hreflang.add(a["hreflang"])

def resolve(href, page):
    u = urlparse(href)
    if u.scheme or u.netloc or href.startswith(("mailto:", "#")): return None
    path = unquote(u.path)
    if path.startswith("/"):
        if not path.startswith(BASE): return ("bad-base", path)
        target = DIST / path[len(BASE):]
    else:
        target = (page.parent / path)
    if path.endswith("/") or target.is_dir(): target = target / "index.html"
    return target

errors, checked, pages = [], 0, 0
for page in sorted(DIST.rglob("*.html")):
    pages += 1
    p = P(); p.feed(page.read_text(encoding="utf-8"))
    name = page.relative_to(DIST).as_posix()
    if name != "404.html":
        if not p.switch: errors.append(f"{name}: no language switch")
        if not {"he", "en"} <= p.hreflang: errors.append(f"{name}: missing hreflang he/en ({p.hreflang})")
    for href in p.links:
        t = resolve(href, page)
        if t is None: continue
        checked += 1
        if isinstance(t, tuple): errors.append(f"{name}: link outside base {href}")
        elif not t.exists(): errors.append(f"{name}: broken {href}")
for f in ("sitemap.xml", "feed.xml", "en/feed.xml", "robots.txt", "404.html"):
    if not (DIST / f).exists(): errors.append(f"missing {f}")
print(f"Pages: {pages}, internal links checked: {checked}, errors: {len(errors)}")
for e in errors: print("  " + e)
sys.exit(1 if errors else 0)
