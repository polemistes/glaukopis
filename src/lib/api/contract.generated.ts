// Made by the test `contract` in src-tauri/src/contract.rs: what the Rust side
// sends, as it sends it, typed as the interface declares it. The type check
// fails where the two differ. Not to be changed by hand: run the tests.

import type { Summary, Reference, LibraryListing, ImportPlan, DuplicateGroup } from './library';
import type { ProjectInfo } from './projects';
import type { Picture } from './pictures';
import type { ToolsInfo, DocumentFormat, FormatSummary, StyleSummary, Preview } from './documents';

export const summary: Summary = {
  "added": "2026-01-01T00:00:00Z",
  "attachments": 1,
  "authors": "Nagy",
  "authorsSort": "nagy gregory",
  "container": "",
  "hasNote": true,
  "id": "00000000-0000-4000-8000-000000000000",
  "key": "nagy1979",
  "modified": "2026-01-01T00:00:00Z",
  "search": "gregory nagy some else the best of the achaeans concepts of the hero  johns hopkins baltimore hero epic 10 1 x 9780801823886 read again 1979 nagy1979",
  "title": "The Best of the Achaeans: Concepts of the Hero",
  "type": "book",
  "year": "1979",
  "yearNumber": 1979
};

export const reference: Reference = {
  "added": "2026-01-01T00:00:00Z",
  "attachments": [
    "attachments/e1/e16fa5d9b51928755db85b917f0297babaf22c7a47e97d9212adab56e61ba04e/Nagy 1979 - The Best of the Achaeans.pdf"
  ],
  "collections": [
    "00000000-0000-4000-8000-000000000000"
  ],
  "fields": {
    "annotation": "Read again.",
    "date": "1979",
    "doi": "10.1/x",
    "isbn": "9780801823886",
    "keywords": "hero, epic",
    "location": "Baltimore",
    "publisher": "Johns Hopkins",
    "subtitle": "Concepts of the Hero",
    "title": "The Best of the Achaeans"
  },
  "files": [
    {
      "exists": true,
      "hash": "e16fa5d9b51928755db85b917f0297babaf22c7a47e97d9212adab56e61ba04e",
      "name": "Nagy 1979 - The Best of the Achaeans.pdf",
      "path": "attachments/e1/e16fa5d9b51928755db85b917f0297babaf22c7a47e97d9212adab56e61ba04e/Nagy 1979 - The Best of the Achaeans.pdf",
      "size": 8
    }
  ],
  "id": "00000000-0000-4000-8000-000000000000",
  "key": "nagy1979",
  "modified": "2026-01-01T00:00:00Z",
  "names": {
    "author": [
      {
        "family": "Nagy",
        "given": "Gregory"
      }
    ],
    "editor": [
      {
        "family": "Else",
        "given": "Some"
      }
    ]
  },
  "summary": {
    "added": "2026-01-01T00:00:00Z",
    "attachments": 1,
    "authors": "Nagy",
    "authorsSort": "nagy gregory",
    "container": "",
    "hasNote": true,
    "id": "00000000-0000-4000-8000-000000000000",
    "key": "nagy1979",
    "modified": "2026-01-01T00:00:00Z",
    "search": "gregory nagy some else the best of the achaeans concepts of the hero  johns hopkins baltimore hero epic 10 1 x 9780801823886 read again 1979 nagy1979",
    "title": "The Best of the Achaeans: Concepts of the Hero",
    "type": "book",
    "year": "1979",
    "yearNumber": 1979
  },
  "type": "book"
};

export const listing: LibraryListing = {
  "collections": [
    {
      "created": "2026-01-01T00:00:00Z",
      "entries": [
        "00000000-0000-4000-8000-000000000000"
      ],
      "id": "00000000-0000-4000-8000-000000000000",
      "name": "Epic",
      "parent": null
    }
  ],
  "entries": [
    {
      "added": "2026-01-01T00:00:00Z",
      "attachments": 1,
      "authors": "Nagy",
      "authorsSort": "nagy gregory",
      "container": "",
      "hasNote": true,
      "id": "00000000-0000-4000-8000-000000000000",
      "key": "nagy1979",
      "modified": "2026-01-01T00:00:00Z",
      "search": "gregory nagy some else the best of the achaeans concepts of the hero  johns hopkins baltimore hero epic 10 1 x 9780801823886 read again 1979 nagy1979",
      "title": "The Best of the Achaeans: Concepts of the Hero",
      "type": "book",
      "year": "1979",
      "yearNumber": 1979
    },
    {
      "added": "2026-01-01T00:00:00Z",
      "attachments": 0,
      "authors": "Nagy",
      "authorsSort": "nagy gregory",
      "container": "",
      "hasNote": false,
      "id": "00000000-0000-4000-8000-000000000000",
      "key": "x",
      "modified": "2026-01-01T00:00:00Z",
      "search": "gregory nagy the best of the achaeans  1979 x",
      "title": "The Best of the Achaeans",
      "type": "book",
      "year": "1979",
      "yearNumber": 1979
    }
  ],
  "file": "/data/data/library/library.bib",
  "warnings": []
};

