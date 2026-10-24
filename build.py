#!/usr/bin/env python3
"""Static site generator for the bilingual tech site. Python 3 stdlib only.

Usage:  python3 build.py
Env overrides:
  SITE_URL   absolute site URL used in sitemap/RSS/canonical (e.g. https://user.github.io/repo)
  BASE_PATH  URL path prefix where the site is served (e.g. /repo/ for GitHub project pages, / for pages.dev)
Output: ./dist
"""
import html, json, os, re, shutil, struct, sys
from datetime import datetime, timezone
from email.utils import format_datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CONTENT = ROOT / "content"
STATIC = ROOT / "static"
DIST = ROOT / "dist"
CFG = json.loads((ROOT / "site.json").read_text(encoding="utf-8"))
SITE_URL = os.environ.get("SITE_URL", CFG["site_url"]).rstrip("/")
BASE = os.environ.get("BASE_PATH", CFG["base_path"])
BASE = "/" + BASE.strip("/") + "/" if BASE.strip("/") else "/"
LANGS = ["he", "en"]
DIR = {"he": "rtl", "en": "ltr"}
OG_LOCALE = {"he": "he_IL", "en": "en_US"}
CATS = CFG["categories"]
CAT_SLUGS = {c["slug"] for c in CATS}
for _c in CATS:
    if _c.get("image") and not (STATIC / _c["image"]).is_file():
        sys.exit(f"ERROR site.json: category {_c['slug']}: image not found: static/{_c['image']}")
REQUIRED = ["title", "date", "slug", "category", "excerpt"]
esc = lambda s: html.escape(str(s), quote=True)


# ---------- paths ----------
def lang_prefix(lang):
    return "" if lang == CFG["default_lang"] else f"{lang}/"

def rel(lang, path=""):
    """Site-relative path (no base), e.g. 'en/posts/x/'."""
    return lang_prefix(lang) + path

def url(lang, path=""):
    return BASE + rel(lang, path)

def abs_url(lang, path=""):
    return SITE_URL + "/" + rel(lang, path)

def asset(name):
    return BASE + "assets/" + name

def abs_asset(name):
    return SITE_URL + "/assets/" + name


# ---------- images ----------
def image_size(path):
    """(width, height) of a WebP, PNG or JPEG file, stdlib only."""
    b = path.read_bytes()
    if b[:4] == b"RIFF" and b[8:12] == b"WEBP":
        c = b[12:16]
        if c == b"VP8 ":
            w, h = struct.unpack("<HH", b[26:30]); return w & 0x3FFF, h & 0x3FFF
        if c == b"VP8L":
            v = int.from_bytes(b[21:25], "little"); return (v & 0x3FFF) + 1, ((v >> 14) & 0x3FFF) + 1
        if c == b"VP8X":
            return int.from_bytes(b[24:27], "little") + 1, int.from_bytes(b[27:30], "little") + 1
    if b[:8] == b"\x89PNG\r\n\x1a\n":
        return struct.unpack(">II", b[16:24])
    if b[:2] == b"\xff\xd8":
        i = 2
        while i < len(b) - 9:
            if b[i] != 0xFF: i += 1; continue
            m = b[i + 1]
            if m in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
                h, w = struct.unpack(">HH", b[i + 5:i + 9]); return w, h
            i += 2 + struct.unpack(">H", b[i + 2:i + 4])[0]
    raise ValueError("unsupported image format (use .webp, .png or .jpg)")

def load_image(meta, where):
    """Validate the optional image fields. `image` is a path under static/ (e.g. img/posts/x.webp)."""
    img = meta.get("image")
    if not img:
        meta["image"] = None
        return
    img = img.lstrip("/")
    if img.startswith("assets/"):
        img = img[len("assets/"):]
    if img.startswith("static/"):
        img = img[len("static/"):]
    if re.match(r"^[a-z]+://", img):
        sys.exit(f"ERROR {where}: image must be a local file under static/, not a URL (no hotlinking)")
    f = STATIC / img
    if not f.is_file():
        sys.exit(f"ERROR {where}: image file not found: static/{img}")
    if not meta.get("image_alt"):
        sys.exit(f"ERROR {where}: image_alt is required when image is set")
    if not meta.get("image_credit"):
        sys.exit(f"ERROR {where}: image_credit is required when image is set")
    try:
        w, h = image_size(f)
    except ValueError as e:
        sys.exit(f"ERROR {where}: static/{img}: {e}")
    meta["image"] = {"path": img, "src": asset(img), "abs": abs_asset(img), "w": w, "h": h,
                     "alt": meta["image_alt"], "credit": meta["image_credit"],
                     "credit_url": meta.get("image_credit_url") or "", "pos": meta.get("image_position") or ""}


