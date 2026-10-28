#!/usr/bin/env python3
"""Rewrite post frontmatter as strict, valid YAML so Pages CMS (and any YAML parser) can open it.
Strings are written double-quoted (JSON escaping is valid YAML), lists as block lists.
Usage: python3 scripts/normalize_frontmatter.py [--check] [files...]   (default: content/*/*.md)"""
import json, re, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
SAFE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._/-]*$")  # slugs, dates, paths: safe unquoted

def load_parser():
    src = (ROOT / "build.py").read_text(encoding="utf-8")
    a, b = src.index("def _fold("), src.index("def inline_md(")
    ns = {"re": re, "json": json, "sys": sys}
    exec(src[a:b], ns)
    return ns["parse_frontmatter"]

def scalar(v):
    if isinstance(v, bool):
        return "true" if v else "false"
    v = str(v)
    if SAFE.match(v) and v.lower() not in ("true", "false", "null", "yes", "no", "on", "off") and not re.fullmatch(r"[\d.]+", v):
        return v
    return json.dumps(v, ensure_ascii=False)

def dump(meta):
    out = []
    for k, v in meta.items():
        if isinstance(v, list):
            out.append(f"{k}: []" if not v else f"{k}:\n" + "\n".join(f"  - {scalar(i)}" for i in v))
        else:
            out.append(f"{k}: {scalar(v)}")
    return "\n".join(out)

def main():
    args = [a for a in sys.argv[1:] if a != "--check"]
    check = "--check" in sys.argv
    parse = load_parser()
    files = [Path(a) for a in args] or sorted((ROOT / "content").glob("*/*.md"))
    changed = []
    for f in files:
        text = f.read_text(encoding="utf-8").replace("\r\n", "\n")
        meta, body = parse(text, f.name)
        new = "---\n" + dump(meta) + "\n---\n\n" + body.lstrip("\n")
        if new != text:
            changed.append(f)
            if not check:
                f.write_text(new, encoding="utf-8")
    for f in changed:
        print(("needs normalizing: " if check else "normalized: ") + str(f.relative_to(ROOT)))
    if check and changed:
        sys.exit(1)

if __name__ == "__main__":
    main()
