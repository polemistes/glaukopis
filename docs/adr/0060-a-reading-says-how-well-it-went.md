# 0060 — A reading says how well it went, a page can be tried, and type is chosen as well as language

Date: 2026-10-19. Status: accepted by the owner on 2026-10-19 in outline; to be built from `docs/plans/a-reading-says-how-well-it-went.md`. Amends 0018 (text read from PDFs and pictures) and its addenda.

## Context

The owner asked whether a cleaning program such as unpaper would make the reading of scans more even in quality: most PDFs read very well, some quite badly. To answer, seven PDFs of the owner's were read on 2026-10-18, three pages each, drawn as the application draws them, with Tesseract 5.5.3 in thirteen ways: as the application reads now; with Tesseract's adaptive thresholds (Sauvola, adaptive Otsu); with its word lists off; at 400 dots to the inch; as one column; with orientation detection; with the application's own black and white; and, for a book in Gothic type, with the Fraktur model. The scores were Tesseract's own confidence per word, the share of words shaped as words (the application's judgement of the text a PDF has), and, afterwards, the share of words the Bokmål dictionary knows. The bench is kept in `.claude/briefs/ocr-quality/bench/`.

What it showed:

- The scans read well as they are read now: a Greek edition scanned as two-page spreads (Greek and English, confidence 90–91), three scans of the Nasjonalbiblioteket at 400 dots to the inch (88–91), a bilevel scan at 600 (87–91). The spread was read in order, the Greek page and then the English, by Tesseract's own analysis of the page.
- No setting of Tesseract's improved any of them. The adaptive thresholds were equal or worse (one page lost a third of its words). Word lists off gave the same text on every page. 400 dots, the column layout and orientation detection changed nothing. The application's own black and white lowered the confidence of the low-resolution book from 84 to 71.
- Where a reading was bad, the picture was not the cause. A Norwegian novel set in Fraktur read with the Norwegian model gave fluent nonsense ("ogfaa", "famme", "Hhave"; confidence 67–72, yet 92–94 % of its words shaped as words); read with Tesseract's Fraktur model it was right ("ogſaa", "ſamme", "have"; 85–87). A book stored as pictures at 72 dots to the inch had a poor text layer ("tidiigere", "rofkninger") that the application judged sound, and read anew it was no better: the letters are not there.
- The dictionary is no judge of old texts. The Bokmål dictionary knew 69–78 % of the words of the good pages of the Nasjonalbiblioteket, whose spelling is of their century ("gaar", "Sjælen"), and 86–91 % of the words of the poor low-resolution book. Tesseract's confidence told the cases apart; the dictionary did not.

unpaper itself has no Windows build and depends on ffmpeg, and the program that has shipped it longest, OCRmyPDF, runs it with its deskew, black filter, grey filter and centring switched off because they eat content. The owner set it aside: what cannot be had on Windows is not had.

## Decision

- **A reading says how well it went.** For every page Tesseract reads, the application keeps the mean of the confidences of its words, from 0 to 100, which Tesseract already gives beside each word. A page under 80 was *read poorly* (on the bench, good pages scored 87–91, the wrong model 65–72). The result of a reading says how many pages were read poorly and which, as stretches ("pages 3–42, 57"), beside the counts it gives now; a PDF made searchable says the same; the log keeps it. Where every page read by a Latin-script model was read poorly, the result says that books in Gothic type are read with the Fraktur model.
- **The look says the resolution of scanned pages.** Where a page is a picture, the look tells its dots to the inch, from the largest picture of the page and the page's size; where the pages are pictures at fewer than 150, the dialog says before reading that the letters are too few to read well, whatever is chosen, and that reading anew will not better the text the file has. The application says what it cannot do rather than reading for an hour and keeping quiet.
- **A page can be tried.** The dialogs that read a PDF (into elements, and made searchable) gain *Try a page*: a page, at first the first Tesseract is to read, is read with the languages and settings as chosen, and the dialog shows the picture as Tesseract saw it beside the text it read, with the confidence. Change a language or a setting, try again; a page takes seconds. This is how anyone finds the right model without knowing Tesseract.
- **Type is chosen as well as language.** Tesseract's Fraktur model (`deu_latf`) is offered on the language server and in the picker as *Fraktur (Gothic type)*, with a line saying that Norwegian, Danish, Swedish and German books before about 1900 are often set in it, whatever their language, and that it is chosen first or alone. The long s it reads (ſ) becomes s in what is read, as the lunate sigma is already made what its place says: it is a form of the letter, not a letter of its own.
- **Every page is shown, and settings hold by stretch.** The dialog shows the pages as a strip of small pictures, drawn as the strip is scrolled. A reading has one or more *stretches* of pages, each with its languages and its layout; at first one, the whole file. The writer begins a new stretch at a page of the strip; where the PDF has an outline, its top entries are offered as places to begin one. The page tried is read with the settings of its stretch.
- **Tesseract's blocks are shown on the tried page.** The blocks Tesseract found, which its TSV gives, are drawn over the picture, so that a writer sees whether two columns were taken as one, or the apparatus as part of the text. They are shown, not edited.
- **No new settings of Tesseract's, and no cleaning program.** Thresholds, word lists, engine, more resolutions: measured, none helped. The settings there are stay. unpaper is not taken in.

## Why not otherwise

- *More settings for the writer*: nobody who works with texts can guess which of Tesseract's hundreds of parameters helps their scan, and on a varied set none did. What helps is seeing.
- *The dictionary as a judge of a reading*: old spelling is unknown to a dictionary of today, and the owner's material is old; it would call good pages poor.
- *Editing the blocks, leaving out the apparatus and the running heads*: a layout editor, a program of its own. Shown first; edited when the showing has proved it needed.
- *Thumbnails drawn for the whole file at once*: minutes and gigabytes for a long book. Drawn as scrolled.

## Consequences

- `PageText` gains the page's confidence; `ReadPdf` and `Made` the pages read poorly; `Looked` the resolution of scanned pages; `Asked` the stretches. The contract is regenerated.
- The child process gains tasks: one page tried, with its picture; small pictures of pages.
- The language packages gain `deu_latf`; the names of models of type are the model's, not a language's.
- The guide says how a reading tells of itself, how a page is tried, and what the Fraktur model is for.

## Addendum of 2026-10-19: an s is an s

Decided by the owner on 2026-10-19: the long s (ſ) is an s in another shape, never another letter. It is written as s wherever Glaukopis takes text, not only in what Tesseract reads into elements: in the text a PDF has, as each character is taken (the text and the translation, and the fonts' maps written when a PDF is made readable), and in the text Tesseract lays unseen under a PDF made searchable, whose words are strings of two-byte codes that are the letters' own (`Identity-H`, every glyph as wide as the next), so that the code of ſ is made that of s and nothing moves. A page of a searchable PDF whose text is kept as it was is not touched, and keeps what it had.

Found the same day: Tesseract's Fraktur model (`deu_latf`) was made for German and has no æ, ø or å; in Norwegian and Danish books it reads them as e, o and a, at a confidence as high as any, and Norwegian chosen beside it does not bring them back. The hint and the remark say so. A model of the Gothic type of Danish and Norwegian books is left for the owner to decide on.

## Addendum of 2026-10-19: a Fraktur model that knows æ, ø and å

Made the same night: `dan_latf`, *Fraktur, Danish and Norwegian (Gothic
type)*, which is Tesseract's `deu_latf` (tessdata_best, Apache 2.0)
fine-tuned with `lstmtraining` on the Danish pages of
pvorb/tesseract-training-fraktur (Apache 2.0, 2013: 891 lines of real
scans and Fraktur fonts, with æ ø å Æ Ø Å and one German page), its
unicharset widened by those six letters, in two runs of 15,000 and 10,000
iterations. `packaging/languages/fraktur/` holds the scripts and the
README that says how it is made again and measured; the model and the
lines are under `packaging/build/fraktur/`, out of git, and the owner
uploads the package by hand with the others.

Measured, not judged by eye, on 42 lines from seven pages of the owner's
Norwegian novel in Gothic type, written out letter by letter (2060
characters, 53 of them æ ø å), and on two real-scan pages of the
repository never trained on: on the owner's lines it gets 50 of the 53 æ ø
å where `deu_latf` gets none, errs in 3.45 % of the characters against
`deu_latf`'s 4.85 % with æ ø å left out of the count, and is sure of the
owner's pages at 84.5 against 85.9, every page over 80 but the palest
(77.5). On the held-out pages, one character in a hundred and 37 of 38.
The old legacy `dan_frak` got 34 of 53 at a confidence of 69.5.

The application counts it as a model of Gothic type wherever `deu_latf`
is, and where Norwegian or Danish is among the languages, the line under
the language picker and the remark on pages read poorly name it rather
than the model made for German. What would be tried next, were it not
enough: lines set by `text2image` in the free Fraktur fonts from Danish
and Norwegian text of before 1900, and real Norwegian pages with their
text.

## Addendum of 2026-10-21: the Fraktur model trained on Norwegian books

The first `dan_latf`, taught æ ø å from Danish pages of 2013, was not yet
usable on the owner's books. It is replaced by one trained on Norwegian
print: 81 books, periodicals and newspapers in Gothic type of 1811–1920
from the National Library of Norway (nb.no, public domain), six pages
each, every line read by eye by a language model from pictures of twelve
lines at a time. Ten books were held out as the yardstick and read twice,
by two models independently; where the two disagreed, under one line in a
hundred, the owner settled the line from its picture. Where the owner
checked lines against the readings, the readings were right but for the
silent normalising of one model (*Pølser* for the printed *Polser*), and
the other model was chosen for the rest. 15,522 lines trained the model,
from `deu_latf`, with the Danish lines of 2013 mixed in.

On the 3,857 held-out lines the model errs in 0.36 % of the characters,
against 2.53 % for the first `dan_latf` and 4.12 % for `deu_latf`, and gets
98.6 % of the æ ø å right; on the owner's novel, 1.60 % against 3.45 % and
6.70 %, with a mean page confidence of 86.6, every page over the
threshold of 80. `packaging/languages/fraktur/` holds the scripts and the
README of the work; the pages, the readings and the lines are in the
owner's folder and the build folder, out of git.

