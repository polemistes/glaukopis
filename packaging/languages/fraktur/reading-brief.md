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
   spelling that looks odd: old books spell as they spell.
2. The long s (ſ) is written as s. Ligatures of type are their letters:
   ff, fi, fl, ſt → st, ch, ck, tz, sk. The letters æ ø å Æ Ø Å ß and &
   stay themselves.
3. Spaced-out letters used for emphasis (S p e r r s a t z) are written as
   an ordinary word, without the spaces.
4. A hyphen at the end of a line (often printed as a double stroke =) is
   written as a plain hyphen -. Dashes as —. Quotation marks as printed:
   „ “ ” » «.
5. Antiqua (roman) words inside the Fraktur, numbers, and punctuation
   exactly as they stand. Keep a space before a colon or semicolon only
   where one is clearly set.
6. One printed line is one row. If the picture shows parts of two lines
   (the cut was wrong), flag it `skip` and leave the text empty. If it is
   not text at all (a rule, an ornament, a page number alone is fine as
   text), flag `skip`.
7. Where you cannot tell a letter, flag the whole line `unsure` and write
   your best reading anyway. Never guess silently: an unsure line is
   left out of training, a wrongly guessed one poisons it.
8. Letters that look alike in Fraktur and are often confused: B and V,
   K and R and N, u and n, c and e, k and t, r and x, f and ſ (s), the
   capital I and J (written J in the common Fraktur form, but as I where
   the printer clearly has an I). Slow down on these.

## Saving and reporting

Append to the TSV after every strip. At the end, report: how many lines
you wrote, how many flagged unsure and skip, and which strips were hard
(pale, small, skewed) and why. Say nothing else in the report. Commit
nothing to git; the folder is not a repository.