# ---------- content parsing ----------
def parse_frontmatter(text, fname):
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", text, re.S)
    if not m:
        sys.exit(f"ERROR {fname}: missing frontmatter (--- ... ---)")
    meta, key = {}, None
    for line in m.group(1).splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        li = re.match(r"^\s+-\s+(.*)$", line)
        if li and key:
            meta.setdefault(key, [])
            if not isinstance(meta[key], list):
                meta[key] = []
            meta[key].append(li.group(1).strip().strip('"'))
            continue
        kv = re.match(r"^([A-Za-z_]+):\s*(.*)$", line)
        if not kv:
            sys.exit(f"ERROR {fname}: bad frontmatter line: {line!r}")
        key, val = kv.group(1), kv.group(2).strip()
        if val.startswith("[") and val.endswith("]"):
            meta[key] = [v.strip().strip('"') for v in val[1:-1].split(",") if v.strip()]
        elif val.lower() in ("true", "false"):
            meta[key] = val.lower() == "true"
        else:
            meta[key] = val.strip('"')
    return meta, m.group(2)

def inline_md(s):
    s = esc(s)
    s = re.sub(r"`([^`]+)`", r"<code>\1</code>", s)
    s = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", s)
    s = re.sub(r"(?<!\*)\*(?!\*)(.+?)\*", r"<em>\1</em>", s)
    def link(m):
        href = m.group(2)
        ext = href.startswith("http")
        attrs = ' rel="noopener" target="_blank"' if ext else ""
        return f'<a href="{href}"{attrs}>{m.group(1)}</a>'
    s = re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", link, s)
    return s

def md_to_html(md):
    out, para, lst = [], [], None
    def flush():
        nonlocal para, lst
        if para:
            out.append("<p>" + inline_md(" ".join(para)) + "</p>"); para = []
        if lst:
            tag = lst[0]
            out.append(f"<{tag}>" + "".join(f"<li>{inline_md(i)}</li>" for i in lst[1]) + f"</{tag}>")
            lst = None
    for line in md.splitlines():
        s = line.strip()
        if not s:
            flush(); continue
        h = re.match(r"^(#{2,4})\s+(.*)$", s)
        ul = re.match(r"^[-*]\s+(.*)$", s)
        ol = re.match(r"^\d+[.)]\s+(.*)$", s)
        if h:
            flush(); n = len(h.group(1)); out.append(f"<h{n}>{inline_md(h.group(2))}</h{n}>")
        elif s.startswith(">"):
            flush(); out.append(f"<blockquote><p>{inline_md(s.lstrip('> '))}</p></blockquote>")
        elif ul or ol:
            if para:
                out.append("<p>" + inline_md(" ".join(para)) + "</p>"); para = []
            tag = "ul" if ul else "ol"
            if not lst or lst[0] != tag:
                flush(); lst = (tag, [])
            lst[1].append((ul or ol).group(1))
        else:
            if lst: flush()
            para.append(s)
    flush()
    return "\n".join(out)

def load_posts(lang):
    posts = []
    folder = CONTENT / lang
    for f in sorted(folder.glob("*.md")):
        meta, body = parse_frontmatter(f.read_text(encoding="utf-8"), f.name)
        miss = [k for k in REQUIRED if not meta.get(k)]
        if miss:
            sys.exit(f"ERROR {lang}/{f.name}: missing {miss}")
        if meta["category"] not in CAT_SLUGS:
            sys.exit(f"ERROR {lang}/{f.name}: unknown category {meta['category']!r}; use one of {sorted(CAT_SLUGS)}")
        if not re.fullmatch(r"[a-z0-9-]+", meta["slug"]):
            sys.exit(f"ERROR {lang}/{f.name}: slug must be lowercase latin letters, digits, hyphens")
        try:
            meta["dt"] = datetime.fromisoformat(meta["date"]).replace(tzinfo=timezone.utc) \
                if len(meta["date"]) == 10 else datetime.fromisoformat(meta["date"])
            if meta["dt"].tzinfo is None:
                meta["dt"] = meta["dt"].replace(tzinfo=timezone.utc)
        except ValueError:
            sys.exit(f"ERROR {lang}/{f.name}: date must be YYYY-MM-DD or ISO 8601")
        if meta.get("draft") is True:
            continue
        src = meta.get("source_links", [])
        meta["source_links"] = src if isinstance(src, list) else [src]
        meta["html"] = md_to_html(body)
        meta["lang"] = lang
        load_image(meta, f"{lang}/{f.name}")
        posts.append(meta)
    slugs = [p["slug"] for p in posts]
    dup = {s for s in slugs if slugs.count(s) > 1}
    if dup:
        sys.exit(f"ERROR {lang}: duplicate slugs {dup}")
    posts.sort(key=lambda p: p["dt"], reverse=True)
    return posts


