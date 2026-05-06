"""
Batch-optimize Sasha's painting photos for the website.

Workflow:
  1. Drop your raw photos (JPEG/PNG) into images/raw/
     Filename = the painting's slug, e.g. `marlowe.jpg`, `bernie-portrait.jpg`
  2. Run:  python tools/optimize-images.py
  3. Optimized variants land in images/portfolio/<slug>-<size>.jpg
     (and .webp), ready to drop into HTML <img src="..."> tags.

Generates 3 widths (800, 1200, 1600 px) with auto-rotation, sharpening,
and high-quality JPEG + WebP output. Skips files that haven't changed.

Requires: Pillow (pip install Pillow)
"""

from __future__ import annotations
import os
import sys
import hashlib
from pathlib import Path
from PIL import Image, ImageOps, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "images" / "raw"
OUT = ROOT / "images" / "portfolio"
WIDTHS = (800, 1200, 1600)
JPEG_Q = 82
WEBP_Q = 80
EXTS = (".jpg", ".jpeg", ".png", ".tif", ".tiff", ".heic")


def file_hash(path: Path) -> str:
    h = hashlib.md5()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()[:10]


def output_paths(slug: str, width: int) -> tuple[Path, Path]:
    return (
        OUT / f"{slug}-{width}.jpg",
        OUT / f"{slug}-{width}.webp",
    )


def needs_rebuild(src: Path, slug: str) -> bool:
    if not OUT.exists():
        return True
    digest = file_hash(src)
    marker = OUT / f".{slug}.hash"
    if not marker.exists():
        return True
    return marker.read_text().strip() != digest


def process_one(src: Path) -> None:
    slug = src.stem.lower().replace(" ", "-")
    if not needs_rebuild(src, slug):
        print(f"  skip   {src.name}  (already up to date)")
        return

    print(f"  build  {src.name}")
    OUT.mkdir(parents=True, exist_ok=True)
    img = Image.open(src)
    img = ImageOps.exif_transpose(img)        # honor camera rotation
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")

    for w in WIDTHS:
        if img.width <= w:
            scaled = img.copy()
        else:
            ratio = w / img.width
            new_h = int(round(img.height * ratio))
            scaled = img.resize((w, new_h), Image.LANCZOS)
            scaled = scaled.filter(ImageFilter.UnsharpMask(radius=0.6, percent=80, threshold=3))

        jpg_path, webp_path = output_paths(slug, w)
        scaled.save(jpg_path, "JPEG", quality=JPEG_Q, optimize=True, progressive=True)
        scaled.save(webp_path, "WEBP", quality=WEBP_Q, method=6)

    digest = file_hash(src)
    (OUT / f".{slug}.hash").write_text(digest)


def main() -> int:
    if not RAW.exists():
        RAW.mkdir(parents=True, exist_ok=True)
        print(f"Created {RAW}. Drop your raw photos here and re-run.")
        return 0

    sources = [p for p in RAW.iterdir() if p.suffix.lower() in EXTS]
    if not sources:
        print(f"No source images in {RAW}. Drop your photos there (JPEG, PNG, etc).")
        return 0

    print(f"Optimizing {len(sources)} image(s)...")
    for src in sorted(sources):
        process_one(src)
    print(f"\nDone. Output -> {OUT}")
    print("Use in HTML like:")
    print("  <img src=\"images/portfolio/<slug>-1200.jpg\"")
    print("       srcset=\"images/portfolio/<slug>-800.jpg 800w,")
    print("               images/portfolio/<slug>-1200.jpg 1200w,")
    print("               images/portfolio/<slug>-1600.jpg 1600w\"")
    print("       sizes=\"(min-width: 880px) 50vw, 100vw\"")
    print("       alt=\"...\" loading=\"lazy\" />")
    return 0


if __name__ == "__main__":
    sys.exit(main())
