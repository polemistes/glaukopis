#!/usr/bin/env python3
"""Gather the readings of the books into lines to train and measure on.

For every page of every book folder, each line cut by make-sheets.py
(those skipped in advance as several lines left out) gets its text from
the readings beside the page, in this order:

0. a line settled by looking at its picture, where readers or a person
   disagreed: `page-NNNN.settled.tsv` (line, flag, text) in the book's
   folder, or BOOKS-DIR/settled.tsv (book, line, flag, text) as the
   sheet of make-settle.py saves it; a flag there leaves the line out;
1. a person's check: `page-NNNN.checked.tsv` or `.truth.tsv`, the line
   seen and not flagged: taken as it is;
2. readers by eye, `page-NNNN.claude.tsv` and `page-NNNN.opus.tsv`: where
   two read the line clean and agree (as compare-readers.py normalises),
   it is taken; where they disagree it is left out and listed in
   `disagreements.tsv` for a person to settle; a single clean reading is
   taken for training, but not for the held-out books, whose lines are a
   yardstick and must be read twice or checked;
3. any flag (unsure, skip, unchecked) of any reader leaves the line out.

The text is written as the application takes text: ſ as s, ligature
characters as their letters, quotation marks as these books print them,
the plain quotation marks a person types as these books print
them, the marks a reader wrote kept as written, the capital I or J the
word has, spaces single.

    gather.py BOOKS-DIR TRAIN-DIR HELDOUT-DIR

Writes `<book>.<line>.png` and `.gt.txt` into TRAIN-DIR, or HELDOUT-DIR
for the books listed in BOOKS-DIR/heldout.json, emptying both first, and
prints per book how many lines were taken and why the others were not.
"""
import collections
import glob
import json
import os
import re
import shutil
import sys
import unicodedata

LIGATURES = {"ﬀ": "ff", "ﬁ": "fi", "ﬂ": "fl", "ﬃ": "ffi", "ﬄ": "ffl", "ﬅ": "st", "ﬆ": "st"}


def quotes(text):
    """The plain quotation marks a person types, made those the books
    print most: " that opens is „, " that closes is “, ' is ’. Marks a
    reader wrote as it saw them (” before and after in some books) are
    kept, since the line is to teach the mark on the page."""
    text = text.replace("'", "’")
    text = re.sub(r'(^|[\s(\[—-])"', lambda m: m.group(1) + "„", text)
    return text.replace('"', "“")


def i_or_j(text):
    return re.sub(r"J(?![aeiouyæøåAEIOUYÆØÅ])", "I", text)


def normalise(text):
    text = unicodedata.normalize("NFC", text).replace("ſ", "s")
    for lig, letters in LIGATURES.items():
        text = text.replace(lig, letters)
    text = i_or_j(quotes(text))
    # The sign for etc., an r rotunda with c, written ꝛc. by some readers
    # and rc. by others: one mark for one glyph.
    text = re.sub(r"(?<![A-Za-zÆØÅæøåÄÖÜäöü])rc\.", "ꝛc.", text)
    text = re.sub(r"\s+", " ", text).strip()
    return re.sub(r" ([.,;:!?])", r"\1", text)


def read(path):
    rows = {}
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            for line in f:
                parts = line.rstrip("\n").split("\t")
                if len(parts) >= 2 and parts[0]:
                    rows[parts[0]] = (parts[1].strip(), parts[2] if len(parts) > 2 else "")
    return rows


def main():
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    books, train, heldout_dir = sys.argv[1:]
    with open(os.path.join(books, "heldout.json"), encoding="utf-8") as f:
        heldout = set(json.load(f))
    for d in (train, heldout_dir):
        shutil.rmtree(d, ignore_errors=True)
        os.makedirs(d)
    disagreements = []
    settled_all = {}
    if os.path.exists(os.path.join(books, "settled.tsv")):
        with open(os.path.join(books, "settled.tsv"), encoding="utf-8") as f:
            for row in f:
                parts = row.rstrip("\n").split("\t")
                if len(parts) >= 3:
                    settled_all[(parts[0], parts[1])] = (parts[2].strip(), parts[3] if len(parts) > 3 else "")
    totals = collections.Counter()
    print(f"{'book':<44} {'taken':>6} {'person':>6} {'two':>5} {'one':>5} {'flag':>5} {'differ':>6} {'unread':>6}")
    for bj in sorted(glob.glob(os.path.join(books, "*", "book.json"))):
        folder = os.path.dirname(bj)
        book = os.path.basename(folder)
        held = book in heldout
        out = heldout_dir if held else train
        c = collections.Counter()
        for lj in sorted(glob.glob(os.path.join(folder, "lines", "page-*.lines.json"))):
            page = os.path.basename(lj)[5:-11]
            with open(lj, encoding="utf-8") as f:
                lines = [l for l in json.load(f) if not l.get("tall")]
            person = {**read(os.path.join(folder, f"page-{page}.truth.tsv")),
                      **read(os.path.join(folder, f"page-{page}.checked.tsv"))}
            settled = read(os.path.join(folder, f"page-{page}.settled.tsv"))
            settled.update({line: v for (b, line), v in settled_all.items() if b == book})
            readers = [read(os.path.join(folder, f"page-{page}.{r}.tsv")) for r in ("claude", "opus")]
            for l in lines:
                name = l["name"]
                text = None
                if name in settled:
                    if settled[name][0]:
                        c["flag"] += 1
                        continue
                    text, how = settled[name][1], "person"
                elif name in person and person[name][0] == "" and person[name][1].strip():
                    text, how = person[name][1], "person"
                elif name in person and person[name][0] in ("unsure", "skip"):
                    c["flag"] += 1
                    continue
                else:
                    got = [r[name] for r in readers if name in r]
                    if not got:
                        c["unread"] += 1
                        continue
                    if any(flag for flag, _ in got) or not all(t.strip() for _, t in got):
                        c["flag"] += 1
                        continue
                    texts = {normalise(t) for _, t in got}
                    if len(texts) > 1:
                        c["differ"] += 1
                        disagreements.append((book, name, *[normalise(t) for _, t in got]))
                        continue
                    if len(got) == 1 and held:
                        c["unread"] += 1
                        continue
                    text, how = got[0][1], "two" if len(got) > 1 else "one"
                text = normalise(text)
                base = os.path.join(out, f"{book[:2]}.{name}")
                shutil.copyfile(os.path.join(folder, "lines", name + ".png"), base + ".png")
                with open(base + ".gt.txt", "w", encoding="utf-8") as f:
                    f.write(text + "\n")
                c[how] += 1
                c["taken"] += 1
        print(f"{book[:43] + ('*' if held else ''):<44} {c['taken']:>6} {c['person']:>6} {c['two']:>5} {c['one']:>5} "
              f"{c['flag']:>5} {c['differ']:>6} {c['unread']:>6}")
        totals.update({("held " if held else "train ") + k: v for k, v in c.items()})
    with open(os.path.join(books, "disagreements.tsv"), "w", encoding="utf-8") as f:
        for row in disagreements:
            f.write("\t".join(row) + "\n")
    print("* held out")
    for k in sorted(totals):
        print(f"  {k}: {totals[k]}")
    print(f"  disagreements listed: {len(disagreements)}")


if __name__ == "__main__":
    main()