# ---------- templates ----------
def cat_name(slug, lang):
    return next(c[lang] for c in CATS if c["slug"] == slug)

def fmt_date(dt, lang):
    if lang == "he":
        return dt.strftime("%d.%m.%Y")
    return dt.strftime("%b %-d, %Y")

THEME_BOOT = ("(function(){try{var t=localStorage.getItem('theme');"
              "if(t!=='light'&&t!=='dark'){t='dark'}"
              "document.documentElement.dataset.theme=t}catch(e){}})();")

ICON_SUN = '<svg class="i-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 1.5v3M12 19.5v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M1.5 12h3M19.5 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>'
ICON_MOON = '<svg class="i-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z"/></svg>'
ICON_MENU = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>'
ICON_PEN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/></svg>'
ICON_SHIELD = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/></svg>'
ICON_CHEV = '<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>'
ICON_USER = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>'

def cat_img(c, lang, size="tile", eager=False):
    """Category image (decorative inside a labelled link). Credit goes in the title attribute and on the about page."""
    if not c.get("image"):
        return ""
    w, h = image_size(STATIC / c["image"])
    load = 'loading="eager"' if eager else 'loading="lazy"'
    return (f'<img src="{asset(c["image"])}" alt="" width="{w}" height="{h}" {load} decoding="async" '
            f'title="{esc(c.get("image_credit", ""))}">')

def cat_counts(lang):
    return CAT_COUNTS.get(lang, {})

def count_label(n, lang):
    t = CFG["strings"][lang]
    return t["post_count_one"] if n == 1 else f'{n} {t["posts_count"]}'

def cat_tiles(lang, cls="cat-tiles", eager=False):
    """Image tiles for every category: homepage strip (scrolls sideways on mobile) and mega-menu."""
    counts = cat_counts(lang)
    items = "".join(
        f'<li><a class="cat-tile c-{c["slug"]}" href="{url(lang, "category/" + c["slug"] + "/")}">'
        f'<span class="cat-tile-media">{cat_img(c, lang, eager=eager)}</span>'
        f'<span class="cat-tile-text"><strong>{esc(c[lang])}</strong><small>{esc(count_label(counts.get(c["slug"], 0), lang))}</small></span></a></li>'
        for c in CATS)
    return f'<ul class="{cls}">{items}</ul>'

def cat_bar(lang):
    """Slim one-tap category bar under the header (all pages except home and the categories index)."""
    t = CFG["strings"][lang]
    items = "".join(
        f'<li><a class="cat-pill c-{c["slug"]}" href="{url(lang, "category/" + c["slug"] + "/")}">'
        f'<span class="cat-pill-img" aria-hidden="true">{cat_img(c, lang)}</span>{esc(c[lang])}</a></li>' for c in CATS)
    items += f'<li><a class="cat-pill cat-pill-all" href="{url(lang, "categories/")}">{esc(t["all_categories"])}</a></li>'
    return f'<nav class="cat-bar" aria-label="{esc(t["categories"])}"><div class="wrap"><ul>{items}</ul></div></nav>'