export const importPlan: ImportPlan = {
  "items": [
    {
      "action": {
        "kind": "skip"
      },
      "candidate": {
        "collections": [],
        "draft": {
          "fields": {
            "date": "1979",
            "title": "The Best of the Achaeans"
          },
          "key": "y",
          "names": {
            "author": [
              {
                "family": "Nagy",
                "given": "Gregory"
              }
            ]
          },
          "type": "book"
        },
        "files": [],
        "notes": [],
        "origin": "y, line 1"
      },
      "matches": [
        {
          "certainty": "certain",
          "gains": [],
          "id": "00000000-0000-4000-8000-000000000000",
          "reasons": [
            "identical"
          ],
          "summary": {
            "authors": "Nagy",
            "container": "",
            "key": "nagy1979",
            "title": "The Best of the Achaeans: Concepts of the Hero",
            "type": "book",
            "year": "1979"
          }
        },
        {
          "certainty": "certain",
          "gains": [],
          "id": "00000000-0000-4000-8000-000000000000",
          "reasons": [
            "identical"
          ],
          "summary": {
            "authors": "Nagy",
            "container": "",
            "key": "x",
            "title": "The Best of the Achaeans",
            "type": "book",
            "year": "1979"
          }
        }
      ],
      "repeats": null,
      "summary": {
        "authors": "Nagy",
        "container": "",
        "key": "y",
        "title": "The Best of the Achaeans",
        "type": "book",
        "year": "1979"
      }
    },
    {
      "action": {
        "kind": "add"
      },
      "candidate": {
        "collections": [],
        "draft": {
          "fields": {
            "date": "2000",
            "journaltitle": "J",
            "title": "Another"
          },
          "key": "z",
          "names": {},
          "type": "article"
        },
        "files": [],
        "notes": [],
        "origin": "z, line 2"
      },
      "matches": [],
      "repeats": null,
      "summary": {
        "authors": "",
        "container": "J",
        "key": "z",
        "title": "Another",
        "type": "article",
        "year": "2000"
      }
    }
  ],
  "source": "pasted",
  "warnings": []
};

export const duplicates: DuplicateGroup[] = [
  {
    "certainty": "certain",
    "ids": [
      "00000000-0000-4000-8000-000000000000",
      "00000000-0000-4000-8000-000000000000"
    ],
    "reasons": [
      "identical"
    ]
  }
];

export const project: ProjectInfo = {
  "cited": [
    "reference"
  ],
  "created": "2026-01-01T00:00:00Z",
  "description": "",
  "id": "00000000-0000-4000-8000-000000000000",
  "maps": [
    {
      "elements": 3,
      "id": "map",
      "name": "Wrath"
    }
  ],
  "modified": "2026-01-01T00:00:00Z",
  "name": "Wrath",
  "pictures": [
    "4ff6ab670a58c14270e034e2090d9a432caa263a14e0a25785386b0c12f880b5"
  ],
  "references": 1,
  "words": 12
};

export const picture: Picture = {
  "added": "2026-01-01T00:00:00Z",
  "alt": "",
  "extension": "png",
  "hash": "4ff6ab670a58c14270e034e2090d9a432caa263a14e0a25785386b0c12f880b5",
  "height": 1,
  "name": "dot.png",
  "note": "",
  "size": 70,
  "width": 1
};

export const tools: ToolsInfo = {
  "latex": [
    "lualatex"
  ],
  "ocrLanguages": [],
  "pandoc": {
    "path": "/usr/bin/pandoc",
    "version": "3.10.2"
  },
  "pandocApi": [
    1,
    23,
    1
  ],
  "pdftoppm": null,
  "resources": "/resources",
  "tesseract": null
};

