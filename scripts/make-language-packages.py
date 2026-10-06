#!/usr/bin/env python3
"""Makes the language packages of spelling and of OCR, and the index that
lists them, for the server Glaukopis imports languages from (ADR 0032):

    scripts/make-language-packages.py [--out DIR] [--work DIR] [--fetch] [--version V]

The packages are written to `packaging/languages/out` (unless --out says
otherwise), with `index.json`; everything in that folder is put on the
server as it is, by default at https://robertemilberge.no/glaukopis/.

Each package is a zip of a `manifest.json` and the files, as
docs/language-packages.md describes. The dictionaries of spelling are
LibreOffice's (https://github.com/LibreOffice/dictionaries), but the
Norwegian, which are made here from the word lists of Bokmålsordboka and
Nynorskordboka and kept in packaging/languages/dictionaries; the data for
Tesseract is tessdata_best (https://github.com/tesseract-ocr/tessdata_best).
What is downloaded is kept in packaging/build/languages (unless --work says
otherwise) and fetched again only with --fetch. The zips are made the same
from the same files, so that their checksums change only when what is in
them does.
"""

import argparse
import datetime
import hashlib
import json
import sys
import urllib.request
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LIBREOFFICE = "https://raw.githubusercontent.com/LibreOffice/dictionaries/master"
TESSDATA = "https://raw.githubusercontent.com/tesseract-ocr/tessdata_best/main"
NORWEGIAN = ROOT / "packaging" / "languages" / "dictionaries"

# The dictionaries of spelling: the name the files are given when imported,
# the language, what it is called in itself, its licence, and its files as
# (where they come from, the name they have in the package). A source that
# begins with "local:" is in packaging/languages/dictionaries.
SPELLING = [
    {
        "name": "en_US", "language": "en-US", "title": "English (United States)",
        "licence": "LicenseRef-SCOWL",
        "files": [("en/en_US.aff", "en_US.aff"), ("en/en_US.dic", "en_US.dic"),
                  ("en/README_en_US.txt", "README_en_US.txt")],
    },
    {
        "name": "en_GB", "language": "en-GB", "title": "English (United Kingdom)",
        "licence": "LGPL-2.1-or-later",
        "files": [("en/en_GB.aff", "en_GB.aff"), ("en/en_GB.dic", "en_GB.dic"),
                  ("en/README_en_GB.txt", "README_en_GB.txt"),
                  ("local:LGPL-2.1.txt", "COPYING-LGPL-2.1.txt")],
    },
    {
        "name": "nb_NO", "language": "nb-NO", "title": "Norsk bokmål",
        "licence": "CC-BY-4.0 AND GPL-2.0-only",
        "source": "Bokmålsordboka (Universitetet i Bergen og Språkrådet, ordbøkene.no, CC BY 4.0), "
                  "with the inflections of Norsk ordbank (Nasjonalbiblioteket) and the rules of spell-norwegian",
        "files": [("local:nb_NO.aff", "nb_NO.aff"), ("local:nb_NO.dic", "nb_NO.dic"),
                  ("local:README_NO.txt", "README_NO.txt"), ("local:COPYING", "COPYING")],
    },
    {
        "name": "nn_NO", "language": "nn-NO", "title": "Norsk nynorsk",
        "licence": "CC-BY-4.0 AND GPL-2.0-only",
        "source": "Nynorskordboka (Universitetet i Bergen og Språkrådet, ordbøkene.no, CC BY 4.0), "
                  "with the inflections of Norsk ordbank (Nasjonalbiblioteket) and the rules of spell-norwegian",
        "files": [("local:nn_NO.aff", "nn_NO.aff"), ("local:nn_NO.dic", "nn_NO.dic"),
                  ("local:README_NO.txt", "README_NO.txt"), ("local:COPYING", "COPYING")],
    },
    {
        "name": "sv_SE", "language": "sv-SE", "title": "Svenska",
        "licence": "LGPL-3.0-only",
        "files": [("sv_SE/dictionaries/sv_SE.aff", "sv_SE.aff"), ("sv_SE/dictionaries/sv_SE.dic", "sv_SE.dic"),
                  ("sv_SE/LICENSE_en_US.txt", "LICENSE_en_US.txt"), ("sv_SE/LICENSE_sv_SE.txt", "LICENSE_sv_SE.txt")],
    },
    {
        "name": "da_DK", "language": "da-DK", "title": "Dansk",
        "licence": "GPL-2.0-only OR LGPL-2.1-only OR MPL-1.1",
        "files": [("da_DK/da_DK.aff", "da_DK.aff"), ("da_DK/da_DK.dic", "da_DK.dic"),
                  ("da_DK/README_da_DK.txt", "README_da_DK.txt")],
    },
    {
        "name": "de_DE", "language": "de-DE", "title": "Deutsch (Deutschland)",
        "licence": "GPL-2.0-only OR GPL-3.0-only",
        "files": [("de/de_DE_frami.aff", "de_DE_frami.aff"), ("de/de_DE_frami.dic", "de_DE_frami.dic"),
                  ("de/README_de_DE_frami.txt", "README_de_DE_frami.txt"),
                  ("de/COPYING_GPLv2", "COPYING_GPLv2"), ("de/COPYING_GPLv3", "COPYING_GPLv3")],
    },
    {
        "name": "fr", "language": "fr", "title": "Français",
        "licence": "MPL-2.0",
        "files": [("fr_FR/dictionaries/fr.aff", "fr.aff"), ("fr_FR/dictionaries/fr.dic", "fr.dic"),
                  ("fr_FR/dictionaries/README_dict_fr.txt", "README_dict_fr.txt")],
    },
    {
        "name": "it_IT", "language": "it-IT", "title": "Italiano",
        "licence": "GPL-3.0-only",
        "files": [("it_IT/it_IT.aff", "it_IT.aff"), ("it_IT/it_IT.dic", "it_IT.dic"),
                  ("it_IT/README_it_IT.txt", "README_it_IT.txt")],
    },
]

