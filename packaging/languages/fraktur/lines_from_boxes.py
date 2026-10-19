"""Turn Tesseract 3 box files into line images with ground truth, as tesstrain takes them.

Usage:
    python3 -I lines_from_boxes.py <set-dir> <out-dir> [--exclude p1,p2] [--only p1,p2]

<set-dir> holds pages named <set>.<page>.exp1.tif with a box file beside each,
<set>.<page>.exp1.box, one box a line: <label> <left> <bottom> <right> <top> <page>,
with the origin at the bottom left of the image. Spaces are not boxed. A label may
be several letters (a ligature of type labelled by its letters, such as ch or st).

For every line of text found, two files go to <out-dir>, named alike:
    <set>.<page>.<nnn>.png     the line cut from the page, grayscale, white background
    <set>.<page>.<nnn>.gt.txt  its text, one line, UTF-8, a newline at the end

Boxes are grouped into lines by vertical overlap, sorted by their left edge, and a
line is split where a gap is wider than COLUMN_SHARE times its height (columns). A
space is written where a gap is wider than SPACE_SHARE times the line's height, the
height being the median height of the line's boxes, but never before , . ; : ! ? ) ].
Lines of fewer than MIN_BOXES
boxes, lines whose boxes cover less than SPARSE_SHARE of their width (boxes are
missing), lines with a box outside the image, and lines with a junk label (~) are
dropped and counted. Ligature characters U+FB00-U+FB06 in labels become letters.
At the end a summary is printed: pages, lines written, lines dropped by reason,
column splits, characters, the multi-letter labels and the non-ASCII characters.
"""

import argparse
import os
import statistics
import sys
from collections import Counter

from PIL import Image

Image.MAX_IMAGE_PIXELS = None

# A gap wider than this share of the line's height (median box height) is a space.
# Chosen from the gaps of real scans and font pages: letter gaps lie at 0.0-0.25,
# word gaps at 0.7-1.5, and the valley between them is emptiest at 0.4-0.5.
SPACE_SHARE = 0.5
# A gap wider than this share of the line's height begins another line (a column).
# The height is the median box height, about 60 % of the ascender-to-descender
# extent, so this is about 3 x the full extent; word gaps in justified scans reach 2.3.
COLUMN_SHARE = 5.0
# Two vertical extents are on one line when they overlap by this share of the smaller.
OVERLAP_SHARE = 0.5
# Margin cut around a line, as a share of its extent: above and below, and at the sides.
MARGIN_SHARE = 0.2
SIDE_SHARE = 0.1
MIN_BOXES = 3
# A line whose boxes cover less than this share of its width has boxes missing
# (its text would lack letters) and is dropped. Full lines cover 0.6-0.9 of
# their width, widely tracked type 0.5; lines with boxes missing 0.2-0.4.
SPARSE_SHARE = 0.45

LIGATURES = {
    "ﬀ": "ff",
    "ﬁ": "fi",
    "ﬂ": "fl",
    "ﬃ": "ffi",
    "ﬄ": "ffl",
    "ﬅ": "st",
    "ﬆ": "st",
}
JUNK_LABELS = {"~"}
# No space is written before these, however wide the gap: old type sets a thin
# space before a comma or a semicolon, which is not a word break.
NO_SPACE_BEFORE = set(",.;:!?)]")


class Box:
    __slots__ = ("label", "left", "bottom", "right", "top")

    def __init__(self, label, left, bottom, right, top):
        self.label = label
        self.left = left
        self.bottom = bottom
        self.right = right
        self.top = top

    @property
    def height(self):
        return self.top - self.bottom


def clean_label(label):
    """The label as written: ligature characters as letters; None for junk."""
    if label in JUNK_LABELS:
        return None
    return "".join(LIGATURES.get(c, c) for c in label)


def read_boxes(path):
    """The boxes of a box file; a label is what stands before the last five fields."""
    boxes = []
    with open(path, encoding="utf-8") as f:
        for raw in f:
            line = raw.rstrip()
            if not line.strip():
                continue
            fields = line.split(" ")
            if len(fields) < 6:
                raise ValueError(f"{path}: cannot read box line {line!r}")
            label = " ".join(fields[:-5])
            left, bottom, right, top = (int(v) for v in fields[-5:-1])
            boxes.append(Box(label, left, bottom, right, top))
    return boxes


def group_lines(boxes):
    """Boxes grouped into lines by vertical overlap, in page order, each sorted by left edge."""
    lines = []  # [bottom, top, boxes]
    for box in boxes:
        best, best_share = None, 0.0
        for line in lines:
            overlap = min(line[1], box.top) - max(line[0], box.bottom)
            smaller = min(line[1] - line[0], box.height)
            if smaller <= 0:
                continue
            share = overlap / smaller
            if share >= OVERLAP_SHARE and share > best_share:
                best, best_share = line, share
        if best is None:
            lines.append([box.bottom, box.top, [box]])
        else:
            best[0] = min(best[0], box.bottom)
            best[1] = max(best[1], box.top)
            best[2].append(box)
    lines.sort(key=lambda line: -line[1])
    return [sorted(line[2], key=lambda b: (b.left, b.right)) for line in lines]


