"""
Inline css/styles.css and js/main.js into every HTML file.

Why: each HTML page in this repo carries the full stylesheet and JS
inside <style>/<script> blocks so the page works as a single self-
contained file (useful for previews, email handoffs, and the Launch
preview panel). The source-of-truth lives in css/styles.css and
js/main.js. Run this script after editing either of those.

Usage:
    python tools/inline.py

CI: a GitHub Actions workflow at .github/workflows/inline.yml runs
this automatically on every push that touches the source files, then
commits the regenerated HTML back to the branch.
"""

from __future__ import annotations
import os
import re
import sys
import glob
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSS_PATH = ROOT / "css" / "styles.css"
JS_PATH = ROOT / "js" / "main.js"

# These markers identify already-inlined blocks so re-runs replace cleanly.
STYLE_HEADER_MARKER = re.compile(r"Sasha Grampone Art")
JS_HEADER_MARKER = re.compile(r"Sasha Grampone Art\s*[—\-]+ interactions")

LINK_TAG_RE = re.compile(r'<link rel="stylesheet" href="css/styles\.css"\s*/?>')
SCRIPT_TAG_RE = re.compile(r'<script src="js/main\.js"></script>')
INLINED_STYLE_RE = re.compile(
    r"<style>\s*/\*\s*=+\s*\n?\s*Sasha Grampone Art[\s\S]*?</style>"
)
INLINED_SCRIPT_RE = re.compile(
    r"<script>\s*/\*\s*Sasha Grampone Art\s*[—\-]+ interactions[\s\S]*?</script>"
)


def main() -> int:
    if not CSS_PATH.exists() or not JS_PATH.exists():
        print(f"error: missing {CSS_PATH} or {JS_PATH}", file=sys.stderr)
        return 1

    css = CSS_PATH.read_text(encoding="utf-8")
    js = JS_PATH.read_text(encoding="utf-8")
    style_block = "<style>\n" + css + "\n</style>"
    script_block = "<script>\n" + js + "\n</script>"

    changed = 0
    for path in sorted(glob.glob(str(ROOT / "*.html"))):
        p = Path(path)
        html = p.read_text(encoding="utf-8")
        new = html

        if LINK_TAG_RE.search(new):
            new = LINK_TAG_RE.sub(lambda m: style_block, new)
        elif INLINED_STYLE_RE.search(new):
            new = INLINED_STYLE_RE.sub(lambda m: style_block, new)
        else:
            print(f"  warn: no style anchor in {p.name}")

        if SCRIPT_TAG_RE.search(new):
            new = SCRIPT_TAG_RE.sub(lambda m: script_block, new)
        elif INLINED_SCRIPT_RE.search(new):
            new = INLINED_SCRIPT_RE.sub(lambda m: script_block, new)
        else:
            print(f"  warn: no script anchor in {p.name}")

        if new != html:
            p.write_text(new, encoding="utf-8")
            print(f"  updated  {p.name}")
            changed += 1
        else:
            print(f"  in sync  {p.name}")

    print(f"\n{changed} file(s) updated.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
