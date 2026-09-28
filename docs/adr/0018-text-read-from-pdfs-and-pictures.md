# 0018 — Text read from PDFs and pictures

Date: 2026-09-28. Status: accepted.

## Context

The one the application is made for asked for OCR of PDFs and pictures:
the text of a PDF either taken out, or laid into it as pdfsandwich does, so
that it can be searched; with Tesseract, the best free engine on every
system, or something better if there is.

pdfsandwich makes the PDF anew from pictures of its pages with the text
under them: what was drawn sharp in the file is drawn again as pixels.
OCRmyPDF, which is widely used and well kept, keeps the pages as they were
and lays only the text into them; but it needs Python, Ghostscript and
more, which are hard to bring along on Windows and macOS.

## Decision

- **Tesseract is used as an installed program**, as Pandoc and Typst are:
  where the settings say, on the path, or beside the application. The
  languages it can read are those it has data for (`tesseract
  --list-langs`); the writer chooses among them, and the language of the
  map and of the interface are chosen at first.
- **Pages are drawn by hayro**, a program library in Rust with nothing
  outside it, at 300 dots to the inch. Where it cannot draw a PDF (one that
  is locked, above all), Poppler's `pdftoppm` is used where it is
  installed.
- **A PDF is made searchable as OCRmyPDF makes it**: Tesseract makes for
  each page a page of text alone, unseen (`textonly_pdf`), and that is laid
  over the page of the PDF as it was. Nothing that is seen changes. Pages
  that have text already are left as they are, unless the writer asks for
  all pages to be read.
- **The text taken out of a PDF or a picture becomes a map**, by the way
  documents become maps (ADR 0012): the file is the centre, and each page
  an element, named by its number, so that what is quoted can be found on
  its page. Lines are joined into paragraphs, and a word broken at the end
  of a line is joined again where the dictionary knows the whole word.
  Pages that have text are read as they are, without OCR.
- **Where it is done:** a PDF attached to a reference can be made
  searchable, and the stored file is replaced by the one that has the text;
  a PDF or a picture can be brought into a project as a map, as documents
  are; a picture of the store can have its text read.
- **Reading goes on in the background**, several pages at a time, shows
  how far it has come, and can be stopped.

## Why not otherwise

- *OCRmyPDF*: the best result, but a chain of programs that cannot be
  brought along beyond Linux. What it does that matters here, laying the
  text over the page as it was, is done here with Tesseract alone.
- *pdfsandwich*: it draws the pages anew, and is kept for Linux only.
- *Tesseract compiled in*: it is C++ with its own libraries, and its
  language data must be installed anyway.

## Consequences

- Without Tesseract nothing is read, and the application says what to
  install. On Arch it is a dependency, with the data for English; other
  languages are packages of their own (`tesseract-data-nor`,
  `tesseract-data-grc`, …).
- A PDF made searchable is somewhat larger than it was: by the text, and
  the font Tesseract uses for it.
