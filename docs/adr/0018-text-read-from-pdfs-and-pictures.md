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

## Addendum of 2026-10-05: the quality of the reading, a text layer taken away, a map of a file of the library

Asked for by the one the application is made for, after reading scans
whose print was faint, and PDFs whose text layer, laid by another program,
was poor.

- **Settings for quality**, which the dialog of a reading has, and which
  are sent with what is asked (`Asked`):
  - *Resolution* (`dpi`): the dots to the inch the pages are drawn at for
    Tesseract, 300 unless another is asked for, and held within 150 and
    600. A very large page is still drawn no longer than 10,000 dots on a
    side, whatever is asked. A picture is not drawn, and is read as large
    as it is.
  - *Layout* (`layout`): how Tesseract takes a page apart, its page
    segmentation: as it judges (`""`, its own default), one *column* of text
    of differing sizes (`--psm 4`), one uniform *block* of text (6), or
    *sparse* text in no order (11). Any other name is as `""`.
  - *Black and white* (`contrast`): the page is made black and white before
    it is read, each dot black or white by Otsu's threshold on the grey
    picture, for print that is faint or uneven. It is done on the picture
    hayro draws; on Poppler's PNG, which is read back, thresholded and
    written as PGM; and on a picture that is read.
- **The text a PDF has can be taken away** as it is made searchable
  (`strip`), only together with all pages being read: for a text layer that
  is poor, so that only what is read now stays. What is taken away is the
  text that is unseen, as scanners and OCR programs lay it: an operation
  that shows text (`Tj`, `TJ`, `'`, `"`) while the render mode (`Tr`) is
  one that neither fills nor strokes the letters (3, or 7, which only
  clips), the mode followed through `q` and `Q` as a part of the graphics
  state; and a text laid over the page here before, whose XObject goes with
  it. Everything else is written as it was: letters that are seen stay,
  with what sets them, and so do the drawing and the pictures within the
  content, so that the page looks as it did and a PDF whose letters are
  real text keeps them. Text drawn within a form XObject of its own is not
  reached. A page whose content cannot be read whole (a picture within it
  packed in a way lopdf does not read) is left as it is, its text with it,
  and the new text laid over it all the same.
- **A map can be made of a PDF of the library**: `ocr_read` takes, as
  `ocr_look` does, whether the path is that of a file of the library within
  its store (`stored`), and resolves it there.
