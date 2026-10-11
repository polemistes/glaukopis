# 0038 — Templates, layouts, and the kinds of elements that make a document

Date: 2026-10-11. Status: accepted.

## Context

Glaukopis has been presented as an application for scholarly writing. It is
to be presented as an application for writing of every kind, with a workflow
led by ideas, in which scholarly writing is one kind among others.

Choosing what kind of document an element is was found confusing and
inflexible. An element's document had settings in three places: the details
in its menu, the format and the reference style over the preview, the
language in a dialog of its own. And the *format* carried two things at
once: how the page looks, and what kind of text it is. "American
Anthropologist" was a look, a citation style, a word limit and a demand for
anonymity in one file. The abstract was typed in a dialog, and the cover of
an e-book was chosen there, while everything else is written in the tree.

The owner asked for a document settings window per element, a template that
can be as little as the title or as much as a publisher's whole submission,
templates for every kind of text that come with the application, and a
template editor; and for the design to allow anything, with nothing enforced
across templates. ADR 0037 reserved the place of templates.

## Decision

Three things, each with one job, and one window that leads with the first.

- **A template** says what a document of its kind consists of: which parts
  it has and in what order, which kinds of elements and of passages it puts
  in hand, which layout and citation style it brings, what it requires, and
  which files it produces. A template is a delta on the template it is
  based on, as kinds of passage are (ADR 0029).
- **A layout** says how the page looks. It is what was called the format:
  page, fonts, headings, notes, the looks of the kinds. The word changes in
  the interface; the ids, the files and the code keep `format`. A layout no
  longer says what kind of text it is: its `limits` and `suggests` move to
  the template. Its `kind` stays, as the group it is offered in, and its
  `style` stays, as the style a publisher's layout brings when the template
  names none.
- **A style** is the citation style, as before, with its editor.

### Everything set on a page is written in the tree

The settings of an element's document are only what the file formats carry
as metadata: the title, which is the element's name until one is written;
the subtitle; the authors with their affiliations; the date; the language;
the keywords; and identifiers (ISBN, edition, publisher, place, DOI). The
template, the layout and the style are chosen there too. Nothing else is
typed in a window. The abstract, the dedication, the acknowledgements, the
blurb, the cover: each is an element.

A **kind of element** (ADR 0025) may now also say what the element is in
the document. The application brings a catalogue of such kinds, as it does
for passages, each with a base, a place, whether a document has one of it
or many, and a look that the layout may change. Of the base kinds:

| Id | Place | Look |
| --- | --- | --- |
| `front-section` | front | an unnumbered section at the first level |
| `back-section` | back | the same, after the body |
| `own-page` | front | a page of its own, no heading, centred |
| `cover` | cover | one; the first picture of its text is the cover |

