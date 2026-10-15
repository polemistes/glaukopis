// Made by the test `contract` in src-tauri/src/contract.rs: what the Rust side
// sends, as it sends it, typed as the interface declares it. The type check
// fails where the two differ. Not to be changed by hand: run the tests.

import type { Summary, Reference, LibraryListing, ImportPlan, DuplicateGroup } from './library';
import type { Looked, PageTextView } from './ocr';
import type { Imported } from './imported';
import type { FilesListing, TakenIn, Exported, Proposal } from './files';
import type { ProjectInfo, Folder } from './projects';
import type { Picture } from './pictures';
import type { ToolsInfo, DocumentFormat, FormatSummary, StyleSummary, Preview, KindEntry, KindLooks } from './documents';
import type { Template, TemplateSummary, PartKindEntry } from './templates';

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
  "publisher": "Johns Hopkins",
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
      "kind": "pdf",
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
    "publisher": "Johns Hopkins",
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
      "publisher": "Johns Hopkins",
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
      "publisher": "",
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

export const looked: Looked = {
  "file": "porson.pdf",
  "fonts": [
    "PorsonGreekSF"
  ],
  "locked": false,
  "pages": 1,
  "picture": false,
  "poor": 0,
  "sample": {
    "lines": [
      ">\u0013θην \\πειλα9\u0013, %γ%λα\u0013α ψολοκομπ9αι\u0013,",
      "\\πεπυδ\\ρι\u0013α μ%θωνα, περιεκ%κκα\u0013α.",
      "ο<τοι μ\\ τ=ν Δ=μητρα, ε9 μ= %κφ\\γω",
      "%κ τ=\u0013δε τ=\u0013 γ=\u0013, ο%δ%ποτε βι\\\u0013ομαι."
    ],
    "page": "1",
    "translated": [
      "ἥσθην ἀπειλαῖς, ἐγέλασα ψολοκομπίαις,",
      "ἀπεπυδάρισα μόθωνα, περιεκόκκασα.",
      "οὔτοι μὰ τὴν Δήμητρα, εἰ μὴ ἐκφάγω",
      "ἐκ τῆσδε τῆς γῆς, οὐδέποτε βιώσομαι."
    ]
  },
  "schemes": [
    {
      "fonts": [
        "PorsonGreekSF"
      ],
      "pages": 1,
      "scheme": "greek-names"
    }
  ],
  "searchable": true,
  "title": null,
  "withText": 1
};

export const shapedImport: Imported = {
  "abstract": null,
  "authors": [],
  "counts": {
    "cited": 0,
    "equations": 0,
    "figures": 0,
    "found": 0,
    "foundMade": 0,
    "notFound": 0,
    "notes": 0,
    "parts": 2,
    "tables": 0,
    "words": 338
  },
  "date": null,
  "file": "shape.pdf",
  "keywords": [],
  "kind": "PDF",
  "language": null,
  "pictures": [],
  "remarks": [],
  "sections": [
    {
      "blocks": [
        {
          "content": [
            {
              "kind": "refmark",
              "label": "1"
            },
            {
              "kind": "text",
              "marks": {},
              "text": "Every page has a shape, whatever is written on it. This first paragraph is set in the body of the book, in the size most of its lines are in, and it runs on from one line to the next as prose does, filling the measure from the left edge to the right."
            }
          ],
          "indent": 0,
          "kind": "paragraph",
          "name": "text"
        },
        {
          "content": [
            {
              "kind": "text",
              "marks": {},
              "text": "A second paragraph begins further in, as many books begin their paragraphs, and goes on as the first one did, to the end of its last line, which may stop short of the right edge."
            }
          ],
          "indent": 0,
          "kind": "paragraph",
          "name": "text"
        },
        {
          "content": [
            {
              "kind": "text",
              "marks": {},
              "text": "Some words stand out in it: "
            },
            {
              "kind": "text",
              "marks": {
                "em": true
              },
              "text": "these are set in italics"
            },
            {
              "kind": "text",
              "marks": {},
              "text": ", and the rest are not."
            }
          ],
          "indent": 0,
          "kind": "paragraph",
          "name": "text"
        },
        {
          "content": [
            {
              "kind": "text",
              "marks": {},
              "text": "1. A note at the foot of the first page, in a smaller size."
            }
          ],
          "indent": 0,
          "kind": "paragraph",
          "name": "style:1"
        }
      ],
      "heading": [],
      "level": 0
    },
    {
      "blocks": [
        {
          "content": [
            {
              "kind": "refmark",
              "label": "2"
            },
            {
              "kind": "text",
              "marks": {},
              "text": "The first line is short,"
            },
            {
              "kind": "break"
            },
            {
              "kind": "text",
              "marks": {},
              "text": "and the second a little longer than it,"
            },
            {
              "kind": "break"
            },
            {
              "kind": "text",
              "marks": {},
              "text": "the third shorter again,"
            },
            {
              "kind": "break"
            },
            {
              "kind": "linemark",
              "number": "4"
            },
            {
              "kind": "text",
              "marks": {},
              "text": "and the fourth stands beside a number."
            },
            {
              "kind": "break"
            },
            {
              "kind": "text",
              "marks": {},
              "text": "A fifth line follows"
            },
            {
              "kind": "break"
            },
            {
              "kind": "text",
              "marks": {},
              "text": "with a sixth that is longer than the fifth was,"
            },
            {
              "kind": "break"
            },
            {
              "kind": "text",
              "marks": {},
              "text": "a seventh,"
            },
            {
              "kind": "break"
            },
            {
              "kind": "linemark",
              "number": "8"
            },
            {
              "kind": "text",
              "marks": {},
              "text": "and an eighth with a number beside it once more."
            }
          ],
          "indent": 0,
          "kind": "paragraph",
          "name": "text",
          "numbering": "given",
          "side": "right"
        },
        {
          "content": [
            {
              "kind": "text",
              "marks": {},
              "text": "After the lines the prose goes on again, as it did before them, in the body of the book, from the left edge to the right, for a few lines more."
            }
          ],
          "indent": 0,
          "kind": "paragraph",
          "name": "text"
        },
        {
          "content": [
            {
              "kind": "text",
              "marks": {},
              "text": "2. A note at the foot of the second page, in a smaller size."
            }
          ],
          "indent": 0,
          "kind": "paragraph",
          "name": "style:1"
        },
        {
          "content": [
            {
              "kind": "refmark",
              "label": "3"
            },
            {
              "kind": "text",
              "marks": {},
              "text": "Another page of prose stands here, so that the body is the size most lines are in, and so that what recurs at the head and at the foot of the pages is seen to recur. It runs on for some lines, as prose does."
            }
          ],
          "indent": 0,
          "kind": "paragraph",
          "name": "text"
        },
        {
          "content": [
            {
              "kind": "text",
              "marks": {},
              "text": "It has a second paragraph as well, which says nothing new, but says it at the length a paragraph has."
            }
          ],
          "indent": 0,
          "kind": "paragraph",
          "name": "text"
        },
        {
          "content": [
            {
              "kind": "text",
              "marks": {},
              "text": "3. A note at the foot of the third page, in a smaller size."
            }
          ],
          "indent": 0,
          "kind": "paragraph",
          "name": "style:1"
        }
      ],
      "heading": [
        {
          "kind": "text",
          "marks": {
            "strong": true
          },
          "text": "Lines That Keep Their Place"
        }
      ],
      "level": 1
    },
    {
      "blocks": [
        {
          "content": [
            {
              "kind": "refmark",
              "label": "4"
            },
            {
              "kind": "text",
              "marks": {},
              "text": "The last page has a heading of the same size as the second page had, and prose under it, and nothing more than that, for a book of tests needs no more."
            }
          ],
          "indent": 0,
          "kind": "paragraph",
          "name": "text"
        },
        {
          "content": [
            {
              "kind": "text",
              "marks": {},
              "text": "4. A note at the foot of the fourth page, in a smaller size."
            }
          ],
          "indent": 0,
          "kind": "paragraph",
          "name": "style:1"
        }
      ],
      "heading": [
        {
          "kind": "text",
          "marks": {
            "strong": true
          },
          "text": "The Last Part"
        }
      ],
      "level": 1
    }
  ],
  "styles": [
    {
      "bold": false,
      "count": 4,
      "family": "LibertinusSerif",
      "id": 1,
      "indent": false,
      "italic": false,
      "kept": false,
      "pages": 4,
      "sample": "1. A note at the foot of the first page, in a smaller size.",
      "size": 0.7699999809265137
    }
  ],
  "subtitle": null,
  "title": [
    {
      "kind": "text",
      "marks": {
        "strong": true
      },
      "text": "The Measure of Things"
    }
  ]
};