# The languages for Tesseract: its name of the language, the language, and
# what it is called in itself. Tesseract has one Norwegian, for Bokmål and
# Nynorsk both, and one English.
OCR = [
    ("eng", "en", "English"),
    ("nor", "no", "Norsk"),
    ("swe", "sv", "Svenska"),
    ("dan", "da", "Dansk"),
    ("deu", "de", "Deutsch"),
    ("fra", "fr", "Français"),
    ("ita", "it", "Italiano"),
]
TESSDATA_VERSION = "4.1.0"

# The time every file of a package is given, so that the same files make
# the same zip.
STAMP = (1980, 1, 1, 0, 0, 0)


def fetch(url: str, to: Path, again: bool) -> Path:
    if to.exists() and not again:
        return to
    to.parent.mkdir(parents=True, exist_ok=True)
    print(f"  fetching {url}", file=sys.stderr)
    request = urllib.request.Request(url, headers={"User-Agent": "Glaukopis language packages"})
    with urllib.request.urlopen(request, timeout=300) as response:
        data = response.read()
    part = to.with_suffix(to.suffix + ".part")
    part.write_bytes(data)
    part.replace(to)
    return to


def source(path: str, work: Path, again: bool) -> Path:
    if path.startswith("local:"):
        local = NORWEGIAN / path.removeprefix("local:")
        if not local.exists():
            sys.exit(f"{local} is missing: run scripts/update-norwegian-dictionaries.sh")
        return local
    return fetch(f"{LIBREOFFICE}/{path}", work / "libreoffice" / path, again)


