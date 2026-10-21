# Reading lines of Fraktur by eye: the brief for a reader

You are given a book folder under `~/glaukopis-fraktur/books/` (or one
page of a newspaper there). In its `strips/` folder are pictures named
`page-NNNN-S01.png`, `page-NNNN-S02.png`, …, each showing up to twelve
lines of a page of a Norwegian or Danish book in Gothic type (Fraktur),
every line numbered at the left (L01, L02, …). `strips/page-NNNN.strips.json`
lists the lines of each strip in order. Your task: look at every strip
and write out exactly what each line shows.

Write the result into `page-NNNN.claude.tsv` in the book folder (beside
`book.json`), one row per line, three columns separated by a tab:

    page-0036-L01<TAB><flag><TAB><text>

where `<flag>` is empty, or `unsure`, or `skip`. Write the file after
every strip (append rows), so nothing is lost if you are stopped.
Finish every page of the folder; do not stop part way without saying so.

## Independence

Read from the pictures only. Do not open `lines/*.lines.json`, the
`sheet-*.html` files, the `.alto.xml` files, or any `.truth.tsv` or
`.human.tsv`: they hold other readings, and yours must not lean on them.
Do not run Tesseract. Look at the strip with the Read tool, at the size
it is; if a strip is hard to read, you may crop a single line from
`lines/<name>.png` and look at it larger, nothing else.

## The rules of transcription

1. Write what is printed, with the spelling of the time: *faa*, *gaar*,
   *Kjærlighed*, *Huus*, *Troe*. Never modernise, never "correct" a
   spelling that looks odd: old books spell as they spell. Write the
   letter on the page even where you know the word otherwise: a printer
   may set *Polser* for *Pølser*, *Rissengryn* with two long s,
   *Kønigsberg* with ø, *gientage* with i and *skjære* with j in the same
   book. Look at the letter, not at the word you expect.
2. The long s (ſ) is written as s. Ligatures of type are their letters:
   ff, fi, fl, ſt → st, ch, ck, tz, sk. The letters æ ø å Æ Ø Å ß and &
   stay themselves.
3. Spaced-out letters used for emphasis (S p e r r s a t z) are written as
   an ordinary word, without the spaces.
4. A hyphen at the end of a line (often printed as a double stroke =) is
   written as a plain hyphen -. Dashes as —. Quotation marks as the book prints
   them: most print „ at the start and “ at the end, some a high ” at
   both ends, a few » «; an apostrophe as ’.
5. Antiqua (roman) words inside the Fraktur, numbers, and punctuation
   exactly as they stand. Keep a space before a colon or semicolon only
   where one is clearly set.
6. One printed line is one row. Every picture is cut with a margin, so
   slivers of the lines above and below often show at its top and
   bottom: that is normal, read the whole line in the middle. Flag
   `skip` (text empty) only when the line itself is not whole: cut off
   at the top or bottom so that letters are missing, two full lines in
   one picture, or no text at all (a rule, an ornament). A page number
   alone is text, and is written.
7. Where you cannot tell a letter, flag the whole line `unsure` and write
   your best reading anyway. Never guess silently: an unsure line is
   left out of training, a wrongly guessed one poisons it.
8. Letters that look alike in Fraktur and are often confused: B and V,
   K and R and N, u and n, c and e, k and t, r and x, f and ſ (s), i and
   j (j drops below the line), o and ø (a worn ø loses its stroke). Slow
   down on these, and enlarge the line from `lines/` whenever one of them
   is in doubt; flag `unsure` rather than choose.
9. The capital I and J are one glyph in Fraktur. Write the letter the
   word has: I before a consonant or standing alone (*Indbyggere*,
   *Israel*, *I Lissabon*), J before a vowel (*Jeg*, *Jo*).

## Saving and reporting

Append to the TSV after every strip. At the end, report: how many lines
you wrote, how many flagged unsure and skip, and which strips were hard
(pale, small, skewed) and why. Say nothing else in the report. Commit
nothing to git; the folder is not a repository.
