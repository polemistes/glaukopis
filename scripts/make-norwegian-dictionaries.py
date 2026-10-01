#!/usr/bin/env python3
"""Makes the Norwegian dictionaries of spelling, Bokmål and Nynorsk, from the
word lists of Bokmålsordboka and Nynorskordboka.

    scripts/make-norwegian-dictionaries.py [--work DIR] [--fetch] [--out DIR]

The University of Bergen publishes the lists at
https://ord.uib.no/ord_1_Ordlister.html: for each language a file
`lemma_expanded.json` with every headword, its word class and sub class, and
every inflected form of every paradigm it has, with `inflection_tags.json`
saying what each form is. The lists are downloaded into the work directory
(`packaging/build/dictionaries` unless --work says otherwise; never into the
tree), and from them `nb_NO.dic` and `nn_NO.dic` are written in
`resources/dictionaries`, as lists of full forms for Hunspell. The affix
files `nb_NO.aff` and `nn_NO.aff` beside them, of the spell-norwegian
project, are kept as they are and give the flags their meaning; see
resources/dictionaries/README.md for the flags and the licences.

Needs only Python 3 and the standard library. The lists are 16 MB each.
"""

import argparse
import json
import re
import sys
import urllib.request
from collections import defaultdict
from datetime import date
from pathlib import Path

SITE = "https://ord.uib.no"
FILES = ("lemma_expanded.json", "inflection_tags.json", "word_class.json", "sub_word_class.json")
LANGUAGES = {"bm": "nb_NO", "nn": "nn_NO"}

# The flags, as the affix files of spell-norwegian define them. They have one
# flag for compounding, COMPOUNDFLAG z, which lets a word begin, continue or
# end a compound, and one rule that makes the genitive, SFX J, which adds an
# s to a word that does not end in one.
COMPOUND = "z"
GENITIVE = "J"
# Nothing shorter than this is a part of a compound (COMPOUNDMIN 4).
COMPOUND_MIN = 4


def fetch(work: Path, language: str, force: bool) -> Path:
    """Downloads the files of a language into the work directory, where they
    are not already."""
    folder = work / language
    folder.mkdir(parents=True, exist_ok=True)
    for name in FILES:
        target = folder / name
        if target.exists() and not force:
            continue
        url = f"{SITE}/{language}/fil/{name}"
        print(f"fetching {url}", file=sys.stderr)
        with urllib.request.urlopen(url, timeout=120) as response:
            target.write_bytes(response.read())
    return folder


def usable(form: str) -> bool:
    """Whether a form can be an entry: one word, with no space in it, and not
    a bare affix such as `-ere` or `anti-`."""
    return bool(form) and not re.search(r"\s", form) and not form.startswith("-") and not form.endswith("-")


def escaped(form: str) -> str:
    """A slash in a word is written `\\/` in a `.dic` file."""
    return form.replace("/", "\\/")


def build(folder: Path) -> tuple[dict[str, set[str]], dict[str, int]]:
    """Reads a `lemma_expanded.json` and gives every entry with its flags,
    and a count of what became of the lemmas."""
    with open(folder / "lemma_expanded.json", encoding="utf-8") as f:
        lemmas = json.load(f)
    with open(folder / "inflection_tags.json", encoding="utf-8") as f:
        tags_of = dict(json.load(f))

    entries: dict[str, set[str]] = defaultdict(set)
    counts: dict[str, int] = defaultdict(int)

    def add(form: str, flags: str = "") -> None:
        if usable(form):
            entries[form].update(flags)
            counts["forms"] += 1

    for lemma, _article, word_class, sub_class, _paradigms, paradigms in lemmas:
        counts[word_class] += 1
        tags = tags_of.get(sub_class)

        if word_class == "NOUN":
            # Every form may be a part of a compound and take the genitive.
            add(lemma, COMPOUND + GENITIVE)
            for forms in paradigms:
                for form in forms:
                    add(form, COMPOUND + GENITIVE)
            # The s that links the first part of a compound to the next
            # (bærekraftsmål, arbeidsplass): the genitive of the headword as a
            # word that may begin a compound. The affix file has no rule for
            # it inside a compound, and no ONLYINCOMPOUND flag, so it stands
            # as a word of its own too; which is the genitive, and right.
            if not lemma.endswith("s") and usable(lemma):
                add(lemma + "s", COMPOUND)
                counts["linking s"] += 1

        elif word_class == "PROPN":
            # A proper noun takes the genitive, and is no part of a compound.
            add(lemma, GENITIVE)
            for forms in paradigms:
                for form in forms:
                    add(form, GENITIVE)

        elif word_class == "ADJ":
            # Begins a compound (storbonde) and ends one, in any of its forms
            # (iskaldt, steinrike).
            add(lemma, COMPOUND)
            for forms in paradigms:
                for form in forms:
                    add(form, COMPOUND)

        elif word_class == "VERB":
            # The infinitive and the imperative, which is the stem, begin
            # compounds (skrivebord, skrivbar); the other forms do not.
            add(lemma, COMPOUND)
            for forms in paradigms:
                for i, form in enumerate(forms):
                    # The forms are the tagged ones less the first, which is
                    # the headword itself.
                    tag = tags[i + 1] if tags and len(forms) == len(tags) - 1 else ()
                    stem = "Inf" in tag or "Imp" in tag
                    add(form, COMPOUND if stem else "")

        elif word_class in ("PFX", "COMPPFX"):
            # Written `alpe-`, `anti-`: first parts of compounds, and nothing
            # on their own. Those long enough to be a part of a compound are
            # taken, without the hyphen, as words that may begin one; too
            # short to compound, they would only pass on their own.
            part = lemma.rstrip("-")
            if len(part) >= COMPOUND_MIN:
                add(part, COMPOUND)
                counts["compounding prefixes"] += 1

        else:
            # Adverbs, prepositions, determiners, pronouns, conjunctions,
            # interjections, abbreviations, symbols, expressions: as they are.
            add(lemma)
            for forms in paradigms:
                for form in forms:
                    add(form)

    return entries, counts


def write(entries: dict[str, set[str]], target: Path) -> int:
    """Writes the entries as a `.dic` file: the count, then each word with
    its flags, sorted."""
    lines = []
    for form in sorted(entries):
        flags = "".join(sorted(entries[form]))
        lines.append(f"{escaped(form)}/{flags}" if flags else escaped(form))
    with open(target, "w", encoding="utf-8", newline="\n") as f:
        f.write(f"{len(lines)}\n")
        f.write("\n".join(lines))
        f.write("\n")
    return len(lines)


def main() -> None:
    root = Path(__file__).resolve().parent.parent
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--work", type=Path, default=root / "packaging" / "build" / "dictionaries",
                        help="where the downloaded lists are kept (default: packaging/build/dictionaries)")
    parser.add_argument("--fetch", action="store_true", help="download the lists anew, though they are there")
    parser.add_argument("--out", type=Path, default=root / "resources" / "dictionaries",
                        help="where the dictionaries are written (default: resources/dictionaries)")
    args = parser.parse_args()

    for language, name in LANGUAGES.items():
        folder = fetch(args.work, language, args.fetch)
        entries, counts = build(folder)
        target = args.out / f"{name}.dic"
        count = write(entries, target)
        size = target.stat().st_size
        print(f"{target}: {count} entries, {size / 1e6:.1f} MB, from {counts['NOUN']} nouns, "
              f"{counts['ADJ']} adjectives, {counts['VERB']} verbs; {counts['linking s']} words with a linking s, "
              f"{counts['compounding prefixes']} compounding prefixes; fetched {date.today().isoformat()}")


if __name__ == "__main__":
    main()
