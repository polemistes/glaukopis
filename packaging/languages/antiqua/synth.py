#!/usr/bin/env python3
"""Synthetic lines of Norwegian in roman type, with their text, for
teaching Tesseract's Norwegian model the print of books and papers from
the 1870s to the 1960s.

    synth.py OUT --lines N --fonts DIR [--texts DIR] [--fraktur-books DIR]
             [--dictionaries DIR] [--seed S]

Each line is `OUT/synth.<nnnnnn>.png` with `OUT/synth.<nnnnnn>.gt.txt`, in
the form tesstrain and `make-model.sh` take. What a line says is drawn from
four kinds, in these shares:

- prose (55 %): a stretch of a public-domain book (Project Gutenberg's
  Norwegian texts in `--texts`), cut at word boundaries to a printed
  line's length;
- old spelling (15 %): lines read by eye from the Norwegian Fraktur books
  (`page-*.opus.tsv` under `--fraktur-books`), set here in roman type, so
  that the spelling of the nineteenth century is not new to the model;
- words (15 %): words of the Bokmål and Nynorsk dictionaries, chosen so
  that o and ø, a and å, ae and æ, i, l, I and 1 stand often beside each
  other, the letters readers report confused;
- figures (15 %): years, dates, page and paragraph numbers, prices,
  fractions, numbered items and references, where 1, l and I meet.

A line is set in one of the fonts of `--fonts` (and the serif fonts of the
system), at a size and weight chosen for it, sometimes in capitals or with
one word spaced out for emphasis (its text then written without the
spaces, as the readers write it); half the lines are then worn by the
changes of `../fraktur/augment.py`. Everything is chosen from a seed and
the line's number, so a run makes the same lines again.

A line is only set in a font that has every letter of it.
"""
import argparse
import glob
import hashlib
import os
import random
import re
import sys
import unicodedata

import numpy as np
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "fraktur"))
import augment  # noqa: E402

SYSTEM_FONTS = [
    "/usr/share/fonts/liberation/LiberationSerif-Regular.ttf",
    "/usr/share/fonts/TTF/DejaVuSerif.ttf",
    "/usr/share/fonts/noto/NotoSerif-Regular.ttf",
    "/usr/share/fonts/libertinus/LibertinusSerif-Regular.otf",
]
# Fonts drawn more seldom: typewriter faces and the Fraktur ones, which
# are here only so that a Fraktur heading in a roman book is not new.
SELDOM = ("CourierPrime", "CutiveMono", "SpecialElite", "Unifraktur", "IMFe")
FRAKTUR = ("Unifraktur",)
# Faces of the book types of the twentieth century with old-style figures
# and small commas, the kind a modern Norwegian novel is set in.
OLD_STYLE = ("EBGaramond", "CormorantGaramond", "Cardo", "SortsMillGoudy", "LibreCaslon", "CrimsonPro",
             "GentiumBookPlus", "Spectral", "Brygada1918", "Alegreya", "Vollkorn", "Newsreader", "IMFe")
ACCENT = {"e": "éêè", "a": "áà", "o": "óòô"}
# What a line may hold: the letters, figures and marks of Norwegian print,
# with the accented letters of names and loanwords. A line with anything
# else (a stray sign of a text's encoding, a superscript) is not made.
ALLOWED = set(" !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]abcdefghijklmnopqrstuvwxyz|"
              "ÆØÅæøåÄÖÜäöüßÉÈÊÓÒÔÁÀÍÚÇéèêëóòôáàâíïúùûçñ–—§»«½¼¾“„’”‘†")


def clean(text):
    text = unicodedata.normalize("NFC", text).replace("ſ", "s")
    for a, b in (("ﬀ", "ff"), ("ﬁ", "fi"), ("ﬂ", "fl"), ("ﬃ", "ffi"), ("ﬄ", "ffl"), ("ﬅ", "st"), ("ﬆ", "st")):
        text = text.replace(a, b)
    text = text.replace("_", "").replace("*", "").replace("­", "")
    text = re.sub(r"\s*--+\s*", " — ", text)
    return re.sub(r"\s+", " ", text).strip()


