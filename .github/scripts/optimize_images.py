"""Keep website images small so pages load fast on phones.

Runs on GitHub after every image upload (Pages CMS or direct), and can be
run by hand from the repository root:  python .github/scripts/optimize_images.py

What it does to files in images/:
  * HEIC/HEIF (iPhone)            -> converted to JPG
  * Photos saved as PNG (> 300 KB, no transparency) -> converted to JPG
  * JPG/JPEG bigger than MAX_SIDE or 800 KB -> resized and recompressed (same name)
  * Other PNGs (logos, diagrams)   -> resized, colours reduced, same name
Every file that gets a new name is also renamed inside _data/*.yml,
the pages (*.html), _includes, _layouts and css/*.css.
Small files are left alone, so running it again changes nothing.
"""
import os
import re
import subprocess
from pathlib import Path

from PIL import Image, ImageOps

try:
    from pillow_heif import register_heif_opener
    register_heif_opener()
except ImportError:          # HEIC support is optional when run by hand
    pass

MAX_SIDE = 2000              # long side in pixels; sharp on big screens
QUALITY = 82                 # JPG quality
PHOTO_PNG_MIN_KB = 300       # PNG photos above this become JPG
SKIP = {"favicon-32.png", "favicon-192.png", "favicon-512.png", "apple-touch-icon.png"}

root = Path(".")
renames = {}


def kb(p):
    return os.path.getsize(p) // 1024


def free_name(path):
    dst, n = path, 1
    while dst.exists():
        dst = path.with_name(f"{path.stem}-{n}{path.suffix}")
        n += 1
    return dst


def is_photo(im):
    """Lots of different colours = photo; few = diagram/logo."""
    sample = im.convert("RGB").copy()
    sample.thumbnail((200, 200))
    return sample.getcolors(1500) is None


def has_alpha(im):
    if im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info):
        alpha = im.convert("RGBA").getchannel("A")
        return alpha.getextrema()[0] < 250
    return False


def save_jpg(im, dst):
    im = im.convert("RGB")
    im.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
    im.save(dst, "JPEG", quality=QUALITY, optimize=True, progressive=True)


def git_rm(path):
    subprocess.run(["git", "rm", "-q", "--cached", "--ignore-unmatch", "--", str(path)], check=False)
    if path.exists():
        path.unlink()


for src in sorted(p for p in (root / "images").rglob("*") if p.is_file()):
    ext = src.suffix.lower()
    if src.name in SKIP or ext not in (".heic", ".heif", ".jpg", ".jpeg", ".png"):
        continue
    try:
        with Image.open(src) as opened:
            im = ImageOps.exif_transpose(opened)
            im.load()
    except Exception as err:          # not a readable image; leave it
        print(f"skip {src}: {err}")
        continue
    before = kb(src)
    big = max(im.size) > MAX_SIDE

    if ext in (".heic", ".heif") or (ext == ".png" and before > PHOTO_PNG_MIN_KB
                                     and not has_alpha(im) and is_photo(im)):
        dst = free_name(src.with_suffix(".jpg"))
        save_jpg(im, dst)
        git_rm(src)
        renames[src.as_posix()] = dst.as_posix()
        print(f"{src} ({before} KB) -> {dst} ({kb(dst)} KB)")

    elif ext in (".jpg", ".jpeg") and (big or before > 800):
        save_jpg(im, src)
        print(f"{src}: {before} KB -> {kb(src)} KB")

    elif ext == ".png" and (big or before > 300):
        im.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
        if has_alpha(im):
            im = im.convert("RGBA")
            im.save(src, "PNG", optimize=True)
        else:
            im = im.convert("RGB").quantize(colors=256, method=Image.MEDIANCUT, dither=Image.NONE)
            im.save(src, "PNG", optimize=True)
        print(f"{src}: {before} KB -> {kb(src)} KB")

targets = (list((root / "_data").glob("*.yml")) + list(root.glob("*.html"))
           + list((root / "_includes").glob("*.html")) + list((root / "_layouts").glob("*.html"))
           + list((root / "css").glob("*.css")))

# Repair links to pictures that were converted in an earlier run, e.g. a page
# saved in Pages CMS still pointing at "photo.heic" after it became "photo.jpg".
ref = re.compile(r"images/[^\n\"')]+?\.(?:heic|heif|png|jpeg)(?![\w.-])", re.IGNORECASE)
for f in targets:
    for m in set(ref.findall(f.read_text(encoding="utf-8"))):
        if not (root / m).exists() and (root / m).with_suffix(".jpg").exists():
            renames.setdefault(m, Path(m).with_suffix(".jpg").as_posix())

if renames:
    for f in targets:
        text = f.read_text(encoding="utf-8")
        new = text
        for old, rep in renames.items():
            # matches "images/x.png", "/images/x.png" and "../images/x.png"
            new = re.sub(re.escape(old) + r"(?![\w.-])", rep, new)
        if new != text:
            f.write_text(new, encoding="utf-8")
            print(f"updated {f}")