def mend(aff: bytes, dic: bytes) -> bytes:
    """Mends what Hunspell lets pass and Spellbook does not: in a dictionary
    whose flags are numbers (FLAG num), a word with a slash in it written
    without escaping it, such as "A/S" in the Danish, whose slash Hunspell
    reads as the beginning of the flags and then skips what is not a flag.
    The slash is escaped, and the quotation marks around such a word taken
    away, so that the word is the word."""
    if b"\nFLAG num" not in b"\n" + aff:
        return dic
    lines = dic.split(b"\n")
    for i, line in enumerate(lines[1:], start=1):
        word, slash, flags = line.partition(b"/")
        flags = flags.split(b"\t")[0].split(b" ")[0].rstrip(b"\r")
        if slash and flags and not all(c in b"0123456789," for c in flags):
            whole = line.rstrip(b"\r").strip(b'"')
            lines[i] = whole.replace(b"/", b"\\/")
    return b"\n".join(lines)


def package(out: Path, file_name: str, manifest: dict, files: list[tuple[str, bytes]]) -> dict:
    """Writes a package, and says what the index says of it."""
    path = out / file_name
    with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for name, data in [("manifest.json", json.dumps(manifest, ensure_ascii=False, indent=2).encode() + b"\n"),
                           *files]:
            info = zipfile.ZipInfo(name, date_time=STAMP)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            z.writestr(info, data)
    data = path.read_bytes()
    print(f"  {file_name}: {len(data) / 1048576:.1f} MB", file=sys.stderr)
    return {
        "kind": manifest["kind"],
        "name": manifest["name"],
        "language": manifest["language"],
        "title": manifest["title"],
        "version": manifest["version"],
        "file": file_name,
        "size": len(data),
        "sha256": hashlib.sha256(data).hexdigest(),
        "licence": manifest["licence"],
        "source": manifest["source"],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--out", type=Path, default=ROOT / "packaging" / "languages" / "out")
    parser.add_argument("--work", type=Path, default=ROOT / "packaging" / "build" / "languages")
    parser.add_argument("--fetch", action="store_true", help="fetch again what was fetched before")
    parser.add_argument("--version", default=datetime.date.today().strftime("%Y.%m.%d"),
                        help="the version of the dictionaries (default: today, as 2026.10.06)")
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    packages = []

    print("Spelling", file=sys.stderr)
    for d in SPELLING:
        files = [(inside, source(path, args.work, args.fetch).read_bytes()) for path, inside in d["files"]]
        aff = next(data for inside, data in files if inside.endswith(".aff"))
        files = [(inside, mend(aff, data) if inside.endswith(".dic") else data) for inside, data in files]
        first = d["files"][0][0]
        manifest = {
            "format": 1,
            "kind": "spelling",
            "language": d["language"],
            "name": d["name"],
            "title": d["title"],
            "version": args.version,
            "licence": d["licence"],
            "source": d.get("source", f"LibreOffice's dictionaries, {LIBREOFFICE}/{first.rsplit('/', 1)[0]}"),
        }
        packages.append(package(args.out, f"spelling-{d['name']}-{args.version}.zip", manifest, files))

    print("OCR", file=sys.stderr)
    licence = fetch(f"{TESSDATA}/LICENSE", args.work / "tessdata_best" / "LICENSE", args.fetch).read_bytes()
    for name, language, title in OCR:
        data = fetch(f"{TESSDATA}/{name}.traineddata", args.work / "tessdata_best" / f"{name}.traineddata",
                     args.fetch).read_bytes()
        manifest = {
            "format": 1,
            "kind": "ocr",
            "language": language,
            "name": name,
            "title": title,
            "version": TESSDATA_VERSION,
            "licence": "Apache-2.0",
            "source": f"tessdata_best {TESSDATA_VERSION}, https://github.com/tesseract-ocr/tessdata_best",
        }
        packages.append(package(args.out, f"ocr-{name}-{TESSDATA_VERSION}.zip", manifest,
                                [(f"{name}.traineddata", data), ("LICENSE", licence)]))

    index = {"format": 1, "packages": packages}
    (args.out / "index.json").write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    # Packages of versions no longer listed are taken away.
    listed = {p["file"] for p in packages} | {"index.json"}
    for old in args.out.iterdir():
        if old.is_file() and old.name not in listed:
            old.unlink()
    print(f"{len(packages)} packages and index.json are in {args.out}", file=sys.stderr)


if __name__ == "__main__":
    main()
