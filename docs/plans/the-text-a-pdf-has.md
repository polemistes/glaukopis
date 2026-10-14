# Build plan: the text a PDF has

The working plan for `docs/adr/0044-the-text-a-pdf-has.md`. Read the record first, in full: it says what; this says how, in which order, in which files, with which interfaces, and how each step is verified. Where they disagree, the record wins; say so in your report. Read also `docs/plans/the-shape-of-a-text-and-its-org-form.md`, section "How to work", which holds here too (plain words; never a record number when talking to the owner; verify before you commit; edit then format; e2e with `timeout`, processes ended by PID only, never `pkill -f`; commit when a step is whole, never push; report the counts). Commit at the end of every step and more often where a step is long: work that is not committed is lost when the session is.

Read, before anything else, `docs/adr/0018-text-read-from-pdfs-and-pictures.md` with its addenda, `crates/core/src/ocr/mod.rs`, `layer.rs`, `text.rs`, `searchable.rs`, `crates/core/src/import/pdf.rs` (which reads PDFs the same way), `src/lib/ocr/ReadStep.svelte`, `SearchableDialog.svelte`, `TextChoice.svelte`, `src/lib/documents/DocumentDialog.svelte`, `src/lib/ocr/PdfMapDialog.svelte`, `src-tauri/src/commands/ocr.rs`, `src/lib/api/ocr.ts`, and `e2e/ocr.mjs`.

## The book to test on

The owner's copy of Wilson's *Aristophanis Fabulae I* (Oxford, 2007), a PDF of 438 pages, is in the library's store: the one file in `/home/proteus/.local/share/glaukopis/library/attachments/5e/5e4cbc56f7dcd149e4b69c34c7d4b45ff5a2ddfda946e774369a34f4d5e3b67c/`. The owner allowed it to be read for this work. Copy it into your scratchpad and never change the copy in the store. Page 98 of the print is page 109 of the file; its Greek is in the font `FCIOCM+PorsonGreekSF` (Type 1C, with a table of differences of 162 names such as `epsilonacute`, `asperacute`, `etaaspergrave`, `omegatildeiota`, `Alphalenis`, `sigmafinalt`), its Latin in Bembo with `BemboExpert` (old-style figures `twooldstyle`, small capitals `Osmall`). The PDF has a damaged object at offset 1410637 that `lopdf` and Poppler both report and both read past; make sure every step reads past it too. What was measured on 2026-10-15: the drawing library draws all 438 pages (2.4 s at 100 dpi); Tesseract with `grc` alone on page 109 drawn at 300 dpi reads the verse nearly right, with lines of accents between the verses and ς or ε for the lunate sigma; with `grc+eng+nor` the words with a lunate sigma come out Latin (*mpocécrapev*); 600 dpi is no better than 300. Poppler's `pdftotext` of page 109 gives `Vθην α%πειλα>, γλαα ψολοκοµπαι,` for ἥσθην ἀπειλαῖς, ἐγέλασα ψολοκομπίαις: the base letters right, the accented ones as ASCII, the sigmas gone. That is the PDF's own map, and what the preview shows *as it is*.

## Vocabulary

- *The text a PDF has*: its own text layer, as `layer.rs` reads it: lines with places.
- *As it is*: that text by the PDF's own map from glyph to Unicode. *As translated*: the same with the schemes applied.
- *Scheme*: a recogniser and translator of one way of keeping letters (`crates/core/src/ocr/schemes/`).
- *Glyph name*: what a font calls a glyph, as the PDF's encoding or the font itself gives it: `etaasper`, `Osmall`, `uni1F00`.
- *Choice of text*: `keep`, `translate`, `anew` (`Asked.text`).

## What exists, and what each piece becomes

