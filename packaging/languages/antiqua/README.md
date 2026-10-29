# A Norwegian model of roman type

Tesseract's Norwegian model (`nor` of tessdata_best 4.1.0) was trained in
2017 on synthetic text only, never on a scan. It reads a clean page of the
nineteenth century well, but users report that it confuses o with ø and 1
with i in some books, the kind of error that print it has never seen (thin
or worn strokes, old-style figures where the 1 looks like a small capital
I) brings. This folder makes `nor` taught such print, in the way the
Fraktur model was made (`../fraktur/README.md`): fine-tuned on real lines
read by eye, here with synthetic lines beside them.

Everything large lives outside the repository: the pages, lines, fonts and
texts in a folder of the owner's (`~/glaukopis-antiqua/`), the training
under `packaging/build/antiqua/`. This folder holds only what makes the
model again.

## Public domain only

Only pages in the public domain and readable from everywhere are used
(`fetch-nb.py --public-only`): the owner decided so on 2026-10-30, being
outside Norway, where the National Library's Bokhylla books (most of
1930–2000) cannot be read. From the library that leaves books whose
authors died more than seventy years ago, in any edition (a 1952 printing
of Hamsun is public domain), and newspapers to 1899; the newspapers of
1900–1935 are CC BY-NC-ND and are not used.

## The material

- `~/glaukopis-antiqua/antiqua_books.csv`: the list fetched (rows
  101–166), novels, plays, poetry, travel, schoolbooks and newspapers in
  Bokmål, Riksmål and Nynorsk from the 1860s to the 1950s, with the twelve
  roman-type books found among the Fraktur list (`aside/` there).
  Editions found in Fraktur, a gothic hybrid or another language were
  moved to `aside/` with the reason in `why.json`.
- Lines are cut, read and sheeted by the Fraktur folder's scripts
  (`make-sheets.py` with `--lang nor`, `make-strips.py`), and read by eye
  by Opus 5.5 following `reading-brief.md`, one reader for a training book,
  two independent ones for a held-out book (`books/heldout.json`).
  `gather.py --roman` makes the lines (I and J kept apart, quotation marks
  as written).
- Synthetic lines: `synth.py` sets Norwegian text (Project Gutenberg's
  Norwegian books, the old-spelling lines of the Fraktur readers, words of
  the Bokmål and Nynorsk dictionaries, figures, dates and references) in
  some fifty free fonts (`~/glaukopis-antiqua/fonts/`, OFL and Apache,
  from Google's font repository, and the serif fonts of the system), half
  of them worn by `../fraktur/augment.py`.
- The word list: `nor`'s own (extracted with `dawg2wordlist`), widened by
  the words of the old-spelling texts that occur twice or more and the
  Nynorsk dictionary's words.

## Measuring

```
python3 -I packaging/languages/fraktur/measure.py --roman --psm 13 \
  --tessdata packaging/build/languages/tessdata_best --lang nor LINES-DIR
```

`--roman` keeps I and J apart and counts „ “ ” " as one mark.

## Making the model

`../fraktur/make-model.sh` with the environment set for this model:

```
export BUILD=packaging/build/antiqua LINES=~/glaukopis-antiqua/lines \
  NAME=nor START=nor WORDS=packaging/build/antiqua/start/nor-widened.words
EXPERIMENT=train SETS="real real-worn synth" packaging/languages/fraktur/make-model.sh prepare
```
