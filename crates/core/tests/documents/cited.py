#!/usr/bin/env python3
"""What the documents with citations made by Zotero and Mendeley were made of.

There is no Zotero where the tests are written, so the files are made as
Zotero makes them, by writing what it writes: see `ReferenceMark.java`,
`Bookmark.java` and `Properties.java` of zotero-libreoffice-integration, and
`field.cpp` and `document.cpp` of zotero-word-for-windows-integration.
What EndNote writes is written here as it is remembered from files of
EndNote, and as Pandoc reads it: its plugin cannot be looked into.

    python3 cited.py texts       writes cited.fodt, bookmarks.fodt and plain.fodt
    soffice --headless -env:UserInstallation=file://<a directory of its own> \
        --convert-to odt cited.fodt        (and bookmarks.fodt; and --convert-to docx)
    python3 cited.py fields      writes cited.docx anew, with the fields as
                                 Word has them, bookmarks.docx with bookmarks,
                                 and endnote.docx with fields of EndNote

`cited.odt` is what LibreOffice made of `cited.fodt`, as it is. `cited.docx`
is what LibreOffice made of `plain.fodt` (the same text without anything of
Zotero), with the fields written into it as the plugin for Word writes them.
"""

import base64
import json
import re
import sys
import zipfile
from pathlib import Path
from xml.sax.saxutils import escape, quoteattr

HERE = Path(__file__).parent

SCHEMA = "https://github.com/citation-style-language/schema/raw/master/csl-citation.json"

NAGY = {
    "id": 12,
    "type": "book",
    "abstract": "Despite widespread interest in the Greek hero as a cult figure, little was written about "
    "the relationship between the cult practices and the portrayals of the hero in poetry. " * 4,
    "event-place": "Baltimore",
    "ISBN": "978-0-8018-2200-6",
    "note": "A note of the one who keeps the library, which says nothing of which work it is.",
    "publisher": "Johns Hopkins University Press",
    "publisher-place": "Baltimore",
    "title": "The Best of the Achaeans: Concepts of the Hero in Archaic Greek Poetry",
    "author": [{"family": "Nagy", "given": "Gregory"}],
    "issued": {"date-parts": [["1979"]]},
}
WEST = {
    "id": 31,
    "type": "article-journal",
    "container-title": "The Journal of Hellenic Studies",
    "DOI": "10.2307/632637",
    "page": "151-172",
    "title": "The Rise of the Greek Epic",
    "volume": "108",
    "author": [{"family": "West", "given": "M. L."}],
    "issued": {"date-parts": [["1988"]]},
}
LORD = {
    "id": 7,
    "type": "book",
    "annote": "Read in the spring.",
    "event-place": "Cambridge, Mass.",
    "publisher": "Harvard University Press",
    "title": "The Singer of Tales",
    "author": [{"family": "Lord", "given": "Albert B."}],
    "issued": {"date-parts": [["1960"]]},
}


def zotero(key):
    return [f"http://zotero.org/users/1234567/items/{key}"]


def item(data, key, **more):
    return {"id": data["id"], "uris": zotero(key), "itemData": data, **more}


def citation(identity, shown, items, note=0):
    return {
        "citationID": identity,
        "properties": {"formattedCitation": shown, "plainCitation": shown, "noteIndex": note},
        "citationItems": items,
        "schema": SCHEMA,
    }