def gutenberg(folder):
    """The bodies of the Gutenberg texts, as one list of words per book."""
    books = []
    for path in sorted(glob.glob(os.path.join(folder, "*.txt"))):
        s = open(path, encoding="utf-8", errors="replace").read()
        a = s.find("*** START OF")
        b = s.find("*** END OF")
        if a < 0 or b < 0:
            continue
        body = s[s.find("\n", a) + 1:b]
        words = clean(body).split()
        if len(words) > 500:
            books.append(words)
    return books


def fraktur_lines(folder):
    lines = []
    for path in sorted(glob.glob(os.path.join(folder, "*", "page-*.opus.tsv"))):
        for row in open(path, encoding="utf-8"):
            parts = row.rstrip("\n").split("\t")
            if len(parts) == 3 and not parts[1] and len(parts[2]) >= 12:
                lines.append(clean(parts[2]))
    return lines


def dictionary_words(folder):
    words = set()
    for name in ("nb_NO.dic", "nn_NO.dic"):
        path = os.path.join(folder, name)
        if not os.path.exists(path):
            continue
        for row in open(path, encoding="utf-8").read().split("\n")[1:]:
            w = row.split("/")[0].strip()
            if 2 <= len(w) <= 18 and re.fullmatch(r"[A-Za-zÆØÅæøåéèêóòôü-]+", w):
                words.add(w)
    return sorted(words)


def prose(r, books, n):
    words = r.choice(books)
    i = r.randrange(0, len(words) - 40)
    out = []
    while len(" ".join(out)) < n and i < len(words):
        out.append(words[i])
        i += 1
    # Now and then an emphatic én or ét, as modern print sets it.
    if r.random() < 0.12:
        k = [j for j, w in enumerate(out) if w in ("en", "et")]
        if k:
            j = r.choice(k)
            out[j] = {"en": "én", "et": "ét"}[out[j]]
    return " ".join(out)


def word_line(r, words, marked, n):
    out = []
    while len(" ".join(out)) < n:
        x = r.random()
        w = r.choice(ACCENTED) if x < 0.15 else r.choice(marked) if x < 0.65 else r.choice(words)
        if r.random() < 0.25:
            w = w[0].upper() + w[1:]
        out.append(w)
        if r.random() < 0.12:
            out[-1] += r.choice(",.;:!?")
    return " ".join(out)


# Words with the accents Norwegian print uses, emphatic én and ét, French
# loanwords, Nynorsk òg and fór: a model that seldom sees them learns to
# drop them.
ACCENTED = ["én", "ét", "éngang", "énsomhet", "éntydig", "hêlt", "gråstêns", "idé", "idéer", "allé", "kafé", "armé",
            "entré", "komité", "trofé", "diskré", "renommé", "ò", "òg", "fór", "lét", "gjér", "dó", "vél", "hú",
            "fè", "là", "à", "après", "café", "Hélène", "René", "José", "Zoë", "Noël", "naïv", "Björn", "Müller",
            "Kärnten", "Göteborg", "Zürich", "før", "føre", "bør", "døde", "ødelagt", "Øvre", "Ørsta", "Åsgårdstrand"]

MONTHS = ["Januar", "Februar", "Marts", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober",
          "November", "December", "januar", "februar", "mars", "april", "mai", "juni", "juli", "august",
          "september", "oktober", "november", "desember"]


