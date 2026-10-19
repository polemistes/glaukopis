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
  (`paakierkegaardske`, `tilselvprøvelse`), never trained on.

### Measurements

CER is the character error rate in per cent; CER−æøå the same with æ ø å
folded to e o a in truth and reading; æøå how many of those letters came
out right; conf the mean confidence.

| set | model | CER | CER−æøå | æøå | conf |
|---|---|---|---|---|---|
| owner | deu_latf | 6.70 | 4.85 | 0/53 | 83.7 |
| owner | dan_frak (legacy) | 15.39 | 14.85 | 34/53 | 69.5 |

`deu_latf` writes the em dash as `-=-` or `=`; those count against it on
the owner's lines (a few characters), the same for every model.