# What is cited, by what it is called here: the text it shows, in pieces
# (those in italics marked), and what Zotero says of it.
CITED = {
    "one": (
        [("(Nagy 1979, 73)", False)],
        citation("wX3kq9Lm", "(Nagy 1979, 73)", [item(NAGY, "ABCD2345", locator="73", label="page")]),
    ),
    "three": (
        [("(see Nagy 1979, chap. 2; West 1988; 1960, 12 and elsewhere)", False)],
        citation(
            "p0Rt5uVa",
            "(see Nagy 1979, chap. 2; West 1988; 1960, 12 and elsewhere)",
            [
                item(NAGY, "ABCD2345", locator="2", label="chapter", prefix="see "),
                item(WEST, "WXYZ6789"),
                {
                    **item(LORD, "QRST2345", locator="12", label="page", suffix=" and elsewhere"),
                    "suppress-author": True,
                },
            ],
        ),
    ),
    "italics": (
        [("(Lord, ", False), ("The Singer of Tales", True), (", 12)", False)],
        citation(
            "h7Gf2dSa",
            "(Lord, <i>The Singer of Tales</i>, 12)",
            [item(LORD, "QRST2345", locator="12", label="page")],
        ),
    ),
    "note": (
        [("Nagy, ", False), ("The Best of the Achaeans", True), (", 73", False)],
        citation(
            "k4Jh8gFd",
            "Nagy, <i>The Best of the Achaeans</i>, 73",
            [item(NAGY, "ABCD2345", locator="73", label="page")],
            note=1,
        ),
    ),
}

# As Mendeley writes: the same, with addresses of its own, and what it
# shows said in its own words.
MENDELEY = (
    [("(West 1988)", False)],
    {
        "citationItems": [
            {
                "id": "ITEM-1",
                "itemData": {**WEST, "id": "ITEM-1"},
                "uris": ["http://www.mendeley.com/documents/?uuid=0c6e6bd1-9f3b-4f2a-8b1e-2f4f3c1d9a77"],
            }
        ],
        "mendeley": {
            "formattedCitation": "(West 1988)",
            "plainTextFormattedCitation": "(West 1988)",
            "previouslyFormattedCitation": "(West 1988)",
        },
        "properties": {"noteIndex": 0},
        "schema": SCHEMA,
    },
)

BIBLIOGRAPHY = [
    [("Lord, Albert B. 1960. ", False), ("The Singer of Tales", True), (". Cambridge, Mass.: Harvard University Press.", False)],
    [
        ("Nagy, Gregory. 1979. ", False),
        ("The Best of the Achaeans: Concepts of the Hero in Archaic Greek Poetry", True),
        (". Baltimore: Johns Hopkins University Press.", False),
    ],
    [
        ("West, M. L. 1988. ‘The Rise of the Greek Epic’. ", False),
        ("The Journal of Hellenic Studies", True),
        (" 108: 151–72.", False),
    ],
]
BIBL = '{"uncited":[],"omitted":[],"custom":[]}'

RANDOM = {"one": "aB3dE5gH7j", "three": "kL9mN1pQ3r", "italics": "sT5uV7wX9y", "note": "zA1bC3dE5f", "bibl": "gH7iJ9kL1m"}
BOOKMARKS = {"one": "Qw3Er5Ty7Ui9", "three": "As2Df4Gh6Jk8", "italics": "Zx1Cv3Bn5Mq7", "note": "Pl0Ok9Ij8Uh7"}


def written(value):
    """JSON as Zotero writes it: without room between its parts."""
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


# ---- OpenDocument ----

HEAD = """<?xml version="1.0" encoding="UTF-8"?>
<office:document xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:meta="urn:oasis:names:tc:opendocument:xmlns:meta:1.0" office:version="1.3" office:mimetype="application/vnd.oasis.opendocument.text">
<office:meta><dc:title>The wrath, cited</dc:title><meta:initial-creator>Robert Emil Berge</meta:initial-creator>{properties}</office:meta>
<office:styles>
<style:style style:name="Standard" style:family="paragraph"/>
<style:style style:name="Heading_20_1" style:display-name="Heading 1" style:family="paragraph" style:default-outline-level="1"><style:text-properties fo:font-size="18pt" fo:font-weight="bold"/></style:style>
<style:style style:name="Footnote" style:family="paragraph"/>
<style:style style:name="Bibliography_20_1" style:display-name="Bibliography 1" style:family="paragraph"/>
</office:styles>
<office:automatic-styles>
<style:style style:name="T1" style:family="text"><style:text-properties fo:font-style="italic"/></style:style>
</office:automatic-styles>
<office:body><office:text>
"""
FOOT = "</office:text></office:body></office:document>\n"


def odt_pieces(pieces):
    return "".join(f'<text:span text:style-name="T1">{escape(t)}</text:span>' if i else escape(t) for t, i in pieces)