| Today | Becomes |
| --- | --- |
| `pdf-extract = "0.12"` from crates.io, used by `ocr/layer.rs` and `import/pdf.rs` | `crates/pdf-text`, the same code taken into the tree, giving the glyph's name with each character |
| `layer::Line { text, left, right, top, bottom }`, `Layer { pages, labels, locked, laid }` | `Line` unchanged; `Layer` gains the names, the translated lines and the schemes per page |
| `Layer::verdict`, `layer::sound`, `Layer::sample` | stay; `Looked` gains `fonts` and `schemes`; a command `ocr_text` gives pages of text for the preview |
| `Asked { all, … }` | `Asked { text: TextChoice, … }` |
| `read_pdf`: a failed page takes the layer's text | a failed page is empty, with a line that says so; counts in `ReadPdf` and in the log |
| `make_searchable` with `all` | with `anew` as before (strip); with `translate`, the fonts' `ToUnicode` maps rewritten, nothing laid over |
| `text::page_paragraphs` / `tsv_paragraphs` | drop lines that are only accents; final sigma within a word to σ |
| `TextChoice.svelte` (sample, two radios) | `TextPart.svelte`: the found-line, three radios, and `TextPreview.svelte` beside them; the dialogs widen |
| `DocumentDialog.svelte` 560, `PdfMapDialog.svelte` 520, `SearchableDialog.svelte` 520 | 960 wide while a PDF with text is shown |

## Step 1 — the glyph names reach the application: `crates/pdf-text`

### 1.1 The crate

