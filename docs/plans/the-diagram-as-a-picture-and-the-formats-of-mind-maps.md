# The diagram as a picture, and the formats of mind maps — the build plan

The working plan for `docs/adr/0068-the-diagram-as-a-picture-and-the-formats-of-mind-maps.md`. Read the record first, in full: it says what and why, and what was found out; this says how, in which order, in which files, and how each stage is verified. Where they disagree, the record wins; say so in your report. Read also `.claude/briefs/common.md` (the progress note, the languages, the rules) and `docs/plans/the-shape-of-a-text-and-its-org-form.md`, section "How to work", which holds here too: plain words; never a record number when talking to the owner; verify before you commit; edit then format (batch your edits of a file before `pnpm format` or `cargo fmt`); e2e with `timeout`, processes ended by PID only, never `pkill -f`; commit when a stage is whole, never push; report the counts. Commit at the end of every stage and more often where a stage is long: work that is not committed is lost when the session is. Keep a progress note as `common.md` says. Build the binary and run `cargo test` only in a capped `systemd-run` unit, as `.claude/briefs/fewer-words/common.md` shows (the memory of this machine is shared with the owner's editor).

Read the last section of `docs/brief.md` (2026-10-26): it is the owner's words, and the record is read from them. **Stages 1 and 2 are asked for. Stages 3, 4 and 5 are proposed and await the owner's word: build them only if the owner has said so when you are given this plan.** Nobody answers questions while you build: where something is open, choose the plainer thing, write the choice down in your progress note and your report, and go on.

## The words

Every word the user sees comes through `t('key')` from `locales/en/<part>.ftl` and `locales/nb/<part>.ftl`; write English and Bokmål together, the Bokmål natural and in the same plain voice (`.claude/briefs/words.md` has the glossary; a mind map is *tankekart*, an image *bilde*, the diagram *diagrammet*). Put new keys at the end of the files under a comment naming this plan. Keys other languages lack show English until translated: that is expected; do not touch the other languages' files except to delete keys nothing uses.

Stage 1 and 2, in `diagram.ftl`:

```
diagram-save-svg = Save the diagram as SVG…              | Lagre diagrammet som SVG…
diagram-save-image = Save the diagram as an image…       | Lagre diagrammet som bilde…
diagram-save-svg-title = Save the diagram as SVG         | Lagre diagrammet som SVG
diagram-save-image-title = Save the diagram as an image  | Lagre diagrammet som bilde
diagram-file-svg = SVG                                   | SVG
diagram-file-png = PNG image                             | PNG-bilde
diagram-saved = The diagram was saved as “{ $name }”     | Diagrammet ble lagret som «{ $name }»
diagram-saved-size = The diagram was saved as “{ $name }”, { $width } × { $height } pixels
                                                         | Diagrammet ble lagret som «{ $name }», { $width } × { $height } piksler
diagram-saved-no-fonts = The fonts could not be put into the file: it is shown in the fonts of whoever opens it.
                                                         | Skriftene kunne ikke legges i filen: den vises i skriftene til den som åpner den.
diagram-save-failed = The diagram could not be saved     | Diagrammet kunne ikke lagres
```

Stages 3 to 5, in `home.ftl` (the two file commands speak through `core.ftl`'s existing errors of files; add to `core.ftl` only where none fits):

```
home-mindmap-open = Open a mind map…                      | Åpne et tankekart…
home-mindmap-open-title = Open a mind map                 | Åpne et tankekart
home-mindmap-filter = Mind map (Freeplane, FreeMind, XMind) | Tankekart (Freeplane, FreeMind, XMind)
home-mindmap-open-failed = The mind map could not be opened | Tankekartet kunne ikke åpnes
home-menu-save-mindmap = Save as a mind map…              | Lagre som tankekart…
home-mindmap-save-title = Save the project as a mind map  | Lagre prosjektet som tankekart
home-mindmap-filter-freeplane = Freeplane and FreeMind    | Freeplane og FreeMind
home-mindmap-filter-xmind = XMind                         | XMind
home-mindmap-filter-opml = OPML                           | OPML
home-mindmap-saved = “{ $name }” was saved as a mind map  | «{ $name }» ble lagret som tankekart
home-mindmap-save-failed = The project could not be saved as a mind map | Prosjektet kunne ikke lagres som tankekart
home-mindmap-left-out = … (one message per thing left out, with counts: images, clouds, summaries, boundaries, hyperlinks, icons not known; see stage 3)
home-mindmap-not-a-map = “{ $name }” is not a mind map of Freeplane, FreeMind or XMind. | «{ $name }» er ikke et tankekart fra Freeplane, FreeMind eller XMind.
```

## Stage 1 — the diagram as SVG

**What is built.** A module that writes the diagram on the screen as an SVG, a command of the core that writes bytes to a path, the menu item, the message, an e2e script.

### 1.1 The core: `file_write` — `src-tauri/src/commands/system.rs`, `src-tauri/src/lib.rs`, `src/lib/api/system.ts`

- `file_write(request: Request<'_>)`: a raw request as `project_file_write` takes (`with_head` in `commands/projects.rs`), the head `{ path: String }`, the body the bytes. Write with the core's `write_atomic` (`fsutil`). Refuse an empty path and a path that is a directory, with the core's error kinds, so that the message to the user says what went wrong (record 0052). Register it in `lib.rs` beside the other commands of `system`.
- In `api/system.ts`: `fileWrite(path: string, bytes: Uint8Array): Promise<void>`, built with `withHead` (move `withHead` from `api/projects.ts` into `api/backend.ts` or a small `api/bytes.ts`, and import it in both places; do not copy it).

### 1.2 The shapes of the diagram — `src/lib/project/diagram/picture.ts`

Design it in two halves, so that stage 2 can draw the same shapes on a canvas if it must:

```ts
export type Shape =
  | { kind: 'rect'; x; y; w; h; rx; fill; stroke; strokeWidth; opacity?; clip?: string }
  | { kind: 'path'; d: string; stroke; strokeWidth; dash?: string; cap?: string; fill?: string; opacity? }
  | { kind: 'text'; x; y; runs: TextRun[]; opacity? }        // y is the baseline
  | { kind: 'icon'; x; y; w; h; svg: string; colour: string; opacity? }  // the inner markup of a lucide svg, viewBox 0 0 24 24
  | { kind: 'group'; opacity: number; shapes: Shape[] };
export interface TextRun { text: string; family: string; size: number; weight: number; italic: boolean; smallCaps: boolean; shift: 'none' | 'sup' | 'sub'; colour: string }
export interface Picture { width: number; height: number; background: string; shapes: Shape[]; fonts: FontFace[]; title: string }
export function shapesOf(diagram: HTMLElement, options: { margin: number }): Picture
export function toSvg(picture: Picture): string
export async function fontsFor(picture: Picture): Promise<EmbeddedFont[]>   // see 1.3
```

`shapesOf` reads the DOM of one `.diagram`:

- **Coordinates.** `div.world` has width and height 0 and stands at the world's origin: its `getBoundingClientRect()` gives the origin on the screen, and the camera's scale `k` is read from the diagram (pass it in, or read `--k` which you set on `.world` for this purpose). Every screen rectangle `r` becomes `{ x: (r.left - origin.x) / k, y: (r.top - origin.y) / k, w: r.width / k, h: r.height / k }`. The picture's bounds are the union of every box drawn plus the margin; shift everything so that the top left is the margin.
- **The background**: the computed `background-color` of `.diagram`.
- **Lines and curves** from `svg.lines`: every `line.branch` and every `g.association path.curve`, with the computed `stroke`, `stroke-width`, `stroke-dasharray`, `stroke-linecap` and `opacity`; skip `.link-hit`, `.to-card`, `.band`, `.pending`. Their coordinates are already the world's.
- **The words of associations**: every `.link-label` that is not `.editing`: a rect of its computed background, border and radius, and a text of its computed font.
- **The boxes**: every `.node[data-node]`, in the order of the DOM (parents before children): a rect of the box's rect with the computed `background-color`, `border-color`, `border-top-width` and `border-radius`; where the computed `opacity` is below 1 (left out), the whole as a group with that opacity. Where the node is `.kinded`, a 4-pixel rect at its left edge in the colour of `--kind` as computed (`getComputedStyle(node).getPropertyValue('--kind')`), clipped to the rounded box (`clip` names a `clipPath` that `toSvg` writes). No shadows.
- **The name**: `.caption .name` (or the `.rename` editor's text where a name is being written: skip the picture in that case and tell the user to finish first; simpler: the menu is not reachable while renaming). Break it into lines as the browser did: for every text node under `.name`, split the text into tokens of words and of spaces; for each word make a `Range` and take its first client rect; words whose rects' tops lie within 1 pixel belong to one line. For each line one `text` shape at `x` = the leftmost word's left and `y` = that word's top + the font's ascent (measure the ascent once per computed font with a canvas `measureText('x').fontBoundingBoxAscent`, which WebKit, Chromium and WebView2 all give; cache by the font string). Within the line, one `TextRun` per run of words with the same style, the spaces kept between them (`xml:space="preserve"` on the `text`); the style read from the computed style of the word's parent element: `font-family`, `font-size`, `font-weight`, `font-style: italic`, `font-variant-caps: small-caps` (the `.smallcaps` span), and `sup`/`sub` from the element's tag. Do not place words one by one: place lines, and let the renderer set the words in the embedded font, so that the file stays editable text.
- **The marks**: every `.marks .mark` that is not `.comments` and whose computed opacity is not 0: its icon (`svg` child: the inner markup, with `currentColor` resolved to the computed `color`) as an `icon` shape at the icon's rect; its text (the count of words) as a `text` shape; the status dot (`.dot`) as a circle: a `path` of a circle with the computed border colour and, for draft and done, its fill (read `background` and draw a half circle for the draft's gradient: two paths).
- **The fold badge**: every `.fold.folded` (the unfolded one is invisible unless hovered: skip anything whose computed opacity is 0 or `visibility` hidden): a rect with its computed background, border and radius, and its text.
- **Skipped**: `.corner`, `.link-handle`, `.others`, `.card`, `.mark.comments`, the `.band`, the hover tooltip, everything outside `.world`.
- **The title** of the picture: the name of the element in view (the `.node.root`'s text).

`toSvg` writes `<svg xmlns="http://www.w3.org/2000/svg" width height viewBox role="img" aria-label="…">`, a `<title>`, `<defs>` with the `<style>` of the fonts and the `clipPath`s, a background `<rect>`, then the shapes in order. Text runs become `<tspan>` with `font-style`, `font-variant="small-caps"`, `baseline-shift="super"`/`"sub"` with `font-size` at 75 % for raised and lowered. Escape text and attributes (`&`, `<`, `>`, `"`); round numbers to a tenth. Fonts are named as the page names them (`'Literata Variable', 'Literata', Georgia, serif`), so that a reader without the embedded fonts still falls back sensibly.

### 1.3 The fonts — in `picture.ts` (or `fonts.ts` beside it)

- Walk `document.styleSheets` and their `CSSFontFaceRule`s (skip sheets that throw on `cssRules`). Keep those whose `font-family` is one the picture's runs use (strip the quotes) and whose `font-style` matches a run (upright, italic) and whose `unicode-range` meets a character of the picture's text (parse `U+0000-00FF, U+0131, U+1F??` into ranges; a rule without a range covers everything). Fetch each `src` `url(...)` (the first `url`, which Vite has rewritten to the bundle's own asset), read it as bytes, base64 it, and write `@font-face { font-family; font-style; font-weight: <the rule's range>; src: url(data:font/woff2;base64,…) format('woff2'); }`. Cache fetched files for the session.
- Where no rule is found or a fetch fails, return what was found and a flag `incomplete`; the SVG is written all the same, and the message adds `diagram-saved-no-fonts`.
- A unit test of the range parser and of the choosing by characters (`picture.test.ts`): Latin text picks the Latin file of Literata and no Greek one; a Greek name picks Greek; italics pick the italic file only where a run is italic.

### 1.4 The diagram — `MapDiagram.svelte`, `DiagramNode.svelte`

- A state `picturing` on the diagram, true while the picture is read. While it is true, the boxes get `selected={false}`, `target={false}`, `lifted={false}`, and the association `.selected` class is off, so that the picture shows no selection. Set it, `await tick()`, wait one `requestAnimationFrame`, read the shapes, unset it.
- `savePicture(kind: 'svg' | 'png')`: read the shapes, then the fonts, then `toSvg` (stage 2 adds the PNG), then ask where with `save` from the dialog plugin (`title: t('diagram-save-svg-title')`, `defaultPath` = `safeFileName(name of the element in view, t('project-untitled')) + '.svg'`, filter `{ name: t('diagram-file-svg'), extensions: ['svg'] }`), then `fileWrite`, then `notifyOk(t('diagram-saved', { name }))` (with `diagram-saved-no-fonts` appended where the fonts were incomplete); errors through `notifyError(t('diagram-save-failed'), e)`. Nothing is written when the dialog is cancelled.
- The two items in `oncontextmenu`'s menu of the background, after a separator following *Tidy the whole map*. Disabled while a name is being written or an element dragged.

### 1.5 The guide — `docs/guide.md`, *The diagram*

A short paragraph after *How far the writing has come*: **Save the diagram as SVG…** and **Save the diagram as an image…**, in the menu of the background, write the map as it stands, folded as it is folded, in the colours of your theme, named after the element in view; the SVG keeps the names as text and carries its fonts; the image is a PNG at twice the size of the screen. One sentence each; no help texts in the interface.

### Verify

- `pnpm check`, `pnpm test` (the new unit tests among them), `cargo test -p glaukopis` in a capped unit for the command's compile, `pnpm exec prettier --write` on the files changed.
- `e2e/diagram-picture.mjs`, new, in the style of `e2e/maps.mjs`: make a project; add elements under and after with the keys and type names, one in italics (select the word in the name editor and press Ctrl+I, or write the name through the rename editor and apply the mark as the editor's tests do), one with a kind and a status from the menu, one folded (Tab), one association with words (menu, *Associate with…*, a label by double-clicking the curve); zoom out once, so that the camera's scale is not 1. In the page, wrap `window.__TAURI_INTERNALS__.invoke` so that `plugin:dialog|save` returns a path under the data directory and everything else passes through. Right-click the background, click *Save the diagram as SVG…*, wait for the message. In Node: the file exists; it holds no `foreignObject`; it holds every name typed, a `<tspan` with `font-style="italic"`, a `stroke-dasharray` (the association), the association's words, at least one `@font-face` with `data:font/woff2`, a `clipPath` (the kind). Then show it: inject `<img src="data:image/svg+xml;base64,…">` into the page over the diagram at the picture's size, screenshot `diagram-picture-1-svg` next to a screenshot of the diagram itself, and look at both: the lines must meet the boxes, the words must stay inside their boxes, the italics must be italics. Set the theme to dark (`app.setTheme('dark')`), save again, check that the background colour of the file differs from the light one. Run `e2e/languages.mjs` for Norwegian.
- Open the file in a browser's `file://` tab if one is available in the harness's Xvfb; if not, the `<img>` check stands.

Commit: *The diagram saved as SVG, drawn from the screen with its fonts.*

## Stage 2 — the diagram as an image

### 2.1 The PNG — `src/lib/project/diagram/picture.ts` (or `raster.ts` beside it)

- `toPng(picture: Picture, svg: string, scale: number): Promise<{ bytes: Uint8Array; width: number; height: number }>`: an `Image` with a `Blob` URL of the SVG (`type: 'image/svg+xml'`), `await img.decode()`, a canvas of `width × scale` by `height × scale`, fill with the background, `drawImage`, `canvas.toBlob('image/png')`, bytes; revoke the URL. The scale is 2, lowered to `Math.floor(16384 / Math.max(width, height) * 10) / 10` where either side would exceed 16384, and never below 0.5 (a map larger than that is saved as SVG alone, with a message: add `diagram-too-large-for-image` — *The map is too large for an image: save it as SVG.*).
- **Settle the engine first.** Before building further, in the harness (WebKitGTK is the engine most likely to refuse): draw a small SVG with an embedded data font and a `<text>` on a canvas and read `toDataURL`. If it throws a security error, or the text is drawn in a fallback font (compare the width of a word to the width in the page), then write `drawShapes(ctx, picture, scale)` that draws the `Shape` list on the canvas directly, with `ctx.font` from each run (the page's fonts are available to a canvas of the page), `ctx.fontVariantCaps = 'small-caps'` where supported and upper-case letters at 80 % where not, raised and lowered by moving the baseline, `setLineDash` for the dashes, `Path2D` for the icons' paths scaled from 24 to their size; and use it for the PNG, keeping the SVG as it is. Write what you found in the progress note and the report.

### 2.2 The diagram — `MapDiagram.svelte`

- *Save the diagram as an image…*: the same as the SVG with `.png`, filter `diagram-file-png`, and the message `diagram-saved-size` with the pixel size.

### Verify

- `e2e/diagram-picture.mjs` grows: *Save the diagram as an image…*, the PNG's header read in Node (bytes 16–23: width and height) equals the SVG's size times the scale; the PNG shown in the page as an `<img>` and screenshotted as `diagram-picture-2-png`; look at it beside the SVG: the same picture, sharp.
- The guide's paragraph, if stage 1 left the image for here.

Commit: *The diagram saved as a PNG image at twice its size.*

Stages 1 and 2 are the owner's request. Stop here and report unless the owner has said to build the formats.

## Stage 3 — Freeplane and FreeMind, in and out (if the owner says so)

### 3.1 The text as HTML, and back — `src/lib/mindmaps/html.ts`

- The page writes a text as HTML already: `blocksHtml` in `project/model/html.ts` (the text view's HTML, with the citations as their words through `citationLabel`, the notes, lists, quotations, tables, figures as `<figure>` with a `data-picture`). Do not write a second one. `notesHtml(blocks: Block[], language: string | null): string` takes `blocksHtml`'s output and makes it plain enough for another program: parse it with `DOMParser`, drop every `data-` attribute and class, turn `span.citation` into its text, a `<figure>` into a `<p><em>` of its caption (the picture itself does not cross: count it in `LeftOut`), the markup of a note into its text in square brackets where it stands, a `.smallcaps` span into `<span style="font-variant: small-caps">`, and serialise the body. Count in a `LeftOut` record what had no form (pictures, equations beyond their source), for the caller to tell.
- `htmlToBlocks(html: string): Block[]`: parse the HTML with ProseMirror's `DOMParser.fromSchema(schema)` as `editor/clipboard.ts` does, write the document into a scratch `Y.XmlFragment` with `prosemirrorToYXmlFragment` of y-prosemirror (`y-prosemirror/src/lib.js` exports it), and read `Block[]` back with `readBody` of `project/model/text.ts`, so that the shapes are exactly the model's. Plain text (no tags) becomes one paragraph per line, blank lines parting paragraphs.
- Tests: a round trip of blocks of every grouping and mark through `notesHtml` and `htmlToBlocks` keeps the words and the marks; a citation comes out as its words; plain text is parted into paragraphs.

### 3.2 Freeplane — `src/lib/mindmaps/freeplane.ts`

- `readFreeplane(xml: string): { name: string; carried: Portable; leftOut: LeftOut }`, using the browser's `DOMParser` (`text/xml`). Accept `<map version="1.0.1">` (FreeMind), `<map version="freeplane …">` and `<map>` with no version. Nodes: `TEXT`, or `richcontent TYPE="NODE"`'s HTML body read into inlines with the four marks of a name (`<i>`/`<em>` italics, `font-variant: small-caps`, `<sup>`, `<sub>`; the rest flattened to text); `richcontent TYPE="NOTE"` → `htmlToBlocks`; `FOLDED="true"` → `collapsed`; `POSITION` on first-level nodes → the `side` fact; icons `idea`/`pencil`/`button_ok` → status (other icons counted as left out); `<attribute NAME="Kind" VALUE>` → a kind of the project (made once per name in `carried.kinds`, colour from the node's `<edge COLOR>` where it has one, else none), *Time* → `when` where it parses as the model's `When` (else left out and counted), *Left out* → `excluded`; `<arrowlink DESTINATION … MIDDLE_LABEL>` → `carried.links` with the ids mapped (`ID` attributes to new ids; an arrowlink to an unknown id is counted as left out); `<cloud>`, `<hook>` (images, summaries), `LINK` hyperlinks counted as left out. The map's root node is the project: its text is the `name`, its children the topmost `carried.elements`; its own note, where it has one, becomes the first element's text? No: the project element itself can have text — keep it as the root's text, which `makeFromMindMap` writes into the project's own element.
- `writeFreeplane(name: string, root: { name: Inline[]; text: Block[] }, carried: Portable, refs): string`: `<map version="freeplane 1.9.0">`, the root `<node TEXT ID="ID_1" CREATED MODIFIED>`, children nested, `ID_n` sequential with a table from the project's ids; `TEXT` as plain words always, and `richcontent TYPE="NODE"` beside it where the name has marks; `richcontent TYPE="NOTE"` with `<html><head/><body>…</body></html>` where there is text; `FOLDED`, `POSITION` from the `side` fact on first-level nodes; `<icon BUILTIN>` for status; `<attribute NAME="Kind" VALUE>` and `<edge COLOR>` for a kind (the kind's ink colour as hex), *Time*, *Left out*; `<arrowlink DESTINATION STARTARROW="None" ENDARROW="None" MIDDLE_LABEL>` on the `from` node for every link whose ends both exist. Escape attributes. Pretty-print with newlines and two spaces, as Freeplane does, so that diffs are readable.
- Fixtures in `src/lib/mindmaps/fixtures/`: a Freeplane 1.11 map written by hand after the format (nested nodes, a folded one, rich name, a note with a list and italics, the three icons, attributes, an arrowlink with a label, a cloud, an image hook, a hyperlink) and a FreeMind 1.0.1 map (plain). Tests: read → the `Portable` expected, the `leftOut` counts; write → read gives back the same; a project of the e2e fixtures written and read keeps names, texts (as paragraphs), facts and links.

### 3.3 The core: `file_read`, and the files dropped — `commands/system.rs`, `api/system.ts`, `drops.ts`

- `file_read(path) -> Response(bytes)`, bounded at 50 MB (the bound of documents brought in), with the core's errors (not found, too large, not readable). `fileRead(path): Promise<Uint8Array>` in `api/system.ts`.
- Where dropped documents become projects (`fromDocument` with `dropped`, found through `drops.ts` and `project-actions.svelte.ts`), a dropped `.mm` or `.xmind` goes to `makeFromMindMap` instead. `.opml` stays a document, as today.

### 3.4 The project made and saved — `src/lib/home/mindmap-file.ts`, `project-actions.svelte.ts`

- `makeFromMindMap(path): Promise<Made | null>` as `makeFromOrg` in `org-file.ts`: read the bytes, tell the kind by the ending (and, failing that, by the first bytes: `PK` is a zip, `<map` is Freeplane), read, `new Project(null)`, write the root's name and text into the project's own element (`writeName`, `writeBody` of `model/blocks.ts`), `makePortable(project, carried, { under: root })`, the name made free with `freeName`, then `make(...)` as Org does; close the scratch project on failure. Where `leftOut` has counts, say them after the project opens in one message, as a document brought in says its remarks (`notifyOk` with the lines, or the remarks dialog the import uses if it is reachable).
- `saveAsMindMap(p: ProjectInfo, here = false)` beside `saveAsOrg`: `save` with three filters (`home-mindmap-filter-freeplane` `['mm']`, `home-mindmap-filter-xmind` `['xmind']`, `home-mindmap-filter-opml` `['opml']`), the project read as `writeOrgFolder` reads it (`read(info)`, flushed where open, `withLibraryRecords`), `portable(project, children of the root)` plus the root's own name and text, the writer by the ending (an unknown ending: `.mm`), `fileWrite`, the message.
- The items: `home-mindmap-open` in `newMenu` after *Open an Org file…* with the `FileText` icon; `home-menu-save-mindmap` in the project's menu after *Save as Org…*. Both disabled while `filing`.

### 3.5 The guide — *Keeping things safe*, after *Your project as Org*

*Your project as a mind map*: what crosses (the table of the record, in prose, short), what does not, that Freeplane's file is what other programs read, and that a map of another program is opened with **Open a mind map…** or dropped on the list.

### Verify

- `pnpm check`, `pnpm test`, the capped `cargo test -p glaukopis`.
- `e2e/mindmaps.mjs`, new: the fixture Freeplane map copied into the data directory, the save dialog stubbed as in stage 1 (`plugin:dialog|open` returning its path); *+* → *Open a mind map…*; the project opens with the names of the fixture in the diagram, the folded one folded, the association's words shown; the message of what was left out appears. Then the project's menu → *Save as a mind map…* with a `.mm` path; the file read in Node: well-formed XML (`fast-xml-parser` is not a dependency: check with a strict regex of the root and a count of `<node`), the names present, an `arrowlink` with `MIDDLE_LABEL`. Open the written file again as a new project and compare the names of the two diagrams. Screenshots `mindmaps-1-opened`, `mindmaps-2-reopened`. `e2e/languages.mjs`.

Commit: *Mind maps of Freeplane and FreeMind opened as projects, and projects saved as them.*

## Stage 4 — XMind, in and out (if the owner says so)

### 4.1 The core: zip in and out — `commands/system.rs` (or `commands/zips.rs`), `api/system.ts`

- `zip_read(path) -> Vec<{ name, text }>` of the text entries only (`.json`, `.xml`), each bounded at 50 MB and the file at 200 MB, with the `zip` crate the core has; `zip_write(path, entries: Vec<{ name, text }>)`, deflated, written atomically. `zipRead`, `zipWrite` in `api/system.ts`.

### 4.2 XMind — `src/lib/mindmaps/xmind.ts`

- `readXmind(entries): { name; carried; leftOut }`: `content.json` where present (an array of sheets: `rootTopic` with `title`, `children.attached`, `children.detached`, `notes.realHTML.content` or `notes.plain.content`, `markers[].markerId`, `labels[]`, `branch === 'folded'`; `relationships[]` with `end1Id`, `end2Id`, `title`), else `content.xml` (namespace `urn:xmind:xmap:xmlns:content:2.0`: `sheet/topic/title`, `children/topics[@type='attached']/topic`, `notes/html` or `notes/plain`, `marker-refs/marker-ref/@marker-id`, `labels/label`, `@branch`, `relationships/relationship[@end1,@end2]/title`). One sheet: its root topic is the project; several: each sheet an element under the project, named by the sheet's title, its root topic's children under it (the root topic's own title becoming that element's name where the sheet has none). Detached topics under the sheet's root. Markers: `task-done` → done, `task-start` → idea, any other `task-*` → draft; a label *Time: …* → `when`, *Left out* → `excluded`, any other label → the kind by that name. Boundaries, summaries, images (`image`), hyperlinks (`href`) counted as left out.
- `writeXmind(name, root, carried, refs): entries`: `content.json` (one sheet, `class: "sheet"`, `rootTopic` with `class: "topic"`, ids as the project's, `children.attached`, `notes` with both `plain` and `realHTML`, `markers`, `labels`, `branch: "folded"`, `relationships`), `content.xml` with the same (so that XMind 8 reads it), `metadata.json` (`{"creator":{"name":"Glaukopis","version":"<app version>"}}`), `manifest.json` (`{"file-entries":{"content.json":{},"metadata.json":{}}}`), `META-INF/manifest.xml` naming `content.xml` and `meta.xml`, `meta.xml` minimal.
- Fixtures: an XMind 2020 `content.json` and an XMind 8 `content.xml`, hand-written after the formats, with notes in both forms, markers, labels, a folded branch, a relationship with a title, a detached topic, two sheets. Tests as in stage 3; `.xmind` added to the open dialog's filter and the drops; the save's filter already offers it.

### Verify

- `e2e/mindmaps.mjs` grows: the XMind fixture zipped in the script (Node's `zlib` and a hand-made zip, or write it with `zip_write` through `__TAURI_INTERNALS__.invoke`), opened, saved, reopened; screenshots `mindmaps-3-xmind`.

Commit: *Mind maps of XMind opened and saved.*

## Stage 5 — OPML out (if the owner says so)

- `src/lib/mindmaps/opml.ts`: `writeOpml(name, root, carried, refs): string`: `<opml version="2.0"><head><title>name</title></head><body><outline text="…" _note="…">…</outline></body></opml>`, the names as plain words, the text as plain paragraphs parted by blank lines in `_note` (from `notesHtml` turned to text, or a small `blocksToText`), nested. Nothing else: OPML has no more.
- Verify: a project saved as OPML, then brought in with *A project from a document…* (Pandoc reads OPML): the names come back as elements, the notes as their text. A unit test of the writer; `e2e/mindmaps.mjs` grows by the round trip.

Commit: *Projects saved as OPML.*

## At the end

- Run every e2e script this plan names, and `e2e/maps.mjs`, `e2e/tree-keys.mjs`, `e2e/documents.mjs`, `e2e/list.mjs`, to see that the diagram, the menus and the list are as they were.
- The guide's passages written (stages 1, 2; 3 if built). `scripts/prune-locales.mjs` if keys were removed.
- Add an addendum to the record, *as built*, naming what departs from the plan and the choices you made alone.
- Report: what was built, what was left, the engine's answer of stage 2.1, the counts of `pnpm check`, `pnpm test`, `cargo test`, and every e2e script with its ok/FAIL counts; the paths of the screenshots to look at.