def layout(lang, path, title, description, body, other_path, og_type="website", noindex=False, needs_auth=False, image=None, catbar=True):
    """path / other_path: site-relative paths without lang prefix, e.g. 'posts/x/'."""
    t = CFG["strings"][lang]
    other = "en" if lang == "he" else "he"
    full_title = f"{title} | {t['site_name']}" if title != t["site_name"] else title
    mega = (f'<div class="mega" id="mega-cats"><div class="mega-inner">{cat_tiles(lang, "mega-tiles")}'
            f'<a class="mega-all" href="{url(lang, "categories/")}">{esc(t["all_categories"])} &rarr;</a></div></div>')
    nav = (f'<li class="has-mega"><a class="nav-cats" href="{url(lang, "categories/")}" aria-haspopup="true">{esc(t["categories"])}{ICON_CHEV}</a>{mega}</li>')
    alt = "".join(
        f'<link rel="alternate" hreflang="{l}" href="{abs_url(l, p)}">'
        for l, p in ((lang, path), (other, other_path)))
    alt += f'<link rel="alternate" hreflang="x-default" href="{abs_url(CFG["default_lang"], path if lang == CFG["default_lang"] else other_path)}">'
    auth_js = f'<script src="{asset("config.js")}"></script>\n<script type="module" src="{asset("auth.js")}"></script>'
    robots = '<meta name="robots" content="noindex">' if noindex else ""
    if image:
        og_img = (f'<meta property="og:image" content="{esc(image["abs"])}">\n'
                  f'<meta property="og:image:width" content="{image["w"]}">\n'
                  f'<meta property="og:image:height" content="{image["h"]}">\n'
                  f'<meta property="og:image:alt" content="{esc(image["alt"])}">\n'
                  f'<meta name="twitter:card" content="summary_large_image">\n'
                  f'<meta name="twitter:image" content="{esc(image["abs"])}">\n'
                  f'<meta name="twitter:image:alt" content="{esc(image["alt"])}">')
    else:
        og_img = '<meta name="twitter:card" content="summary">'
    return f"""<!doctype html>
<html lang="{lang}" dir="{DIR[lang]}" data-base="{BASE}" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script>{THEME_BOOT}</script>
<title>{esc(full_title)}</title>
<meta name="description" content="{esc(description)}">
{robots}
<link rel="canonical" href="{abs_url(lang, path)}">
{alt}
<meta property="og:type" content="{og_type}">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(description)}">
<meta property="og:url" content="{abs_url(lang, path)}">
<meta property="og:site_name" content="{esc(t['site_name'])}">
<meta property="og:locale" content="{OG_LOCALE[lang]}">
<meta property="og:locale:alternate" content="{OG_LOCALE[other]}">
{og_img}
<meta name="theme-color" content="#0b0e14">
<link rel="alternate" type="application/rss+xml" title="{esc(t['site_name'])} RSS" href="{url(lang, 'feed.xml')}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Rubik:wght@400;500;600;700&family=Secular+One&display=swap">
<link rel="stylesheet" href="{asset('style.css')}">
<link rel="icon" href="{asset('favicon.svg')}" type="image/svg+xml">
<script src="{asset('main.js')}" defer></script>
{auth_js}
</head>
<body>
<a class="skip" href="#main">{esc(t['skip'])}</a>
<header class="site-header">
  <div class="wrap header-row">
    <button class="icon-btn nav-toggle" aria-expanded="false" aria-controls="site-nav" aria-label="{esc(t['menu'])}">{ICON_MENU}</button>
    <a class="brand" href="{url(lang)}"><span class="brand-mark" aria-hidden="true"></span>{esc(t['site_name'])}</a>
    <nav id="site-nav" class="site-nav" aria-label="{esc(t['categories'])}">
      <ul>
        {nav}
        <li><a href="{url(lang, 'archive/')}">{esc(t['archive'])}</a></li>
        <li><a href="{url(lang, 'about/')}">{esc(t['about'])}</a></li>
      </ul>
    </nav>
    <div class="header-tools">
      <a class="lang-switch" href="{url(other, other_path)}" hreflang="{other}" lang="{other}">{esc(t['switch'])}</a>
      <button class="icon-btn theme-toggle" type="button" aria-label="{esc(t['theme'])}" title="{esc(t['theme'])}">{ICON_SUN}{ICON_MOON}</button>
      <a class="icon-btn role-link" href="{url(lang, 'dashboard/')}" data-role-min="writer" hidden aria-label="{esc(t['dashboard'])}" title="{esc(t['dashboard'])}">{ICON_PEN}</a>
      <a class="icon-btn role-link" href="{url(lang, 'admin/')}" data-role-min="admin" hidden aria-label="{esc(t['admin'])}" title="{esc(t['admin'])}">{ICON_SHIELD}</a>
      <a class="icon-btn account-link" href="{url(lang, 'account/')}" aria-label="{esc(t['account'])}" title="{esc(t['account'])}" data-auth-link>{ICON_USER}</a>
    </div>
  </div>
</header>
{cat_bar(lang) if catbar else ""}
<main id="main" class="wrap">
{body}
</main>
<footer class="site-footer">
  <div class="wrap footer-row">
    <div><a class="brand" href="{url(lang)}"><span class="brand-mark" aria-hidden="true"></span>{esc(t['site_name'])}</a><p>{esc(t['tagline'])}</p></div>
    <ul class="footer-links">
      <li><a href="{url(lang, 'archive/')}">{esc(t['archive'])}</a></li>
      <li><a href="{url(lang, 'about/')}">{esc(t['about'])}</a></li>
      <li><a href="{url(lang, 'feed.xml')}">{esc(t['rss'])}</a></li>
      <li><a href="{url(other, other_path)}" hreflang="{other}" lang="{other}">{esc(t['switch'])}</a></li>
    </ul>
  </div>
</footer>
</body>
</html>
"""

