# 0071 — A simple image editor

Date: 2026-10-28. Status: accepted by the owner on 2026-10-28 ("Make the plan so I can give it to Opus 5.5"), from their wish for a simple image editor (turns, cropping, brightness, contrast and saturation), an assessment that found most of the groundwork there, and their resolutions (an edit never changes a figure by itself, since an image may be a figure in many documents and an edit made for one would be wrong in the others; the writer swaps by hand; no limit that is not necessary; the source of a copy is the image it was made from, whether that is a copy or not); to be built from `docs/plans/a-simple-image-editor.md`. Builds on 0069 (a file in a view: the editor lives in the side that shows an image) and 0070 (one place for files: the copy is a file of the library, made from another, as the copies made to be figures are).

## Context

The owner wants to turn, crop and adjust an image without leaving the application: a scan that lies on its side, a photograph with a margin to cut away, a plate too dark to read. Nothing more: no selection, no retouching, no levels or curves. What was found:

- **The pixel work is there.** The core depends on the `image` crate (0.25, `crates/core/Cargo.toml`), which decodes and encodes every kind the library takes (PNG, JPEG, GIF, WebP, TIFF, BMP), turns by quarters, flips, crops and resizes. `crates/core/src/library/figures.rs` decodes a file with its orientation tag applied (`decode`, line 167), encodes a JPEG at quality 93 or a PNG (`encode`, 178), measures (`measure`, 210), makes a lighter copy no wider than a width (`lighter`, 298), and names a copy after its source (`shown_name`, 316). Brightness, contrast and saturation are not in the crate in the form the browser has them; they are a few lines over the pixels.
- **A copy made from a file is a known thing.** `Library::for_figure` (`crates/core/src/library/mod.rs:958`) stores prepared bytes as a file of their own through `attachments::store_bytes`, in the same folder, named after the original, with `made_from` set to the original's hash, measured, with the original's alternative text, recorded once; a file the library has by the same hash is that file. The pane of a file shows what it was made from as a link (`src/lib/files/FilePane.svelte:131,365`). The source is never changed.
- **The viewer shows an image in a side.** `src/lib/viewer/FileSide.svelte` shows an image through `ImageView.svelte` as one page, fitted or at a zoom, about the pointer; its bar, `ViewerBar.svelte`, holds the page and the zoom and nothing of a map. The side's spec is `FileSide` in `src/lib/project/sides.svelte.ts:33` (file, page, zoom), kept with the window.
- **A figure names its file by hash** (`src/lib/editor/schema.ts:674`, attrs `file`, `extension`, `name`). The panel of a figure (`src/lib/figures/FigurePanel.svelte`) has *Another image…*, which asks for a file of the computer (`choosePicture`, `src/lib/figures/views.svelte.ts:376`) and changes the figure's attributes (`#replace`, 559). The projects in which an image is a figure are known from each project's summary (`figuresIn`, `src/lib/files/store.svelte.ts:395`).
- **The browser previews for free.** WebKit's `filter: brightness() contrast() saturate()` and a `transform` on the image give a live preview while a slider moves, without a round trip. The formulas of the filter functions are given in Filter Effects Module Level 1, so Rust can do the same to the pixels; the preview and the result agree when both follow them.
- **A limit exists already.** A file larger than 50 MB is refused as a figure (`figures::MAX_BYTES`, `too_large`); the owner has asked for no limit beyond what is necessary.

## Decision

### What an edit is

- **Six things, and no more**: turning by quarters, left and right; flipping sideways and upside down; a crop, a rectangle drawn over the image; brightness, contrast and saturation, each a slider from 0 to 200 % with 100 % the image as it is. Applied in that order: turns, then flips in the turned frame, then the crop in the frame that shows, then the colours; brightness before contrast before saturation, as the browser applies them when they are written so.
- **The colours follow the browser's formulas** (Filter Effects Module Level 1, the shorthand functions, on the stored sRGB values): brightness multiplies each channel; contrast stretches each channel about the middle; saturation mixes the channels by the matrix the specification gives, with the weights 0.213, 0.715, 0.072. What the preview shows is what is kept.
- **The result is a new file of the library**, beside the one edited, in its folder, named after it with *edited* before the ending (*plate.jpg* becomes *plate (edited).jpg*, and that edited again *plate (edited 2).jpg*), measured, with the source's alternative text, and `made_from` the hash of the file that was in view, whether that was an original or a copy. A JPEG is kept as a JPEG at the quality figures use; everything else as PNG, as a figure's copy is; an animated GIF by its first frame. The bytes are stored once: an edit whose result the library already holds is that file. **The source is never changed**, and nothing is removed.
- **No figure follows the copy by itself.** The side that showed the source shows the copy once it is kept; every figure goes on showing the file it names.

