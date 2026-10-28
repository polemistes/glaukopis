# A simple image editor — the build plan

The working plan for `docs/adr/0071-a-simple-image-editor.md`. Read the record first, in full: it says what and why, and what was found; this says how, in which order, in which files, and how each stage is verified. Where they disagree, the record wins; say so in your report. Read also `.claude/briefs/common.md` (the progress note, the languages, the rules), and the records 0069 (a file in a view) and 0070 (one place for files), whose code this builds on.

Read the last section of `docs/brief.md` (2026-10-28, *a simple image editor*): it is the owner's words, and the record is read from them. Nobody answers questions while you build: where something is open, choose the plainer thing, write the choice down in your progress note and your report, and go on. The record's "Choices made in writing this" lists what the owner has not been asked about; build them as written.

Work on `main`. Commit after every stage that builds, with a message that says what was built, in the voice of `git log`. Keep `PROGRESS-opus.md` at the root as the common brief says.

## Vocabulary

- *The source*: the file of the library that is in view when editing begins; an original or a copy, it makes no difference.
- *A copy*: a file of the library made from another, with `made_from` the source's hash (`FileRecord`, `crates/core/src/library/files.rs:42-71`). There are three reasons a copy is made now: to be a figure (`Library::for_figure`, `mod.rs:958`), by editing, and to be smaller. The record does not say which.
- *An edit*: the settings of one editing: quarter turns clockwise (0–3), flipped sideways, flipped upside down, a crop as fractions of the frame that shows, and brightness, contrast and saturation in percent (100 as it is).
- *The frame that shows*: the image after the turns and the flips, as the side shows it. The crop is given in it, as fractions from 0 to 1 of its width and height, so that it means the same on the preview and on the full image.
- *The preview*: the image the side shows while editing: upright, no larger than 2400 pixels on its longer side, made by the core when editing begins and not kept.
- *The editing row*: the row of controls under the viewer's bar while editing.
- *The viewer*: `src/lib/viewer/` (0069): `FileSide.svelte` the side, `ViewerBar.svelte` its bar, `ImageView.svelte` the image as one page, `viewers.svelte.ts` the facts of the file, `show.ts` the ways in.

## The words

Every word the user sees comes through `t('key')` from `locales/en/<part>.ftl` and `locales/nb/<part>.ftl`; write English and Bokmål together, in the same plain voice (`.claude/briefs/words.md` has the glossary). New keys go at the end of their files under a comment naming this plan. The other languages are left to be translated later; a key whose English changes is removed from the other languages' files so that they fall back. `common.ftl` may be used (`common-cancel`, if there), not added to.

```
viewer.ftl
viewer-edit = Edit                                            | Rediger
viewer-edit-turn-left = Turn left                             | Drei til venstre
viewer-edit-turn-right = Turn right                           | Drei til høyre
viewer-edit-flip-sideways = Flip sideways                     | Speilvend
viewer-edit-flip-over = Flip upside down                      | Snu opp ned
viewer-edit-crop = Crop                                       | Beskjær
viewer-edit-brightness = Brightness                           | Lysstyrke
viewer-edit-contrast = Contrast                               | Kontrast
viewer-edit-saturation = Saturation                           | Metning
viewer-edit-percent = { $percent } %                          | { $percent } %
viewer-edit-as-it-was = As it was                             | Som det var
viewer-edit-start-again = Start again                         | Begynn på nytt
viewer-edit-keep = Keep as a new file                         | Behold som ny fil
viewer-edit-cut-to = Cut to { $width } × { $height } of { $fullWidth } × { $fullHeight }
                                                              | Beskåret til { $width } × { $height } av { $fullWidth } × { $fullHeight }
viewer-edit-leave-title = Leave without keeping?              | Gå ut uten å beholde?
viewer-edit-leave-message = What was changed is lost.         | Det som ble endret, går tapt.
viewer-edit-leave = Leave                                     | Gå ut
viewer-edit-kept = Kept as { $name }                          | Beholdt som { $name }
viewer-edit-not-kept = The edited image could not be kept     | Det redigerte bildet kunne ikke beholdes
viewer-edit-not-opened = The image could not be opened for editing: { $why }
                                                              | Bildet kunne ikke åpnes for redigering: { $why }
viewer-edit-too-large-title = Too large to be edited          | For stort til å redigeres
viewer-edit-too-large-message = The image is larger than { $most } MB, which is the most an image may be. A smaller copy can be made and edited instead.
                                                              | Bildet er større enn { $most } MB, som er det meste et bilde kan være. En mindre kopi kan lages og redigeres i stedet.
viewer-edit-make-smaller = Make a smaller copy                | Lag en mindre kopi

figures.ftl
figures-versions = Versions                                   | Versjoner
figures-version-size = { $width } × { $height }               | { $width } × { $height }

files.ftl
# Changed: a copy is made for more than one reason now.
files-made-from = Made from                                   | Laget av
files-copies = Copies made from it                            | Kopier laget av den

core-pictures.ftl
# Put before the ending of a copy's name: "plate (edited).jpg", "plate (edited 2).jpg".
core-pictures-edited = edited                                 | redigert
# Likewise: "plate (smaller).jpg".
core-pictures-smaller = smaller                               | mindre
core-pictures-not-editable = a drawing has no pixels to edit  | en tegning har ingen piksler å redigere
core-pictures-nothing-changed = nothing was changed           | ingenting ble endret
```

