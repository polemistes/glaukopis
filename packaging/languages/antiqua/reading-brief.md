# Reading lines of roman type by eye: the brief for a reader

You are given a book folder under `~/glaukopis-antiqua/books/` (or one
page of a newspaper there). In its `strips/` folder are pictures named
`page-NNNN-S01.png`, `page-NNNN-S02.png`, …, each showing up to twelve
lines of a page of a Norwegian book or newspaper in roman type (antiqua),
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

1. Write what is printed, with the spelling of the time: *paa*, *gaar*,
   *Kjærlighed*, *hvad*, *Huus*, Nynorsk as Nynorsk. Never modernise, never
   "correct" a spelling that looks odd: write the letter on the page even
   where you know the word otherwise. Look at the letter, not at the word
   you expect.
2. Ligatures of type are their letters: ff, fi, fl, ffi, ffl. The letters
   æ ø å Æ Ø Å é ö ü ß and & stay themselves. A long s (ſ), rare in
   roman type, is written as s.
3. Spaced-out letters used for emphasis (s p e r r e t) are written as an
   ordinary word, without the spaces. Italic and bold are written as
   plain text.
4. A hyphen at the end of a line is written as a plain hyphen -. A dash
   (long or short, as a dash) as —, a dash between figures (1814–1905)
   as –. Quotation marks as the page prints them: » «, „ “, ” ”, or “ ”;
   an apostrophe as ’.
5. Numbers and punctuation exactly as they stand. Old-style figures (that
   go below and above the line) are figures all the same. Keep a space
   before a colon, semicolon, ! or ? only where one is clearly set.
6. One printed line is one row. Every picture is cut with a margin, so
   slivers of the lines above and below often show at its top and
   bottom: that is normal, read the whole line in the middle. Flag
   `skip` (text empty) only when the line itself is not whole: cut off
   at the top or bottom so that letters are missing, two full lines in
   one picture, or no text at all (a rule, an ornament, a picture). A
   page number alone is text, and is written.
7. Where you cannot tell a letter, flag the whole line `unsure` and write
   your best reading anyway. Never guess silently: an unsure line is
   left out of training, a wrongly guessed one poisons it.
8. Letters that look alike and are often confused in roman type: o and ø
   (a thin or worn stroke through the ø), a and å (a small ring), 1 and l
   and I and i (old figures: the 1 may look like a small capital I),
   0 and O and o, 5 and S, rn and m, cl and d, li and h, c and e, e and é,
   , and . , „ and ,, — and –. Slow down on these, and enlarge the line
   from `lines/` whenever one of them is in doubt; flag `unsure` rather
   than choose.
9. A line of Gothic type (Fraktur) inside a roman book, a heading or a
   name, is read as it stands, the same rules applying.
10. Small capitals are written as capitals (SYDPOLEN, EN GLAD GUT): what
   the eye sees, not what the word would be in ordinary type.
11. A raised footnote number or mark is written as a plain figure or mark
   straight after the word (venner4, ikke10, Tid*), never as a superscript
   character. Neither small capitals nor footnote numbers make a line
   unsure.

## Saving and reporting

Append to the TSV after every strip. At the end, report: how many lines
you wrote, how many flagged unsure and skip, and which strips were hard
(pale, small, skewed) and why. Say nothing else in the report. Commit
nothing to git; the folder is not a repository.