def line_height(boxes):
    return statistics.median(b.height for b in boxes)


def split_columns(boxes):
    """A line split where a gap is wider than COLUMN_SHARE times its height."""
    limit = COLUMN_SHARE * line_height(boxes)
    pieces, piece = [], [boxes[0]]
    reach = boxes[0].right
    for box in boxes[1:]:
        if box.left - reach > limit:
            pieces.append(piece)
            piece = []
        piece.append(box)
        reach = max(reach, box.right)
    pieces.append(piece)
    return pieces


def text_of(boxes):
    limit = SPACE_SHARE * line_height(boxes)
    parts = [boxes[0].label]
    reach = boxes[0].right
    for box in boxes[1:]:
        if box.left - reach > limit and box.label[:1] not in NO_SPACE_BEFORE:
            parts.append(" ")
        parts.append(box.label)
        reach = max(reach, box.right)
    return "".join(parts).strip()


def cut(page, boxes):
    """The line cut from the page with a margin; the page is a PIL image, y grows downward."""
    width, height = page.size
    left = min(b.left for b in boxes)
    right = max(b.right for b in boxes)
    bottom = min(b.bottom for b in boxes)
    top = max(b.top for b in boxes)
    extent = top - bottom
    margin = round(MARGIN_SHARE * extent)
    side = round(SIDE_SHARE * extent)
    x0 = max(0, left - side)
    x1 = min(width, right + side)
    y0 = max(0, height - top - margin)
    y1 = min(height, height - bottom + margin)
    return page.crop((x0, y0, x1, y1))


def page_names(set_dir):
    """(set, page) for every box file with a TIFF beside it, in name order."""
    found = []
    for name in sorted(os.listdir(set_dir)):
        if not name.endswith(".box"):
            continue
        stem = name[: -len(".box")]
        parts = stem.split(".")
        if len(parts) != 3:
            continue
        if not os.path.exists(os.path.join(set_dir, stem + ".tif")):
            print(f"no TIFF for {name}, skipped", file=sys.stderr)
            continue
        found.append((parts[0], parts[1], stem))
    return found


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n", 1)[0])
    ap.add_argument("set_dir")
    ap.add_argument("out_dir")
    ap.add_argument("--exclude", default="", help="pages to leave out, comma-separated")
    ap.add_argument("--only", default="", help="the only pages to take, comma-separated")
    args = ap.parse_args()
    exclude = {p for p in args.exclude.split(",") if p}
    only = {p for p in args.only.split(",") if p}

    os.makedirs(args.out_dir, exist_ok=True)
    pages_done = 0
    written = 0
    dropped = Counter()
    splits = 0
    characters = 0
    long_labels = Counter()
    non_ascii = Counter()

    for set_name, page_name, stem in page_names(args.set_dir):
        if page_name in exclude or (only and page_name not in only):
            continue
        boxes = read_boxes(os.path.join(args.set_dir, stem + ".box"))
        with Image.open(os.path.join(args.set_dir, stem + ".tif")) as im:
            page = im.convert("L")
        width, height = page.size
        pages_done += 1
        number = 0
        for grouped in group_lines(boxes):
            pieces = split_columns(grouped)
            splits += len(pieces) - 1
            for line in pieces:
                if len(line) < MIN_BOXES:
                    dropped["fewer than %d boxes" % MIN_BOXES] += 1
                    continue
                span = max(b.right for b in line) - min(b.left for b in line)
                if sum(b.right - b.left for b in line) < SPARSE_SHARE * span:
                    dropped["boxes cover under %d %% of the line" % round(100 * SPARSE_SHARE)] += 1
                    continue
                if any(b.left < 0 or b.bottom < 0 or b.right > width or b.top > height for b in line):
                    dropped["box outside the image"] += 1
                    continue
                labels = [clean_label(b.label) for b in line]
                if any(label is None for label in labels):
                    dropped["junk label"] += 1
                    continue
                if any(label == "" for label in labels):
                    dropped["empty label"] += 1
                    continue
                for b, label in zip(line, labels):
                    b.label = label
                text = text_of(line)
                if not text:
                    dropped["empty text"] += 1
                    continue
                number += 1
                base = os.path.join(args.out_dir, f"{set_name}.{page_name}.{number:03d}")
                cut(page, line).save(base + ".png")
                with open(base + ".gt.txt", "w", encoding="utf-8") as f:
                    f.write(text + "\n")
                written += 1
                characters += len(text)
                for label in labels:
                    if len(label) > 1:
                        long_labels[label] += 1
                    for c in label:
                        if ord(c) > 127:
                            non_ascii[c] += 1

    print(f"pages: {pages_done}")
    print(f"lines written: {written}")
    for reason, n in sorted(dropped.items()):
        print(f"lines dropped, {reason}: {n}")
    print(f"column splits: {splits}")
    print(f"characters: {characters}")
    print(f"multi-letter labels: {len(long_labels)} distinct, the most common:")
    print("  " + " ".join(f"{label}:{n}" for label, n in long_labels.most_common(30)))
    print(f"non-ASCII characters: {len(non_ascii)} distinct:")
    print("  " + " ".join(f"{c}:{n}" for c, n in non_ascii.most_common()))


if __name__ == "__main__":
    main()