export const pageText: PageTextView[] = [
  {
    "hasText": true,
    "label": "1",
    "lines": [
      ">\u0013θην \\πειλα9\u0013, %γ%λα\u0013α ψολοκομπ9αι\u0013,",
      "\\πεπυδ\\ρι\u0013α μ%θωνα, περιεκ%κκα\u0013α.",
      "ο<τοι μ\\ τ=ν Δ=μητρα, ε9 μ= %κφ\\γω",
      "%κ τ=\u0013δε τ=\u0013 γ=\u0013, ο%δ%ποτε βι\\\u0013ομαι."
    ],
    "number": 1,
    "translated": [
      "ἥσθην ἀπειλαῖς, ἐγέλασα ψολοκομπίαις,",
      "ἀπεπυδάρισα μόθωνα, περιεκόκκασα.",
      "οὔτοι μὰ τὴν Δήμητρα, εἰ μὴ ἐκφάγω",
      "ἐκ τῆσδε τῆς γῆς, οὐδέποτε βιώσομαι."
    ]
  }
];

export const files: FilesListing = {
  "files": [
    {
      "added": "2026-01-01T00:00:00Z",
      "exists": true,
      "folder": null,
      "hash": "e16fa5d9b51928755db85b917f0297babaf22c7a47e97d9212adab56e61ba04e",
      "kind": "pdf",
      "name": "Nagy 1979 - The Best of the Achaeans.pdf",
      "origin": null,
      "path": "attachments/e1/e16fa5d9b51928755db85b917f0297babaf22c7a47e97d9212adab56e61ba04e/Nagy 1979 - The Best of the Achaeans.pdf",
      "references": [
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
          "publisher": "Johns Hopkins",
          "search": "gregory nagy some else the best of the achaeans concepts of the hero  johns hopkins baltimore hero epic 10 1 x 9780801823886 read again 1979 nagy1979",
          "title": "The Best of the Achaeans: Concepts of the Hero",
          "type": "book",
          "year": "1979",
          "yearNumber": 1979
        }
      ],
      "size": 8
    },
    {
      "added": "2026-01-01T00:00:00Z",
      "exists": true,
      "folder": "00000000-0000-4000-8000-000000000000",
      "hash": "4ff6ab670a58c14270e034e2090d9a432caa263a14e0a25785386b0c12f880b5",
      "kind": "picture",
      "name": "plate.png",
      "origin": "/data/plate.png",
      "path": "attachments/4f/4ff6ab670a58c14270e034e2090d9a432caa263a14e0a25785386b0c12f880b5/plate.png",
      "references": [],
      "size": 70
    }
  ],
  "folders": [
    {
      "id": "00000000-0000-4000-8000-000000000000",
      "name": "Greek",
      "order": "000001"
    }
  ]
};

export const takenIn: TakenIn = {
  "files": [
    {
      "added": "2026-01-01T00:00:00Z",
      "exists": true,
      "folder": "00000000-0000-4000-8000-000000000000",
      "hash": "4ff6ab670a58c14270e034e2090d9a432caa263a14e0a25785386b0c12f880b5",
      "kind": "picture",
      "name": "plate.png",
      "origin": "/data/plate.png",
      "path": "attachments/4f/4ff6ab670a58c14270e034e2090d9a432caa263a14e0a25785386b0c12f880b5/plate.png",
      "references": [],
      "size": 70
    }
  ],
  "folders": 0,
  "problems": [],
  "same": []
};

export const exported: Exported = {
  "bib": "/data/exported/references.bib",
  "files": 2,
  "folders": 1,
  "problems": [],
  "stopped": false,
  "total": 2
};