export const format: DocumentFormat = {
  "bibliography": {
    "entrySpacing": "0pt",
    "hangingIndent": "1.27cm",
    "lineSpacing": 0.0,
    "newPage": false,
    "size": 0.0,
    "title": "Bibliography"
  },
  "description": "What most publishers and journals accept where they state no layout of their own: 12-point serif type, double spacing, margins of 2.5 cm, text aligned left.",
  "equations": {
    "afterNumber": ")",
    "align": "center",
    "beforeNumber": "("
  },
  "figures": {
    "align": "center",
    "captionAlign": "center",
    "captionItalic": false,
    "captionLineSpacing": 1.0,
    "captionPosition": "below",
    "captionSize": 0.0,
    "endTitle": "Figures",
    "label": "Figure",
    "labelBold": false,
    "labelItalic": false,
    "placeholder": "[{} about here]",
    "placement": "in-text",
    "reference": "",
    "separator": ". ",
    "wrap": false
  },
  "font": {
    "family": "Times New Roman",
    "size": 12.0
  },
  "headings": {
    "levels": [
      {
        "align": "left",
        "bold": true,
        "case": "none",
        "indent": false,
        "italic": false,
        "newPage": false,
        "runIn": false,
        "size": 14.0,
        "spaceAfter": "12pt",
        "spaceBefore": "24pt"
      },
      {
        "align": "left",
        "bold": true,
        "case": "none",
        "indent": false,
        "italic": false,
        "newPage": false,
        "runIn": false,
        "size": 12.0,
        "spaceAfter": "6pt",
        "spaceBefore": "18pt"
      },
      {
        "align": "left",
        "bold": false,
        "case": "none",
        "indent": false,
        "italic": true,
        "newPage": false,
        "runIn": false,
        "size": 12.0,
        "spaceAfter": "6pt",
        "spaceBefore": "12pt"
      }
    ],
    "numbered": false
  },
  "id": "manuscript",
  "kind": "general",
  "limits": {
    "abstractWords": null,
    "keywords": null,
    "note": "",
    "words": null
  },
  "lineNumbers": false,
  "name": "Manuscript",
  "notes": {
    "kind": "footnotes",
    "lineSpacing": 1.0,
    "size": 10.0,
    "title": "Notes"
  },
  "page": {
    "height": "297mm",
    "marginBottom": "2.5cm",
    "marginLeft": "2.5cm",
    "marginRight": "2.5cm",
    "marginTop": "2.5cm",
    "size": "a4",
    "width": "210mm"
  },
  "pageNumbers": {
    "firstPage": true,
    "position": "bottom-center",
    "show": true
  },
  "quote": {
    "fromLines": null,
    "fromWords": null,
    "indentLeft": "1.27cm",
    "indentRight": "0pt",
    "italic": false,
    "lineSpacing": 0.0,
    "size": 0.0
  },
  "runningHead": {
    "align": "left",
    "case": "none",
    "content": "none",
    "text": ""
  },
  "source": {
    "checked": "2026-09-27",
    "confidence": "high",
    "name": "What the requirements of publishers and journals have in common",
    "notes": "See docs/research/formats-publishers.md and formats-journals.md, under Observations. Paragraphs are indented rather than spaced, which is the more common of two conflicting conventions.",
    "url": ""
  },
  "style": "chicago-notes-bibliography",
  "tables": {
    "align": "center",
    "captionAlign": "center",
    "captionItalic": false,
    "captionLineSpacing": 1.0,
    "captionPosition": "above",
    "captionSize": 0.0,
    "endTitle": "Tables",
    "headerBold": false,
    "label": "Table",
    "labelBold": false,
    "labelItalic": false,
    "lineSpacing": 1.0,
    "placeholder": "[{} about here]",
    "placement": "in-text",
    "reference": "",
    "rules": "horizontal",
    "separator": ". ",
    "size": 0.0,
    "wrap": false
  },
  "text": {
    "align": "left",
    "hyphenate": false,
    "indent": "1.27cm",
    "indentFirst": false,
    "lineSpacing": 2.0,
    "paragraphs": "indent",
    "spaceBetween": "0pt"
  },
  "title": {
    "abstractLabel": "Abstract",
    "align": "center",
    "anonymous": false,
    "bold": true,
    "case": "none",
    "italic": false,
    "keywordsLabel": "Keywords",
    "placement": "top",
    "showAbstract": true,
    "showAffiliations": true,
    "showAuthors": true,
    "showDate": false,
    "size": 16.0
  }
};

