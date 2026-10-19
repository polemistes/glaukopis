# 0055 — The title page in every document, where the template puts it

Date: 2026-10-19. Status: accepted by the owner on 2026-10-19; to be built from `docs/plans/the-title-page-in-every-document.md`. Amends 0038 (what the core makes of a template) and 0054 (what the document contains).

## Context

Since 0054 a writer turns the title page of a document on or off in Look, under *What the document contains*, and the template says where it stands: a novel has its cover, then the half title, then the title page. In the preview and the PDF both hold, because the core writes the title page itself, as blocks of Typst, at the place the template says. In every other document the core writes no title page at all. It gives Pandoc the title, the subtitle, the authors and the date as metadata, and Pandoc's writers for Word, Writer, LaTeX and the web print a title block from that metadata, always at the head of the document. So in Word the switch does nothing, and a novel's title block stands before its half title. The same metadata is also what the file carries as its properties: the title and the author in Word's document properties and Writer's, the `<title>` of a web page, the title of a PDF set by LaTeX. Withholding it to lose the block would lose those too, which is why it was left as it was.

The owner's rule: a document that is made should be as like the preview as it can be.

## Decision

**The core writes the title page in every document, at the place the template says, and keeps the file's properties by other means.** Pandoc is given no `title`, `subtitle`, `author` or `date` as metadata for Word, Writer, LaTeX and the web page, so its writers print no title block of their own. Where the template places the title page, and only where it does, the core writes it:

- **Word and Writer**: paragraphs in the styles the reference documents already define, *Title*, *Subtitle*, *Author* (one paragraph for each author) and *Date*, and a new *Affiliation* under each author where the layout shows affiliations; then a page break where the layout sets the title on a page of its own. The file's properties, the title and the creators, are written into `docProps/core.xml` and `meta.xml` after Pandoc has written the file, as the core already sets tables and equations right there.
- **LaTeX**: `\title`, `\author`, `\date` and `\maketitle`, written as raw LaTeX around the title's own inlines, in the body where the template places the title page. The PDF's properties come from `title-meta` and `author-meta`, which Pandoc's template reads into `\hypersetup` without printing anything.
- **The web page and the e-book**: a block `gk-front` with the title, the subtitle, the authors, their affiliations and the date, each in a block of its own class, styled by the core's own stylesheet from the layout's title look. The page's `<title>` and its `<meta>` for the authors and the date come from `pagetitle`, `author-meta` and `date-meta`. The e-book keeps its title, authors and date as metadata, which go into its package and, since the core already asks for no title page of Pandoc's, nowhere else.
- **Markdown** keeps the title block as metadata at its head: there is no page to place it on.

**The abstract goes the same way.** It is a part the writer places; for Word it was metadata, which Pandoc set at the head. In every document it is now written where the template places it, as Writer already had it: for Word and Writer in the styles *Abstract Title* and *Abstract*, for LaTeX as the `abstract` environment, for the web page and the e-book as the blocks `abstract-title` and `abstract` that Pandoc's own stylesheet styles.

**What the properties say.** The title, and the authors unless the layout is anonymous. A layout that shows no authors on the page still names them in the file's properties: that is what properties are for, and nothing of it is on a page. The keywords, the language and the identifiers reach the properties as before.

## Why not otherwise

- *Strip Pandoc's title block from the written file instead*: it would depend on the shape of each writer's output, and the half title is set in the same *Title* style, so a stripped head could take the half title with it. Writing the block ourselves is what the Typst side does already.
- *Leave Word as it was, since the title at the head is what most Word documents have*: the switch would then do nothing in the format most writers hand in, and a book's order would be wrong there. The owner's rule decides it.

## Consequences

- `export/mod.rs`: the title page and the abstract written per target at their items; the metadata per target; `prepare` gives `after::docx` and `after::odt` the properties.
- `export/after.rs`: the properties written into `docProps/core.xml` and `meta.xml`.
- `export/reference.rs`: the paragraph style *Affiliation* in both reference documents.
- `html_styles` and `epub_styles`: rules for the blocks of the front.
- Tests per format: on, off, and the order with a half title; the properties kept in each.
- The guide says the title page and the abstract stand where the template puts them in every document, and that the switch holds everywhere.
