#!/usr/bin/env python3
"""Compare two readers of the same lines: how often they agree, and the
character error rate of one against the other, for the lines both read
and neither flagged.

A reader's file is `page-NNNN.<reader>.tsv` in a book's folder (line,
flag, text), as the sheets save it (`human`, `truth`) or a reader by eye
writes it (`claude`). Lines are compared where the first reader's flag is
empty (checked, not unsure, skip or unchecked) and the second's is not
`skip`. Text is normalised as measure.py normalises it: ſ is s, spaces
single, none before . , ; : ! ?, and quotation marks as `quotes` makes them

    compare-readers.py BOOKS-DIR [--truth human] [--other claude] [--show N]

Prints per book and in all: lines compared, lines identical, characters,
the error rate of the other reader against the truth reader, and, with
--show, the N lines that differ most.
"""
import argparse
import glob
import os
import re
import unicodedata


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
    return re.sub(r" ([.,;:!?])", r"\1", text)


def distance(a, b):
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return prev[-1]


def read(path):
    rows = {}
    with open(path, encoding="utf-8") as f:
        for line in f:
            parts = line.rstrip("\n").split("\t")
            if len(parts) >= 2 and parts[0]:
                rows[parts[0]] = (parts[1].strip(), parts[2] if len(parts) > 2 else "")
    return rows


def main():
    p = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    p.add_argument("books")
    p.add_argument("--truth", default="human")
    p.add_argument("--other", default="claude")
    p.add_argument("--show", type=int, default=0)
    a = p.parse_args()
    total = [0, 0, 0, 0]
    worst = []
    print(f"{'book':<44} {'lines':>5} {'same':>5} {'chars':>6} {'CER%':>6}")
    for folder in sorted(glob.glob(os.path.join(a.books, "*"))):
        n = same = chars = errors = 0
        for tf in sorted(glob.glob(os.path.join(folder, f"page-*.{a.truth}.tsv"))):
            of = tf[: -len(f".{a.truth}.tsv")] + f".{a.other}.tsv"
            if not os.path.exists(of):
                continue
            truth, other = read(tf), read(of)
            for name, (flag, text) in truth.items():
                if flag or name not in other or other[name][0] == "skip":
                    continue
                t, o = normalise(text), normalise(other[name][1])
                if not t:
                    continue
                d = distance(t, o)
                n += 1
                same += d == 0
                chars += len(t)
                errors += d
                if d:
                    worst.append((d / len(t), name, t, o))
        if n:
            print(f"{os.path.basename(folder)[:44]:<44} {n:>5} {same:>5} {chars:>6} {100 * errors / chars:>6.2f}")
            for k, v in enumerate((n, same, chars, errors)):
                total[k] += v
    if total[0]:
        print(f"{'all':<44} {total[0]:>5} {total[1]:>5} {total[2]:>6} {100 * total[3] / total[2]:>6.2f}")
    for rate, name, t, o in sorted(worst, reverse=True)[: a.show]:
        print(f"  {name} ({100 * rate:.0f}%)\n    {a.truth}: {t}\n    {a.other}: {o}")


if __name__ == "__main__":
    main()