### Where it is, and how it looks

- **In the side that shows an image** (0069): a button *Edit* in the viewer's bar, for an image that has pixels, not a drawing. Pressed, a row of controls opens under the bar: the four turning and flipping buttons, *Crop*, the three sliders with their percent and a reset each, *Start again*, and at the end *Keep as a new file* and *Cancel*. The image stays where it is, zoomed as before, and shows every change at once. *Crop* lays a rectangle with handles over the image, the outside shaded, and the row says the size it cuts to in pixels; the rectangle begins as the whole image.
- **Escape or *Cancel* leaves editing**; where something has been changed, it asks first. Editing is not kept with the window: closing the side or the application loses an edit not kept.
- **The preview works on a lighter copy.** While editing, the side shows the image no larger than 2400 pixels on its longer side, upright, made by the core when editing begins and not kept; an image smaller than that is shown as it is. The settings are in fractions and percents, so they mean the same on the copy and on the full image. *Keep* applies them to the full image in Rust.
- **No limit that is not necessary.** An image of any size under the limit figures have is edited in full. A file larger than 50 MB is refused with the words figures use, and the refusal offers to make a smaller copy: the image scaled so that its longer side is 4000 pixels, kept as a file made from it, named with *smaller* before the ending; the side then shows the copy, and editing begins on it.

### The swap, by hand, one step at a time

- **The panel of a figure** gains *Versions*, under *Another image…*: a menu of the files of the library that are the figure's image, its source, its source's source up to the original, and every copy made from any of them, each with its name and its size in pixels, the one shown marked. Choosing one makes the figure name that file, in this document and nowhere else. A figure whose image has no versions shows no menu.
- **The pane of a file** says, besides what it was made from, which copies were made from it, each a link; the line *Made to be a figure, from* becomes *Made from*, since a copy is now made for two reasons and the record does not say which.
- **The picture panel of a project** is unchanged: the copies are images of the library and appear in it as every image does.

## Choices made in writing this, which the owner has not been asked about

1. The editing row lives in the side, under the viewer's bar, not in a dialog: the image needs the room and the zoom.
2. The sliders run from 0 to 200 %, with 100 % as it is, rather than −100 to +100: the browser's functions are percents, and the number says what is done.
3. The lighter copy for the preview is 2400 pixels on its longer side; the smaller copy offered for a file over 50 MB is 4000.
4. The name of a copy is the source's with *(edited)*, counted up where that name is taken; the writer renames it in the pane as any file.
5. Escape and *Cancel* ask only where something was changed.
6. No aspect lock on the crop and no straightening by degrees: the first is a small thing to add later, the second needs resampling the `image` crate does not do.
7. The edit runs in the application's process, not in the child that reads PDFs: the decoders are the `image` crate's own, in Rust, and bounded by the file's size.

## Why not otherwise

- **Not a figure that follows the copy.** The owner's reason: an image may be a figure in many documents, and an edit made for one would be wrong in the others. The writer chooses, and the choice is one step where the figure is.
- **Not a copy made in place of the file.** Files are kept by their hash; a changed file is a new file. Keeping the source costs nothing and is the undo.
- **Not the thumbnail for the preview.** At 480 pixels a crop cannot be placed; a lighter copy at 2400 is placed exactly enough and still cheap to filter.
- **Not a limit of the editor's own.** A merely big scan keeps its resolution for print; only what a figure cannot hold anyway is refused, and then with a way on.
- **Not the `image` crate's own `brighten` and `contrast`.** They add and stretch by other formulas than the browser's; the preview would lie.

## Consequences

- `crates/core/src/library/figures.rs` gains the edit (its settings, the turns, flips, crop and colours over a `DynamicImage`, the preview and the smaller copy); `mod.rs` gains `Library::edited` and `Library::smaller_copy`, beside `for_figure`; `core-pictures.ftl` gains the words *edited* and *smaller* and the refusal's offer.
- `src-tauri/src/commands/files.rs` gains the commands of editing (the facts, the preview, the keeping, the smaller copy); the contract follows.
- `src/lib/viewer/` gains the editing row and the crop over the image; `ImageView.svelte` learns to show an image with a transform and a filter; `ViewerBar.svelte` the button; `FileSide.svelte` the state of editing and what follows keeping.
- `src/lib/figures/FigurePanel.svelte` and `views.svelte.ts` gain *Versions*; `src/lib/files/FilePane.svelte` the copies made from a file.
- The guide's section *A file in a view* gains the editing; *The files of the library* the copies; `viewer.ftl`, `figures.ftl`, `files.ftl` the words, in English and Bokmål.
- Nothing of the model of a document changes: a figure names its file by hash and extension as before.
