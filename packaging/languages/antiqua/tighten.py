#!/usr/bin/env python3
"""Tight copies of line images: each cut to the band of its own line, as
Tesseract cuts a line when it reads a whole page.

    tighten.py SOURCE OUT [--bilevel]

The lines read by eye are cut with a margin, slivers of the lines above
and below included, and a model trained only on such pictures reads worse
when Tesseract hands it the tight lines of a page (measured on a modern
book on 2026-10-30). Every `<name>.png` with `<name>.gt.txt` in SOURCE
gets `<name>.tight.png` in OUT, with the same text: the rows of ink are
found, the run of rows that holds the middle of the picture is taken as
the line (with its ascenders and descenders, up to the first white row
or a few rows of a sliver's edge), and the picture is cut to it and to
the ink at left and right, with a margin of two dots. A line whose band
cannot be found is left out. `--bilevel` makes the tight copy black and
white at Otsu's threshold, as a bilevel scan is (named `.tightbw`).
"""
import os
import shutil
import sys

import numpy as np
from PIL import Image


def band(a):
    """The rows and columns of the line in the middle of the picture: its
    core (the rows dense with ink, about its x-height) around the middle,
    widened up and down by up to the core's own height for ascenders and
    descenders while the rows hold ink at all, so that a sliver of the
    next line, beyond that reach or past a white row, stays out."""
    dark = a < min(160, int(a.mean()) - 30)
    rows = dark.sum(axis=1)
    h = len(rows)
    if rows.max() == 0:
        return None
    dense = rows > rows.max() * 0.3
    near = [i for i in range(h) if dense[i]]
    c = min(near, key=lambda i: abs(i - h // 2))
    top = bottom = c
    while top > 0 and dense[top - 1]:
        top -= 1
    while bottom < h - 1 and dense[bottom + 1]:
        bottom += 1
    core = bottom - top + 1
    if core < h * 0.12:
        return None
    reach = int(core * 0.9) + 2
    t, b = top, bottom
    while t > 0 and top - t < reach and rows[t - 1] > 0:
        t -= 1
    while b < h - 1 and b - bottom < reach and rows[b + 1] > 0:
        b += 1
    cols = dark[t:b + 1].sum(axis=0)
    xs = np.nonzero(cols)[0]
    if len(xs) == 0:
        return None
    return max(0, xs[0] - 2), max(0, t - 2), min(a.shape[1], xs[-1] + 3), min(h, b + 3)


def otsu(a):
    hist = np.bincount(a.ravel(), minlength=256).astype(float)
    total = a.size
    best, threshold, sum_all, sum_b, w_b = -1.0, 128, float(np.dot(np.arange(256), hist)), 0.0, 0.0
    for t in range(256):
        w_b += hist[t]
        if w_b == 0 or w_b == total:
            continue
        sum_b += t * hist[t]
        m_b, m_f = sum_b / w_b, (sum_all - sum_b) / (total - w_b)
        between = w_b * (total - w_b) * (m_b - m_f) ** 2
        if between > best:
            best, threshold = between, t
    return threshold


def main():
    args = [x for x in sys.argv[1:] if x != "--bilevel"]
    bilevel = len(args) < len(sys.argv) - 1
    if len(args) != 2:
        sys.exit(__doc__)
    source, out = args
    tag = ".tightbw" if bilevel else ".tight"
    os.makedirs(out, exist_ok=True)
    made = left = 0
    for f in sorted(os.listdir(source)):
        if not f.endswith(".gt.txt"):
            continue
        name = f[:-7]
        png = os.path.join(source, name + ".png")
        if not os.path.exists(png):
            continue
        im = Image.open(png).convert("L")
        box = band(np.asarray(im, dtype=np.int32))
        if box is None:
            left += 1
            continue
        im = im.crop(box)
        if bilevel:
            g = np.asarray(im, dtype=np.uint8)
            im = Image.fromarray(np.where(g <= otsu(g), 0, 255).astype(np.uint8))
        im.save(os.path.join(out, name + tag + ".png"))
        shutil.copyfile(os.path.join(source, f), os.path.join(out, name + tag + ".gt.txt"))
        made += 1
    print(f"{made} tight lines, {left} left out")


if __name__ == "__main__":
    main()
