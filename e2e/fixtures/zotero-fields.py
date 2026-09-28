#!/usr/bin/env python3
"""Puts citations as Zotero writes them into a Word file that Pandoc made.

    zotero-fields.py <in.docx> <out.docx>

Every `ZOTCITE<n>` in the text of the file becomes a field of Zotero that
cites one or two works, with what Zotero says of them, and shows "(Author
year, page)". For the scripts that measure; no test of the reader, which has
its own documents.
"""
import json
import re
import sys
import zipfile
from xml.sax.saxutils import escape

WORKS = [
    ("Nagy", "Gregory", "The Best of the Achaeans: Concepts of the Hero in Archaic Greek Poetry", 1979, "Johns Hopkins University Press", "Baltimore"),
    ("Lord", "Albert B.", "The Singer of Tales", 1960, "Harvard University Press", "Cambridge, Mass."),
    ("West", "Martin L.", "The Making of the Iliad: Disquisition and Analytical Commentary", 2011, "Oxford University Press", "Oxford"),
    ("Parry", "Milman", "The Making of Homeric Verse: The Collected Papers of Milman Parry", 1971, "Clarendon Press", "Oxford"),
    ("Janko", "Richard", "Homer, Hesiod and the Hymns: Diachronic Development in Epic Diction", 1982, "Cambridge University Press", "Cambridge"),
]
LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def key(n):
    out = ""
    for _ in range(8):
        out += LETTERS[n % len(LETTERS)]
        n = n // len(LETTERS) + 7
    return out


def field(n):
    items, shown = [], []
    for k in range(1 + n % 2):
        # Many works: a library of a few hundred.
        which = (n * 7 + k * 3) % 400
        family, given, title, year, publisher, place = WORKS[which % len(WORKS)]
        page = str(1 + (n * 13 + k) % 300)
        items.append({
            "id": 1000 + which,
            "uris": [f"http://zotero.org/users/1234567/items/{key(which)}"],
            "itemData": {
                "id": 1000 + which,
                "type": "book",
                "title": f"{title} ({which})",
                "publisher": publisher,
                "publisher-place": place,
                "event-place": place,
                "abstract": "What the book is about, at some length. " * 12,
                "language": "en",
                "ISBN": f"978-0-19-{which:06d}-0",
                "author": [{"family": family, "given": given}],
                "issued": {"date-parts": [[str(year + which % 30)]]},
            },
            "locator": page,
            "label": "page",
        })
        shown.append(f"{family} {year + which % 30}, {page}")
    text = "(" + "; ".join(shown) + ")"
    code = {
        "citationID": f"c{n}",
        "properties": {"formattedCitation": text, "plainCitation": text, "noteIndex": 0},
        "citationItems": items,
        "schema": "https://github.com/citation-style-language/schema/raw/master/csl-citation.json",
    }
    return (
        '</w:t></w:r>'
        '<w:r><w:fldChar w:fldCharType="begin"/></w:r>'
        '<w:r><w:instrText xml:space="preserve"> ADDIN ZOTERO_ITEM CSL_CITATION '
        + escape(json.dumps(code)) +
        ' </w:instrText></w:r>'
        '<w:r><w:fldChar w:fldCharType="separate"/></w:r>'
        '<w:r><w:t xml:space="preserve">' + escape(text) + '</w:t></w:r>'
        '<w:r><w:fldChar w:fldCharType="end"/></w:r>'
        '<w:r><w:t xml:space="preserve">'
    )


def main():
    source, target = sys.argv[1], sys.argv[2]
    count = 0
    with zipfile.ZipFile(source) as old, zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED) as new:
        for item in old.infolist():
            data = old.read(item.filename)
            if item.filename in ("word/document.xml", "word/footnotes.xml"):
                text = data.decode("utf-8")

                def put(match):
                    nonlocal count
                    count += 1
                    return field(int(match.group(1)))

                text = re.sub(r"ZOTCITE(\d+)", put, text)
                data = text.encode("utf-8")
            new.writestr(item, data)
    print(count)


main()