## Stage 1 — the core: an image edited, and a smaller copy

Work in `crates/core`, `cargo test -p glaukopis-core library` after each step. Commit at the end.

### 1.1 The edit over the pixels — `crates/core/src/library/figures.rs`

- `pub struct Edit { turns: u8, flip_x: bool, flip_y: bool, crop: Option<Crop>, brightness: u16, contrast: u16, saturation: u16 }` and `pub struct Crop { x: f64, y: f64, width: f64, height: f64 }`, both `Serialize, Deserialize, Default`, `#[serde(rename_all = "camelCase")]`; `Edit::default()` is nothing changed (100, 100, 100); `Edit::is_nothing(&self)`. `turns` is read modulo 4.
- `pub fn apply(picture: DynamicImage, edit: &Edit) -> DynamicImage`, in the record's order:
  1. the turns: `rotate90` once per quarter clockwise (`image::imageops`, or `DynamicImage::rotate90/180/270`);
  2. the flips, in the turned frame: `fliph` where `flip_x`, `flipv` where `flip_y`;
  3. the crop, in the frame that shows: `x = round(crop.x * w)`, `y = round(crop.y * h)`, `cw = max(1, round(crop.width * w))`, `ch = max(1, round(crop.height * h))`, clamped to the image, `crop_imm`; a crop that is the whole frame (all four within 1/w of 0, 0, 1, 1) is skipped;
  4. the colours, `colours(&mut rgba, edit)`, skipped where all three are 100.
- `fn colours(picture: &mut RgbaImage, brightness: u16, contrast: u16, saturation: u16)`, per pixel on the stored sRGB values as fractions 0–1, alpha untouched, in this order and by these formulas (Filter Effects Module Level 1, the shorthand functions; `b`, `c`, `s` are the percents over 100):
  - brightness: `v' = v * b`;
  - contrast: `v' = (v - 0.5) * c + 0.5`;
  - saturation, by the matrix:
    `R' = (0.213 + 0.787s)R + (0.715 - 0.715s)G + (0.072 - 0.072s)B`,
    `G' = (0.213 - 0.213s)R + (0.715 + 0.285s)G + (0.072 - 0.072s)B`,
    `B' = (0.213 - 0.213s)R + (0.715 - 0.715s)G + (0.072 + 0.928s)B`;
  each step clamped to 0–1 before the next, rounded to 8 bits at the end. Work in `f32`. A 16-bit image is taken to 8 bits first (`to_rgba8`): what is kept is 8-bit PNG or JPEG anyway.
