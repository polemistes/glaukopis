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