def odt_mark(name, how):
    pieces, value = CITED[name]
    shown = odt_pieces(pieces)
    if how == "plain":
        return shown
    if how == "bookmarks":
        called = quoteattr(f"ZOTERO_BREF_{BOOKMARKS[name]}")
        return f"<text:bookmark-start text:name={called}/>{shown}<text:bookmark-end text:name={called}/>"
    called = quoteattr(f"ZOTERO_ITEM CSL_CITATION {written(value)} RND{RANDOM[name]}")
    return f"<text:reference-mark-start text:name={called}/>{shown}<text:reference-mark-end text:name={called}/>"


def odt_properties():
    """What is cited at the bookmarks, as the properties of the document hold it: in parts of 255 signs."""
    out = []
    for name, random in BOOKMARKS.items():
        value = f"ZOTERO_ITEM CSL_CITATION {written(CITED[name][1])}"
        for n, at in enumerate(range(0, len(value), 255)):
            called = quoteattr(f"ZOTERO_BREF_{random}_{n + 1}")
            out.append(
                f'<meta:user-defined meta:name={called} meta:value-type="string">{escape(value[at:at + 255])}</meta:user-defined>'
            )
    return "".join(out)


def fodt(how):
    mark = lambda name: odt_mark(name, how)
    listed = "".join(f'<text:p text:style-name="Bibliography_20_1">{odt_pieces(p)}</text:p>\n' for p in BIBLIOGRAPHY)
    if how == "marks":
        called = quoteattr(f" ZOTERO_BIBL {BIBL} CSL_BIBLIOGRAPHY RND{RANDOM['bibl']}")
        listed = f"<text:section text:name={called}>\n{listed}</text:section>\n"
    body = f"""<text:h text:style-name="Heading_20_1" text:outline-level="1">The word</text:h>
<text:p text:style-name="Standard">The wrath of Achilles is what the poem is of {mark("one")}, as is often said.</text:p>
<text:p text:style-name="Standard">Much is written of it {mark("three")}. The singer {mark("italics")} is another matter.</text:p>
<text:p text:style-name="Standard">Not all agree.<text:note text:id="ftn1" text:note-class="footnote"><text:note-citation>1</text:note-citation><text:note-body><text:p text:style-name="Footnote">See {mark("note")}; but he says otherwise elsewhere.</text:p></text:note-body></text:note> And so it stands.</text:p>
<text:h text:style-name="Heading_20_1" text:outline-level="1">Works</text:h>
{listed}"""
    properties = odt_properties() if how == "bookmarks" else ""
    return HEAD.replace("{properties}", properties) + body + FOOT


# ---- Word ----


def run(inner, italic=False):
    properties = "<w:rPr><w:i/><w:iCs/></w:rPr>" if italic else ""
    return f"<w:r>{properties}{inner}</w:r>"


def text(said, italic=False):
    return run(f'<w:t xml:space="preserve">{escape(said)}</w:t>', italic)