- `pub fn edited(bytes: &[u8], edit: &Edit) -> Result<Prepared>`: `kind_of` the bytes (`Kind::Svg` is `Error::invalid(tr!("core-pictures-not-editable"))`; an animated GIF is its first frame, which is what `decode` gives), `decode` with the format (the orientation tag applied, as `prepared` does, so the pixels are upright as the browser shows them), `apply`, then `encode` as JPEG where the source was JPEG and as PNG otherwise, with the ending `"jpg"` or `"png"` and the size of what was encoded. `Edit::is_nothing` is `Error::invalid(tr!("core-pictures-nothing-changed"))`.
- `pub fn preview(bytes: &[u8], longest: u32) -> Result<Prepared>`: decoded upright as above, resized with `resize` (`FilterType::Triangle`, as `lighter` and `small.rs` do) so that the longer side is at most `longest` where it is larger, and encoded as JPEG for a JPEG source, PNG for every other kind, so that TIFF, BMP, WebP and GIF are shown as the browser shows PNG. The size returned is the **full** image's upright size, not the preview's: the interface needs the full one.
- `pub fn smaller(bytes: &[u8], longest: u32) -> Result<Prepared>`: the same resizing, encoded as the kind `edited` would give; used for the copy offered over the limit. The size returned is the copy's.
- `pub fn copy_name(name: &str, word: &str, taken: impl Fn(&str) -> bool) -> String` with `ending`: `shown_name` of the stem with ` (word)` added, then ` (word 2)`, ` (word 3)`… until `taken` says no; a stem that already ends in ` (word)` or ` (word n)` is counted up, not doubled (`plate (edited).jpg` edited again is `plate (edited 2).jpg`). `word` is `tr!("core-pictures-edited")` or `tr!("core-pictures-smaller")`.
- Tests, with pictures made in the test (`image::RgbaImage::from_fn`, 4×3 with a different colour in each corner, encoded as PNG; a JPEG too):
  - one quarter turn clockwise puts the top-left pixel top-right, and the size is 3×4; two turns put it bottom-right; three, bottom-left; `flip_x` after one turn, and the crop of the right half after that, give the pixels the record's order says (write the expected corners out by hand);
  - the crop of the left half of a 4×3 is 2×3, the top-left pixel kept; a crop that is the whole frame changes nothing; a crop smaller than a pixel is one pixel;
  - brightness 200 on (0.25, 0.25, 0.25) gives (0.5, 0.5, 0.5); contrast 0 gives mid grey everywhere; saturation 0 of a pure red (1, 0, 0) gives (0.213, 0.213, 0.213) within one shade; 100 everywhere changes nothing; the alpha stays;
  - `edited` of a JPEG is a JPEG, of a BMP a PNG; of SVG the not-editable error; of nothing changed its error;
  - `preview` of a 5000×2000 image is 2400×960 and reports 5000×2000; of a 100×100, 100×100 as it is;
  - `copy_name("plate.jpg", "edited", |n| n == "plate (edited).jpg")` is `plate (edited 2).jpg`; of `plate (edited 2).jpg` is `plate (edited 3).jpg`; of a name without an ending, `plate (edited).png` with the ending given.

### 1.2 The library keeps the copy — `crates/core/src/library/mod.rs`