export const proposal: Proposal[] = [
  {
    "hash": "4ff6ab670a58c14270e034e2090d9a432caa263a14e0a25785386b0c12f880b5",
    "lookup": {
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
    "matches": [
      {
        "certainty": "probable",
        "gains": [],
        "id": "00000000-0000-4000-8000-000000000000",
        "reasons": [
          "name"
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
        "certainty": "probable",
        "gains": [],
        "id": "00000000-0000-4000-8000-000000000000",
        "reasons": [
          "name"
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
    "name": "Nagy 1979 - The Best of the Achaeans.pdf",
    "named": {
      "families": [
        "Nagy"
      ],
      "title": "The Best of the Achaeans",
      "year": 1979
    },
    "notes": [
      "A remark."
    ]
  }
];

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
  "folder": "00000000-0000-4000-8000-000000000000",
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

export const folder: Folder = {
  "id": "00000000-0000-4000-8000-000000000000",
  "name": "Epic",
  "order": "000002",
  "parent": "00000000-0000-4000-8000-000000000000"
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
  "lineNumbers": false,
  "name": "Manuscript",
  "notes": {
    "kind": "footnotes",
    "lineSpacing": 1.0,
    "size": 10.0,
    "title": "Notes"
  },
  "page": {
    "columnGap": "1cm",
    "columns": 1,
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
    "italics": "italic",
    "lineSpacing": 2.0,
    "paragraphs": "indent",
    "refmarks": "raised",
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
  },
  "verse": {
    "every": 5,
    "side": "left"
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
    "confidence": "medium",
    "description": "The standard screenplay page: 12-point Courier, single spacing, a wide margin at the left for binding, scene headings in capitals, the character over the dialogue, the dialogue in a narrow column; a page a minute of film.",
    "id": "screenplay",
    "kind": "stage",
    "name": "Screenplay",
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
      "svg": "<svg/>",
      "texts": [
        {
          "baseline": 100.5,
          "size": 11.0,
          "text": "Wrath",
          "width": 40.25,
          "x": 72.0
        }
      ]
    }
  ],
  "places": [
    {
      "element": "e1",
      "page": 1,
      "y": 72.0
    }
  ],
  "substitute": "Libertinus Serif",
  "warnings": [
    "A remark."
  ],
  "width": 595.0
};

export const kinds: KindEntry[] = [
  {
    "basedOn": null,
    "counted": true,
    "family": "paragraph",
    "group": "none",
    "id": "text",
    "style": "Body Text",
    "words": false
  },
  {
    "basedOn": null,
    "counted": true,
    "family": "paragraph",
    "group": "quote",
    "id": "quote",
    "style": "Block Text",
    "words": false
  },
  {
    "basedOn": "quote",
    "counted": true,
    "family": "paragraph",
    "group": "none",
    "id": "epigraph",
    "style": "Epigraph",
    "words": false
  },
  {
    "basedOn": "quote",
    "counted": false,
    "family": "paragraph",
    "group": "none",
    "id": "attribution",
    "style": "Attribution",
    "words": false
  },
  {
    "basedOn": null,
    "counted": true,
    "family": "paragraph",
    "group": "lines",
    "id": "line",
    "style": "Line",
    "words": false
  },
  {
    "basedOn": null,
    "counted": false,
    "family": "paragraph",
    "group": "none",
    "id": "speaker",
    "style": "Speaker",
    "words": true
  },
  {
    "basedOn": null,
    "counted": false,
    "family": "paragraph",
    "group": "none",
    "id": "direction",
    "style": "Stage Direction",
    "words": true
  },
  {
    "basedOn": null,
    "counted": true,
    "family": "paragraph",
    "group": "none",
    "id": "scene",
    "style": "Scene Heading",
    "words": false
  },
  {
    "basedOn": null,
    "counted": true,
    "family": "paragraph",
    "group": "none",
    "id": "action",
    "style": "Action",
    "words": false
  },
  {
    "basedOn": null,
    "counted": true,
    "family": "paragraph",
    "group": "none",
    "id": "character",
    "style": "Character",
    "words": false
  },
  {
    "basedOn": null,
    "counted": true,
    "family": "paragraph",
    "group": "none",
    "id": "dialogue",
    "style": "Dialogue",
    "words": false
  },
  {
    "basedOn": null,
    "counted": true,
    "family": "paragraph",
    "group": "none",
    "id": "parenthetical",
    "style": "Parenthetical",
    "words": false
  },
  {
    "basedOn": null,
    "counted": true,
    "family": "paragraph",
    "group": "none",
    "id": "transition",
    "style": "Transition",
    "words": false
  },
  {
    "basedOn": null,
    "counted": true,
    "family": "paragraph",
    "group": "glossary",
    "id": "headword",
    "style": "Headword",
    "words": false
  },
  {
    "basedOn": null,
    "counted": true,
    "family": "paragraph",
    "group": "glossary",
    "id": "gloss",
    "style": "Gloss",
    "words": false
  },
  {
    "basedOn": null,
    "counted": true,
    "family": "paragraph",
    "group": "list",
    "id": "item",
    "style": "",
    "words": false
  },
  {
    "basedOn": null,
    "counted": true,
    "family": "paragraph",
    "group": "list",
    "id": "numbered",
    "style": "",
    "words": false
  },
  {
    "basedOn": null,
    "counted": true,
    "family": "paragraph",
    "group": "code",
    "id": "code",
    "style": "Source Code",
    "words": false
  },
  {
    "basedOn": null,
    "counted": false,
    "family": "paragraph",
    "group": "none",
    "id": "break",
    "style": "Section Break",
    "words": false
  },
  {
    "basedOn": null,
    "counted": false,
    "family": "paragraph",
    "group": "none",
    "id": "draft",
    "style": "",
    "words": false
  },
  {
    "basedOn": null,
    "counted": false,
    "family": "words",
    "group": "words",
    "id": "foreign",
    "style": "Foreign",
    "words": false
  },
  {
    "basedOn": null,
    "counted": false,
    "family": "words",
    "group": "words",
    "id": "title",
    "style": "Title of a Work",
    "words": false
  },
  {
    "basedOn": null,
    "counted": false,
    "family": "words",
    "group": "words",
    "id": "term",
    "style": "Term",
    "words": false
  },
  {
    "basedOn": null,
    "counted": false,
    "family": "words",
    "group": "words",
    "id": "mention",
    "style": "Mention",
    "words": false
  },
  {
    "basedOn": null,
    "counted": false,
    "family": "words",
    "group": "words",
    "id": "highlight",
    "style": "",
    "words": false
  }
];

export const kindLooks: KindLooks = {
  "action": {
    "look": {
      "align": "left",
      "bold": false,
      "case": "none",
      "firstLine": "0pt",
      "indentLeft": "0pt",
      "indentRight": "0pt",
      "italic": false,
      "keepWithNext": false,
      "lineSpacing": 2.0,
      "monospace": false,
      "newPage": false,
      "size": 12.0,
      "spaceAfter": "11pt",
      "spaceBefore": "11pt",
      "text": "",
      "underline": false
    },
    "said": false
  },
  "attribution": {
    "look": {
      "align": "right",
      "bold": false,
      "case": "none",
      "firstLine": "0pt",
      "indentLeft": "1.27cm",
      "indentRight": "0pt",
      "italic": false,
      "keepWithNext": false,
      "lineSpacing": 2.0,
      "monospace": false,
      "newPage": false,
      "size": 12.0,
      "spaceAfter": "6pt",
      "spaceBefore": "0pt",
      "text": "",
      "underline": false
    },
    "said": false
  },
  "break": {
    "look": {
      "align": "center",
      "bold": false,
      "case": "none",
      "firstLine": "0pt",
      "indentLeft": "0pt",
      "indentRight": "0pt",
      "italic": false,
      "keepWithNext": true,
      "lineSpacing": 2.0,
      "monospace": false,
      "newPage": false,
      "size": 12.0,
      "spaceAfter": "12pt",
      "spaceBefore": "12pt",
      "text": "* * *",
      "underline": false
    },
    "said": false
  },
  "character": {
    "look": {
      "align": "left",
      "bold": false,
      "case": "upper",
      "firstLine": "0pt",
      "indentLeft": "5.6cm",
      "indentRight": "0pt",
      "italic": false,
      "keepWithNext": true,
      "lineSpacing": 2.0,
      "monospace": false,
      "newPage": false,
      "size": 12.0,
      "spaceAfter": "0pt",
      "spaceBefore": "11pt",
      "text": "",
      "underline": false
    },
    "said": false
  },
  "code": {
    "look": {
      "align": "left",
      "bold": false,
      "case": "none",
      "firstLine": "0pt",
      "indentLeft": "0pt",
      "indentRight": "0pt",
      "italic": false,
      "keepWithNext": false,
      "lineSpacing": 1.0,
      "monospace": true,
      "newPage": false,
      "size": 12.0,
      "spaceAfter": "6pt",
      "spaceBefore": "6pt",
      "text": "",
      "underline": false
    },
    "said": false
  },
  "dialogue": {
    "look": {
      "align": "left",
      "bold": false,
      "case": "none",
      "firstLine": "0pt",
      "indentLeft": "2.5cm",
      "indentRight": "3.8cm",
      "italic": false,
      "keepWithNext": false,
      "lineSpacing": 2.0,
      "monospace": false,
      "newPage": false,
      "size": 12.0,
      "spaceAfter": "0pt",
      "spaceBefore": "0pt",
      "text": "",
      "underline": false
    },
    "said": false
  },
  "direction": {
    "look": {
      "align": "left",
      "bold": false,
      "case": "none",
      "firstLine": "0pt",
      "indentLeft": "1cm",
      "indentRight": "0pt",
      "italic": true,
      "keepWithNext": false,
      "lineSpacing": 2.0,
      "monospace": false,
      "newPage": false,
      "size": 12.0,
      "spaceAfter": "3pt",
      "spaceBefore": "3pt",
      "text": "",
      "underline": false
    },
    "said": false
  },
  "draft": {
    "look": {
      "align": "left",
      "bold": false,
      "case": "none",
      "firstLine": "1.27cm",
      "indentLeft": "0pt",
      "indentRight": "0pt",
      "italic": false,
      "keepWithNext": false,
      "lineSpacing": 2.0,
      "monospace": false,
      "newPage": false,
      "size": 12.0,
      "spaceAfter": "0pt",
      "spaceBefore": "0pt",
      "text": "",
      "underline": false
    },
    "said": false
  },
  "epigraph": {
    "look": {
      "align": "left",
      "bold": false,
      "case": "none",
      "firstLine": "0pt",
      "indentLeft": "4cm",
      "indentRight": "0pt",
      "italic": false,
      "keepWithNext": false,
      "lineSpacing": 2.0,
      "monospace": false,
      "newPage": false,
      "size": 12.0,
      "spaceAfter": "18pt",
      "spaceBefore": "6pt",
      "text": "",
      "underline": false
    },
    "said": false
  },
  "foreign": {
    "look": {
      "align": "left",
      "bold": false,
      "case": "none",
      "firstLine": "0pt",
      "indentLeft": "0pt",
      "indentRight": "0pt",
      "italic": true,
      "keepWithNext": false,
      "lineSpacing": 0.0,
      "monospace": false,
      "newPage": false,
      "size": 0.0,
      "spaceAfter": "0pt",
      "spaceBefore": "0pt",
      "text": "",
      "underline": false
    },
    "said": false
  },
  "gloss": {
    "look": {
      "align": "left",
      "bold": false,
      "case": "none",
      "firstLine": "0pt",
      "indentLeft": "1.27cm",
      "indentRight": "0pt",
      "italic": false,
      "keepWithNext": false,
      "lineSpacing": 2.0,
      "monospace": false,
      "newPage": false,
      "size": 12.0,
      "spaceAfter": "6pt",
      "spaceBefore": "0pt",
      "text": "",
      "underline": false
    },
    "said": false
  },
  "headword": {
    "look": {
      "align": "left",
      "bold": true,
      "case": "none",
      "firstLine": "0pt",
      "indentLeft": "0pt",
      "indentRight": "0pt",
      "italic": false,
      "keepWithNext": true,
      "lineSpacing": 2.0,
      "monospace": false,
      "newPage": false,
      "size": 12.0,
      "spaceAfter": "0pt",
      "spaceBefore": "6pt",
      "text": "",
      "underline": false
    },
    "said": false
  },
  "highlight": {
    "look": {
      "align": "left",
      "bold": false,
      "case": "none",
      "firstLine": "0pt",
      "indentLeft": "0pt",
      "indentRight": "0pt",
      "italic": false,
      "keepWithNext": false,
      "lineSpacing": 0.0,
      "monospace": false,
      "newPage": false,
      "size": 0.0,
      "spaceAfter": "0pt",
      "spaceBefore": "0pt",
      "text": "",
      "underline": false
    },
    "said": false
  },
  "item": {
    "look": {
      "align": "left",
      "bold": false,
      "case": "none",
      "firstLine": "1.27cm",
      "indentLeft": "0pt",
      "indentRight": "0pt",
      "italic": false,
      "keepWithNext": false,
      "lineSpacing": 2.0,
      "monospace": false,
      "newPage": false,
      "size": 12.0,
      "spaceAfter": "0pt",
      "spaceBefore": "0pt",
      "text": "",
      "underline": false
    },
    "said": false
  },
  "line": {
    "look": {
      "align": "left",
      "bold": false,
      "case": "none",
      "firstLine": "0pt",
      "indentLeft": "1cm",
      "indentRight": "0pt",
      "italic": false,
      "keepWithNext": false,
      "lineSpacing": 2.0,
      "monospace": false,
      "newPage": false,
      "size": 12.0,
      "spaceAfter": "0pt",
      "spaceBefore": "0pt",
      "text": "",
      "underline": false
    },
    "said": false
  },
  "mention": {
    "look": {
      "align": "left",
      "bold": false,
      "case": "none",
      "firstLine": "0pt",
      "indentLeft": "0pt",
      "indentRight": "0pt",
      "italic": false,
      "keepWithNext": false,
      "lineSpacing": 0.0,
      "monospace": false,
      "newPage": false,
      "size": 0.0,
      "spaceAfter": "0pt",
      "spaceBefore": "0pt",
      "text": "",
      "underline": false
    },
    "said": false
  },
  "numbered": {
    "look": {
      "align": "left",
      "bold": false,
      "case": "none",
      "firstLine": "1.27cm",
      "indentLeft": "0pt",
      "indentRight": "0pt",
      "italic": false,
      "keepWithNext": false,
      "lineSpacing": 2.0,
      "monospace": false,
      "newPage": false,
      "size": 12.0,
      "spaceAfter": "0pt",
      "spaceBefore": "0pt",
      "text": "",
      "underline": false
    },
    "said": false
  },
  "parenthetical": {
    "look": {
      "align": "left",
      "bold": false,
      "case": "none",
      "firstLine": "0pt",
      "indentLeft": "4cm",
      "indentRight": "4cm",
      "italic": false,
      "keepWithNext": true,
      "lineSpacing": 2.0,
      "monospace": false,
      "newPage": false,
      "size": 12.0,
      "spaceAfter": "0pt",
      "spaceBefore": "0pt",
      "text": "",
      "underline": false
    },
    "said": false
  },
  "quote": {
    "look": {
      "align": "left",
      "bold": false,
      "case": "none",
      "firstLine": "0pt",
      "indentLeft": "1.27cm",
      "indentRight": "0pt",
      "italic": false,
      "keepWithNext": false,
      "lineSpacing": 2.0,
      "monospace": false,
      "newPage": false,
      "size": 12.0,
      "spaceAfter": "6pt",
      "spaceBefore": "6pt",
      "text": "",
      "underline": false
    },
    "said": false
  },
  "scene": {
    "look": {
      "align": "left",
      "bold": true,
      "case": "upper",
      "firstLine": "0pt",
      "indentLeft": "0pt",
      "indentRight": "0pt",
      "italic": false,
      "keepWithNext": true,
      "lineSpacing": 2.0,
      "monospace": false,
      "newPage": false,
      "size": 12.0,
      "spaceAfter": "11pt",
      "spaceBefore": "19pt",
      "text": "",
      "underline": false
    },
    "said": false
  },
  "speaker": {
    "look": {
      "align": "left",
      "bold": false,
      "case": "smallcaps",
      "firstLine": "0pt",
      "indentLeft": "1cm",
      "indentRight": "0pt",
      "italic": false,
      "keepWithNext": false,
      "lineSpacing": 2.0,
      "monospace": false,
      "newPage": false,
      "size": 12.0,
      "spaceAfter": "3pt",
      "spaceBefore": "8pt",
      "text": "",
      "underline": false
    },
    "said": false
  },
  "term": {
    "look": {
      "align": "left",
      "bold": false,
      "case": "none",
      "firstLine": "0pt",
      "indentLeft": "0pt",
      "indentRight": "0pt",
      "italic": true,
      "keepWithNext": false,
      "lineSpacing": 0.0,
      "monospace": false,
      "newPage": false,
      "size": 0.0,
      "spaceAfter": "0pt",
      "spaceBefore": "0pt",
      "text": "",
      "underline": false
    },
    "said": false
  },
  "text": {
    "look": {
      "align": "left",
      "bold": false,
      "case": "none",
      "firstLine": "1.27cm",
      "indentLeft": "0pt",
      "indentRight": "0pt",
      "italic": false,
      "keepWithNext": false,
      "lineSpacing": 2.0,
      "monospace": false,
      "newPage": false,
      "size": 12.0,
      "spaceAfter": "0pt",
      "spaceBefore": "0pt",
      "text": "",
      "underline": false
    },
    "said": false
  },
  "title": {
    "look": {
      "align": "left",
      "bold": false,
      "case": "none",
      "firstLine": "0pt",
      "indentLeft": "0pt",
      "indentRight": "0pt",
      "italic": true,
      "keepWithNext": false,
      "lineSpacing": 0.0,
      "monospace": false,
      "newPage": false,
      "size": 0.0,
      "spaceAfter": "0pt",
      "spaceBefore": "0pt",
      "text": "",
      "underline": false
    },
    "said": false
  },
  "transition": {
    "look": {
      "align": "right",
      "bold": false,
      "case": "upper",
      "firstLine": "0pt",
      "indentLeft": "0pt",
      "indentRight": "0pt",
      "italic": false,
      "keepWithNext": false,
      "lineSpacing": 2.0,
      "monospace": false,
      "newPage": false,
      "size": 12.0,
      "spaceAfter": "11pt",
      "spaceBefore": "11pt",
      "text": "",
      "underline": false
    },
    "said": false
  }
};

export const template: Template = {
  "contents": [
    {
      "part": "title-page"
    },
    {
      "part": "body"
    },
    {
      "part": "notes"
    },
    {
      "part": "bibliography"
    }
  ],
  "description": "A document of nothing but its text: the title, the body, the notes and the bibliography.",
  "group": "plain",
  "id": "plain",
  "kinds": [],
  "name": "Plain document",
  "outputs": [
    {
      "id": "document",
      "targets": [
        "pdf",
        "pdf-latex",
        "docx",
        "odt",
        "latex",
        "typst",
        "markdown",
        "html",
        "epub"
      ]
    }
  ],
  "passageKinds": [],
  "requirements": {
    "abstractWords": null,
    "anonymous": false,
    "keywords": null,
    "note": "",
    "words": null
  }
};

export const templates: TemplateSummary[] = [
  {
    "checked": "2026-10-11",
    "confidence": "medium",
    "description": "A student's or a conference paper: a title page, the text, the notes and the bibliography, as the writer's usual layout and citation style set them.",
    "group": "plain",
    "id": "paper",
    "name": "Paper",
    "own": false
  },
  {
    "checked": "",
    "confidence": "",
    "description": "A document of nothing but its text: the title, the body, the notes and the bibliography.",
    "group": "plain",
    "id": "plain",
    "name": "Plain document",
    "own": false
  },
  {
    "checked": "2026-10-11",
    "confidence": "medium",
    "description": "An article for a journal: a title page, the abstract and keywords, the text, then appendices, acknowledgements, notes and bibliography, with no limits until a journal's template sets them.",
    "group": "article",
    "id": "article",
    "name": "Journal article",
    "own": false
  },
  {
    "checked": "2026-10-11",
    "confidence": "medium",
    "description": "A report: a title page, an abstract, the contents, the text, then appendices and bibliography.",
    "group": "article",
    "id": "report",
    "name": "Report",
    "own": false
  },
  {
    "checked": "2026-10-11",
    "confidence": "medium",
    "description": "An academic book: half-title and title page, copyright, dedication and epigraph, the contents, foreword, preface and acknowledgements, the chapters, then appendices, glossary, notes, bibliography and a note on the author.",
    "group": "book",
    "id": "book",
    "name": "Academic book",
    "own": false
  },
  {
    "checked": "2026-10-11",
    "confidence": "medium",
    "description": "A thesis or dissertation: a title page, the abstract and acknowledgements, the table of contents with the lists of figures and tables, the chapters, then appendices and bibliography.",
    "group": "book",
    "id": "thesis",
    "name": "Thesis",
    "own": false
  },
  {
    "checked": "2026-10-11",
    "confidence": "medium",
    "description": "A collection of stories as a book: the cover, title page, copyright and dedication, the contents, each story an element, then acknowledgements and a note on the author.",
    "group": "fiction",
    "id": "story-collection",
    "name": "Collection of stories",
    "own": false
  },
  {
    "checked": "2026-10-11",
    "confidence": "medium",
    "description": "A novel as a printed book or an e-book: the cover, half-title and title page, copyright, dedication and epigraph, the contents, the chapters, then acknowledgements and a note on the author.",
    "group": "fiction",
    "id": "novel",
    "name": "Novel",
    "own": false
  },
  {
    "checked": "2026-10-11",
    "confidence": "medium",
    "description": "A novel as a manuscript for an agent or a publisher: a title page and the chapters, in the standard manuscript format.",
    "group": "fiction",
    "id": "novel-manuscript",
    "name": "Novel manuscript",
    "own": false
  },
  {
    "checked": "2026-10-11",
    "confidence": "medium",
    "description": "A short story for submission to a magazine or a competition: a title page and the text, in the standard manuscript format.",
    "group": "fiction",
    "id": "short-story",
    "name": "Short story",
    "own": false
  },
  {
    "checked": "2026-10-11",
    "confidence": "low",
    "description": "A stage play: a title page, the cast and the setting, then the acts and scenes, with the speeches written as verse, each with its speaker and its directions.",
    "group": "stage",
    "id": "play",
    "name": "Play",
    "own": false
  },
  {
    "checked": "2026-10-11",
    "confidence": "low",
    "description": "A screenplay: a title page and the script, with its scene headings, action, characters, dialogue, parentheticals and transitions on the standard page.",
    "group": "stage",
    "id": "screenplay",
    "name": "Screenplay",
    "own": false
  },
  {
    "checked": "2026-10-11",
    "confidence": "low",
    "description": "A collection of poems: a title page and dedication, the contents, each poem an element with its lines written as verse, then acknowledgements and a note on the poet.",
    "group": "poetry",
    "id": "poems",
    "name": "Poems",
    "own": false
  },
  {
    "checked": "2026-10-11",
    "confidence": "medium",
    "description": "A blog post: the text alone, as a web page or as Markdown for a site that makes its own pages.",
    "group": "other",
    "id": "blog-post",
    "name": "Blog post",
    "own": false
  },
  {
    "checked": "2026-10-11",
    "confidence": "medium",
    "description": "A letter: the text and a signature.",
    "group": "other",
    "id": "letter",
    "name": "Letter",
    "own": false
  },
  {
    "checked": "2026-10-11",
    "confidence": "medium",
    "description": "A news article: a standfirst above the text, for the web, a word processor or print.",
    "group": "other",
    "id": "news-article",
    "name": "News article",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "Manuscripts for American Anthropologist: Times New Roman 12, double-spaced and aligned left, endnotes and not footnotes, Chicago author-date references; anonymised, and at most 8,000 words at first submission.",
    "group": "journal",
    "id": "american-anthropologist",
    "name": "American Anthropologist",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "Manuscripts for the American Economic Review: 11-point type with spacing of 1.5 and one-inch margins, the layout by which the journal measures length; sections numbered in roman numerals, footnotes, no title page, and an abstract of 100 words or fewer.",
    "group": "journal",
    "id": "american-economic-review",
    "name": "American Economic Review",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "Manuscripts for the American Political Science Review: 12-point type, double-spaced main text, footnotes and not endnotes, page numbers on all pages, Chicago author-date references; anonymised, with an abstract of 150 words or less.",
    "group": "journal",
    "id": "american-political-science-review",
    "name": "American Political Science Review",
    "own": false
  },
  {
    "checked": "2025-07-18",
    "confidence": "medium",
    "description": "Articles for the American Sociological Review: Times New Roman 12, everything double-spaced, notes and references included, margins of at least one inch, endnotes under the heading NOTES, no page numbers, ASA references; anonymised, at most 15,000 words.",
    "group": "journal",
    "id": "american-sociological-review",
    "name": "American Sociological Review",
    "own": false
  },
  {
    "checked": "2025-07-06",
    "confidence": "medium",
    "description": "Articles for Classical Philology: 12-point type, everything double-spaced, footnotes and not endnotes, author-date references given in the notes with a list of literature cited; anonymised, at most 45 pages.",
    "group": "journal",
    "id": "classical-philology",
    "name": "Classical Philology",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "Articles for History and Theory: footnotes in a house style based on the Chicago Manual, with no bibliography; quotations of more than seventy words set off; an abstract of 200 to 300 words and six to eight keywords. The journal prescribes no page layout.",
    "group": "journal",
    "id": "history-and-theory",
    "name": "History and Theory",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "Articles for the Journal of Biblical Literature: a standard 12-point font, double-spaced, footnotes included; block quotations of five or more lines single-spaced; footnotes in SBL style with no bibliography and no cover page; anonymised, at most 10,000 words.",
    "group": "journal",
    "id": "journal-of-biblical-literature",
    "name": "Journal of Biblical Literature",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "Accepted manuscripts for Language (Linguistic Society of America) by the LSA Journals Style Sheet: letter paper with one-inch margins, 12-point type and spacing of 1.5 throughout, aligned left, two levels of numbered headings in small capitals that run into the text, and endnotes after the references.",
    "group": "journal",
    "id": "language-accepted",
    "name": "Language (accepted manuscript)",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "Manuscripts sent to Language (Linguistic Society of America) for review: double-spaced throughout and anonymised, with an abstract of at most 200 words and five to seven keywords; at most 18,000 words.",
    "group": "journal",
    "id": "language-submission",
    "name": "Language (submission for review)",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "Papers for Mind: line spacing of 1.15 or 1.5 and never double, continuous line numbers, sections numbered in arabic numerals with bold headings and italic sub-headings, quotations of about thirty words or more set off; anonymised.",
    "group": "journal",
    "id": "mind",
    "name": "Mind",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "Manuscripts for Nature: a standard font, preferably Times New Roman 12, double-spaced, with line numbers; a summary paragraph of ideally no more than 200 words in place of an abstract, and numbered references in the journal's own style.",
    "group": "journal",
    "id": "nature",
    "name": "Nature",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "Articles for Past & Present: Times New Roman 12, double-spaced, indented paragraphs, sections numbered in roman numerals, footnotes only and no bibliography, quotations of 50 words or more inset from both margins; anonymised.",
    "group": "journal",
    "id": "past-and-present",
    "name": "Past & Present",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "Manuscripts for PLOS ONE: double-spaced in any standard font, with page numbers and continuous line numbers, a title page as the first page, at most three levels of heading, no footnotes, and an abstract of at most 300 words.",
    "group": "journal",
    "id": "plos-one",
    "name": "PLOS ONE",
    "own": false
  },
  {
    "checked": "2025-09-06",
    "confidence": "medium",
    "description": "Manuscripts for Psychological Review (American Psychological Association): the professional paper of APA 7, double-spaced throughout with five levels of unnumbered headings, an abstract of at most 250 words on a page of its own and up to five keywords.",
    "group": "journal",
    "id": "psychological-review",
    "name": "Psychological Review",
    "own": false
  },
  {
    "checked": "2025-08-10",
    "confidence": "medium",
    "description": "Research articles for Science: letter paper, Times New Roman, single-spaced throughout, references and notes in one numbered list, an abstract of 125 words or less and at most 3,000 words of main text.",
    "group": "journal",
    "id": "science",
    "name": "Science",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "Articles for the American Historical Review: Times New Roman 12, double-spaced, on letter paper with one-inch margins; no headings, only section breaks; all references in footnotes of 10 points, with no bibliography; fully anonymised.",
    "group": "journal",
    "id": "american-historical-review",
    "name": "The American Historical Review",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "Articles for The Art Bulletin (College Art Association): Times New Roman 12 for everything, all copy double-spaced and aligned left, endnotes in Chicago style with no bibliography, quotations of 50 words or more set off; anonymised, at most 16,000 words.",
    "group": "journal",
    "id": "art-bulletin",
    "name": "The Art Bulletin",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "Articles for The Classical Quarterly: Times New Roman 12 throughout, footnotes included, double-spaced and justified; section titles in capitals and centred, sub-section titles in italics, nothing in bold; footnotes and no bibliography; anonymised.",
    "group": "journal",
    "id": "classical-quarterly",
    "name": "The Classical Quarterly",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "Articles for The Journal of Hellenic Studies: a generic font, three levels of heading numbered by hand, footnotes with author-date references and a bibliography, quotations of more than four lines set off; anonymised, at most 9,000 words.",
    "group": "journal",
    "id": "journal-of-hellenic-studies",
    "name": "The Journal of Hellenic Studies",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "medium",
    "description": "Typescripts for Bloomsbury Academic: at least double-spaced throughout, margins of at least 2.5 cm, page numbers centred at the foot in one sequence, endnotes, and quotations of over sixty words set off as a block.",
    "group": "publisher",
    "id": "bloomsbury-academic",
    "name": "Bloomsbury Academic (books)",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "Book manuscripts for Brill: indented paragraphs, headings numbered decimally in arabic numerals, footnotes numbered anew in every chapter, a separate bibliography, and a manuscript anonymised for review.",
    "group": "publisher",
    "id": "brill-books",
    "name": "Brill (books)",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "The series Kunst og kultur i opplæring from Cappelen Damm Forskning (NOASP): Calibri 11, double-spaced and justified, headings in the APA form in at most three levels, quotations of over 40 words set off, and APA 7 references.",
    "group": "publisher",
    "id": "cappelen-damm-kunst-og-kultur",
    "name": "Cappelen Damm Forskning: Kunst og kultur i opplæring",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "The series Libelli from Cappelen Damm Forskning (NOASP): Calibri 12 with spacing of 1.5, headings of 16 and 14 points, endnotes, quotations of over three lines set off in single-spaced 10-point type, and Chicago short notes with a full bibliography.",
    "group": "publisher",
    "id": "cappelen-damm-libelli",
    "name": "Cappelen Damm Forskning: Libelli",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "Book chapters for Routledge and Taylor & Francis: a blank line between paragraphs and no indent, at most three levels of unnumbered subheading, notes as endnotes numbered by chapter, and an abstract of 100 to 200 words for every chapter.",
    "group": "publisher",
    "id": "routledge-books",
    "name": "Routledge / Taylor & Francis (books)",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "Book manuscripts for SAGE: Times New Roman 12, double-spaced, paragraphs parted by a blank line without indent, no page numbers, headers or footers, at most four levels of heading, notes at the end of each chapter, and APA references.",
    "group": "publisher",
    "id": "sage-books",
    "name": "SAGE (books)",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "The general layout for articles sent to Taylor & Francis journals: Times New Roman 12, double spacing, margins of at least 2.5 cm, and five levels of heading of which the fourth and fifth run into the paragraph.",
    "group": "publisher",
    "id": "taylor-francis-journals",
    "name": "Taylor & Francis journals",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "Book manuscripts for Universitetsforlaget (Scandinavian University Press) by its general guide for authors: the simplest possible formatting, a blank line between paragraphs, a ragged right margin, no hyphenation, and quotations of more than two lines set off as paragraphs of their own.",
    "group": "publisher",
    "id": "universitetsforlaget-books",
    "name": "Universitetsforlaget (books, general guide)",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "Chapters for open access monographs and anthologies from Universitetsforlaget (Scandinavian University Press): Times New Roman 12 with spacing of 1.5, at most three levels of unnumbered heading, and for every chapter an English abstract of 150 to 250 words and four or five keywords.",
    "group": "publisher",
    "id": "universitetsforlaget-open-access",
    "name": "Universitetsforlaget (open access research books)",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "Book manuscripts for the University of Chicago Press: minimal formatting, headings told apart by size (18, 16 and 14 points, bold), notes made with the word processor's note function, a title page, and Chicago style for references.",
    "group": "publisher",
    "id": "university-of-chicago-press-books",
    "name": "University of Chicago Press (books)",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "Book manuscripts for Yale University Press: endnotes numbered anew in each chapter, subheads used sparingly and never numbered, quotations set off as a block only from 100 words, and Chicago notes and bibliography.",
    "group": "publisher",
    "id": "yale-university-press",
    "name": "Yale University Press (books)",
    "own": false
  },
  {
    "checked": "2026-09-18",
    "confidence": "high",
    "description": "The professional paper of the APA Publication Manual, 7th edition, for manuscripts sent to journals: a title page with author note, a running head of the shortened title in capitals, an abstract of at most 250 words; double spacing throughout and five levels of unnumbered headings.",
    "group": "style-guide",
    "id": "apa-7-professional",
    "name": "APA 7 (professional paper)",
    "own": false
  },
  {
    "checked": "2026-09-18",
    "confidence": "high",
    "description": "The student paper of the APA Publication Manual, 7th edition: a title page with course, instructor and due date, no running head and normally no abstract; double spacing throughout, five levels of unnumbered headings, and block quotations from 40 words.",
    "group": "style-guide",
    "id": "apa-7-student",
    "name": "APA 7 (student paper)",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "The paper format of Turabian's Manual for Writers, 9th edition, which follows the Chicago Manual of Style: double-spaced text with single-spaced block quotations, notes and bibliography entries, margins of at least one inch, and a title page of its own.",
    "group": "style-guide",
    "id": "chicago-turabian-paper",
    "name": "Chicago / Turabian (paper)",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "Copy prepared as the MHRA Style Guide, 4th edition (2024) asks: a serif font in one size throughout, double or one-and-a-half spacing, few levels of heading, and prose quotations of more than forty words set off as a block without quotation marks.",
    "group": "style-guide",
    "id": "mhra-4",
    "name": "MHRA Style Guide 4",
    "own": false
  },
  {
    "checked": "2025-01-19",
    "confidence": "high",
    "description": "The research paper format of the MLA Handbook, 9th edition: everything double-spaced, one-inch margins, no title page, the writer's surname before the page number at the top right, and a list headed Works Cited.",
    "group": "style-guide",
    "id": "mla-9",
    "name": "MLA 9 (research paper)",
    "own": false
  },
  {
    "checked": "2026-09-27",
    "confidence": "high",
    "description": "The term paper of the Student Supplement to the SBL Handbook of Style, 2nd edition: 12-point type, double-spaced text with single-spaced block quotations and bibliography, footnotes, a title page in capitals, and five forms of heading.",
    "group": "style-guide",
    "id": "sbl-2-student",
    "name": "SBL Handbook of Style 2 (student paper)",
    "own": false
  }
];

export const partKinds: PartKindEntry[] = [
  {
    "basedOn": null,
    "group": "front",
    "id": "front-section",
    "look": {},
    "one": false,
    "place": "front",
    "style": "Front Section"
  },
  {
    "basedOn": null,
    "group": "back",
    "id": "back-section",
    "look": {},
    "one": false,
    "place": "back",
    "style": "Back Section"
  },
  {
    "basedOn": null,
    "group": "front",
    "id": "own-page",
    "look": {
      "align": "center",
      "heading": false,
      "ownPage": true
    },
    "one": false,
    "place": "front",
    "style": "Own Page"
  },
  {
    "basedOn": null,
    "group": "cover",
    "id": "cover",
    "look": {
      "heading": false
    },
    "one": true,
    "place": "cover",
    "style": "Cover"
  },
  {
    "basedOn": "front-section",
    "group": "front",
    "id": "abstract",
    "look": {},
    "one": true,
    "place": "front",
    "style": "Abstract"
  },
  {
    "basedOn": "own-page",
    "group": "front",
    "id": "dedication",
    "look": {
      "italic": true
    },
    "one": false,
    "place": "front",
    "style": "Dedication"
  },
  {
    "basedOn": "own-page",
    "group": "front",
    "id": "epigraph",
    "look": {},
    "one": false,
    "place": "front",
    "style": "Epigraph Page"
  },
  {
    "basedOn": "own-page",
    "group": "front",
    "id": "copyright",
    "look": {
      "align": "left",
      "size": 9.0
    },
    "one": true,
    "place": "front",
    "style": "Copyright"
  },
  {
    "basedOn": "front-section",
    "group": "front",
    "id": "foreword",
    "look": {},
    "one": false,
    "place": "front",
    "style": "Foreword"
  },
  {
    "basedOn": "front-section",
    "group": "front",
    "id": "preface",
    "look": {},
    "one": false,
    "place": "front",
    "style": "Preface"
  },
  {
    "basedOn": "front-section",
    "group": "front",
    "id": "cast",
    "look": {},
    "one": false,
    "place": "front",
    "style": "Cast"
  },
  {
    "basedOn": "front-section",
    "group": "front",
    "id": "setting",
    "look": {},
    "one": false,
    "place": "front",
    "style": "Setting"
  },
  {
    "basedOn": "front-section",
    "group": "front",
    "id": "standfirst",
    "look": {
      "heading": false,
      "italic": true
    },
    "one": true,
    "place": "front",
    "style": "Standfirst"
  },
  {
    "basedOn": "back-section",
    "group": "back",
    "id": "acknowledgements",
    "look": {},
    "one": false,
    "place": "back",
    "style": "Acknowledgements"
  },
  {
    "basedOn": "back-section",
    "group": "back",
    "id": "appendix",
    "look": {
      "lettered": true
    },
    "one": false,
    "place": "back",
    "style": "Appendix"
  },
  {
    "basedOn": "back-section",
    "group": "back",
    "id": "afterword",
    "look": {},
    "one": false,
    "place": "back",
    "style": "Afterword"
  },
  {
    "basedOn": "back-section",
    "group": "back",
    "id": "glossary",
    "look": {},
    "one": false,
    "place": "back",
    "style": "Glossary"
  },
  {
    "basedOn": "back-section",
    "group": "back",
    "id": "about-the-author",
    "look": {},
    "one": true,
    "place": "back",
    "style": "About the Author"
  },
  {
    "basedOn": "back-section",
    "group": "back",
    "id": "signature",
    "look": {
      "heading": false
    },
    "one": true,
    "place": "back",
    "style": "Signature"
  },
  {
    "basedOn": "cover",
    "group": "cover",
    "id": "blurb",
    "look": {
      "heading": false
    },
    "one": true,
    "place": "cover",
    "style": "Blurb"
  }
];
