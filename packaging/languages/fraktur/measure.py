#!/usr/bin/env python3
"""Measure a Tesseract model over sets of line images with their truth.

A set is a folder of line images (`<name>.png` or `.tif`) each with the
text it shows in `<name>.gt.txt`. For every set the script prints, as
numbers only: the lines and characters, the character error rate (edit
distance over the characters of the truth), the same rate with æ ø å
folded to e o a in truth and reading alike (everything but æ ø å), how
many of the æ ø å Æ Ø Å of the truth came out right, and the mean
confidence of the words, which is what the application calls a page's
confidence. Texts are printed only for the worst lines, on request.

What the application does to a reading is done here too before counting:
ſ is s. A ligature character of type (U+FB00–U+FB06) in a reading is left
as it is, so that it counts as an error against the letters of the truth.
Spaces are made single, and a space before . , ; : ! ? is dropped, since
old type sets a thin space there that no truth can write the same.

    measure.py --tessdata DIR --lang NAME [--legacy] [--worst N] SET...

`--legacy` reads with the old engine (`--oem 0`), for `dan_frak`. Each
line is read as one line (`--psm 7`), all of a set in one run of
Tesseract.
"""
import argparse
import csv
import io
import os
import re
import subprocess
import sys
import tempfile
import unicodedata

LETTERS = "æøåÆØÅ"
FOLD = str.maketrans("æøåÆØÅ", "eoaEOA")


def quotes(text):
    """Quotation marks as these books print them, whatever was typed: a
    plain or high double quote that opens (at the start, after a space or
    an opening bracket) is „, one that closes is “; ” is “ too, the two
    being one mark in this type; ' and ‘ are ’."""
    text = text.replace("”", "“").replace("‘", "’").replace("'", "’")
    text = re.sub(r'(^|[\s(\[—-])["“]', lambda m: m.group(1) + "„", text)
    return text.replace('"', "“")


def i_or_j(text):
    """The capital I and J are one glyph in Fraktur, read as J; it is the
    letter the word has: I before a consonant or standing alone
    (Indbyggere, Israel, I Lissabon), J before a vowel (Jeg, Jo)."""
    return re.sub(r"J(?![aeiouyæøåAEIOUYÆØÅ])", "I", text)


def normalise(text):
    text = i_or_j(quotes(unicodedata.normalize("NFC", text).replace("ſ", "s")))
    text = re.sub(r"\s+", " ", text).strip()
    text = re.sub(r" ([.,;:!?])", r"\1", text)
    return text


def align(truth, read):
    """Edit distance and, for each character of the truth, the character
    of the reading it is aligned with (None where it was dropped)."""
    n, m = len(truth), len(read)
    d = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(n + 1):
        d[i][0] = i
    for j in range(m + 1):
        d[0][j] = j
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            cost = 0 if truth[i - 1] == read[j - 1] else 1
            d[i][j] = min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
    aligned = [None] * n
    i, j = n, m
    while i > 0 and j > 0:
        if d[i][j] == d[i - 1][j - 1] + (0 if truth[i - 1] == read[j - 1] else 1):
            aligned[i - 1] = read[j - 1]
            i, j = i - 1, j - 1
        elif d[i][j] == d[i - 1][j] + 1:
            i -= 1
        else:
            j -= 1
    return d[n][m], aligned


def read_set(folder, tessdata, lang, legacy):
    names = sorted(
        f[: -len(".gt.txt")] for f in os.listdir(folder) if f.endswith(".gt.txt")
    )
    images = []
    for name in names:
        for ext in (".png", ".tif", ".tiff"):
            if os.path.exists(os.path.join(folder, name + ext)):
                images.append(os.path.join(folder, name + ext))
                break
        else:
            sys.exit(f"{folder}: no image for {name}")
    with tempfile.TemporaryDirectory() as tmp:
        listing = os.path.join(tmp, "list.txt")
        with open(listing, "w") as f:
            f.write("\n".join(images) + "\n")
        cmd = ["tesseract", listing, os.path.join(tmp, "out"), "--tessdata-dir", tessdata,
               "-l", lang, "--psm", "7", "-c", "tessedit_create_tsv=1"]
        if legacy:
            cmd += ["--oem", "0"]
        subprocess.run(cmd, check=True, capture_output=True)
        with open(os.path.join(tmp, "out.tsv"), encoding="utf-8") as f:
            rows = list(csv.DictReader(f, delimiter="\t", quoting=csv.QUOTE_NONE))
    words = {}
    for row in rows:
        if row["level"] != "5" or not row["text"].strip():
            continue
        page = int(row["page_num"]) - 1
        words.setdefault(page, []).append((row["text"], float(row["conf"])))
    result = []
    for k, name in enumerate(names):
        with open(os.path.join(folder, name + ".gt.txt"), encoding="utf-8") as f:
            truth = normalise(f.read())
        ws = words.get(k, [])
        read = normalise(" ".join(w for w, _ in ws))
        conf = sum(c for _, c in ws) / len(ws) if ws else None
        result.append((name, truth, read, conf))
    return result


def measure(lines):
    chars = sum(len(t) for _, t, _, _ in lines)
    errors = 0
    errors_folded = 0
    letters = 0
    letters_right = 0
    confs = []
    per_line = []
    for name, truth, read, conf in lines:
        dist, aligned = align(truth, read)
        errors += dist
        errors_folded += align(truth.translate(FOLD), read.translate(FOLD))[0]
        for c, r in zip(truth, aligned):
            if c in LETTERS:
                letters += 1
                letters_right += r == c
        if conf is not None:
            confs.append(conf)
        per_line.append((dist / max(1, len(truth)), name, truth, read))
    return {
        "lines": len(lines),
        "chars": chars,
        "cer": 100 * errors / max(1, chars),
        "cer_but_letters": 100 * errors_folded / max(1, chars),
        "letters": letters,
        "letters_right": letters_right,
        "confidence": sum(confs) / len(confs) if confs else float("nan"),
        "per_line": sorted(per_line, reverse=True),
    }


def main():
    p = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    p.add_argument("--tessdata", required=True)
    p.add_argument("--lang", required=True)
    p.add_argument("--legacy", action="store_true")
    p.add_argument("--worst", type=int, default=0, help="print the N worst lines of each set")
    p.add_argument("sets", nargs="+")
    a = p.parse_args()
    print(f"{'set':<12} {'lines':>5} {'chars':>6} {'CER%':>6} {'CER%-æøå':>9} {'æøå':>7} {'right%':>6} {'conf':>5}")
    for folder in a.sets:
        name = os.path.basename(os.path.normpath(folder))
        m = measure(read_set(folder, a.tessdata, a.lang, a.legacy))
        right = 100 * m["letters_right"] / m["letters"] if m["letters"] else float("nan")
        print(f"{name:<12} {m['lines']:>5} {m['chars']:>6} {m['cer']:>6.2f} {m['cer_but_letters']:>9.2f} "
              f"{m['letters_right']:>3}/{m['letters']:<3} {right:>6.1f} {m['confidence']:>5.1f}")
        for rate, line, truth, read in m["per_line"][: a.worst]:
            print(f"  {line} ({100*rate:.0f}%)\n    truth: {truth}\n    read:  {read}")


if __name__ == "__main__":
    main()
