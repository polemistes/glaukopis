# 0044 — The text a PDF has: read right, shown whole, translated, or read anew without fallback

Date: 2026-10-15. Status: accepted by the owner on 2026-10-15; to be built from `docs/plans/the-text-a-pdf-has.md`. Amends 0018 (text read from PDFs) and its addendum of 2026-10-15 (the text kept or read anew).

## Context

The owner read Wilson's Oxford text of Aristophanes into elements, a digital edition of 2008 whose Greek is set in the font PorsonGreekSF, and got gibberish twice: first from the PDF's own text, then from Tesseract. What was found, on the book itself:

- **The drawing is sound.** Glaukopis's drawing library drew all 438 pages without a failure. Tesseract, reading a page drawn by it with Ancient Greek alone, gives mostly correct Greek.
- **The PDF's own text is wrong in every reader, and right in its font.** The font names each of its 151 Greek glyphs by what it is, *etaasper*, *alphatildelenisiota*, *Alphalenisacute*; but the table the PDF gives from glyph to Unicode, which every reader copies by, maps the accented letters to Latin signs and the sigmas to nothing. The library Glaukopis reads text with drops every glyph whose name it does not know, and warned 93,000 times doing so. The names, which would give the editor's own text exactly, reached nothing.
- **Tesseract errs in three ways on such a book.** The rows of breathings and accents over tightly set lines come out as lines of their own, of signs; with English or Norwegian among the languages, words with the lunate sigma, which looks like a Latin *c*, are read as Latin words; and the lunate sigma is read as ς or ε. A higher resolution does not help.
- **Reading anew could fall back in silence.** A page Tesseract could not read was given the PDF's own text, with only a remark at the foot of the dialog.

The owner asked for a clean and understandable interface: the whole text a PDF has, to be looked through before deciding; what encoding it is in, said, with the choice to translate it into readable Unicode; and reading from the pages as pictures, whatever text the PDF has, as an option that means what it says.

## Decision

### The glyph names reach the application

The text-reading library is taken into the tree as a crate of its own, `crates/pdf-text`, under its licence, and changed in one respect: every character it hands over comes with the name of its glyph as the font's encoding gives it, from the font's own table of differences, its base encoding, or the embedded font. Its warnings become debug messages. The library's reading of pages is otherwise as it was; it is replaced by a reading of our own only if it keeps failing on files, which is a later decision.

### Schemes: how a font or a text keeps its letters

A *scheme* recognises an encoding and translates it. Three are built now:

- **Composed Greek glyph names**, as Porson and other scholarly fonts name them: a letter, then any of *asper*, *lenis*, *acute*, *grave*, *tilde*, *dieresis*, *iota*, in any order, capital or small. Each is made into the letter with its combining marks and normalised, so that *etaasper* becomes ἡ and *Alphalenisacute* becomes Ἄ. A standalone breathing or accent followed by a capital vowel or rho is composed with it; standing alone otherwise, it is the spacing sign, so that *lenis* after γ is the elision mark γ᾽. The sigmas are stored as σ and ς whatever shape the font prints, since what is stored is searched; a σ at the end of a word becomes ς.
- **Adobe's expert names**: old-style figures to digits, small capitals to the small letters they stand for, the f-ligatures to their letters.
- **Beta Code in the text itself**, where a line of Latin letters carries the marks `) ( / \ = | +` and `*` as Beta Code does.

A scheme applies to a character where the PDF's own map gives nothing, a private-use character, or a Latin sign for a glyph whose name says Greek. The page says which schemes applied and in which fonts; the look at a PDF lists them for the whole file. The scheme's result is the text *as translated*, kept beside the text *as it is*.

### What the dialog shows and asks, wherever a PDF is read

- **The whole text, to look through.** Where a PDF has text, a preview scrolls through every page, each under its printed number, loaded as it is reached. It shows the text as it is, or as translated, as the choice stands.
- **What was found, in a line.** How many pages have text, in which fonts, and which schemes apply: "The Greek is stored as the glyph names of PorsonGreekSF and can be made into Greek letters."
- **Three choices**, the same for reading into elements and for making a PDF searchable: *Keep the text the PDF has*; *Translate it into readable text*, offered only where a scheme applies, with the preview showing the result; *Read every page anew with Tesseract*. The first choice is translation where a scheme applies, reading anew where the text is poor and no scheme applies, and keeping otherwise.
- **For a searchable PDF, translation rewrites the PDF's own tables.** The fonts whose glyphs were translated get a correct map from glyph to Unicode written into the file. No text is laid over, nothing drawn changes, and every reader then copies and searches the Greek rightly.

### Reading anew means Tesseract alone

- A page that cannot be drawn or read comes out empty, with a line in the element that says so and why. It never takes the PDF's text.
- The dialog and the log say, after a reading, how many pages Tesseract read, how many were taken from the PDF, and how many could not be read.
- Lines that are only breathings and accents are dropped; a final sigma within a word becomes σ where Greek is among the languages; the dialog warns when Greek is read together with a Latin-script language, since the lunate sigma reads as *c*.

## Later

- TeX's transliteration of Greek as a scheme; tables for the old eight-bit Greek fonts (SPIonic, SGreek, GreekKeys, WinGreek), one each as a file turns up; the dialog always names the fonts, so that the owner can say which.
- Translation applied to the first page when a file is identified for the library, so that a title in such a font is found.
- A reading of pages of our own, should the library keep failing on files.

## Consequences

- `crates/pdf-text` joins the workspace, with the licence of pdf-extract and a note of what was changed.
- `Asked.all` becomes `Asked.text`, one of *keep*, *translate*, *anew*; `Looked` gains the schemes found and the fonts; a command gives the text of a range of pages for the preview.
- The dialogs that read a PDF grow wide enough for a preview beside the choices.
- The guide's section on text in scans says what the choices are and what translation does.
- The words of the other languages lag, as usual.

## Why not otherwise

- *Text extraction of our own from the start*: a known-sized but large job with its own faults on files the present library reads well; one change to the library gives what is needed now.
- *Text through the drawing library*: it tells the Unicode of a glyph by the PDF's own map, which is what is wrong here, and exposes neither the glyph's name nor its code.
- *Laying a translated text layer over the pages of a searchable PDF*: the pages already hold the glyphs in their places; only the map is wrong, and rewriting it is smaller and better.
- *Mapping lunate sigma to ϲ*: faithful to the print, useless to a search for σοφός.