Copy `~/.cargo/registry/src/index.crates.io-*/pdf-extract-0.12.1/src/` into `crates/pdf-text/src/`, with a `Cargo.toml` (`name = "pdf-text"`, the workspace's edition is 2024 but keep the crate's own `edition = "2018"` so that nothing in it needs rewriting, the dependencies of `Cargo.toml.orig` with the versions `Cargo.lock` has now), its licence file (MIT, as the crate says; copy the text of the MIT licence with the author's name as in `Cargo.toml.orig`), and a `README.md` saying where it came from, which version, and what was changed. Add it to `[workspace].members`; in `crates/core/Cargo.toml` replace `pdf-extract` by `pdf-text = { path = "../pdf-text" }` and in `layer.rs` and `import/pdf.rs` replace `pdf_extract::` by `pdf_text::`. Build: everything as before. Commit this before changing a line of it, so that the diff of the change is readable.

### 1.2 The change

In `lib.rs`, where a simple font is built (the place that makes `unicode_map` from the differences, the base encoding and the embedded font's own encoding; search for `unicode_map`, `get_unicode_map`, `encoding_to_unicode_table`, and the `Differences` handling), keep beside the map a `names: HashMap<CharCode, String>`: the glyph name of each code as the differences give it, else as the base encoding names it, else as the embedded font's own encoding (Type 1C: the CFF charset, which the crate already reads for `unicode_map`; Type 1: the font's encoding, which it reads with `type1_encoding_parser`; TrueType with a `post` table: leave for later, say so). The trait `OutputDev` gains

```rust
/// A character with the name of its glyph, where the font gives one. The default is `output_character`.
fn output_glyph(&mut self, trm: &Transform, width: f64, spacing: f64, font_size: f64, char: &str, glyph: Option<&str>) -> Result<(), OutputError> {
    self.output_character(trm, width, spacing, font_size, char)
}
```

and the interpreter calls `output_glyph` wherever it called `output_character`, with the name of the code. Where the PDF's own map gives nothing for a code, hand over the empty string as `char` (today the crate skips or guesses; find out which, and make it the empty string with the name, so that a scheme can fill it). Every `warn!` of the crate about glyph names and Unicode mismatches becomes `debug!`. Nothing else changes.

Tests in `crates/pdf-text/src/lib.rs` or a `tests/` directory: a PDF made with `lopdf` (a dev-dependency) with Helvetica and a `Differences` array `[65 /etaasper /alphatildeiota /Osmall]` and a `ToUnicode` map sending 65 to `V`; a device that collects `(char, glyph)` sees `("V", Some("etaasper"))`, `("", Some("alphatildeiota"))` where the map has nothing, and a plain `("a", Some("a"))` for a code the base encoding names.

Verify: `cargo test -p pdf-text`, `cargo test -p glaukopis-core` (unchanged behaviour), `cargo check -p glaukopis`. Commit.

## Step 2 — schemes, the layer with names, the look, and the preview's command

### 2.1 Schemes — `crates/core/src/ocr/schemes/mod.rs`, `greek_names.rs`, `expert.rs`, `beta.rs`

```rust
/// How a font or a text keeps its letters, recognised and translated.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum Scheme { GreekNames, ExpertNames, BetaCode }

/// What a scheme makes of one glyph, by its name: the text it stands for.
pub fn by_name(name: &str) -> Option<(Scheme, String)>;
/// Composes a standalone breathing or accent with the capital that follows it, and makes a σ at the end of a word ς: over a line already translated.
pub fn mend_greek(line: &str) -> String;
/// Beta Code in a line, where it is that: the line in Greek.
pub fn beta_code(line: &str) -> Option<String>;
/// Whether a character the PDF's map gives is to be trusted over the name: not for nothing, a private-use character, a control character, or a Latin letter or sign where the name says Greek.
pub fn map_is_wrong(mapped: &str, name: &str) -> bool;
```

`greek_names.rs`: the base names (`alpha`…`omega`, with `sigma` → σ, `sigmafinalt` → ς, `Sigmafinalt` → Σ, the capitals by an initial capital letter of the name, `rho`/`Rho` with breathings, `upsilon` with dieresis), the marks (`asper` U+0314, `lenis` U+0313, `acute` U+0301, `grave` U+0300, `tilde` U+0342, `dieresis` U+0308, `iota` U+0345; `macron` U+0304, `breve` U+0306 where they appear), parsed from the name greedily, the base first, the marks in any order; the result composed with `unicode_normalization::UnicodeNormalization::nfc`. A name of marks alone (`asper`, `lenisacute`, `tildelenis`, `aspergrave`, `acute`, `grave`, `dieresis`, `tilde`, …) gives the *spacing* sign: ῾ U+1FFE, ᾿ U+1FBF, ῞ U+1FDE, ῎ U+1FCE, ῍ U+1FCD, ῝ U+1FDD, ῟ U+1FDF, ῏ U+1FCF, ΄ U+0384, ` U+1FEF, ¨ U+00A8, ῀ U+1FC0, and `lenis` alone also serves as the elision mark (U+1FBD); `mend_greek` then composes a spacing sign followed by a capital vowel or Ρ into the precomposed capital (῞Α → Ἅ: the sign's marks as combining marks after the letter, then NFC). Tests: at least thirty names, among them every name of the book listed above, `etatildeasperiota` → ᾗ, `Alphalenisacute` → Ἄ, `upsilonacutedieresis` → ΰ, `omegalenisacuteiota` → ᾤ, `rhoasper` → ῥ; `mend_greek("῞Α")` → "Ἅ", `mend_greek("ἐγέλασα σοφός σ.")` → "ἐγέλασα σοφός ς."? No: a σ before a full stop ends a word: "ἐγέλασα σοφός ς." is wrong; the test wants "σοφός" to stay and "σ." to become "ς.". Write the rule: σ becomes ς when the next character is not a Greek letter (end, space, punctuation, apostrophe ᾽ excepted: before the elision mark a sigma is final as well, "ς᾽").

`expert.rs`: `zerooldstyle`…`nineoldstyle` → the digit; `Asmall`…`Zsmall` → the small letter; `ff`, `fi`, `fl`, `ffi`, `ffl` and `f_f`, `f_i`, `f_l`, `f_f_i`, `f_f_l` → the letters; `commasuperior`, `periodsuperior` → `,` `.`; what else `glyphnames.rs` of the crate maps into the private-use range (`uniF7..`) takes the name's plain reading where one is obvious; leave the rest.

`beta.rs`: the standard table (TLG Beta Code: `a` α … `w` ω, `*` before a capital, `s` σ/ς by position, `)` lenis, `(` asper, `/` acute, `\` grave, `=` tilde, `|` iota, `+` dieresis, `:` ·, `'` ᾽), the marks after the letter in any order, capitals with the marks between `*` and the letter (`*)a` or `*a)`); composed with NFC. Recognition of a line is conservative: it is Beta Code when at least one in eight of its letters is directly followed by one of `)(/\=|+` and the line has no word that is a common English or Norwegian word of three letters or more from a short list (`the`, `and`, `with`, `that`, `for`, `det`, `som`, `ikke`, `med`, `og`); a line that is not recognised is left as it is. Tests with the first line of the Iliad in Beta Code, a line of English with a parenthesis, and a line of Norwegian.

### 2.2 The layer — `crates/core/src/ocr/layer.rs`

`Gatherer` implements `output_glyph` as well: beside `text` it keeps, per character, the glyph name (`names: Vec<Option<String>>` in step with the characters, or a parallel line of names per `Line`: choose what keeps `Line` as it is for the rest of the code; a `Line` may gain `names: Vec<(usize, String)>`, the byte offset of each character with a name, or the gatherer may make a second `Line` per line with the translated text). What is needed at the end, per page:

```rust
pub struct Page {
    /// The text as the PDF's own map gives it.
    pub lines: Vec<Line>,
    /// The same lines as translated, where any scheme applied; else `None`.
    pub translated: Option<Vec<Line>>,
    /// The schemes that applied on the page, with the fonts (base names without the subset prefix) they applied in.
    pub schemes: Vec<(Scheme, String)>,
}
```

`Layer.pages: Vec<Option<Page>>`. The translation of a character: `by_name(name)` where the name is given and `map_is_wrong(mapped, name)`, else the mapped text; then `mend_greek` over each line; then `beta_code` over each line of the result where no name scheme applied to the line. `Layer::verdict` judges the *translated* text where there is one, and `Layer::sample` gives both forms. `has_text` as before (counts the letters of the text as it is, or of the translation where there is one, whichever has more).

Tests: a PDF made with `lopdf` in `tests.rs` (write a helper `porson_pdf()` that makes a one-page PDF with Helvetica, a `Differences` array of twenty of the book's names, a `ToUnicode` map that sends them to ASCII as the book's does, and a content stream of three lines of at least 120 glyph codes in all, which is what `has_text` needs); `layer::read` of it gives `translated` lines in Greek, `schemes == [(GreekNames, "Helvetica")]`, verdict `Sound` where the as-is text was `Poor`. The same helper writes `e2e/fixtures/porson.pdf` in an `#[ignore]` test `write_porson_fixture`, run once by hand and the file committed.

### 2.3 What is asked, what is looked at, and the text for the preview — `ocr/mod.rs`, `commands/ocr.rs`, `api/ocr.ts`

```rust
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TextChoice { #[default] Keep, Translate, Anew }
pub struct Asked { pub languages: Vec<String>, pub text: TextChoice, pub dpi: u32, pub layout: String, pub contrast: bool }
```

`all` goes everywhere (`ocr/mod.rs`, `tests.rs`, `commands/ocr.rs`, `api/ocr.ts`, the three dialogs: `anew` becomes `text === 'anew'`; `PictureTextDialog` sends `text: 'keep'`).

`Looked` gains:

```rust
/// The fonts of the text, base names without the subset prefix, those with most glyphs first.
pub fonts: Vec<String>,
/// The schemes that apply, each with the fonts it applies in and on how many pages.
pub schemes: Vec<SchemeFound>,   // { scheme: Scheme, fonts: Vec<String>, pages: usize }
```

and `Sample` gains `translated: Option<Vec<String>>`. `poor` counts by the translated text where there is one.

A new command for the preview:

```rust
/// The text a PDF has, page by page, for the preview: `count` pages from `from` (counted from nought), as it is and as translated.
#[tauri::command(async)]
pub fn ocr_text(state, path: String, stored: Option<bool>, from: usize, count: usize) -> CommandResult<Vec<PageTextView>>
pub struct PageTextView { pub number: usize, pub label: String, pub lines: Vec<String>, pub translated: Option<Vec<String>>, pub has_text: bool }
```

built from `layer_of` (which keeps the layer of the file looked at last, so the preview costs no second reading), lines joined by `text::by_place` order as `read_pdf` orders them (reuse what `read_pdf` does for a page that is taken as it is, but keep the lines, not the paragraphs: the preview shows the page as it stands). `count` is held to 50. In `api/ocr.ts`: `TextChoice`, `Asked.text`, `Looked.fonts`, `Looked.schemes`, `Sample.translated`, `PageTextView`, `ocrText(path, stored, from, count)`. `contract.rs`: a value `looked` of type `Looked` with a scheme found, made from the fixture PDF of 2.2 (the helper lives in the core's tests; move it to `crate::testing` so the contract test can use it), and `pageText: PageTextView[]`.

Verify: `cargo test -p glaukopis-core`, `cargo test -p glaukopis contract`, `pnpm check`. Commit.

## Step 3 — reading: keep, translate, anew without fallback; the searchable PDF's maps

### 3.1 `read_pdf`

- `wanted` = every page when `Anew`, else the pages without text, as now.
- A page not read by Tesseract takes, with `Translate`, the translated lines where the page has them, else its lines as they are; with `Keep`, its lines as they are.
- A page Tesseract failed on, with `Anew`: `paragraphs = vec![tr!("ocr-page-failed-line", message = why)]` (a line such as "This page could not be read: …"), `read: false`. Never the layer's lines.
- `ReadPdf` gains `read: usize, taken: usize, failed: usize`; the remarks say them in one line (`ocr-remark-counts`: "N pages read by Tesseract, M taken from the PDF, K could not be read"), followed by the first four failures as now. `tracing::info!(pages, read, taken, failed, text = ?asked.text, "a PDF was read")` at the end; the same in `make_searchable`.

### 3.2 `make_searchable` with `Translate` — `searchable.rs`

```rust
/// Writes into the PDF a right map from glyph to Unicode for every font whose glyphs the schemes translated: the pages stay as they are, and every reader then copies and searches the text rightly. The fonts that were given a map.
pub fn remap(bytes: Vec<u8>, doc: Document, maps: &[FontMap]) -> Result<(Vec<u8>, usize)>
pub struct FontMap { /// The font's object id. pub font: ObjectId, /// Code to text. pub entries: Vec<(u32, String)> }
```

The maps come from the layer: `Gatherer` learns, with each glyph, the font's object id and code (give `output_glyph` what it needs: the crate's font has its object id; add `font: Option<ObjectId>` and `code: u32` to the call, or a separate `begin_font(id)` call; decide while doing step 1.2 and say so). `remap` writes, as `lay_over` does with `Document::new_from_prev`, a new `ToUnicode` stream per font (`/CIDInit /ProcSet findresource begin … begincodespacerange <00> <FF> endcodespacerange … beginbfchar <41> <1F21> … endbfchar … endcmap`, UTF-16BE, several code units where the text is longer than one character, in runs of at most 100 `bfchar` entries as the CMap specification asks) and a copy of the font's dictionary pointing to it. Simple fonts only; a Type0 font is left alone and said. `make_searchable` with `Translate`: no Tesseract; `remap`; `Searchable { pdf: Some(..), read: 0, with_text, remapped: n, .. }` (`Searchable` gains `remapped: usize`); `MadeSearchable` carries it; the toast says "The PDF's text is readable now: N fonts given their letters". With `Anew`: as today (`strip` true). With `Keep`: as today.

Tests: `remap` on the fixture PDF of 2.2, then `pdf_text` reads Greek out of it, and `pdftotext` where Poppler is installed; the result draws the same (`drawn(&before) == drawn(&after)` as the strip test compares).

### 3.3 Tesseract's reading — `text.rs`, `commands/ocr.rs`

- `tsv_paragraphs` keeps, per line, the mean confidence of its words (column 10 of the TSV, `conf`) — `Line` gains `conf: Option<f32>`, `None` for the PDF's own lines.
- `page_paragraphs` drops a line where (a) it has no letter or digit, or (b) its letters and digits are fewer than a third of its characters without spaces and its mean confidence is under 50, or (c) more than half of its characters are Greek spacing accents and breathings (U+0384–0385, U+1FBD–1FC1, U+1FCD–1FCF, U+1FDD–1FDF, U+1FED–1FEF, U+1FFD–1FFE) and combining marks (U+0300–036F). Tests with the lines Tesseract gave on the book: `" Ν " ΄ ΄ Ε 3 ΄ 2.ϑ»ϑβὲ2 ΄ὔ΄`, `3 ΄,ὔ ΄ ΄,`, `ΕΝ κ ο κ 2 ;`, `» Ν Ν ΄ ΄ὔ΄ 3 Ε ΄ὔ .,2 ΄ὔ΄` are dropped; `700`, `Αλ.`, `ἀπεπυδάρισα μόθωνα, περιεκόκκασα.` and `698 γ᾽ εἰ R: ἐὰν cett.` are kept.
- Where the languages asked include `grc` or `ell`: `mend_greek`'s sigma rule over every paragraph read by Tesseract (a σ at a word's end to ς, a ς within a word to σ).
- The dialog warns (a hint under the languages, `ocr-languages-greek-with-latin`) when `grc` or `ell` is chosen together with a language of the Latin script; the hint says why.

Verify: `cargo test -p glaukopis-core`, `pnpm check`, `pnpm test`; the OCR tests that use Typst and Tesseract run here. Commit.

## Step 4 — the dialog: the found-line, three choices, the preview

### 4.1 `src/lib/ocr/TextPart.svelte` (from `TextChoice.svelte`) and `TextPreview.svelte`

`TextPart` props: `looked: Looked`, `path: string`, `stored: boolean`, `choice: TextChoice` (bindable), `searchable?: boolean`. It shows:
- the found-line: `ocr-text-found` ("Text on { $withText } of { $pages } pages, in { $fonts }."), then per scheme found `ocr-text-scheme-greek-names` ("The Greek is stored as the glyph names of { $fonts } and can be made into Greek letters."), `ocr-text-scheme-expert`, `ocr-text-scheme-beta`; then `ocr-text-poor`/`-poor-all` as now when the (translated) text is poor;
- the three radios, `data-choice="keep" | "translate" | "anew"`; *translate* only when `looked.schemes.length > 0`; hints as now, with `ocr-text-translate-hint` ("The text is made readable by what the fonts say of their letters; nothing is read from pictures.") and `ocr-text-translate-searchable-hint` ("The PDF's own tables are put right, so that every reader copies and searches the text rightly; nothing drawn changes.");
- `TextPreview` beside them.

The first choice: `translate` where a scheme was found; else `anew` where `anewAtFirst(looked)`; else `keep` (`how.ts`: `firstTextChoice(looked): TextChoice`).

`TextPreview` props: `path`, `stored`, `pages: number`, `translated: boolean`. A scrolling box (`max-height` of the dialog's body, `min-height: 320px`) that asks `ocrText(path, stored, from, 20)` for the first pages, and for the next 20 when the scroll comes within 400 px of the end (`IntersectionObserver` on a sentinel), until all are had; each page a block: a small heading with `ocr-text-page { $label }`, the lines as `<pre>`-like wrapped text (`white-space: pre-wrap`), the pages without text with `ocr-text-page-none` greyed. When `translated` turns, the box shows `translated ?? lines`. `data-text-preview`, `data-text-page={label}` on the blocks, for the scripts.

### 4.2 The three dialogs

- `ReadStep.svelte`: `<TextPart {looked} {path} {stored} bind:choice />` in the place of `TextChoice`; the languages and *How it is read* shown when `choice === 'anew'` or the PDF has pages without text; the about-line gains `ocr-about-translate` ("The text the PDF has is made readable, and the pages without text are read from pictures of them." / "…; no page is read from a picture.").
- `SearchableDialog.svelte`: the same with `searchable`; `ocr-searchable-translate` as the about-line; the button says *Make readable* (`ocr-searchable-make-readable`) when `translate` is chosen.
- `DocumentDialog.svelte`, `PdfMapDialog.svelte`, `SearchableDialog.svelte`: `width={looked?.withText ? 960 : 560}` (or the dialog's own former width) — `Dialog` takes `width`; the body of `TextPart` lays the choices (a column of 340 px) and the preview (the rest) side by side with `grid-template-columns: 340px minmax(0, 1fr)`, and one under the other below 700 px of dialog width.

### 4.3 Words, e2e

Words in `locales/en|nb/ocr.ftl` (the new ones above; `ocr-text-keep`, `-anew` and their hints stay). `e2e/ocr.mjs`: in the part *text that does not read as text*, use `e2e/fixtures/porson.pdf` beside `beta.pdf`: dropped on the tabs, the dialog says a scheme was found (`[data-text-found]` mentions "glyph names"), *translate* is chosen at first, the preview shows Greek letters (`[data-text-preview]` holds "ἥ" or whatever the fixture's first word is) and switches to the ASCII form when *keep* is clicked; *Read the text* with *translate* makes the element with Greek text and no Tesseract run (check no `ocr-` folder appears in `work`); screenshots `ocr-2d-translate` and `-dark`. The searchable part: `porson.pdf` attached to a reference through `invoke('attachment_add', …)`, *Make readable*, and `pdftotext` (where installed) of the stored file gives Greek. The present checks of `beta.pdf` stay (its text has no names, so no scheme: *anew* at first).

Verify: `pnpm check`, `pnpm test`, `node scripts/check-locales.mjs nb`, `pnpm e2e:build`, `timeout 500 node e2e/ocr.mjs`, and `documents.mjs`, `files.mjs`. Read the screenshots in light and dark. Commit.

## Step 5 — the owner's book, the guide, the last checks

- **By hand, on the book** (a copy in the scratchpad): `ocr_look` through the e2e harness or an `#[ignore]` test: `schemes` names `GreekNames` in `PorsonGreekSF` and `ExpertNames` in `BemboExpert`; the preview of page 109 translated reads `ἥσθην ἀπειλαῖς, ἐγέλασα ψολοκομπίαις,` (the print reads: Αλ. ἥσθην ἀπειλαῖς, ἐγέλασα ψολοκομπίαις, / ἀπεπυδάρισα μόθωνα, περιεκόκκασα. / Πα. οὔτοι μὰ τὴν Δήμητρά γ᾽, εἰ μή σ᾽ ἐκφάγω / ἐκ τῆσδε τῆς γῆς, οὐδέποτε βιώσομαι.); read into a new project with *translate*: no Tesseract, every page Greek; make a copy searchable with *translate*: `pdftotext` on the result gives Greek. Read page 109 anew with `grc` alone: no line of accents in the element, final sigmas right. Report what you saw, with a few lines quoted.
- `docs/guide.md`, section *Text in scans and pictures*: the preview, the found-line, the three choices, what translation does to a searchable PDF, that reading anew never takes the PDF's text, and the warning on Greek with Latin languages. One sentence under *Keeping things safe* is not needed.
- `node scripts/check-locales.mjs` over every language exits 0; `cargo clippy -p pdf-text -p glaukopis-core -p glaukopis --all-targets` clean on what was touched (the vendored crate may carry warnings of its own: silence them with `#![allow(…)]` at its top rather than editing its code).
- The full e2e set that reads PDFs: `ocr.mjs`, `documents.mjs`, `sources.mjs`, `files.mjs`, `library.mjs`.

Commit.

## Report

At the end: what was built step by step; what was left (TrueType `post` names, Type0 fonts in `remap`, TeX transliteration, the eight-bit font tables); what the book gave by hand, quoted; the counts of `cargo test -p glaukopis-core`, `cargo test -p pdf-text`, `pnpm check`, `pnpm test`, and of each e2e script; and anything done otherwise than the record, with why.