export const formats: FormatSummary[] = [
  {
    "checked": "",
    "confidence": "",
    "description": "Not for submission: a page that is pleasant to read, for sharing a draft or reading one's own text afresh. Close spacing, justified, with hyphenation.",
    "id": "reading",
    "kind": "general",
    "name": "For reading",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "What most publishers and journals accept where they state no layout of their own: 12-point serif type, double spacing, margins of 2.5 cm, text aligned left.",
    "id": "manuscript",
    "kind": "general",
    "name": "Manuscript",
    "own": false
  },
  {
    "checked": "2026-10-01",
    "confidence": "high",
    "description": "The standard manuscript format that agents and publishers of fiction ask for: 12-point type, double spacing, margins of 2.5 cm, each chapter on a new page, the title and page number at the head of every page.",
    "id": "novel-manuscript",
    "kind": "fiction",
    "name": "Novel manuscript",
    "own": false
  },
  {
    "checked": "2026-10-01",
    "confidence": "medium",
    "description": "A page as a printed novel has it, for reading one's own book as a book, or for a printing of one's own: a small page, serif type, justified and hyphenated, each chapter on a new page with room above its heading, the page number at the foot.",
    "id": "novel-book",
    "kind": "fiction",
    "name": "Novel, as a book",
    "own": false
  },
  {
    "checked": "2026-10-01",
    "confidence": "low",
    "description": "A stage play for reading and rehearsal: 12-point type, lines set as verse with the speaker above each speech in small capitals and the directions in italics, each act on a new page, the scenes within it headed; wide margins for notes.",
    "id": "play-script",
    "kind": "stage",
    "name": "Play script",
    "own": false
  },
  {
    "checked": "2026-10-01",
    "confidence": "low",
    "description": "A collection of poems: each poem an element, its name the title, its lines written as verse. A narrow page, a quiet serif, lines left as written, no hyphenation, each poem on a page of its own.",
    "id": "poetry",
    "kind": "poetry",
    "name": "Poems",
    "own": false
  },
  {
    "checked": "2026-09-18",
    "confidence": "high",
    "description": "The professional paper of the APA Publication Manual, 7th edition, for manuscripts sent to journals: a title page with author note, a running head of the shortened title in capitals, an abstract of at most 250 words; double spacing throughout and five levels of unnumbered headings.",
    "id": "apa-7-professional",
    "kind": "style-guide",
    "name": "APA 7 (professional paper)",
    "own": false
  },
  {
    "checked": "2026-09-18",
    "confidence": "high",
    "description": "The student paper of the APA Publication Manual, 7th edition: a title page with course, instructor and due date, no running head and normally no abstract; double spacing throughout, five levels of unnumbered headings, and block quotations from 40 words.",
    "id": "apa-7-student",
    "kind": "style-guide",
    "name": "APA 7 (student paper)",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "The paper format of Turabian's Manual for Writers, 9th edition, which follows the Chicago Manual of Style: double-spaced text with single-spaced block quotations, notes and bibliography entries, margins of at least one inch, and a title page of its own.",
    "id": "chicago-turabian-paper",
    "kind": "style-guide",
    "name": "Chicago / Turabian (paper)",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "Copy prepared as the MHRA Style Guide, 4th edition (2024) asks: a serif font in one size throughout, double or one-and-a-half spacing, few levels of heading, and prose quotations of more than forty words set off as a block without quotation marks.",
    "id": "mhra-4",
    "kind": "style-guide",
    "name": "MHRA Style Guide 4",
    "own": false
  },
  {
    "checked": "2025-01-19",
    "confidence": "high",
    "description": "The research paper format of the MLA Handbook, 9th edition: everything double-spaced, one-inch margins, no title page, the writer's surname before the page number at the top right, and a list headed Works Cited.",
    "id": "mla-9",
    "kind": "style-guide",
    "name": "MLA 9 (research paper)",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "The term paper of the Student Supplement to the SBL Handbook of Style, 2nd edition: 12-point type, double-spaced text with single-spaced block quotations and bibliography, footnotes, a title page in capitals, and five forms of heading.",
    "id": "sbl-2-student",
    "kind": "style-guide",
    "name": "SBL Handbook of Style 2 (student paper)",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "medium",
    "description": "Typescripts for Bloomsbury Academic: at least double-spaced throughout, margins of at least 2.5 cm, page numbers centred at the foot in one sequence, endnotes, and quotations of over sixty words set off as a block.",
    "id": "bloomsbury-academic",
    "kind": "publisher",
    "name": "Bloomsbury Academic (books)",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "Book manuscripts for Brill: indented paragraphs, headings numbered decimally in arabic numerals, footnotes numbered anew in every chapter, a separate bibliography, and a manuscript anonymised for review.",
    "id": "brill-books",
    "kind": "publisher",
    "name": "Brill (books)",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "The series Kunst og kultur i opplæring from Cappelen Damm Forskning (NOASP): Calibri 11, double-spaced and justified, headings in the APA form in at most three levels, quotations of over 40 words set off, and APA 7 references.",
    "id": "cappelen-damm-kunst-og-kultur",
    "kind": "publisher",
    "name": "Cappelen Damm Forskning: Kunst og kultur i opplæring",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "The series Libelli from Cappelen Damm Forskning (NOASP): Calibri 12 with spacing of 1.5, headings of 16 and 14 points, endnotes, quotations of over three lines set off in single-spaced 10-point type, and Chicago short notes with a full bibliography.",
    "id": "cappelen-damm-libelli",
    "kind": "publisher",
    "name": "Cappelen Damm Forskning: Libelli",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "Book chapters for Routledge and Taylor & Francis: a blank line between paragraphs and no indent, at most three levels of unnumbered subheading, notes as endnotes numbered by chapter, and an abstract of 100 to 200 words for every chapter.",
    "id": "routledge-books",
    "kind": "publisher",
    "name": "Routledge / Taylor & Francis (books)",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "Book manuscripts for SAGE: Times New Roman 12, double-spaced, paragraphs parted by a blank line without indent, no page numbers, headers or footers, at most four levels of heading, notes at the end of each chapter, and APA references.",
    "id": "sage-books",
    "kind": "publisher",
    "name": "SAGE (books)",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "The general layout for articles sent to Taylor & Francis journals: Times New Roman 12, double spacing, margins of at least 2.5 cm, and five levels of heading of which the fourth and fifth run into the paragraph.",
    "id": "taylor-francis-journals",
    "kind": "publisher",
    "name": "Taylor & Francis journals",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "Book manuscripts for Universitetsforlaget (Scandinavian University Press) by its general guide for authors: the simplest possible formatting, a blank line between paragraphs, a ragged right margin, no hyphenation, and quotations of more than two lines set off as paragraphs of their own.",
    "id": "universitetsforlaget-books",
    "kind": "publisher",
    "name": "Universitetsforlaget (books, general guide)",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "Chapters for open access monographs and anthologies from Universitetsforlaget (Scandinavian University Press): Times New Roman 12 with spacing of 1.5, at most three levels of unnumbered heading, and for every chapter an English abstract of 150 to 250 words and four or five keywords.",
    "id": "universitetsforlaget-open-access",
    "kind": "publisher",
    "name": "Universitetsforlaget (open access research books)",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "Book manuscripts for the University of Chicago Press: minimal formatting, headings told apart by size (18, 16 and 14 points, bold), notes made with the word processor's note function, a title page, and Chicago style for references.",
    "id": "university-of-chicago-press-books",
    "kind": "publisher",
    "name": "University of Chicago Press (books)",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "Book manuscripts for Yale University Press: endnotes numbered anew in each chapter, subheads used sparingly and never numbered, quotations set off as a block only from 100 words, and Chicago notes and bibliography.",
    "id": "yale-university-press",
    "kind": "publisher",
    "name": "Yale University Press (books)",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "Manuscripts for American Anthropologist: Times New Roman 12, double-spaced and aligned left, endnotes and not footnotes, Chicago author-date references; anonymised, and at most 8,000 words at first submission.",
    "id": "american-anthropologist",
    "kind": "journal",
    "name": "American Anthropologist",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "Manuscripts for the American Economic Review: 11-point type with spacing of 1.5 and one-inch margins, the layout by which the journal measures length; sections numbered in roman numerals, footnotes, no title page, and an abstract of 100 words or fewer.",
    "id": "american-economic-review",
    "kind": "journal",
    "name": "American Economic Review",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "Manuscripts for the American Political Science Review: 12-point type, double-spaced main text, footnotes and not endnotes, page numbers on all pages, Chicago author-date references; anonymised, with an abstract of 150 words or less.",
    "id": "american-political-science-review",
    "kind": "journal",
    "name": "American Political Science Review",
    "own": false
  },
  {
    "checked": "2025-07-18",
    "confidence": "medium",
    "description": "Articles for the American Sociological Review: Times New Roman 12, everything double-spaced, notes and references included, margins of at least one inch, endnotes under the heading NOTES, no page numbers, ASA references; anonymised, at most 15,000 words.",
    "id": "american-sociological-review",
    "kind": "journal",
    "name": "American Sociological Review",
    "own": false
  },
  {
    "checked": "2025-07-06",
    "confidence": "medium",
    "description": "Articles for Classical Philology: 12-point type, everything double-spaced, footnotes and not endnotes, author-date references given in the notes with a list of literature cited; anonymised, at most 45 pages.",
    "id": "classical-philology",
    "kind": "journal",
    "name": "Classical Philology",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "Articles for History and Theory: footnotes in a house style based on the Chicago Manual, with no bibliography; quotations of more than seventy words set off; an abstract of 200 to 300 words and six to eight keywords. The journal prescribes no page layout.",
    "id": "history-and-theory",
    "kind": "journal",
    "name": "History and Theory",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "Articles for the Journal of Biblical Literature: a standard 12-point font, double-spaced, footnotes included; block quotations of five or more lines single-spaced; footnotes in SBL style with no bibliography and no cover page; anonymised, at most 10,000 words.",
    "id": "journal-of-biblical-literature",
    "kind": "journal",
    "name": "Journal of Biblical Literature",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "Accepted manuscripts for Language (Linguistic Society of America) by the LSA Journals Style Sheet: letter paper with one-inch margins, 12-point type and spacing of 1.5 throughout, aligned left, two levels of numbered headings in small capitals that run into the text, and endnotes after the references.",
    "id": "language-accepted",
    "kind": "journal",
    "name": "Language (accepted manuscript)",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "Manuscripts sent to Language (Linguistic Society of America) for review: double-spaced throughout and anonymised, with an abstract of at most 200 words and five to seven keywords; at most 18,000 words.",
    "id": "language-submission",
    "kind": "journal",
    "name": "Language (submission for review)",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "Papers for Mind: line spacing of 1.15 or 1.5 and never double, continuous line numbers, sections numbered in arabic numerals with bold headings and italic sub-headings, quotations of about thirty words or more set off; anonymised.",
    "id": "mind",
    "kind": "journal",
    "name": "Mind",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "Manuscripts for Nature: a standard font, preferably Times New Roman 12, double-spaced, with line numbers; a summary paragraph of ideally no more than 200 words in place of an abstract, and numbered references in the journal's own style.",
    "id": "nature",
    "kind": "journal",
    "name": "Nature",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "Articles for Past & Present: Times New Roman 12, double-spaced, indented paragraphs, sections numbered in roman numerals, footnotes only and no bibliography, quotations of 50 words or more inset from both margins; anonymised.",
    "id": "past-and-present",
    "kind": "journal",
    "name": "Past & Present",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "Manuscripts for PLOS ONE: double-spaced in any standard font, with page numbers and continuous line numbers, a title page as the first page, at most three levels of heading, no footnotes, and an abstract of at most 300 words.",
    "id": "plos-one",
    "kind": "journal",
    "name": "PLOS ONE",
    "own": false
  },
  {
    "checked": "2025-09-06",
    "confidence": "medium",
    "description": "Manuscripts for Psychological Review (American Psychological Association): the professional paper of APA 7, double-spaced throughout with five levels of unnumbered headings, an abstract of at most 250 words on a page of its own and up to five keywords.",
    "id": "psychological-review",
    "kind": "journal",
    "name": "Psychological Review",
    "own": false
  },
  {
    "checked": "2025-08-10",
    "confidence": "medium",
    "description": "Research articles for Science: letter paper, Times New Roman, single-spaced throughout, references and notes in one numbered list, an abstract of 125 words or less and at most 3,000 words of main text.",
    "id": "science",
    "kind": "journal",
    "name": "Science",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "Articles for the American Historical Review: Times New Roman 12, double-spaced, on letter paper with one-inch margins; no headings, only section breaks; all references in footnotes of 10 points, with no bibliography; fully anonymised.",
    "id": "american-historical-review",
    "kind": "journal",
    "name": "The American Historical Review",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "Articles for The Art Bulletin (College Art Association): Times New Roman 12 for everything, all copy double-spaced and aligned left, endnotes in Chicago style with no bibliography, quotations of 50 words or more set off; anonymised, at most 16,000 words.",
    "id": "art-bulletin",
    "kind": "journal",
    "name": "The Art Bulletin",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "Articles for The Classical Quarterly: Times New Roman 12 throughout, footnotes included, double-spaced and justified; section titles in capitals and centred, sub-section titles in italics, nothing in bold; footnotes and no bibliography; anonymised.",
    "id": "classical-quarterly",
    "kind": "journal",
    "name": "The Classical Quarterly",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "Articles for The Journal of Hellenic Studies: a generic font, three levels of heading numbered by hand, footnotes with author-date references and a bibliography, quotations of more than four lines set off; anonymised, at most 9,000 words.",
    "id": "journal-of-hellenic-studies",
    "kind": "journal",
    "name": "The Journal of Hellenic Studies",
    "own": false
  }
];