Of the named kinds, each a delta on a base: `abstract` (front; one; set as
the layout sets the abstract, under the layout's label), `dedication`
(own-page, italic), `epigraph` (own-page), `copyright` (own-page, left,
small; one), `foreword`, `preface`, `cast`, `setting`, `standfirst` (front; no heading; italic; one)
on `front-section`; `acknowledgements`, `appendix` (lettered; many),
`afterword`, `glossary`, `about-the-author` (one), `signature` (no heading;
one) on `back-section`; `blurb` (cover; no heading; one) on `cover`. The
catalogue is in `crates/core/src/templates/kinds.rs` with the looks and in
`src/lib/project/parts.ts` with the words; the contract test holds the ids
alike. Groups in the menu: *Front matter*, *Back matter*, *Cover*.

- **A kind of the writer's own may be based on a kind of the catalogue**
  (`basedOn` on `KindRecord`), and is then that in the document: "Author's
  note" based on `front-section` works in every layout. A kind based on
  nothing is as before, a name and a colour for the eye.
- **An element's `kind` is the id of a kind of the project, or the id of a
  kind of the catalogue.** The catalogue's ids are words; the project's are
  uuids. A catalogue kind shows a plain grey label where the writer's own
  show their colour.
- **A kind of the matter belongs to its parent.** The abstract under the
  book is the book's; the abstract under chapter three is chapter three's,
  printed at the head of the chapter when the book is printed and as the
  document's abstract when the chapter is printed alone. "Front" means
  before the parent's text and body, "back" after its last child, "here"
  where it stands among its siblings, "cover" in a cover output only,
  "none" nowhere.
- **Among siblings, the first in order is used** of a kind a document has
  one of; the others are marked on their label and listed in the checklist.
  Nothing is refused when a kind is given.
- **A part is never silently lost.** A front or back kind the template does
  not list is printed by its place, after what the template lists there, in
  tree order. A kind with place `cover` is printed only by a cover output.
- **Names are the only matching.** When a template or a kind is made, the
  names in use are offered first, as they are across projects already.

### The template

A JSON file: those that come with the application in `resources/templates/`,
the writer's own in `templates/` of the data directory, and copied into the
project (`templates` map of the document) when chosen there, so that a
shared project and a `.glaukopis` file carry them. The project's copy is
read first, then the application's.

```json
{
  "id": "journal-article",
  "name": "Journal article",
  "group": "article",
  "description": "An article for a journal: abstract, keywords, …",
  "source": { "name": "", "url": "", "checked": "", "confidence": "", "notes": "" },
  "basedOn": "plain",
  "layout": "manuscript",
  "style": "chicago-author-date",
  "contents": [
    { "part": "title-page" },
    { "kind": "abstract" },
    { "part": "keywords" },
    { "part": "contents" },
    { "part": "body" },
    { "kind": "appendix" },
    { "kind": "acknowledgements" },
    { "part": "notes" },
    { "part": "bibliography" }
  ],
  "kinds": ["abstract", "appendix", "acknowledgements"],
  "passageKinds": ["quote", "epigraph"],
  "requirements": { "words": 8000, "abstractWords": 250, "keywords": 6, "anonymous": true, "note": "" },
  "outputs": [
    { "id": "document", "targets": ["pdf", "docx", "odt", "latex", "pdf-latex", "markdown", "html", "epub", "typst"] }
  ]
}
```

- `group`: `plain`, `article`, `book`, `fiction`, `stage`, `poetry`,
  `other`, `journal`, `publisher`, `style-guide`, `own`. The chooser offers
  templates by group, with a search, and says of each where its
  requirements come from and how sure that is.
- `basedOn`: in a file that comes with the application, what is not said
  is as the base has it: every field but `id`, `name`, `group`,
  `description`, `source` and `basedOn` is inherited, and the core fills
  it in on reading, so that what it lists and gives is always whole. A
  template of the writer's own is saved whole, and its `basedOn` says only
  what it was made from, as a format's does. The root is `plain`: title
  page, body, notes, bibliography; no kinds; no requirements; the document
  output with every target.
- `layout` and `style` absent mean the writer's usual, from the settings.
- `contents`: the order of the document. The generated parts are
  `half-title`, `title-page`, `keywords`, `contents`, `list-of-figures`,
  `list-of-tables`, `body`, `notes`, `bibliography`. A `kind` item places
  every element of that kind, in tree order, at that point; a kind listed
  before `body` is front matter wherever its own place says, and one listed
  after is back matter.
- `kinds`: the kinds of elements the template puts in the hand: shown in
  the kind menu's template group. Those named in `contents` are in hand
  whether listed or not.
- `passageKinds`: what `suggests` was on the format.
- `requirements`: what `limits` was, and `anonymous`, which the preview and
  the checklist judge by; the layout's `title.anonymous` keeps setting the
  page.
- `outputs`: the files the template makes, each with its targets and,
  where it is not the document's, its own layout and the places it prints
  (`"places": ["cover"]`). Only `document` is made in this piece; a `cover`
  output, one sheet composed from the cover element, the trim size and the
  page count of the interior, is a later piece and keeps this shape.

The core lists, gets, saves and deletes templates as it does formats
(`templates_list`, `templates_get`, `templates_save`, `templates_delete`),
and receives the whole template with every request (`DocumentRequest::template`,
`PreviewRequest::template`), as it receives the format.

### What the core receives and makes

`Document` loses `abstract` and `cover` and gains `identifiers` and
`parts`; `Section` gains `kind`.

```
Document { title, subtitle, authors, date, keywords, language,
           identifiers: { isbn, edition, publisher, place, doi, … },
           parts: [ Part ], sections: [ Section ], references, kinds }
Part     { kind, element, title: [Inline], sections: [ Section ] }
Section  { level, heading, blocks, element, kind? }
```

- `parts` are the elements of a matter or cover kind among the direct
  children of the element printed, in tree order, each with its own
  sections below it (its text at level 0, its children from level 1).
- Deeper down, the interface's walker orders every element's children as
  front kinds, then the rest, then back kinds, and the first section of a
  kind-element carries `kind`; the core sets it by the kind's resolved
  look, at the level it stands at.
- The core places the parts as the template's `contents` say: the title
  page from the settings as before; the abstract part's blocks as the
  abstract, through Pandoc's metadata and the Typst label as before; the
  keywords; the generated contents; the body; the notes; the bibliography
  where `div#refs` stands, which is how Pandoc places it; every other part
  as a section with its kind's look. The look of a part kind is resolved
  like a passage kind's: the base, the kind, then the layout's `parts`
  table (`DocumentFormat::parts`, by id).
- In Word and Writer each part kind is a paragraph style of its name, as
  passage kinds are. In Typst each is a show rule on `<gk-part-ID>`. On
  the web and in the e-book a class `gk-part-ID`.
- The e-book's cover is the first picture of the cover part.
- The identifiers go into the metadata of every target that carries them.
- The layout's `limits` and `suggests` are removed from the files and the
  struct; the format editor loses the limits.

### The window, the menu and the editors

- **Document settings**, one window per element, from the element's menu,
  from the bar over the preview, and by Ctrl+Shift+D: sections *Template*,
  *Details*, *Parts*, *Layout and citations*, *Language*, *Checklist*.
  Every inherited value says which element it comes from, with one click
  to take the inherited value again. *Parts* lists the kinds of the
  template with the elements that fill each, offers to make one that is
  missing, and opens the one that exists. *Checklist* lists what the
  requirements and the tree say: words over the limit, the abstract's
  words, the keywords, doubled kinds, parts of a kind the template has no
  place for. The choosers over the preview and the *Languages…* dialog go;
  the preview's bar has one button for the window.
- **The kind menu** is one menu in groups: the project's own kinds, the
  template's kinds and the catalogue kinds already in use, *More…* with
  the catalogue by group, then *New kind…* and *Kinds of this project…*.
  The dialog of a kind gains *Based on*.
- **The template editor**, like the format editor: name, based on,
  description, layout, style, the contents in order, the kinds in hand,
  the kinds of passage, the requirements, the outputs. Editing one that
  came with the application makes one of the writer's own.
- **The settings** have the writer's usual template, layout and style.

### What comes with the application

Generic templates, each saying what it consists of: plain document; paper
(a student's or a conference paper); journal article; academic book; thesis;
report; novel (as a book, with cover); novel manuscript; short story;
collection of stories; play; screenplay; poems; news article; blog post;
letter. The journals, publishers and style guides that were formats become
templates of their own groups, based on the generic ones, each keeping its
former format as its layout, its style, and its limits as requirements; made
by `scripts/templates-from-formats.mjs` from the format files, so that they
can be made again.

### Old projects

A document with an abstract or a cover in an element's settings is changed
once on opening, outside undo: the abstract becomes the first child, named
*Abstract* in the language of the document, of kind `abstract`; the cover
becomes a child named *Cover*, of kind `cover`, with the picture as a figure.
The settings lose the two.

## Why not otherwise

- *Fields in the template, typed in the window*: text would be stored under
  the template's names and lost or orphaned on changing template; and the
  ids of a writer's own template would match nothing. In the tree, text
  is never lost; only where it is printed can differ, and that is visible.
- *Parts as a thing beside kinds*: an element would have two labels, and
  two menus would compete for one slot. A kind is what an element is; the
  document is one more thing it can be.
- *Refusing a second abstract*: duplicates arise from copying, moving,
  including and two writers at once, so the rule for printing must exist
  anyway, and a warning that names both is more useful than a blocked
  menu item.
- *One template per project*: refused with kinds of project (ADR 0028). A
  template sits on an element and inherits down; a thin element that
  includes a chapter sends it as an article with the journal's template.

## Consequences

- `DocumentSettings` loses `abstract` and `cover`, gains `template` and
  `identifiers`; `OWN_SETTINGS` is title and subtitle. `KindRecord` gains
  `basedOn`. The settings gain `defaultTemplate`.
- The request to the core carries `template` and `output`.
- "Format" becomes "layout" in the words of the interface, in English and
  Bokmål; the other languages keep their word until read by a speaker.
- The guide, the README, the descriptions of the packages and the words of
  the home page say what the application is for: writing of every kind.
- Later pieces: the cover output; levels of a template (what the first,
  second and third level under a document mean, so that a scene prints
  without a heading); parts edited in place in the window; a template's
  own words for a kind.