def thumb(p, lang, big=False, eager=False):
    """Card/hero media. Real image when the post has one, otherwise the CSS-gradient placeholder.
    Decorative here (the linked title next to it carries the meaning), so alt is empty."""
    cls = f'thumb c-{p["category"]}{" thumb-big" if big else ""}'
    label = f'<span>{esc(cat_name(p["category"], lang))}</span>'
    im = p.get("image")
    if not im:
        return f'<div class="{cls}" aria-hidden="true">{label}</div>'
    load = 'loading="eager" fetchpriority="high"' if eager else 'loading="lazy"'
    pos = f' style="object-position:{esc(im["pos"])}"' if im.get("pos") else ""
    return (f'<div class="{cls} has-img" aria-hidden="true"><img src="{esc(im["src"])}" alt="" width="{im["w"]}" height="{im["h"]}"{pos} '
            f'{load} decoding="async">{label}</div>')

def post_figure(p, lang):
    """Lead image at the top of a post, with alt text and a credit line."""
    im = p.get("image")
    if not im:
        return thumb(p, lang, big=True)
    credit = esc(im["credit"])
    if im["credit_url"]:
        credit = f'<a href="{esc(im["credit_url"])}" rel="noopener" target="_blank">{credit}</a>'
    return (f'<figure class="post-figure"><div class="thumb thumb-big has-img c-{p["category"]}">'
            f'<img src="{esc(im["src"])}" alt="{esc(im["alt"])}" width="{im["w"]}" height="{im["h"]}" loading="eager" fetchpriority="high" decoding="async"></div>'
            f'<figcaption class="credit">{credit}</figcaption></figure>')

def meta_line(p, lang):
    t = CFG["strings"][lang]
    badge = f' <span class="badge">{esc(t["placeholder"])}</span>' if p.get("placeholder") else ""
    return (f'<p class="meta"><a class="cat" href="{url(lang, "category/" + p["category"] + "/")}">{esc(cat_name(p["category"], lang))}</a>'
            f'<time datetime="{p["dt"].date().isoformat()}">{fmt_date(p["dt"], lang)}</time>{badge}</p>')

def card(p, lang):
    href = url(lang, "posts/" + p["slug"] + "/")
    return f"""<article class="card">
  <a class="card-media" href="{href}" tabindex="-1" aria-hidden="true">{thumb(p, lang)}</a>
  <div class="card-body">
  {meta_line(p, lang)}
  <h3><a href="{href}">{esc(p['title'])}</a></h3>
  <p class="excerpt">{esc(p['excerpt'])}</p>
  </div>
</article>"""

def hero(p, lang):
    t = CFG["strings"][lang]
    href = url(lang, "posts/" + p["slug"] + "/")
    return f"""<article class="hero-story">
  <a class="hero-media" href="{href}" tabindex="-1" aria-hidden="true">{thumb(p, lang, big=True, eager=True)}</a>
  <div class="hero-body">
    <p class="kicker">{esc(t['top_story'])}</p>
    {meta_line(p, lang)}
    <h2><a href="{href}">{esc(p['title'])}</a></h2>
    <p class="excerpt">{esc(p['excerpt'])}</p>
    <a class="btn" href="{href}">{esc(t['read_more'])}</a>
  </div>
</article>"""

def listing(posts, lang):
    if not posts:
        return f'<p class="empty">{esc(CFG["strings"][lang]["no_posts"])}</p>'
    return '<div class="cards">' + "\n".join(card(p, lang) for p in posts) + "</div>"


# ---------- writers ----------
WRITTEN = []
CAT_COUNTS = {}
def write(lang, path, content):
    out = DIST / rel(lang, path)
    if path == "" or path.endswith("/"):
        out = out / "index.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(content, encoding="utf-8")
    WRITTEN.append(out.relative_to(DIST).as_posix())

def write_raw(relpath, content):
    out = DIST / relpath
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(content, encoding="utf-8")
    WRITTEN.append(relpath)

