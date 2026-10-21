# A Fraktur model that knows æ, ø and å

`dan_latf` is Tesseract's modern Fraktur model `deu_latf` (tessdata_best)
taught the letters æ ø å Æ Ø Å, for Norwegian and Danish books in Gothic
type of the nineteenth century and before. `deu_latf` was made for German
and has none of those letters; it reads *være* as *vere* and *møde* as
*mode* at full confidence (record 0060, addendum of 2026-10-19).

Everything large lives under `packaging/build/fraktur/` (not in git):
the clones, the line images, the checkpoints, the model, and the lines
of the owner's book used for measuring. This folder holds only what makes
the model again from nothing.

## The rules of the text

- An s is an s: the long s (ſ) is never another letter; the model may
  write ſ or s, the application folds ſ to s wherever it takes text.
- A ligature of type comes out as its letters (ff, fi, fl, ffi, ffl, ſt,
  st, ch, ck, tz, sk, ll, …), never as a ligature character (ﬀ ﬁ ﬆ).
  A ligature that is a letter stays one: ß, æ, Æ, œ, Œ and & are always
  written as themselves.

## The material

- Training data: <https://github.com/pvorb/tesseract-training-fraktur>
  (Apache 2.0, last change 2013). `dan-frak/` has 31 TIFF pages with
  Tesseract 3 box files (about 48,000 boxed characters; ø 308, æ 241,
  å 52, Ø 34, Æ 29, Å 14); `deu-frak/` and `swe-frak/` the same kind of
  data for German and Swedish. The long s is labelled `s`, ligatures of
  type by their letters, as the rules want them.
- The start model: `packaging/build/languages/tessdata_best/deu_latf.traineddata`.
- `radical-stroke.txt` from <https://github.com/tesseract-ocr/langdata_lstm>,
  which `combine_lang_model` needs.
- The old legacy model `dan_frak.traineddata` from
  <https://github.com/tesseract-ocr/tessdata>, measured as a baseline only.
- Tools: Tesseract 5.5 with its training tools (`lstmtraining`,
  `combine_lang_model`, `unicharset_extractor`, `merge_unicharsets`,
  `combine_tessdata`), python3 with Pillow.

## Measuring

