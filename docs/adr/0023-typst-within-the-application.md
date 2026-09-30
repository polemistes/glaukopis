# 0023 — Typst within the application

Date: 2026-09-30. Status: accepted. Amends 0005.

## Context

The preview and the PDF were set by the program `typst`, run once for each
making. The program keeps nothing between runs, so every page that came into
view as the preview was moved through set the whole document again, up to
three times where the pages asked for were not there. Of a book of 600 pages
that is seconds of work for every stop of the scroll. On Linux the program
comes with the system, in whatever version the system has, and the preamble
the application writes needs one of 0.13 or later.

## Decision

Typst is compiled into the application, as the crates `typst`, `typst-svg`,
`typst-pdf` and `typst-kit` (Apache-2.0), in the version the program had
(0.15.1). `export/typeset.rs` gives Typst its world:

- the place where the document is made is the only root it can read; it
  asks for no packages (the one it needs, wrap-it, is kept in `resources`);
- its fonts are those of the computer and those Typst brings, found once
  when the first document is set, as the program found them on each run;
- the day is that of UTC.

The preview keeps the document it set, for the four projects last looked at,
and draws the pages that are asked for from it as SVG: a page that comes into
view costs milliseconds and no setting. A document that is set again is set
anew only where it changed, as Typst remembers its work between settings
(`comemo`, evicted after ten). The PDF is set in the same way, so that what
the preview shows and what the PDF holds come from one engine, of one
version. Pandoc is not changed: it still writes the Typst, with the citations
set by citeproc.

The program `typst` is no longer looked for, shown in the settings, or
brought with the installers. The tests of OCR still make their scans and
pictures with it where it is installed, since the application's Typst does
not draw pictures.

## Consequences

- Scrolling the preview of a book of 614 pages fetches three pages in about
  12 ms (`e2e/large.mjs`).
- One program fewer to install, and no difference of versions between what
  the application writes and what sets it.
- The application is larger by Typst, and takes longer to build.
- Setting cannot be stopped midway, as the program could be ended: a
  making that is stopped is stopped before and after it. A document is set
  in about a second at most.
- A font installed while the application runs is seen when it next starts.