export const styles: StyleSummary[] = [
  {
    "bibliography": true,
    "id": "american-chemical-society",
    "kind": "numeric",
    "own": false,
    "title": "ACS Guide 2026 revision"
  },
  {
    "bibliography": true,
    "id": "american-medical-association",
    "kind": "numeric",
    "own": false,
    "title": "AMA Manual of Style 11th edition"
  },
  {
    "bibliography": true,
    "id": "american-anthropological-association",
    "kind": "author-date",
    "own": false,
    "title": "American Anthropological Association"
  },
  {
    "bibliography": true,
    "id": "american-journal-of-archaeology",
    "kind": "note",
    "own": false,
    "title": "American Journal of Archaeology"
  },
  {
    "bibliography": true,
    "id": "american-physics-society",
    "kind": "numeric",
    "own": false,
    "title": "American Physical Society"
  },
  {
    "bibliography": true,
    "id": "apa",
    "kind": "author-date",
    "own": false,
    "title": "APA Style 7th edition"
  },
  {
    "bibliography": true,
    "id": "american-political-science-association",
    "kind": "author-date",
    "own": false,
    "title": "APSA Style Manual revised 2018 edition"
  },
  {
    "bibliography": true,
    "id": "american-sociological-association",
    "kind": "author-date",
    "own": false,
    "title": "ASA Style Guide 6th/7th edition"
  },
  {
    "bibliography": false,
    "id": "bluebook-law-review",
    "kind": "note",
    "own": false,
    "title": "Bluebook Law Review"
  },
  {
    "bibliography": true,
    "id": "cambridge-university-press-author-date",
    "kind": "author-date",
    "own": false,
    "title": "Cambridge University Press, CambridgeB (author-date)"
  },
  {
    "bibliography": true,
    "id": "cambridge-university-press-note",
    "kind": "note",
    "own": false,
    "title": "Cambridge University Press (note)"
  },
  {
    "bibliography": true,
    "id": "cell",
    "kind": "numeric",
    "own": false,
    "title": "Cell"
  },
  {
    "bibliography": true,
    "id": "chicago-author-date-17th-edition",
    "kind": "author-date",
    "own": false,
    "title": "Chicago Manual of Style 17th edition (author-date)"
  },
  {
    "bibliography": true,
    "id": "chicago-notes-bibliography-17th-edition",
    "kind": "note",
    "own": false,
    "title": "Chicago Manual of Style 17th edition (notes and bibliography)"
  },
  {
    "bibliography": true,
    "id": "chicago-author-date",
    "kind": "author-date",
    "own": false,
    "title": "Chicago Manual of Style 18th edition (author-date)"
  },
  {
    "bibliography": true,
    "id": "chicago-notes-bibliography",
    "kind": "note",
    "own": false,
    "title": "Chicago Manual of Style 18th edition (notes and bibliography)"
  },
  {
    "bibliography": true,
    "id": "chicago-shortened-notes-bibliography",
    "kind": "note",
    "own": false,
    "title": "Chicago Manual of Style 18th edition (shortened notes and bibliography)"
  },
  {
    "bibliography": true,
    "id": "harvard-cite-them-right",
    "kind": "author-date",
    "own": false,
    "title": "Cite Them Right 12th edition (author-date/Harvard)"
  },
  {
    "bibliography": true,
    "id": "din-1505-2",
    "kind": "author-date",
    "own": false,
    "title": "DIN 1505-2 (author-date, Deutsch) - standard superseded by ISO-690"
  },
  {
    "bibliography": true,
    "id": "elsevier-harvard",
    "kind": "author-date",
    "own": false,
    "title": "Elsevier (author-date/Harvard, with titles)"
  },
  {
    "bibliography": false,
    "id": "history-and-theory",
    "kind": "note",
    "own": false,
    "title": "History and Theory"
  },
  {
    "bibliography": true,
    "id": "ieee",
    "kind": "numeric",
    "own": false,
    "title": "IEEE Reference Guide version 11.29.2023"
  },
  {
    "bibliography": true,
    "id": "infoclio-de",
    "kind": "note",
    "own": false,
    "title": "infoclio.ch (Deutsch - Schweiz)"
  },
  {
    "bibliography": true,
    "id": "iso690-author-date-en",
    "kind": "author-date",
    "own": false,
    "title": "ISO-690 (author-date, English)"
  },
  {
    "bibliography": true,
    "id": "iso690-full-note-en",
    "kind": "note",
    "own": false,
    "title": "ISO-690 (full note, English)"
  },
  {
    "bibliography": true,
    "id": "iso690-numeric-en",
    "kind": "numeric",
    "own": false,
    "title": "ISO-690 (numeric, English)"
  },
  {
    "bibliography": true,
    "id": "mhra-author-date",
    "kind": "author-date",
    "own": false,
    "title": "MHRA Style Guide 4th edition (author-date)"
  },
  {
    "bibliography": true,
    "id": "mhra-notes",
    "kind": "note",
    "own": false,
    "title": "MHRA Style Guide 4th edition (notes)"
  },
  {
    "bibliography": true,
    "id": "mhra-shortened-notes",
    "kind": "note",
    "own": false,
    "title": "MHRA Style Guide 4th edition (shortened notes)"
  },
  {
    "bibliography": true,
    "id": "modern-language-association",
    "kind": "author",
    "own": false,
    "title": "MLA Handbook 9th edition (in-text citations)"
  },
  {
    "bibliography": true,
    "id": "nature",
    "kind": "numeric",
    "own": false,
    "title": "Nature"
  },
  {
    "bibliography": true,
    "id": "new-harts-rules-author-date",
    "kind": "author-date",
    "own": false,
    "title": "New Hart's Rules: The Oxford Style Guide 2nd edition (author-date, bracketed date with comma)"
  },
  {
    "bibliography": true,
    "id": "new-harts-rules-notes",
    "kind": "note",
    "own": false,
    "title": "New Hart's Rules: The Oxford Style Guide 2nd edition (notes)"
  },
  {
    "bibliography": true,
    "id": "nlm-citation-sequence",
    "kind": "numeric",
    "own": false,
    "title": "NLM/Vancouver: Citing Medicine 2nd edition (citation-sequence)"
  },
  {
    "bibliography": true,
    "id": "norsk-apa-manual",
    "kind": "author-date",
    "own": false,
    "title": "Norsk APA-manual - APA 7th edition (author-date)"
  },
  {
    "bibliography": true,
    "id": "oscola",
    "kind": "note",
    "own": false,
    "title": "OSCOLA 4th edition"
  },
  {
    "bibliography": true,
    "id": "pnas",
    "kind": "numeric",
    "own": false,
    "title": "Proceedings of the National Academy of Sciences of the United States of America"
  },
  {
    "bibliography": true,
    "id": "plos",
    "kind": "numeric",
    "own": false,
    "title": "Public Library of Science"
  },
  {
    "bibliography": true,
    "id": "sage-harvard",
    "kind": "author-date",
    "own": false,
    "title": "SAGE (author-date/Harvard)"
  },
  {
    "bibliography": true,
    "id": "society-of-biblical-literature-author-date",
    "kind": "author-date",
    "own": false,
    "title": "SBL Handbook of Style 2nd edition (author-date)"
  },
  {
    "bibliography": true,
    "id": "society-of-biblical-literature-fullnote-bibliography",
    "kind": "note",
    "own": false,
    "title": "SBL Handbook of Style 2nd edition (notes)"
  },
  {
    "bibliography": true,
    "id": "science",
    "kind": "numeric",
    "own": false,
    "title": "Science"
  },
  {
    "bibliography": true,
    "id": "springer-basic-author-date",
    "kind": "author-date",
    "own": false,
    "title": "Springer - Basic (author-date)"
  },
  {
    "bibliography": true,
    "id": "taylor-and-francis-chicago-author-date",
    "kind": "author-date",
    "own": false,
    "title": "Taylor & Francis Journals Standard Reference Style Guide: Chicago author-date version 2.0"
  },
  {
    "bibliography": true,
    "id": "the-journal-of-hellenic-studies",
    "kind": "author-date",
    "own": false,
    "title": "The Journal of Hellenic Studies"
  },
  {
    "bibliography": true,
    "id": "the-lancet",
    "kind": "numeric",
    "own": false,
    "title": "The Lancet"
  },
  {
    "bibliography": true,
    "id": "unified-style-sheet-for-linguistics",
    "kind": "author-date",
    "own": false,
    "title": "Unified style sheet for linguistics"
  }
];

export const preview: Preview = {
  "count": 2,
  "height": 842.0,
  "missing": [
    "gone"
  ],
  "pages": [
    {
      "number": 1,
      "svg": "<svg/>"
    }
  ],
  "substitute": "Libertinus Serif",
  "warnings": [
    "A remark."
  ],
  "width": 595.0
};