def build_lang(lang, posts, other_slugs):
    t = CFG["strings"][lang]
    # home: hero story + latest grid + per-category rows
    cat_blocks = []
    for c in CATS:
        cp = [p for p in posts if p["category"] == c["slug"]][:3]
        if cp:
            cat_blocks.append(f'<section class="cat-block"><h2 class="section-title"><a href="{url(lang, "category/" + c["slug"] + "/")}">{esc(c[lang])}</a></h2>{listing(cp, lang)}</section>')
    top = hero(posts[0], lang) if posts else f'<section class="intro"><h1>{esc(t["site_name"])}</h1><p>{esc(t["tagline"])}</p></section>'
    rest = posts[1:13]
    latest = f'<section><h2 class="section-title">{esc(t["latest"])}</h2>{listing(rest, lang)}</section>' if rest else ""
    home = f"""<h1 class="visually-hidden">{esc(t['site_name'])}: {esc(t['tagline'])}</h1>
<nav class="cat-strip" aria-label="{esc(t['categories'])}">{cat_tiles(lang, eager=True)}</nav>
{top}
{latest}
{''.join(cat_blocks) if len(posts) > 3 else ''}
<p class="more"><a class="btn btn-ghost" href="{url(lang, 'archive/')}">{esc(t['all_posts'])}</a></p>"""
    write(lang, "", layout(lang, "", t["site_name"], t["tagline"], home, "", catbar=False))

    # categories index
    counts = cat_counts(lang)
    cards = []
    for c in CATS:
        cp = [x for x in posts if x["category"] == c["slug"]]
        latest_items = "".join(f'<li><a href="{url(lang, "posts/" + x["slug"] + "/")}">{esc(x["title"])}</a></li>' for x in cp[:3])
        latest_html = f'<ul class="cat-card-latest">{latest_items}</ul>' if latest_items else f'<p class="cat-card-empty">{esc(t["no_posts"])}</p>'
        href = url(lang, "category/" + c["slug"] + "/")
        cards.append(f"""<article class="cat-card c-{c['slug']}">
  <a class="cat-card-media" href="{href}" tabindex="-1" aria-hidden="true">{cat_img(c, lang)}</a>
  <div class="cat-card-body">
    <h2><a href="{href}">{esc(c[lang])}</a></h2>
    <p class="cat-card-desc">{esc(c.get('desc', {}).get(lang, ''))}</p>
    <p class="meta">{esc(count_label(counts.get(c['slug'], 0), lang))}</p>
    {latest_html}
    <a class="btn btn-ghost" href="{href}">{esc(t['view_all'])}</a>
  </div>
</article>""")
    cbody = (f'<header class="page-head"><p class="kicker">{esc(t["site_name"])}</p><h1>{esc(t["all_categories"])}</h1>'
             f'<p class="page-desc">{esc(t["categories_page_desc"])}</p></header><div class="cat-cards">{"".join(cards)}</div>')
    write(lang, "categories/", layout(lang, "categories/", t["all_categories"], t["categories_page_desc"], cbody, "categories/", catbar=False))

    # categories
    for c in CATS:
        p = "category/" + c["slug"] + "/"
        cp = [x for x in posts if x["category"] == c["slug"]]
        head_img = f'<div class="page-head-img" aria-hidden="true">{cat_img(c, lang, eager=True)}</div>' if c.get("image") else ""
        body = (f'<header class="page-head cat-head c-{c["slug"]}">{head_img}<div><p class="kicker">{esc(t["categories"])}</p><h1>{esc(c[lang])}</h1>'
                f'<p class="page-desc">{esc(c.get("desc", {}).get(lang, ""))}</p></div></header>{listing(cp, lang)}')
        write(lang, p, layout(lang, p, c[lang], f"{c[lang]} | {t['tagline']}", body, p))

    # archive grouped by month
    groups, cur = [], None
    for x in posts:
        k = x["dt"].strftime("%Y-%m")
        if k != cur:
            groups.append((k, [])); cur = k
        groups[-1][1].append(x)
    arch = "".join(
        f'<section><h2>{k}</h2><ul class="archive">' + "".join(
            f'<li><time datetime="{x["dt"].date().isoformat()}">{fmt_date(x["dt"], lang)}</time> <a href="{url(lang, "posts/" + x["slug"] + "/")}">{esc(x["title"])}</a> <span class="cat-label">{esc(cat_name(x["category"], lang))}</span></li>'
            for x in items) + "</ul></section>" for k, items in groups) or f'<p>{esc(t["no_posts"])}</p>'
    write(lang, "archive/", layout(lang, "archive/", t["archive"], t["all_posts"], f'<header class="page-head"><h1>{esc(t["archive"])}</h1></header>{arch}', "archive/"))

    # about
    credits = "".join(
        f'<li><strong>{esc(c[lang])}</strong>: <a href="{esc(c["image_credit_url"])}" rel="noopener" target="_blank">{esc(c["image_credit"])}</a></li>'
        for c in CATS if c.get("image") and c.get("image_credit"))
    credits_html = (f'<section class="credits" id="credits"><h2>{esc(t["image_credits"])}</h2><p>{esc(t["credits_intro"])}</p><ul>{credits}</ul></section>'
                    if credits else "")
    write(lang, "about/", layout(lang, "about/", t["about"], t["tagline"],
                                 f'<article class="prose"><h1>{esc(t["about"])}</h1>{CFG["about"][lang]}{credits_html}</article>', "about/"))

    # login + account (filled in client-side by assets/auth.js; graceful when no keys)
    write(lang, "login/", layout(lang, "login/", t["login_title"], t["login_title"],
        f'<section class="auth-page prose"><h1>{esc(t["login_title"])}</h1><div id="auth-root" data-view="login"><noscript>JavaScript</noscript></div></section>',
        "login/", noindex=True))
    write(lang, "account/", layout(lang, "account/", t["account_title"], t["account_title"],
        f'<section class="auth-page prose"><h1>{esc(t["account_title"])}</h1><div id="auth-root" data-view="account"><noscript>JavaScript</noscript></div></section>',
        "account/", noindex=True))

    # role pages (filled in client-side; show a notice until Supabase is connected)
    roles = (f'<section class="panel roles-info"><h2>{esc(t["roles_title"])}</h2><ul>'
             + "".join(f'<li>{esc(t["role_" + r])}</li>' for r in ("reader", "writer", "editor", "admin")) + "</ul></section>")
    write(lang, "admin/", layout(lang, "admin/", t["admin_title"], t["admin_title"],
        f'<section class="auth-page app-page"><h1>{esc(t["admin_title"])}</h1><div id="auth-root" data-view="admin"><noscript>JavaScript</noscript></div>{roles}</section>',
        "admin/", noindex=True))
    write(lang, "dashboard/", layout(lang, "dashboard/", t["dashboard_title"], t["dashboard_title"],
        f'<section class="auth-page app-page"><h1>{esc(t["dashboard_title"])}</h1><p class="notice queue-note">{esc(t["queue_note"])}</p>'
        f'<div id="auth-root" data-view="dashboard"><noscript>JavaScript</noscript></div>{roles}</section>',
        "dashboard/", noindex=True))

    # posts
    for x in posts:
        p = "posts/" + x["slug"] + "/"
        other_p = p if x["slug"] in other_slugs else ""
        src = ""
        if x["source_links"]:
            src = f'<section class="sources"><h2>{esc(t["sources"])}</h2><ul>' + "".join(
                f'<li><a href="{esc(s)}" rel="noopener" target="_blank">{esc(s)}</a></li>' for s in x["source_links"]) + "</ul></section>"
        badge = f' <span class="badge">{esc(t["placeholder"])}</span>' if x.get("placeholder") else ""
        related = [r for r in posts if r["category"] == x["category"] and r["slug"] != x["slug"]][:3]
        rel_html = f'<section class="related"><h2 class="section-title">{esc(cat_name(x["category"], lang))}</h2>{listing(related, lang)}</section>' if related else ""
        body = f"""<article class="post" data-slug="{esc(x['slug'])}" data-title="{esc(x['title'])}">
<header class="post-head">
<p class="meta"><a class="cat" href="{url(lang, 'category/' + x['category'] + '/')}">{esc(cat_name(x['category'], lang))}</a><span>{esc(t['published'])} <time datetime="{x['dt'].isoformat()}">{fmt_date(x['dt'], lang)}</time></span>{badge}</p>
<h1>{esc(x['title'])}</h1>
<p class="lead">{esc(x['excerpt'])}</p>
<div class="post-actions" id="fav-root" hidden></div>
</header>
{post_figure(x, lang)}
<div class="prose">
{x['html']}
{src}
</div>
<section class="comments prose" id="comments-root" aria-label="{esc(t['comments'])}" hidden></section>
</article>
{rel_html}"""
        write(lang, p, layout(lang, p, x["title"], x["excerpt"], body, other_p, og_type="article", image=x.get("image")))

    # RSS
    items = "".join(f"""
  <item>
    <title>{esc(x['title'])}</title>
    <link>{abs_url(lang, 'posts/' + x['slug'] + '/')}</link>
    <guid isPermaLink="true">{abs_url(lang, 'posts/' + x['slug'] + '/')}</guid>
    <pubDate>{format_datetime(x['dt'])}</pubDate>
    <category>{esc(cat_name(x['category'], lang))}</category>
    <description>{esc(x['excerpt'])}</description>
  </item>""" for x in posts[:30])
    rss = f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>{esc(t['site_name'])}</title>
  <link>{abs_url(lang)}</link>
  <description>{esc(t['tagline'])}</description>
  <language>{'he-IL' if lang == 'he' else 'en-US'}</language>
  <atom:link href="{abs_url(lang, 'feed.xml')}" rel="self" type="application/rss+xml"/>
  <lastBuildDate>{format_datetime(datetime.now(timezone.utc))}</lastBuildDate>{items}