def figure_line(r, words):
    def num():
        return str(r.choice([r.randint(1, 20), r.randint(1, 199), r.randint(1, 1999), r.choice([1, 11, 111, 101, 110, 17, 71, 41, 14, 1914, 1911, 1881, 1871])]))

    def year():
        return str(r.randint(1814, 1965))

    def money():
        return r.choice(["Kr. ", "kr. ", "", "Spd. "]) + f"{r.randint(0, 999)},{r.randint(0, 99):02d}"

    parts = [
        lambda: f"i {year()}",
        lambda: f"i {num()} år",
        lambda: f"kl. {r.randint(1, 12)}",
        lambda: f"{r.choice(words)} i {r.choice(words)}",
        lambda: f"{r.choice(words)} i {r.choice(words)}",
        lambda: f"{r.randint(1, 31)}. {r.choice(MONTHS)} {year()}",
        lambda: f"{r.randint(1, 31)}de {r.choice(MONTHS)} {year()}",
        lambda: f"§ {num()}",
        lambda: f"S. {num()}",
        lambda: f"s. {num()}–{num()}",
        lambda: f"{num()}.",
        lambda: money(),
        lambda: r.choice(["½", "¼", "¾", "1/2", "1/4", "3/4", "1½", "11½", "2¼"]),
        lambda: f"Nr. {num()}",
        lambda: f"{r.choice(['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIV', 'XIX'])}.",
        lambda: f"{num()}ste" if r.random() < 0.5 else f"{num()}te",
        lambda: f"{r.randint(1, 23)},{r.randint(0, 59):02d}",
        lambda: f"{year()}–{str(r.randint(1814, 1965))[2:]}",
        lambda: f"Kap. {num()}",
        lambda: f"{num()} pCt.",
        lambda: r.choice(words),
        lambda: r.choice(words),
        lambda: r.choice(words),
    ]
    n = r.randint(3, 9)
    return " ".join(r.choice(parts)() for _ in range(n))


class Font:
    def __init__(self, path):
        self.path = path
        self.name = os.path.basename(path)
        t = TTFont(path, fontNumber=0, lazy=True)
        self.chars = set(chr(c) for c in t.getBestCmap())
        self.axes = {a.axisTag: (a.minValue, a.defaultValue, a.maxValue) for a in t["fvar"].axes} if "fvar" in t else {}
        self.weight = 0.25 if self.name.startswith(SELDOM) else 1.0

    def has(self, text):
        return all(c in self.chars or c == " " for c in text)

    def at(self, size, r):
        f = ImageFont.truetype(self.path, size, layout_engine=ImageFont.Layout.RAQM)
        if "wght" in self.axes:
            lo, default, hi = self.axes["wght"]
            w = min(hi, max(lo, r.choice([default, default, r.uniform(max(lo, 300), min(hi, 700))])))
            values = [w if tag == "wght" else d for tag, (_, d, _) in self.axes.items()]
            try:
                f.set_variation_by_axes(values)
            except Exception:
                pass
        return f


def render(text, font, r):
    size = r.randint(28, 58)
    f = font.at(size, r)
    spaced = None
    words = text.split(" ")
    if len(words) > 3 and r.random() < 0.06:
        spaced = r.randrange(len(words))
    pad_x, pad_y = r.randint(6, 30), r.randint(int(size * 0.25), int(size * 0.6))
    asc, desc = f.getmetrics()
    tracking = size * r.uniform(0.25, 0.45)
    # Width: words drawn one by one, the spaced word letter by letter.
    space = f.getlength(" ") * r.uniform(0.85, 1.6)
    pieces = []
    x = pad_x
    for k, w in enumerate(words):
        if k == spaced:
            for c in w:
                pieces.append((x, c))
                x += f.getlength(c) + tracking
            x -= tracking
        else:
            pieces.append((x, w))
            x += f.getlength(w)
        x += space
    width = int(x - space + pad_x)
    height = int(asc + desc + 2 * pad_y)
    paper = r.randint(215, 255)
    ink = r.randint(0, 70)
    im = Image.new("L", (max(width, 16), height), paper)
    d = ImageDraw.Draw(im)
    for px, s in pieces:
        d.text((px, pad_y), s, font=f, fill=ink)
    return im


