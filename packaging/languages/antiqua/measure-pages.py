#!/usr/bin/env python3
"""Measure a model on whole pages, read as the application reads them.

    measure-pages.py --tessdata DIR --lang NAME TRUTH-DIR PAGES-DIR [--dpi 300] [--book PREFIX]

A model can read lines cut with a margin well and pages worse: on a page
Tesseract finds the lines itself and hands them to the model cut tight.
This script reads every page of PAGES-DIR (`page-NNNN.pgm` or `.png`,
drawn as the application draws them) whole, with Tesseract's own layout
(`--psm 3`), and compares the text with the truth of that page: the
lines of TRUTH-DIR whose names hold `page-NNNN-L`, joined in order. It
prints the character error rate over all pages, normalised as
`../fraktur/measure.py --roman` normalises, and the mean confidence of
the words. `--book` takes only the truth lines whose names begin with
PREFIX (a book's folder name), for a set that holds several books; pages
may then be the book's own `page-NNNN.jpg`.
"""
import argparse
import csv
import glob
import io
import os
import re
import subprocess
import sys

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "fraktur"))
import measure  # noqa: E402


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--tessdata", required=True)
    p.add_argument("--lang", required=True)
    p.add_argument("--dpi", default="300")
    p.add_argument("--book", default="")
    p.add_argument("truth")
    p.add_argument("pages")
    a = p.parse_args()
    measure.ROMAN = True
    truth = {}
    for g in sorted(glob.glob(os.path.join(a.truth, a.book + "*.gt.txt"))):
        m = re.search(r"page-(\d+)-L", g)
        if m:
            truth.setdefault(m.group(1), []).append(open(g, encoding="utf-8").read().strip())
    chars = errors = 0
    confs = []
    for page, lines in sorted(truth.items()):
        found = [f for f in glob.glob(os.path.join(a.pages, f"page-{page}.*")) if f.endswith((".pgm", ".png", ".jpg"))]
        if not found:
            continue
        out = subprocess.run(["tesseract", found[0], "-", "--dpi", a.dpi, "--tessdata-dir", a.tessdata, "-l", a.lang,
                              "-c", "tessedit_create_tsv=1"], capture_output=True, text=True).stdout
        rows = [r for r in csv.DictReader(io.StringIO(out), delimiter="\t", quoting=csv.QUOTE_NONE)
                if r["level"] == "5" and r["text"].strip()]
        read = " ".join(r["text"] for r in rows)
        confs += [float(r["conf"]) for r in rows]
        t, r = measure.normalise(" ".join(lines)), measure.normalise(read)
        chars += len(t)
        errors += measure.align(t, r)[0]
    print(f"pages {len(truth)} chars {chars} CER {100 * errors / max(1, chars):.2f} conf {sum(confs) / max(1, len(confs)):.1f}")


if __name__ == "__main__":
    main()