</channel>
</rss>
"""
    write_raw(rel(lang, "feed.xml"), rss)

def build_404():
    blocks = []
    for lang in LANGS:
        t = CFG["strings"][lang]
        blocks.append(f'<section lang="{lang}" dir="{DIR[lang]}" class="nf"><p class="kicker">404</p><h1>{esc(t["not_found_title"])}</h1><p>{esc(t["not_found_body"])}</p><p><a class="btn" href="{url(lang)}">{esc(t["back_home"])}</a></p></section>')
    t = CFG["strings"]["he"]
    page = f"""<!doctype html>
<html lang="he" dir="rtl" data-theme="dark">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<script>{THEME_BOOT}</script>
<title>404 | {esc(t['site_name'])}</title><meta name="robots" content="noindex">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Rubik:wght@400;500;600;700&family=Secular+One&display=swap">
<link rel="stylesheet" href="{asset('style.css')}"></head>
<body><main id="main" class="wrap nf-wrap">{''.join(blocks)}</main></body></html>
"""
    write_raw("404.html", page)

def build_sitemap(all_posts):
    entries = []
    pages = ["", "archive/", "about/", "categories/"] + ["category/" + c["slug"] + "/" for c in CATS]
    for lang in LANGS:
        other = "en" if lang == "he" else "he"
        for p in pages:
            entries.append((lang, p, p, other, None))
        other_slugs = {x["slug"] for x in all_posts[other]}
        for x in all_posts[lang]:
            p = "posts/" + x["slug"] + "/"
            entries.append((lang, p, p if x["slug"] in other_slugs else None, other, x["dt"].date().isoformat()))
    xml = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">']
    for lang, p, op, other, lastmod in entries:
        xml.append(f"  <url><loc>{abs_url(lang, p)}</loc>")
        if lastmod:
            xml.append(f"    <lastmod>{lastmod}</lastmod>")
        xml.append(f'    <xhtml:link rel="alternate" hreflang="{lang}" href="{abs_url(lang, p)}"/>')
        if op is not None:
            xml.append(f'    <xhtml:link rel="alternate" hreflang="{other}" href="{abs_url(other, op)}"/>')
        xml.append("  </url>")
    xml.append("</urlset>\n")
    write_raw("sitemap.xml", "\n".join(xml))
    write_raw("robots.txt", f"User-agent: *\nAllow: /\n" + "".join(f"Disallow: {BASE}{l}{p}/\n" for l in ("", "en/") for p in ("login", "account", "admin", "dashboard")) + f"Sitemap: {SITE_URL}/sitemap.xml\n")

def main():
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir()
    shutil.copytree(STATIC, DIST / "assets")
    (DIST / ".nojekyll").write_text("")
    posts = {l: load_posts(l) for l in LANGS}
    for l in LANGS:
        CAT_COUNTS[l] = {c["slug"]: sum(1 for x in posts[l] if x["category"] == c["slug"]) for c in CATS}
    for lang in LANGS:
        other = "en" if lang == "he" else "he"
        build_lang(lang, posts[lang], {x["slug"] for x in posts[other]})
    build_404()
    build_sitemap(posts)
    print(f"Built {len(WRITTEN)} files into {DIST} (base_path={BASE}, site_url={SITE_URL})")
    for l in LANGS:
        print(f"  {l}: {len(posts[l])} posts")

if __name__ == "__main__":
    main()
