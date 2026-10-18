# The words of Glaukopis, and what they mean

The application has words of its own. A translation chooses one word of
its language for each, and keeps to it in every file. Each language writes
its choices in `locales/<tag>/GLOSSARY.md`, with the form of address it
uses. The English is what the writer of the application chose: plain words
of the everyday language, used in a particular sense, rather than terms of
computing. Choose in the same spirit: the plain word a scholar of the
language would use, not a transliteration of the English.

## The work

- **project** — one piece of work: a book, an article, a thesis. It is one
  tree of elements, whose top element bears the project's name, and is what
  is shared with others. *Projects* is the first view of the rail.
- **map** — a mind map: the elements under one element, drawn around it.
  Any element of a project can be opened as a map, and one goes back up to
  the one above it. A map is also a document in the making; the text of a
  map, read in order, is the text of the document. Each has a language.
  The home page can also show all the projects as a map around the owl,
  their folders as labels: *the owl map*, *the map of the projects*.
- **element** — one node of a project's tree: a name, a text, a kind,
  children. In the text view an element is a heading with its text under
  it; in the diagram it is a box. Any element can be printed as a document.
- **the centre** — the element in view, which the map is drawn around; its
  name is the name of the map.
- **the diagram** — the view where the map is drawn as boxes and lines.
- **the text** — the view where the map is read and written as a running
  text with headings; "text mode".
- **passage** — a stretch of the text: a paragraph or a run of paragraphs
  that is spoken of as one, as in "the passage selected".
- **kind** — what something *is*, as against how it looks: an element has a
  kind (character, place, event, source…), a paragraph has a kind (text,
  quotation, verse, list, dialogue…), and a run of words may have a kind
  (foreign words, the title of a work, a term, a mention, a highlight). The
  same word is used for all three. A kind is a meaning, never a look.
- **look** — how a kind is set in a document: size, spacing, italics and
  so on. Looks belong to the layout, not to the text.
- **layout** — how the page of a document looks: the margins, the fonts,
  the headings, the notes, the looks of the kinds. "Manuscript" and "A
  book of fiction" are layouts. The files and the code call it the
  *format*, which was its name in the interface until ADR 0038; the word
  "format" is now kept for file formats (Word, PDF) only.
- **template** — what a document of a kind consists of: which parts it has
  and in what order, which kinds of elements and of passages it puts in
  hand, which layout and reference style it brings, what it requires
  (words, keywords, anonymity), and which files it makes. "Journal
  article", "Novel manuscript" and a journal's own are templates. A
  template is chosen in the document settings of an element, and inherits
  down the tree.
- **style** — the reference style only: how citations and the bibliography
  are written (author–date, notes, numbers). Never used for looks.
- **document settings** — the window of an element's document: its
  template, its details (title, authors, date, keywords, identifiers), its
  parts, its layout and style, its language, and the checklist.
- **part** — a kind of element that has a place in the document: the
  abstract, a dedication, an appendix, the cover. Front matter, back
  matter and the cover are its places.
- **document** — the manuscript that is made of a map or a project: the
  file that goes to the publisher, as Word, PDF, LaTeX and so on. Also a
  file *brought in*: a Word document, a PDF.
- **the manuscript** — the document as it is printed or exported; what the
  preview shows.
- **the preview** — the pages of the document, set as they will print,
  shown beside the text.
- **export** — making the document as a file for others.
- **bring in** — the English avoids "import" where it can: a document is
  *brought in* and becomes a map; references are *imported* from Zotero
  (where the common word is kept).

## References and citations

- **the library** — all the references the writer has, shared by every
  project; the second view of the rail. Not a project's own.
- **reference** — one entry of the library: a book, an article, a chapter;
  a *work*.
- **collection** — a named group of references within the library, like a
  folder.
- **attachment** — a file kept with a reference, usually its PDF.
- **note** — notes written on a reference, in the library.
- **citation** — a reference cited in the text, with its pages: what the
  style turns into "(Berge 2026, 12)" or a footnote.
- **locator** — the part of a citation that says where: page, chapter,
  verse, line.
- **lookup** — finding a reference's details on the net by DOI, ISBN or
  search.
- **loose citations** — citations in a text brought in from elsewhere,
  recognised as such but not yet tied to a reference of the library, and
  offered to be matched with it; *made into citations* when they are. Until
  2026-10-12 the interface called them *found citations*.

## Words and marks

- **foreign words** — a kind of words: words in another language than the
  map's, which carry their language, for spelling and for the document.
- **title of a work** — a kind of words: the title of a book or article
  named in the text, set as the layout says (usually italics).
- **term** — a kind of words: a word where it is introduced or defined.
- **mention** — a kind of words: a word spoken of *as a word*, set in the
  quotation marks of the language of the map.
- **highlight** — a kind of words for the eye on the screen; it does not
  print.
- **marks** — italics, bold, small capitals, underline, superscript,
  subscript, struck through, code: how letters look, as against kinds.

## Pictures, figures, tables and formulas

- **picture** — an image file, kept in the store, with what is said of it.
- **the store** — where all pictures live, shared by every project, like
  the library; the third view of the rail is *Pictures*.
- **figure** — a picture as it stands in a text, with a caption, a width
  and a number of its own. A picture and a figure are two things.
- **caption** — the text under a figure or over a table.
- **pointer** — a reference from one place in a text to another: to a
  figure, a table, an element, a page.
- **table** — a table in the text.
- **formula** — mathematics set in the text, in a line or on its own.
- **placing** — where a figure or table stands on the page: here, at the
  top, at the side, floating.

## Time, comments, history

- **timeline** — elements that have a time, shown along a line.
- **when** — the time or span of time an element has.
- **comment** — a remark on a passage or an element, for those one works
  with; answered in a thread, and resolved.
- **history** — the past states of a project, which can be looked at and
  gone back to.
- **changes** / **review** — what others changed since one last looked,
  shown to be accepted or rejected one by one.
- **sharing**, **working together** — several writers on one project,
  through a server; one *joins* a shared project.

## Reading and checking

- **spelling** — the checking of spelling; **dictionary** — a dictionary of
  spelling for a language; **own words** — words the writer has added to
  the dictionary.
- **reading text** / **OCR** — reading the text of a scanned PDF or a
  picture with Tesseract; a PDF *made searchable* has its text laid under
  the picture of its pages.
- **search** / **replace**; **found** — what a search turns up.

## The interface

- **the rail** — the bar at the left with the views: Projects, Library,
  Pictures, Settings.
- **the panel at the side** — the pane beside the text with references,
  pictures, comments, changes, history.
- **pane** — one side of a split, when two maps are open side by side.
- **the palette** — the box of commands opened with a key, where commands
  are found by name.
- **the writing tools** — the row of tools over the text: kinds, marks,
  citations, figures, spelling.
- **fold**, **fold away** — hiding what is under an element, in the
  diagram or in the text, and opening it again.
- **settings** — the application's settings.
- **data directory** — the folder on the computer where Glaukopis keeps
  the writer's things.

## Names that are not translated

Glaukopis; Pandoc, Typst, Tesseract, Hunspell, LaTeX, LuaLaTeX, BibLaTeX,
Zotero, CSL, Markdown; the names of file formats (DOCX, ODT, PDF, EPUB,
RTF, HTML, SVG, PNG); the names of fonts; the names of reference styles
(APA, Chicago, MLA); DOI, ISBN, ISSN, arXiv, URL; the keys of the keyboard,
written as the keyboard of the language writes them (Ctrl is *Strg* on a
German keyboard).