def main():
    p = argparse.ArgumentParser()
    p.add_argument("out")
    p.add_argument("--lines", type=int, required=True)
    p.add_argument("--fonts", required=True)
    p.add_argument("--texts")
    p.add_argument("--fraktur-books")
    p.add_argument("--dictionaries")
    p.add_argument("--seed", default="antiqua")
    p.add_argument("--worn", type=float, default=0.5, help="share of lines worn by augment.py's changes")
    p.add_argument("--accents", type=float, default=0.0,
                   help="share of prose lines in which one word's e, a or o is given an accent (é ê è á à ó ò ô), "
                        "so that small accents are seen often; their text is the accented word")
    p.add_argument("--old-style", action="store_true",
                   help="draw only from fonts with old-style figures and small commas (Garamond, Caslon, Goudy, ...)")
    args = p.parse_args()
    os.makedirs(args.out, exist_ok=True)
    books = gutenberg(args.texts) if args.texts else []
    old = fraktur_lines(args.fraktur_books) if args.fraktur_books else []
    words = dictionary_words(args.dictionaries) if args.dictionaries else []
    marked = [w for w in words if re.search(r"[øæåØÆÅ]|[oO].*[oO]|ll|il|li|Il", w)] or words
    fonts_all = [Font(f) for f in sorted(glob.glob(os.path.join(args.fonts, "*.[ot]tf"))) + [f for f in SYSTEM_FONTS if os.path.exists(f)]]
    fonts = [f for f in fonts_all if not args.old_style or f.name.startswith(OLD_STYLE)]
    print(f"books {len(books)}, old lines {len(old)}, words {len(words)} ({len(marked)} marked), fonts {len(fonts)}", flush=True)
    kinds = [("prose", 55), ("old", 15), ("words", 15), ("figures", 15)]
    made = {}
    for i in range(args.lines):
        base = os.path.join(args.out, f"synth.{i:06d}")
        if os.path.exists(base + ".gt.txt"):
            continue
        r = random.Random(hashlib.sha256(f"{args.seed}:{i}".encode()).digest())
        kind = r.choices([k for k, _ in kinds], [w for _, w in kinds])[0]
        n = r.randint(20, 72)
        if kind == "prose" and books:
            text = prose(r, books, n)
            if r.random() < args.accents:
                ws = text.split(" ")
                k = [j for j, w in enumerate(ws) if any(c in ACCENT for c in w)]
                if k:
                    j = r.choice(k)
                    w = ws[j]
                    pos = [i for i, c in enumerate(w) if c in ACCENT]
                    i = r.choice(pos)
                    ws[j] = w[:i] + r.choice(ACCENT[w[i]]) + w[i + 1:]
                    text = " ".join(ws)
        elif kind == "old" and old:
            text = r.choice(old)
        elif kind == "words" and words:
            text = word_line(r, words, marked, n)
        else:
            text = figure_line(r, words or ["og"])
        if r.random() < 0.04:
            text = text.upper()
        text = clean(text)
        if not text or not set(text) <= ALLOWED:
            continue
        usable = [f for f in fonts if f.has(text)]
        if not usable:
            continue
        font = r.choices(usable, [f.weight for f in usable])[0]
        if font.name.startswith(FRAKTUR) and r.random() < 0.7:
            font = r.choices(usable, [0 if f.name.startswith(FRAKTUR) else f.weight for f in usable])[0]
        im = render(text, font, r)
        if r.random() < args.worn:
            a = np.asarray(im, dtype=np.float32)
            changes = r.sample(augment.CHANGES, r.choice([1, 2, 2, 3]))
            if augment.thin in changes and augment.heavy in changes:
                changes.remove(augment.heavy)
            for change in sorted(changes, key=augment.CHANGES.index):
                a = change(a, r)
            im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
        im.save(base + ".png")
        with open(base + ".gt.txt", "w", encoding="utf-8") as out:
            out.write(text + "\n")
        made[kind] = made.get(kind, 0) + 1
    print(f"made {made}")


if __name__ == "__main__":
    main()
