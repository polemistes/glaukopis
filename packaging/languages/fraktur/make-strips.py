#!/usr/bin/env python3
"""Make strips of lines to be read by eye: pictures of twelve lines each,
every line scaled to one height and numbered at the left, from the lines
make-sheets.py cut. A reader works strip by strip and writes what each
line shows into `page-NNNN.claude.tsv` (line, flag, text) in the book's
folder. Lines skipped in advance (several lines in one) are left out.

    make-strips.py BOOKS-DIR [--only 01,04] [--per 12] [--height 64]

Writes `strips/page-NNNN-S01.png`… and `strips/page-NNNN.strips.json`
(the names of the lines of each strip) in every book's folder.
"""
import argparse
import glob
import json
import os

from PIL import Image, ImageDraw, ImageFont


def main():
    p = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    p.add_argument("books")
    p.add_argument("--only")
    p.add_argument("--per", type=int, default=12)
    p.add_argument("--height", type=int, default=64)
    p.add_argument("--width", type=int, default=1500)
    a = p.parse_args()
    only = set(a.only.split(",")) if a.only else None
    try:
        font = ImageFont.truetype("DejaVuSans.ttf", 18)
    except OSError:
        font = ImageFont.load_default()
    total = 0
    for folder in sorted(glob.glob(os.path.join(a.books, "*", "book.json"))):
        folder = os.path.dirname(folder)
        if only and os.path.basename(folder).split("-")[0] not in only:
            continue
        out = os.path.join(folder, "strips")
        os.makedirs(out, exist_ok=True)
        for lj in sorted(glob.glob(os.path.join(folder, "lines", "page-*.lines.json"))):
            page = os.path.basename(lj)[5:-11]
            with open(lj, encoding="utf-8") as f:
                lines = [l for l in json.load(f) if not l.get("tall")]
            strips = []
            for k in range(0, len(lines), a.per):
                group = lines[k:k + a.per]
                ims = []
                for l in group:
                    im = Image.open(os.path.join(folder, "lines", l["name"] + ".png")).convert("L")
                    w = max(1, int(im.width * a.height / im.height))
                    im = im.resize((min(w, a.width), a.height))
                    ims.append(im)
                strip = Image.new("L", (a.width + 70, (a.height + 6) * len(ims)), 255)
                d = ImageDraw.Draw(strip)
                for i, (l, im) in enumerate(zip(group, ims)):
                    y = i * (a.height + 6)
                    d.text((4, y + a.height // 2 - 10), l["name"].rsplit("-", 1)[1], fill=0, font=font)
                    strip.paste(im, (70, y))
                name = f"page-{page}-S{k // a.per + 1:02d}"
                strip.save(os.path.join(out, name + ".png"))
                strips.append({"strip": name, "lines": [l["name"] for l in group]})
            with open(os.path.join(out, f"page-{page}.strips.json"), "w", encoding="utf-8") as f:
                json.dump(strips, f, indent=1)
            total += len(strips)
        print(f"{os.path.basename(folder)}: {len(glob.glob(os.path.join(out, '*.png')))} strips", flush=True)
    print(f"{total} strips in all")


if __name__ == "__main__":
    main()
