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

`../fraktur/make-model.sh` with the environment set for this model
(`BUILD`, `LINES`, `NAME=nor`, `START=nor`, and `WORDS`, `PUNCS`, `NUMBERS`
for the word list and the patterns combine_lang_model needs with it):

```
A=packaging/build/antiqua/start
export BUILD=$PWD/packaging/build/antiqua LINES=~/glaukopis-antiqua/lines NAME=nor START=nor \
  WORDS=$A/nor-widened.words PUNCS=$A/nor.punc NUMBERS=$A/nor.numbers
EXPERIMENT=tight SETS="real real-worn real-tight synth2 synth2-tight" packaging/languages/fraktur/make-model.sh prepare
EXPERIMENT=tight packaging/languages/fraktur/make-model.sh train runT 40000 0.00005
EXPERIMENT=tight packaging/languages/antiqua/judge.sh runT
```

The sets: `real` the lines read by eye (gather.py --roman); `real-worn`
a worn copy of each (`../fraktur/augment.py`); `real-tight` and
`real-tightbw` each cut tight to its own line (`tighten.py`), the second
black and white as a bilevel scan is; `synth2` synthetic lines with the
accents and figures of modern print (`synth.py --seed antiqua2`) and their
tight copies; `synth3` synthetic lines in old-style faces with accents
given to one word in two lines of prose (`--accents 0.5 --old-style`).

## Measuring a model

A model must be measured on whole pages as well as on lines: when the
application reads a page, Tesseract finds the lines itself and hands
them to the model cut tight, and a model trained only on lines cut with
a margin read the held-out lines far better than the stock model and
whole modern pages worse. `judge.sh` measures four ways:

- held-out lines: the 2,245 lines of the ten held-out books and newspaper
  page, each read by two readers who agreed (`measure.py --roman --psm 13`);
- held-out pages: the same books' pages read whole (`measure-pages.py`),
  the errors summed; reading order and running heads count here, so the
  number only compares models;
- modern lines and modern pages: ten pages of a Norwegian novel set in a
  twentieth-century face with old-style figures and accents (é, ê),
  bilevel at 600 dots, one of the owner's books on the OCR bench, read by
  two readers; kept with the owner's material, never trained on.

## The runs of 2026-10-30

| model | held-out lines | held-out pages | modern lines | modern pages |
|---|---|---|---|---|
| stock nor (tessdata_best 4.1.0) | 1.43 | 6.17 | 0.14 | 0.44 |
| run M: real, worn, synthetic; 60,000 at 0.0001 | 0.38 | | 0.11 | 0.59 |
| run T: with tight copies and synth2; 40,000 at 0.00005 | 0.35 | 5.27 | 0.11 | 0.48 |
| **run U: run T and 12,000 more with bilevel tight copies and synth3, at 0.00002** | **0.36** | **5.24** | **0.10** | **0.45** |

Character error rates in per cent. Run M split words, read commas as full
stops and dropped accents on whole pages (`stem mer`, `verden.`, `helt`
for `hêlt`); the tight copies, the accented lines and the bilevel copies
brought the pages back to the stock model's (one or two characters in
14,000) while keeping the gain on older print.

On the held-out lines, the confusions users reported:

| confusion | stock | run U |
|---|---|---|
| o and ø | 7 | 0 |
| a and å | 29 | 0 |
| „ “ and the like (stock nor has no „) | 295 | 18 |
| 1, i, l and I | 41 | 35 |

The 1/I confusions left are almost all italic Roman numerals (I, II, III)
in the glossary of a school edition, which both models misread.

**Run U is the model**, with a smaller word list (`nor-small.words`:
the stock list and the words of nineteenth-century spelling, without the
Nynorsk dictionary's 425,000 stems, which changed nothing measured and
made the file 20 MB rather than 14.7). It was made with
`lstmtraining --stop_training` from run U's checkpoint and a proto model
of the same unicharset with that list, copied to
`packaging/build/antiqua/nor.traineddata`, where
`scripts/make-language-packages.py` takes it as version 2026.10.30 of
the Norwegian package in place of tessdata_best's.
