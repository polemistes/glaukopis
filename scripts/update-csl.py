#!/usr/bin/env python3
"""Brings the bundled reference styles up to date.

Downloads the Citation Style Language styles and locales repositories and
writes, under resources/csl/:

  styles/<id>.csl      the styles that come with Glaukopis
  index.json           id, title, parent and kind of every style there is
  locator-terms.json   the words for "page", "chapter", ... in each language

Run from the root of the repository:  python3 scripts/update-csl.py
"""

import html
import io
import json
import os
import re
import shutil
import sys
import tarfile
import tempfile
import urllib.request

CURATED = """
chicago-notes-bibliography chicago-shortened-notes-bibliography chicago-author-date
chicago-notes-bibliography-17th-edition chicago-author-date-17th-edition
modern-language-association apa harvard-cite-them-right
mhra-notes mhra-shortened-notes mhra-author-date new-harts-rules-notes new-harts-rules-author-date
oscola
society-of-biblical-literature-fullnote-bibliography society-of-biblical-literature-author-date
american-journal-of-archaeology the-journal-of-hellenic-studies history-and-theory
unified-style-sheet-for-linguistics
american-sociological-association american-political-science-association american-anthropological-association
cambridge-university-press-author-date cambridge-university-press-note
taylor-and-francis-chicago-author-date sage-harvard elsevier-harvard springer-basic-author-date
norsk-apa-manual din-1505-2 iso690-author-date-en iso690-full-note-en iso690-numeric-en infoclio-de
bluebook-law-review
nlm-citation-sequence ieee nature science pnas plos the-lancet cell american-medical-association
american-chemical-society american-physics-society
""".split()

LABELS = [
    "book", "chapter", "column", "figure", "folio", "issue", "line", "note", "number", "opus",
    "page", "paragraph", "part", "section", "sub-verbo", "verse", "volume",
]

REPOSITORIES = {
    "styles": "https://codeload.github.com/citation-style-language/styles/tar.gz/refs/heads/master",
    "locales": "https://codeload.github.com/citation-style-language/locales/tar.gz/refs/heads/master",
}


def fetch(url: str, into: str) -> str:
    with urllib.request.urlopen(url, timeout=300) as response:
        data = response.read()
    with tarfile.open(fileobj=io.BytesIO(data), mode="r:gz") as tar:
        tar.extractall(into, filter="data")
        return os.path.join(into, tar.getnames()[0].split("/")[0])


def describe(path: str) -> dict:
    with open(path, encoding="utf-8") as f:
        head = f.read(6000)
    name = os.path.basename(path)[:-4]
    title = re.search(r"<title>(.*?)</title>", head, re.S)
    short = re.search(r"<title-short>(.*?)</title-short>", head, re.S)
    parent = None
    link = re.search(r'<link[^>]*rel="independent-parent"[^>]*>', head)
    if link:
        href = re.search(r'href="([^"]+)"', link.group(0))
        if href:
            parent = href.group(1).rstrip("/").split("/")[-1]
    kind = re.search(r'citation-format="([^"]+)"', head)
    fields = re.findall(r'<category field="([^"]+)"', head)
    out = {"i": name, "t": html.unescape(re.sub(r"\s+", " ", title.group(1)).strip()) if title else name}
    if short:
        out["s"] = html.unescape(short.group(1).strip())
    if parent:
        out["p"] = parent
    if kind:
        out["f"] = kind.group(1)
    if fields:
        out["c"] = fields
    return out


def main() -> int:
    target = os.path.join("resources", "csl")
    if not os.path.isdir(target):
        print("Run this from the root of the repository.", file=sys.stderr)
        return 1
    with tempfile.TemporaryDirectory() as tmp:
        styles = fetch(REPOSITORIES["styles"], tmp)
        locales = fetch(REPOSITORIES["locales"], tmp)

        out_styles = os.path.join(target, "styles")
        os.makedirs(out_styles, exist_ok=True)
        for f in os.listdir(out_styles):
            os.remove(os.path.join(out_styles, f))
        missing = []
        for name in CURATED:
            source = os.path.join(styles, name + ".csl")
            if os.path.exists(source):
                shutil.copy(source, os.path.join(out_styles, name + ".csl"))
            else:
                missing.append(name)
        if missing:
            print("Not found, and left out:", ", ".join(missing), file=sys.stderr)

        index = []
        for folder in (styles, os.path.join(styles, "dependent")):
            for f in sorted(os.listdir(folder)):
                if f.endswith(".csl"):
                    index.append(describe(os.path.join(folder, f)))
        kinds = {d["i"]: d.get("f") for d in index}
        for d in index:
            if "p" in d and "f" not in d and kinds.get(d["p"]):
                d["f"] = kinds[d["p"]]
        with open(os.path.join(target, "index.json"), "w", encoding="utf-8") as f:
            json.dump(index, f, ensure_ascii=False, separators=(",", ":"))

        terms = {}
        for f in sorted(os.listdir(locales)):
            m = re.match(r"locales-(.+)\.xml$", f)
            if not m:
                continue
            with open(os.path.join(locales, f), encoding="utf-8") as handle:
                text = handle.read()
            found = {}
            for t in re.finditer(r'<term name="([^"]+)"( form="([^"]+)")?\s*>(.*?)</term>', text, re.S):
                name, form, body = t.group(1), t.group(3) or "long", t.group(4)
                if name not in LABELS or form not in ("short", "long"):
                    continue
                single = re.search(r"<single>(.*?)</single>", body, re.S)
                multiple = re.search(r"<multiple>(.*?)</multiple>", body, re.S)
                if single:
                    one = html.unescape(single.group(1).strip())
                    many = html.unescape(multiple.group(1).strip()) if multiple else one
                else:
                    one = many = html.unescape(re.sub(r"<[^>]+>", "", body).strip())
                found.setdefault(name, {})[form] = [one, many]
            terms[m.group(1)] = found
        with open(os.path.join(target, "locator-terms.json"), "w", encoding="utf-8") as f:
            json.dump(terms, f, ensure_ascii=False, separators=(",", ":"))

        print(f"{len(CURATED) - len(missing)} styles bundled, {len(index)} indexed, {len(terms)} languages")
    return 0


if __name__ == "__main__":
    sys.exit(main())
