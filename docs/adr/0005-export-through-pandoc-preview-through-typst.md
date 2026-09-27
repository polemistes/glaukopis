# 0005 — Export through Pandoc, preview through Typst

Date: 2026-09-27. Status: accepted.

## Context

Export must cover LaTeX, ODT and DOCX at least, with every common reference
style, and a preview must be available at all times. Citation formatting must
be the same in the preview and in every export.

## Decision

- The interface hands the core a map as JSON. The core writes Pandoc Markdown
  from it. That Markdown is both the readable copy kept on disk and the input to
  every export.
- Pandoc with citeproc formats citations from a CSL style and a BibLaTeX file
  holding only the entries cited. One citation engine serves preview and export.
- Inside the editor a citation is shown in a neutral short form (author, year,
  locator). The style is applied in the preview.
- A document format is a set of parameters. From it the core generates a Typst
  template, LaTeX settings, and reference documents for DOCX and ODT.
- Preview: Pandoc writes Typst, Typst compiles to SVG pages, shown in the
  preview panel. PDF export uses the same route, or LaTeX when chosen.
- Pandoc and Typst are found through the settings, then `PATH`, then beside the
  executable. They are package dependencies on Linux and are bundled elsewhere.

## Consequences

- The application depends on two external programs. When one is missing the
  application says which, and everything else keeps working.
- What the preview shows is what the PDF will be.