- Take the storing part of `for_figure` (`mod.rs:980-1004`: the size check, `store_bytes`, `hash_of_path`, the file already there by hash, the `FileRecord` with `made_from`, `save_files`, the view of the last record) out into `fn keep_copy(&mut self, source: &FileRecord, content: Vec<u8>, name: String, measured: Option<(u32, u32)>) -> Result<FileView>`, and have `for_figure` call it. Behaviour unchanged; its tests (`mod.rs:2100-2130`) still pass.
- `pub fn edited(&mut self, hash: &str, edit: &Edit) -> Result<FileView>`: the record (not found as `for_figure` says it), the file's size over `MAX_BYTES` is `too_large()`, the bytes read, `figures::edited`, the name `copy_name(&record.name, &tr!("core-pictures-edited"), |n| self.files.files().iter().any(|f| f.name == n && f.folder == record.folder))`, then `keep_copy`. The source is not touched. `made_from` is the hash given, whatever the source is a copy of.
- `pub fn smaller_copy(&mut self, hash: &str) -> Result<FileView>`: the same with `figures::smaller(&bytes, 4000)` and the word *smaller*; **no** check of `MAX_BYTES` before (that is what it is for), but the result over `MAX_BYTES` is `too_large()` (halve `longest` once and try again before giving up; say so in the log).
- `pub fn edit_facts(&self, hash: &str) -> Result<EditFacts>`: `EditFacts { width, height, ending: String, editable: bool, too_large: bool }` (`Serialize`, camelCase): the upright size (from `measure` where the file has no orientation tag, else from decoding the header's orientation and swapping; the plainer thing is to decode the dimensions through `ImageReader::into_decoder()` and its `orientation()` and swap for the quarter turns, without decoding the pixels), `ending` `"jpg"` or `"png"` as `edited` would keep it, `editable` false for a drawing, `too_large` the file's size over `MAX_BYTES`. The library is read with its lock held, briefly.
- Where the library's lock must not be held while pixels are worked on (the rule of 0070's addendum: *the library is not held while it talks or draws*): `edited` and `smaller_copy` read the record under the lock, let it go, do the pixel work as free functions, and take the lock again to `keep_copy`; a record that went away in between is not found. Follow how `file_small` (`src-tauri/src/commands/files.rs:392`) lets the library go. The plainer way, if the borrow allows: a method on the library that does only the keeping, and the pixel work in the command.
- Tests: an edited copy stands beside its source in the same folder, named `… (edited).png`, measured, with the source's `alt`, `made_from` the source; the source's record is unchanged; the same edit twice is one file (the second `edited` returns the first's view); an edit of the copy is named `… (edited 2).png` and made from the copy; a smaller copy of a 5000×100 image is 4000×80; `edit_facts` of a drawing says not editable.

Commit: *An image edited in the core: turns, flips, a crop and the browser's colour formulas over the pixels, kept as a new file of the library made from the one edited; a preview no larger than a side needs; a smaller copy for a file over the limit.*

### 1.3 The commands — `src-tauri/src/commands/files.rs`, `lib.rs`, `contract.rs`

- `file_edit_facts(hash) -> CommandResult<EditFacts>`.
- `file_edit_preview(hash) -> CommandResult<Response>`: the bytes of `figures::preview(&bytes, 2400)`, read as `file_small` reads (the record under the lock, the file with it let go). Not kept anywhere.
- `file_edit_keep(hash, edit: Edit) -> CommandResult<FileView>`.
- `file_smaller_copy(hash) -> CommandResult<FileView>`.
- All `#[tauri::command(async)]`, listed in `lib.rs` beside `file_for_figure` (line 171). `contract.rs`: `put("editFacts", "files.EditFacts", ..)` with a sample; `Edit` and `Crop` are arguments, so they are written by hand in `src/lib/api/files.ts` as the other argument types are. `cargo test -p glaukopis contract` writes `src/lib/api/contract.generated.ts`.
- `cargo clippy -p glaukopis-core -p glaukopis --all-targets`.

Commit: *The commands of editing an image: its facts, its preview, the keeping of the edited copy, and a smaller copy.*

## Stage 2 — the interface: editing in the side

### 2.1 The API — `src/lib/api/files.ts`

- `export interface Crop { x: number; y: number; width: number; height: number }`, `export interface Edit { turns: number; flipX: boolean; flipY: boolean; crop: Crop | null; brightness: number; contrast: number; saturation: number }`, `EditFacts` from the contract; `fileEditFacts(hash)`, `fileEditPreview(hash): Promise<ArrayBuffer>` (as `fileSmall`, line 194), `fileEditKeep(hash, edit)`, `fileSmallerCopy(hash)`.

### 2.2 The settings and what they mean — `src/lib/viewer/editing.ts` (new), `editing.test.ts`

Pure functions, tested with vitest:

- `nothing(): Edit`, `isNothing(edit)`.
- `turned(edit, by: 1 | -1)`: turns modulo 4; `flipped(edit, 'x' | 'y')`.
- `shownSize(edit, width, height): [number, number]`: swapped for odd turns.
- `cssTransform(edit): string`: `scale(fx, fy) rotate(turns × 90deg)` with `fx = flipX ? -1 : 1`, `fy = flipY ? -1 : 1`: the browser applies the functions right to left, so the turn comes first and the flip acts in the turned frame, as the core does it. Write this in a comment; it is the one place the two must agree.
- `cssFilter(edit): string`: `brightness(b) contrast(c) saturate(s)` with each percent over 100, in that order; `''` where all are 100.
- `clampedCrop(crop): Crop`: within 0–1, at least `1 / 4096` wide and high, `x + width ≤ 1`.
- `cutSize(edit, width, height): [number, number]`: the pixels the crop cuts to, in the frame that shows, rounded as the core rounds.
- Tests: the size after one and two turns; the transform and filter strings for a known edit, and `''` for nothing; a crop pushed past the edge is clamped; `cutSize` of the left half of 4×3 is [2, 3].

### 2.3 The image with an edit over it — `src/lib/viewer/ImageView.svelte`

- New props: `edit?: Edit | null`, `preview?: ImageSource | null` (where given, read in place of `source`; same `fileRead` and blob URL), and `children?: Snippet` drawn over the image (the crop frame).
- The box the image fills is `shownSize(edit, w, h)` at the factor; the `img` inside it has the full `w × h` at the factor and `style:transform={cssTransform(edit)}` with `transform-origin: center` and `style:filter={cssFilter(edit)}`; a turned image is centred in its swapped box (`position: absolute; inset: 0; margin: auto`). The fit (`fit`, line 56) and `zoomAt` (79) work on the box, not the `img` (`el.querySelector('.box')` instead of `img`).
- The scroller gets `data-viewer-editing` while `edit` is given, for the scripts.

### 2.4 The crop frame — `src/lib/viewer/CropFrame.svelte` (new)

- Over the box, the same size: a rectangle at the crop's fractions, with eight handles (corners and sides) and a draggable inside, the outside shaded (`background: rgba(0,0,0,.45)` in four pieces, or a `clip-path` with `evenodd`); dragging changes the fractions through `onchange(crop)`, clamped with `clampedCrop`; pointer capture as `src/lib/ui/drag.svelte.ts` does it, if that fits, else `setPointerCapture` by hand. The handles are 10 px squares, hit at 16 px. Keys: none. `data-crop-frame` with `data-x`, `data-y`, `data-width`, `data-height` in fractions to three places, for the scripts.

### 2.5 The editing row — `src/lib/viewer/EditRow.svelte` (new)

- Props: `edit: Edit`, `facts: EditFacts`, `cropping: boolean`, `onchange(edit)`, `oncropping(on)`, `onkeep()`, `oncancel()`.
- In order: four `IconButton`s (`RotateCcw` and `RotateCw` of lucide; for the two flips choose icons of the installed set that read as flips, `node_modules/@lucide/svelte/dist/icons/`: the set has no `flip-horizontal` or `history`) with tooltips `viewer-edit-turn-left`…; `Crop` as a toggled button (`aria-pressed`); a rule; three sliders, each a label, an `<input type="range" min="0" max="200">` (as `FigurePanel.svelte:99` has one), the percent after it (`viewer-edit-percent`) and a small *As it was* button shown while it is not 100; a rule; *Start again* (`viewer-edit-start-again`, enabled while `!isNothing`); a spring; where cropping, the text `viewer-edit-cut-to` with `cutSize` and the full size; `Keep as a new file` (`Button` primary, enabled while `!isNothing`); `Cancel` (`common-cancel`). `data-edit-row`, `data-edit-keep`, `data-edit-cancel`, `data-edit-crop`, each slider `data-edit-slider="brightness"`.
- The row wraps on a narrow side (`flex-wrap`), never scrolls.

### 2.6 The side — `src/lib/viewer/FileSide.svelte`, `ViewerBar.svelte`, `src/lib/project/sides.svelte.ts`

- `ViewerBar`: props `editable: boolean` (a picture with `facts.picture` and not a drawing; the drawing is known by its ending `.svg` from `files.get(hash)?.name`, or better by `EditFacts.editable` fetched when the side shows a picture), `editing: boolean`, `onedit()`: a button *Edit* (`Pencil`) after the zoom, `data-viewer-edit`, pressed look while editing, hidden where not editable.
- `FileSide`: state `editing: { facts: EditFacts; edit: Edit; preview: ImageSource | null; cropping: boolean } | null`. *Edit* pressed:
  1. `fileEditFacts(spec.file)`; `too_large` → `confirm` (`src/lib/ui/confirm.svelte.ts`) with `viewer-edit-too-large-title`, `-message` (`most` 50), the confirming answer `viewer-edit-make-smaller`; confirmed → `fileSmallerCopy`, `files.reload()`, the side shows the copy (step 4 below), and editing begins on it; not editable → the button was hidden, nothing;
  2. `fileEditPreview` into a blob URL as `ImageSource` (`{ path }` is a file path today: give `ImageSource` a second form `{ url }`, or hand `ImageView` the blob through a `previewUrl` prop; the plainer is the prop); a failure is `viewer-edit-not-opened` as a toast, and editing does not begin;
  3. editing begins with `nothing()`; the zoom goes to the fit (`sides.setFileZoom(key, null)`).
  4. *Keep*: `fileEditKeep(spec.file, edit)` → `files.reload()` and `pictures.reload()` (`src/lib/figures/pictures.svelte.ts:157`, so that thumbnails and the panel know the copy) → the side shows the copy: `sides.openFile(hash)` (`sides.svelte.ts:307`), which shows a file in the active side; read it, and if it makes a new side rather than putting the file into this one, add `sides.setFile(key, hash)` that does only that with the zoom at the fit → editing ends → toast `viewer-edit-kept` with the name. A failure is `viewer-edit-not-kept` with the error; editing stays open.
  5. *Cancel* and Escape (bound while editing through `shortcuts.bind` as `ImageView` binds the zoom, or a `keydown` on the side; Escape must not also close a dialog: the confirm is modal and takes it first): where `isNothing`, editing ends; else `confirm` with `viewer-edit-leave-title`, `-message`, the answer `viewer-edit-leave`.
  6. Leaving the side (`onDestroy`), or the side changing its file, drops the editing and revokes the preview's URL.
- The crop: `cropping` toggled by the row; while on, `CropFrame` is drawn as `ImageView`'s child with `edit.crop ?? { 0, 0, 1, 1 }`; off, the crop stays in the edit (it is a setting) and the frame is not drawn; *Start again* clears it.
- Test hook (`src/lib/shell/testing.ts`): `testHook('__glaukopisImageEditing', { begin: () => …, set: (part: Partial<Edit>) => …, cropping: (on) => …, keep: () => …, cancel: () => … })` on the active file side, so that the script sets a slider or a crop exactly rather than dragging. The buttons and sliders are still real and the script presses the buttons that matter (*Edit*, the turns, *Keep*).

### Verify

- `pnpm check`, `pnpm test`.
- `e2e/file-view.mjs` still passes (the bar has one more button).
- The new `e2e/image-editing.mjs` (stage 4) is written after the panel; run `e2e/file-view.mjs` now and look at a screenshot of the row open.

Commit: *An image edited in its side: an Edit button in the bar, a row of turns, flips, a crop and three sliders under it, the image showing every change at once over a lighter copy, kept as a new file made from the one in view, a smaller copy offered over the limit.*

## Stage 3 — the swap, by hand

### 3.1 The versions of an image — `src/lib/figures/images.svelte.ts` (or `files/store.svelte.ts`), tested

- `export function versionsOf(hash: string): FileView[]`: from `files.files`, the root (follow `madeFrom` up while the file is there; a `madeFrom` the library lacks ends the climb), then the root and every file whose `madeFrom` chain reaches it (walk down, breadth first, no cycles), in the order: the root first, then by `added`. Only files that `exists`. A test in `images.test.ts` (or the pictures' test file) with a made-up listing: a root, a copy, a copy of the copy, an unrelated file.

### 3.2 The panel of a figure — `src/lib/figures/FigurePanel.svelte`, `views.svelte.ts`

- Props `versions: FileView[]`, `shown: string` (the figure's hash), `onversion(file: FileView)`. Under *Another image…* (line 156), where `versions.length > 1`: a button *Versions* (`figures-versions`, an icon of the set such as `Layers`, `data-figure-versions`) that opens `openMenu` (`src/lib/ui/menu.svelte`) with one item per version: `name` and `figures-version-size` as the label (`${name} — ${size}`; where width is null, the name alone), `checked` for `shown`, `action: () => onversion(file)`.
- `FigureView` (`views.svelte.ts:515-530`): passes `versions: versionsOf(node.attrs.file)` (reactive: the panel is remade on `#again` or reads the store directly; the plainer is to compute when the panel opens and again after `#replace`), and `onversion` → `this.#change({ file: f.hash, extension: fileEnding(f.name).toLowerCase(), name: f.name })` as `#replace` (559) does, then `#again()`. The `alt` attribute of the figure is left as it is.

### 3.3 The pane of a file — `src/lib/files/FilePane.svelte`

- `const copies = $derived(file ? files.files.filter((f) => f.madeFrom === file.hash && f.exists) : [])`; under the *Made from* line (365-372): where any, `files-copies` and each a link `formatRoute({ view: 'files', file: f.hash })`, `data-copies`. `files-made-from` reworded as the words say; remove the key from the other languages' files (`locales/*/files.ftl` but `en` and `nb`) so that they fall back.

### Verify

- `pnpm check`, `pnpm test`; `e2e/figures.mjs` and `e2e/files.mjs` still pass.

Commit: *The versions of a figure's image in its panel, chosen by hand for this document; the copies made from a file in its pane.*

## Stage 4 — the script, the words, the guide, the record

### 4.1 `e2e/image-editing.mjs` (new; the harness as `e2e/file-view.mjs` uses it)

A data directory of its own. `resources/brand/owl.png` taken in (`files_take_in`), its record read (`files_list`: width `W`, height `H`), shown in a side (`__glaukopisViewer.show(hash)`, `show.ts:31`). Then:

1. the bar has *Edit* (`[data-viewer-edit]`); pressed, the row is there (`[data-edit-row]`) and the scroller says editing; the preview `img` has a blob source; *Keep* is disabled;
2. *Turn right* pressed: the box is `H × W` at the fit (read the box's width and height and compare their ratio), the `img`'s `transform` contains `rotate(90deg)`; *Keep* is enabled;
3. the hook sets `brightness: 150` and the `img`'s `filter` contains `brightness(1.5)`; the slider `[data-edit-slider="brightness"]` says 150; its *As it was* pressed, 100 again;
4. *Crop* pressed, the frame is there; the hook sets the crop `{ x: 0, y: 0, width: 0.5, height: 1 }`; the row says *Cut to … of …* with the width half of the turned width;
5. *Keep* pressed: a new file in the listing named `owl (edited).png`, `madeFrom` the owl's hash, width `round(H/2)`, height `W` (turned, then cut to the left half), in the same folder; the owl's record unchanged (same `added`, `width`, `height`, `name`); the side shows the copy (`[data-file-side]` is the copy's hash) and the row is gone; screenshot `image-editing-3-kept`;
6. *Edit* on the copy, the hook sets `flipY: true`, *Keep*: `owl (edited 2).png`, `madeFrom` the **copy's** hash;
7. *Edit* again, the hook sets `contrast: 120`, *Cancel*: the confirm appears (its title), *Leave* pressed, the row is gone, no new file;
8. a project made, a figure of the owl put into a text (as `e2e/figures.mjs` does it, lines 200-235), its panel opened, *Versions* (`[data-figure-versions]`) pressed: the menu lists three names with the owl checked; the first copy chosen: the figure's `data-picture` is the copy's hash; the owl's pane in the files view lists two copies (`[data-copies] a`); screenshot `image-editing-4-versions`.
9. The too-large path is a Rust test (1.2); the script does not make a 50 MB file.

Screenshots `image-editing-1-row`, `-2-crop`, `-3-kept`, `-4-versions`; look at them: the row fits in one or two lines, the shade outside the crop is visible, the kept image is turned and cut as the preview showed.

### 4.2 The words and the languages

- `locales/en/*.ftl` and `locales/nb/*.ftl` as *The words* says; `scripts/prune-locales.mjs` for anything left unused; `e2e/languages.mjs` in Norwegian, which must find no English in the row, the menu and the pane.

### 4.3 The guide — `docs/guide.md`

- *A file in a view* (line 1316): a sub-section *Editing an image*: the button, the six things and that they are all, the sliders in percent with 100 as it is, the crop, that the preview is a lighter copy and the result is made from the full image, that the result is a new file beside the one edited, named with *(edited)*, that the one edited is never changed and no figure follows the copy, that a file over 50 MB is offered a smaller copy, and that an edit not kept is lost with the side.
- *Figures* (line 390): *Versions* in the figure's panel.
- *The files of the library* (line 1175): a copy made from a file, by editing or to be a figure, says what it was made from, and a file says which copies were made from it.

### 4.4 The record

- An addendum to `docs/adr/0071-a-simple-image-editor.md`, *as built*: what departs from the plan, the choices you made alone, the counts.

Commit: *A simple image editor, as built: the script, the words in Norwegian, the guide, the record's addendum.*

## At the end

- Run `e2e/image-editing.mjs`, `e2e/file-view.mjs`, `e2e/figures.mjs`, `e2e/files.mjs`, `e2e/picture-panel.mjs`, `e2e/languages.mjs`, `e2e/as-left.mjs`, `e2e/documents.mjs`; `cargo test -p glaukopis-core -p glaukopis`, `cargo clippy --all-targets`, `pnpm check`, `pnpm test`.
- Report: what was built, stage by stage, with the commits; what was left and why; the choices made alone (how the library's lock is let go during the pixel work, which function of `sides` shows the copy, the shape of `ImageSource` for the preview, anything else); whether the preview and the kept copy look alike on the screenshots, which is the check of the colour formulas, and if not, by how much; the counts of `pnpm check`, `pnpm test`, `cargo test`, `cargo clippy`, and every e2e script with its ok/FAIL counts; the paths of the screenshots to look at.