def field(code, pieces, cut=1):
    """A field as Word has it: its code, cut into runs, and what it shows."""
    size = max(1, -(-len(code) // cut))
    codes = "".join(
        run(f'<w:instrText xml:space="preserve">{escape(code[at:at + size])}</w:instrText>')
        for at in range(0, len(code), size)
    )
    shown = "".join(text(t, i) for t, i in pieces)
    return (
        run('<w:fldChar w:fldCharType="begin"/>')
        + codes
        + run('<w:fldChar w:fldCharType="separate"/>')
        + shown
        + run('<w:fldChar w:fldCharType="end"/>')
    )


def word_field(name, cut=1):
    pieces, value = CITED[name]
    return field(f" ADDIN ZOTERO_ITEM CSL_CITATION {written(value)} ", pieces, cut)


def word_bookmark(name, number):
    pieces, _ = CITED[name]
    shown = "".join(text(t, i) for t, i in pieces)
    called = quoteattr(f"ZOTERO_BREF_{BOOKMARKS[name]}")
    return f'<w:bookmarkStart w:id="{number}" w:name={called}/>{shown}<w:bookmarkEnd w:id="{number}"/>'


def word_properties():
    out = []
    pid = 2
    for name, random in BOOKMARKS.items():
        value = f"ZOTERO_ITEM CSL_CITATION {written(CITED[name][1])}"
        for n, at in enumerate(range(0, len(value), 255)):
            called = quoteattr(f"ZOTERO_BREF_{random}_{n + 1}")
            out.append(
                f'<property fmtid="{{D5CDD505-2E9C-101B-9397-08002B2CF9AE}}" pid="{pid}" name={called}>'
                f"<vt:lpwstr>{escape(value[at:at + 255])}</vt:lpwstr></property>"
            )
            pid += 1
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
        '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/custom-properties" '
        'xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">' + "".join(out) + "</Properties>"
    )


def endnote(shown, record, more=""):
    """What EndNote says of a citation, in its own form."""
    number, author, year, title, place, publisher = record
    return (
        f"<EndNote><Cite><Author>{author.split(',')[0]}</Author><Year>{year}</Year><RecNum>{number}</RecNum>{more}"
        f"<DisplayText>{escape(shown)}</DisplayText><record><rec-number>{number}</rec-number>"
        f'<foreign-keys><key app="EN" db-id="9a2tzx5ep0fxe2e5vwcv0a5uvd2ad0fzs05v" timestamp="1600000000">{number}</key></foreign-keys>'
        f'<ref-type name="Book">6</ref-type><contributors><authors><author>{author}</author></authors></contributors>'
        f"<titles><title>{title}</title></titles><dates><year>{year}</year></dates>"
        f"<pub-location>{place}</pub-location><publisher>{publisher}</publisher><urls></urls></record></Cite></EndNote>"
    )


ENDNOTE = {
    # What is said stands in the code of the field.
    "one": endnote(
        "(see Nagy 1979, 73)",
        (12, "Nagy, Gregory", "1979", "The Best of the Achaeans", "Baltimore", "Johns Hopkins University Press"),
        "<Prefix>see </Prefix><Pages>73</Pages>",
    ),
    # What is said is kept with the field, as EndNote keeps what is long.
    "italics": endnote(
        "(Lord, The Singer of Tales, 12)",
        (7, "Lord, Albert B.", "1960", "The Singer of Tales", "Cambridge, Mass.", "Harvard University Press"),
        "<Pages>12</Pages>",
    ),
}


def word_endnote(name):
    pieces, _ = CITED[name]
    said = ENDNOTE[name]
    if name == "one":
        return field(f" ADDIN EN.CITE {said} ", [("(see Nagy 1979, 73)", False)], cut=2)
    data = base64.b64encode(said.encode()).decode()
    begin = run(f'<w:fldChar w:fldCharType="begin"><w:fldData xml:space="preserve">{data}</w:fldData></w:fldChar>')
    return (
        begin
        + run('<w:instrText xml:space="preserve"> ADDIN EN.CITE </w:instrText>')
        + begin
        + run('<w:instrText xml:space="preserve"> ADDIN EN.CITE.DATA </w:instrText>')
        + run('<w:fldChar w:fldCharType="end"/>')
        + run('<w:fldChar w:fldCharType="separate"/>')
        + "".join(text(t, i) for t, i in pieces)
        + run('<w:fldChar w:fldCharType="end"/>')
    )


def shown_runs(part, name):
    """Where the runs stand that show a citation, in a part that LibreOffice wrote: from the first to the last."""
    pieces, _ = CITED[name]
    first = escape(pieces[0][0])
    last = escape(pieces[-1][0])
    at = part.index(first)
    start = part.rindex("<w:r>", 0, at)
    end = part.index("</w:r>", part.index(last, at)) + len("</w:r>")
    # The runs must hold the citation and nothing else: LibreOffice writes
    # what stands with other marks as runs of its own.
    held = "".join(re.findall(r"<w:t[^>]*>([^<]*)</w:t>", part[start:end]))
    return start, end, held


def word(how):
    source = HERE / "plain.docx"
    parts = {}
    with zipfile.ZipFile(source) as made:
        names = made.namelist()
        for name in names:
            parts[name] = made.read(name)
    document = parts["word/document.xml"].decode()
    notes = parts["word/footnotes.xml"].decode()
    number = 100
    for name in CITED:
        if how == "endnote" and name not in ENDNOTE:
            continue
        where = "notes" if name == "note" else "document"
        part = notes if where == "notes" else document
        start, end, held = shown_runs(part, name)
        before = after = ""
        shown = "".join(t for t, _ in CITED[name][0])
        if held != shown:
            # The text around it was in the same run: it is set apart.
            at = held.index(shown)
            before, after = held[:at], held[at + len(shown):]
        if how == "bookmarks":
            new = word_bookmark(name, number)
            number += 1
        elif how == "endnote":
            new = word_endnote(name)
        else:
            # The second is cut, as Word cuts a code that is long.
            new = word_field(name, cut=3 if name == "three" else 1)
        new = (text(before) if before else "") + new + (text(after) if after else "")
        part = part[:start] + new + part[end:]
        if where == "notes":
            notes = part
        else:
            document = part
    if how == "fields":
        # The list of works, as a field over paragraphs; and one of Mendeley.
        first = document.index("<w:p>", document.index("Works</w:t>"))
        first = document.index("<w:r>", first)
        last = document.rindex("</w:p>", 0, document.index("<w:sectPr"))
        begin = (
            run('<w:fldChar w:fldCharType="begin"/>')
            + run(f'<w:instrText xml:space="preserve"> ADDIN ZOTERO_BIBL {escape(BIBL)} CSL_BIBLIOGRAPHY </w:instrText>')
            + run('<w:fldChar w:fldCharType="separate"/>')
        )
        document = document[:first] + begin + document[first:last] + run('<w:fldChar w:fldCharType="end"/>') + document[last:]
        pieces, value = MENDELEY
        mendeley = (
            "<w:p>"
            + text("Another program says the same ")
            + field(f"ADDIN CSL_CITATION {written(value)}", pieces)
            + text(".")
            + "</w:p>"
        )
        at = document.index("</w:p>", document.index("And so it stands")) + len("</w:p>")
        document = document[:at] + mendeley + document[at:]
    parts["word/document.xml"] = document.encode()
    parts["word/footnotes.xml"] = notes.encode()
    if how == "bookmarks":
        parts["docProps/custom.xml"] = word_properties().encode()
        names.append("docProps/custom.xml")
        types = parts["[Content_Types].xml"].decode()
        parts["[Content_Types].xml"] = types.replace(
            "</Types>",
            '<Override PartName="/docProps/custom.xml" '
            'ContentType="application/vnd.openxmlformats-officedocument.custom-properties+xml"/></Types>',
        ).encode()
        rels = parts["_rels/.rels"].decode()
        parts["_rels/.rels"] = rels.replace(
            "</Relationships>",
            '<Relationship Id="rIdCustom" '
            'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/custom-properties" '
            'Target="docProps/custom.xml"/></Relationships>',
        ).encode()
    to = HERE / {"fields": "cited.docx", "bookmarks": "bookmarks.docx", "endnote": "endnote.docx"}[how]
    with zipfile.ZipFile(to, "w", zipfile.ZIP_DEFLATED) as out:
        for name in names:
            out.writestr(zipfile.ZipInfo(name, date_time=(2026, 9, 28, 12, 0, 0)), parts[name], zipfile.ZIP_DEFLATED)
    print(f"wrote {to.name}")


def main():
    what = sys.argv[1] if len(sys.argv) > 1 else ""
    if what == "texts":
        (HERE / "cited.fodt").write_text(fodt("marks"), encoding="utf-8")
        (HERE / "bookmarks.fodt").write_text(fodt("bookmarks"), encoding="utf-8")
        (HERE / "plain.fodt").write_text(fodt("plain"), encoding="utf-8")
        print("wrote cited.fodt, bookmarks.fodt, plain.fodt")
    elif what == "fields":
        word("fields")
        word("bookmarks")
        word("endnote")
    else:
        print(__doc__)
        sys.exit(2)


if __name__ == "__main__":
    main()
