# pdf-text

The text of PDFs, for Glaukopis: [pdf-extract](https://github.com/jrmuizel/pdf-extract)
0.12.1 by Jeff Muizelaar, under the MIT licence (`LICENSE`), taken into the
tree so that it can be changed. Its own README is `README-upstream.md`.

Why: Glaukopis reads the text a PDF has with it. A font may name its glyphs
in ways the standard list of Adobe does not know (the Greek of scholarly
editions: `etaasper`, `alphatildelenisiota`), and pdf-extract then gives
nothing for them. Glaukopis can make the letters out of the names, if it is
given them (ADR 0044).

What is changed from 0.12.1 (see the history of this folder; the first commit
is the crate as it was):

- `OutputDev` has `output_glyph`, which is given the name of each character's
  glyph, where the font has one, and the code; it calls `output_character`
  unless a device does otherwise.
- A code that the PDF's map does not give a character for is handed over as
  an empty string with its name, not left out.
- Its warnings about glyph names and Unicode are debug messages.

The changes are to be offered to pdf-extract; when it has them, this folder
can go.
