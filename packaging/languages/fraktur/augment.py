#!/usr/bin/env python3
"""Degraded copies of line images, to teach a model print it has seen too
little of: pale, thin, heavy, blurred, speckled, coarse or slightly
tilted.

    augment.py SOURCE OUT [--copies N] [--seed S]

Every `<name>.png` with its `<name>.gt.txt` in SOURCE gets N copies in
OUT, named `<name>.aug<k>.png`, with the same text. Each copy has two or
three of the changes below, chosen and sized from a seed made of the
line's name, so that the same lines come out the same every time:

- pale: the ink lightened toward the paper, and the paper greyed;
- thin or heavy: the strokes eroded or thickened by a dot;
- blur: a Gaussian blur of half a dot to a dot and a half;
- coarse: drawn smaller (to 55-85 %) and back, as a scan at low resolution;
- speckle: dark and light dots scattered, as dust and worn paper;
- tilt: turned by up to half a degree;
- uneven: the paper darkened across the line by a soft gradient.

The text is never changed, so no change may make a letter unreadable:
the sizes are kept within what a person still reads without doubt.
"""
import argparse
import hashlib
import os
import random
import shutil

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage


def pale(a, r):
    ink, paper = r.uniform(70, 150), r.uniform(200, 245)
    return paper - (255 - a) / 255 * (paper - ink)


def thin(a, r):
    return ndimage.grey_dilation(a, size=(2, 2))  # light grows: strokes thin


def heavy(a, r):
    return ndimage.grey_erosion(a, size=(2, 2))  # dark grows: strokes thicken


def blur(a, r):
    return ndimage.gaussian_filter(a, r.uniform(0.5, 1.5))


def coarse(a, r):
    h, w = a.shape
    f = r.uniform(0.55, 0.85)
    im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    small = im.resize((max(8, int(w * f)), max(8, int(h * f))), Image.BILINEAR)
    return np.asarray(small.resize((w, h), Image.BILINEAR), dtype=np.float32)


def speckle(a, r):
    rng = np.random.default_rng(r.getrandbits(32))
    out = a.copy()
    n = int(a.size * r.uniform(0.0005, 0.003))
    ys, xs = rng.integers(0, a.shape[0], n), rng.integers(0, a.shape[1], n)
    out[ys, xs] = np.where(rng.random(n) < 0.5, 40, 250)
    return out


def tilt(a, r):
    return ndimage.rotate(a, r.uniform(-0.5, 0.5), reshape=False, mode="nearest", order=1)


def uneven(a, r):
    h, w = a.shape
    g = np.linspace(0, 1, w)[None, :] if r.random() < 0.5 else np.linspace(0, 1, h)[:, None]
    if r.random() < 0.5:
        g = 1 - g
    return a - g * r.uniform(15, 50) * (a / 255)


CHANGES = [pale, thin, heavy, blur, coarse, speckle, tilt, uneven]


def degrade(path, out, name, seed):
    r = random.Random(hashlib.sha256(f"{seed}:{name}".encode()).digest())
    a = np.asarray(Image.open(path).convert("L"), dtype=np.float32)
    changes = r.sample(CHANGES, r.choice([2, 2, 3]))
    if thin in changes and heavy in changes:
        changes.remove(heavy)
    for change in sorted(changes, key=CHANGES.index):
        a = change(a, r)
    Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(out)
    return [c.__name__ for c in changes]


def main():
    p = argparse.ArgumentParser()
    p.add_argument("source")
    p.add_argument("out")
    p.add_argument("--copies", type=int, default=1)
    p.add_argument("--seed", default="glaukopis")
    args = p.parse_args()
    os.makedirs(args.out, exist_ok=True)
    names = sorted(f[:-7] for f in os.listdir(args.source) if f.endswith(".gt.txt"))
    count = {}
    for name in names:
        png = os.path.join(args.source, name + ".png")
        if not os.path.exists(png):
            continue
        for k in range(args.copies):
            base = os.path.join(args.out, f"{name}.aug{k}")
            if os.path.exists(base + ".png"):
                continue
            for c in degrade(png, base + ".png", f"{name}.{k}", args.seed):
                count[c] = count.get(c, 0) + 1
            shutil.copyfile(os.path.join(args.source, name + ".gt.txt"), base + ".gt.txt")
    print(f"{len(names)} lines, {args.copies} copies each; changes: {count}")


if __name__ == "__main__":
    main()
