"""Convert HEIC/HEIF photos in images/ to JPG and update every reference.

Most browsers (Chrome, Edge, Firefox) cannot display HEIC, so photos
uploaded from an iPhone through Pages CMS are converted here.
Run from the repository root. Prints the converted files.
"""
import re
import subprocess
from pathlib import Path

from PIL import Image, ImageOps
from pillow_heif import register_heif_opener

register_heif_opener()

MAX_SIDE = 2000      # long side in pixels; plenty for the website
QUALITY = 85

root = Path(".")
heics = sorted(p for p in (root / "images").rglob("*")
               if p.is_file() and p.suffix.lower() in (".heic", ".heif"))

renames = {}
for src in heics:
    dst = src.with_suffix(".jpg")
    n = 1
    while dst.exists():
        dst = src.with_name(f"{src.stem}-{n}.jpg")
        n += 1
    with Image.open(src) as im:
        im = ImageOps.exif_transpose(im).convert("RGB")
        im.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
        im.save(dst, "JPEG", quality=QUALITY, optimize=True, progressive=True)
    subprocess.run(["git", "rm", "-q", "--", str(src)], check=True)
    renames[src.as_posix()] = dst.as_posix()
    print(f"{src} -> {dst}")

if renames:
    targets = list((root / "_data").glob("*.yml")) + list(root.glob("*.html"))
    for f in targets:
        text = f.read_text(encoding="utf-8")
        new = text
        for old, rep in renames.items():
            # matches "images/x.heic" and "/images/x.heic"
            new = re.sub(re.escape(old) + r"(?![\w.-])", rep, new)
        if new != text:
            f.write_text(new, encoding="utf-8")
            print(f"updated {f}")