`measure.py` reads a model over sets of line images with their truth and
prints numbers only: the character error rate, the same rate with æ ø å
folded away (everything but those letters), how many of the æ ø å of the
truth came out right, and the mean confidence of the words (what the
application calls a page's confidence; under 80 a page is "read poorly").
ſ is folded to s as the application folds it; a ligature character in a
reading counts as an error.

```
python3 -I packaging/languages/fraktur/measure.py \
  --tessdata packaging/build/languages/tessdata_best --lang deu_latf \
  packaging/build/fraktur/eval/owner packaging/build/fraktur/lines/heldout
python3 -I packaging/languages/fraktur/measure.py \
  --tessdata packaging/build/fraktur/clones --lang dan_frak --legacy ...
```

The sets:

- `owner`: 42 lines from seven pages (30, 120, 200, 280, 350, 450, 520)
  of a Norwegian novel in Gothic type, scanned at 329 dpi and
  drawn at 300 dpi as the application draws pages; 2060 characters, 53
  of them æ ø å. Written out letter by letter from the pictures; old
  spelling as printed, ſ as s, ligatures as letters, the em dash as —.
  The owner's book: the lines stay out of git.
- `heldout`: two real-scan pages of the training repository
  (`paakierkegaardske`, `tilselvprøvelse`), never trained on; 59 lines,
  3002 characters, 38 of them æ ø å.

## Lines from the box files

`lines_from_boxes.py` turns a set's box files into line images with their
text, as tesstrain takes them (`<set>.<page>.<nnn>.png` and `.gt.txt`).
Its docstring says how lines are grouped, where a space goes (a gap wider
than half the median box height), and what is dropped. The three sets of
the repository turned out to be the same thirty pages under three names
(only `nyeeventyr` in `dan-frak` and `fontfile_9` in `deu-frak` are
unique), so the model is trained on the Danish lines and that one German
page alone; German and Swedish lines mixed in would only have repeated
the Danish ones.

```
python3 -I packaging/languages/fraktur/lines_from_boxes.py \
  packaging/build/fraktur/clones/tesseract-training-fraktur/dan-frak \
  packaging/build/fraktur/lines/dan --exclude paakierkegaardske,tilselvprøvelse,font18,font19
python3 -I packaging/languages/fraktur/lines_from_boxes.py \
  packaging/build/fraktur/clones/tesseract-training-fraktur/dan-frak \
  packaging/build/fraktur/lines/heldout --only paakierkegaardske,tilselvprøvelse
python3 -I packaging/languages/fraktur/lines_from_boxes.py \
  packaging/build/fraktur/clones/tesseract-training-fraktur/deu-frak \
  packaging/build/fraktur/lines/deu --exclude font18,font19
mkdir -p packaging/build/fraktur/lines/german
ln packaging/build/fraktur/lines/deu/deu-frak.fontfile_9.* packaging/build/fraktur/lines/german/
```

`font18` and `font19` are set letter-spaced, so no share of the height
tells their words apart; they are left out. 971 Danish lines and 34
German came out, 989 with their lstmf; 59 held-out.

## Making the model

`make-model.sh` does what tesstrain does for a start model with new
letters: `deu_latf` is taken apart (`combine_tessdata -u`), the unicharset
of the training lines is merged into its own (`merge_unicharsets`), a
proto model with the widened unicharset and no word lists is made
(`combine_lang_model`, with `radical-stroke.txt` in `clones/`), a WordStr
box and an lstmf are written beside every line, nine lines in ten go on
the training list and one in ten on the evaluation list, and
`lstmtraining` continues from `deu_latf`'s LSTM with `--old_traineddata`
so that the net's output layer is remapped to the new unicharset. The
unicharset grows from 100 entries to 118 (æ ø å Æ Ø Å, — ” „ ½ § · and a
few French letters of the test text).

```
packaging/languages/fraktur/make-model.sh prepare
nohup packaging/languages/fraktur/make-model.sh train run1 15000 > packaging/build/fraktur/logs/run1.log 2>&1 &
packaging/languages/fraktur/make-model.sh finish run1   # models/run1/dan_latf.traineddata
```

### Measurements

CER is the character error rate in per cent; CER−æøå the same with æ ø å
folded to e o a in truth and reading; æøå how many of those letters came
out right; conf the mean confidence.

| set | model | CER | CER−æøå | æøå | conf |
|---|---|---|---|---|---|
| owner | deu_latf | 6.70 | 4.85 | 0/53 | 83.7 |
| owner | dan_frak (legacy) | 15.39 | 14.85 | 34/53 | 69.5 |
| owner | pilot (300 iterations) | 9.17 | 7.72 | 0/53 | 62.0 |
| heldout | deu_latf | 3.46 | 2.40 | 0/38 | 88.8 |
| heldout | dan_frak (legacy) | 2.53 | 2.10 | 25/38 | 84.5 |
| owner | run 1 (15,000 iterations) | 3.88 | 3.88 | 48/53 | 79.4 |
| owner | **run 2 (10,000 more)** | **3.45** | **3.45** | **50/53** | **81.3** |
| heldout | pilot (300 iterations) | 6.36 | 5.90 | 0/38 | 69.1 |
| heldout | run 1 | 0.97 | 0.97 | 38/38 | 88.7 |
| heldout | run 2 | 1.17 | 1.17 | 37/38 | 89.5 |

The confidence of the owner's whole pages, read as the application reads
them (`--psm 3`, the mean of the words' confidences), which is what the
threshold of 80 is set against:

| page | deu_latf | run 1 | run 2 |
|---|---|---|---|
| 30 | 87.1 | 83.9 | 85.3 |
| 120 | 86.0 | 82.5 | 86.6 |
| 200 | 84.2 | 82.0 | 86.4 |
| 280 | 86.9 | 86.1 | 87.1 |
| 350 | 85.2 | 82.8 | 83.6 |
| 450 | 85.1 | 75.1 | 77.5 |
| 520 | 86.9 | 82.4 | 84.9 |
| mean | 85.9 | 82.1 | 84.5 |

Page 450 is the palest scan of the seven; the new model is less sure of
it than `deu_latf`, which was sure of *vere* and *mode*.

**Run 2 is the model** (`packaging/build/fraktur/dan_latf.traineddata`,
chosen with `make-model.sh choose run2`; 7.5 MB). On the owner's lines it
gets 50 of 53 æ ø å (94 %) where `deu_latf` gets none; its errors in the
other letters are fewer (3.45 % against 4.85 %); its confidence stays
over 80 (81.3 on the lines, 84.5 on the pages). On the held-out pages of
the repository it errs in one character of a hundred and gets 37 of 38.

Run 1 was 15,000 iterations from `deu_latf` at a learning rate of 0.0001
(17 minutes on 16 cores; training error 0.59 % at the end, still
falling); run 2 continued from its last checkpoint for 10,000 more at the
same rate. A pilot of 300 iterations proved the pipeline first.

## What would be tried next

More lines: the model has seen only 891 lines of Danish, from one kind of
scan and eighteen fonts. Lines set by `text2image` in the free Fraktur
fonts UnifrakturMaguntia and UnifrakturCook from Danish and Norwegian
text of before 1900 would widen it, and real pages of Norwegian books
with their text would do more. Page 450 shows where it is weakest: pale,
thin print.

`deu_latf` writes the em dash as `-=-` or `=`; those count against it on
the owner's lines (a few characters), the same for every model.

## Norwegian ground truth from the National Library

The next model is to be trained on Norwegian books, corrected by people.
The pages come from the National Library (nb.no), whose API needs no
login: a catalogue search, the page pictures through IIIF at the scan's
full size, and an ALTO file per page with the library's own OCR and the
place of every line. The pages and everything made from them stay
outside the repository, in a folder of the owner's
(`~/glaukopis-fraktur/`); only the scripts are here.

```
python3 -I packaging/languages/fraktur/fetch-nb.py LIST.csv ~/glaukopis-fraktur/books --pages 6
python3 -I packaging/languages/fraktur/make-sheets.py ~/glaukopis-fraktur/books \
  --tessdata packaging/build/fraktur --lang dan_latf
```

`fetch-nb.py` takes a list of books (columns `nr,title,author,year,…`),
chooses an edition of each (public domain and readable from everywhere
first), and fetches pages spread through the body of the book, each
with its ALTO; a folder per book holds `book.json` saying what was
chosen, and `report.tsv` says what became of every row, with `review:`
where the edition found may not be the book asked for. A run can be
taken up again; books fetched before are skipped.

`make-sheets.py` cuts every page into lines where the ALTO places them,
reads each with the model, and writes a correction sheet per page, a
single HTML file that works offline in any browser: every line's
picture over a box with the model's reading, the library's reading
beside it to take instead, the rules of transcription at the top, and
flags for *unsure* (left out of training) and *skip* (not text, or cut
wrongly). A line counts as checked once the cursor has been in it; lines never
visited are saved as *unchecked* and left out, so a long sheet (a
newspaper page has some 350 lines) may be done in parts. **Save**
downloads `page-NNNN.truth.tsv` (line, flag, text), which goes back into
the book's folder; **Load** takes it back in to go on. `index.html` in
the books folder lists all sheets, the books held out for measuring
first (`heldout.json`), and says of each book whether it is Fraktur
(`types.json`, judged by eye). `--html-only` writes the sheets anew from
the lines already cut and read.

Books in roman type are moved out of the books folder, to `aside/`
beside it: they cannot teach a Fraktur model.
