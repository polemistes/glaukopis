# One place for files — the build plan

The working plan for `docs/adr/0070-one-place-for-files.md`. Read the record first, in full: it says what and why, and what was found; this says how, in which order, in which files, and how each stage is verified. Where they disagree, the record wins; say so in your report. Read also `.claude/briefs/common.md` (the progress note, the languages, the rules) and `docs/plans/the-shape-of-a-text-and-its-org-form.md`, section "How to work", which holds here too: plain words; never a record number when talking to the owner; verify before you commit; edit then format (batch your edits of a file before `pnpm format` or `cargo fmt`); e2e with `timeout`, processes ended by PID only, never `pkill -f`; commit when a stage is whole, never push; report the counts. Commit at the end of every stage and more often where a stage is long: work that is not committed is lost when the session is. Keep a progress note as `common.md` says. Build the binary and run `cargo test` only in a capped `systemd-run` unit, as `.claude/briefs/fewer-words/common.md` shows (the memory of this machine is shared with the owner's editor); `pnpm e2e:build` the same way.

Read the last section of `docs/brief.md` (2026-10-27, *one place for files*): it is the owner's words, and the record is read from them. Nobody answers questions while you build: where something is open, choose the plainer thing, write the choice down in your progress note and your report, and go on. The record's "Choices made in writing this" lists what the owner has not been asked about; build to the record. Never read or write `~/.local/share/glaukopis`: the migration is tried on data directories of the tests alone.

## Vocabulary

- *The store*: the library's store of files, `library/attachments/<2>/<hash>/<name>` with its record `library/files.json` (`crates/core/src/library/attachments.rs`, `files.rs`, `mod.rs`). After this plan it holds the images too.
- *The store of pictures*: `pictures/files/<hash>.<ext>` with `pictures/pictures.json` (`crates/core/src/pictures.rs`). It goes.
- *An image*: a file of the store whose kind is `picture`. *A figure*: an image as it stands in a text, naming its file by hash and extension (`figure` node, `src/lib/editor/schema.ts:674`).
- *A thumbnail*: a picture 480 wide of an image, or of the first page of a PDF, kept for good as `library/small/<hash>.png`.
- *Prepared*: what the store of pictures did to every picture taken in: GIF, WebP, TIFF and BMP made PNG, a JPEG turned upright by its orientation tag (`prepared` in `pictures.rs:183`). After this plan it is done only when an image becomes a figure, and makes a file of its own.

## The words

Every word the user sees comes through `t('key')` from `locales/en/<part>.ftl` and `locales/nb/<part>.ftl`; write English and Bokmål together, in the same plain voice (`.claude/briefs/words.md` has the glossary). New keys go at the end of their files under a comment naming this plan. Keys that nothing uses any more are deleted from every language's file (`scripts/prune-locales.mjs` helps); `pictures.ftl` goes in every language when the images view goes, its surviving keys moved to `files.ftl` under new names. No help texts: the labels speak for themselves.

```
files.ftl
files-as-list = List                                       | Liste
files-as-grid = Thumbnails                                 | Miniatyrer
files-size-small = Small                                   | Små
files-size-medium = Medium                                 | Middels
files-size-large = Large                                   | Store
files-include-subfolders = Include subfolders              | Ta med undermapper
files-sort = Sort by                                       | Sorter etter
files-sort-name = Name                                     | Navn
files-sort-kind = Kind                                     | Type
files-sort-added = Date added                              | Dato lagt til
files-column-used = Used in                                | Brukt i
files-used-figure = A figure in { $project }               | En figur i { $project }
files-used-figures = A figure in { $count } projects       | En figur i { $count } prosjekter
files-used-nowhere = Not used yet                          | Ikke brukt ennå
files-pixels = { $width } × { $height } pixels             | { $width } × { $height } piksler
files-alt = What it shows, in words                        | Hva det viser, med ord
files-preview-none = No preview for this kind of file      | Ingen forhåndsvisning for denne filtypen
files-made-for-figures = Made from { $name } to be a figure | Laget av { $name } for å bli en figur
files-remove-used = It is a figure in { $count } projects, which will show nothing in its place. | Den er en figur i { $count } prosjekter, som da vil vise ingenting der.
files-images-folder = Images                               | Bilder
files-add-images = Add images…                             | Legg til bilder …
files-not-on-computer = Not on this computer yet           | Ikke på denne maskinen ennå

project.ftl
# The third scope of the picture panel, was "the whole store".
project-pictures-library = The library                     | Biblioteket
```

Keep `files-add-images` only if the picture panel needs words of its own for adding; else use `files-add-files`. The words of `pictures.ftl` that the picture panel still needs (`pictures-not-on-computer`, the scopes) move to `project.ftl` or `files.ftl`; look at each.

## Stage 1 — the core: one store

Work in `crates/core` first, `cargo test -p glaukopis-core` after each step. Commit after 1.4 and at the end.

### 1.1 The record of an image — `crates/core/src/library/files.rs`, `mod.rs`

- `FileRecord` gains `width: Option<u32>`, `height: Option<u32>`, `alt: String` (serde default, skipped when none/empty), and `made_from: Option<String>` (the hash of the file a prepared copy was made from). `FileView` (`mod.rs:1303`) carries them; `FileView::of` fills them.
- `kind_of` (`files.rs:543`): `svg` is a picture. Add it to `ocr::PICTURE_ENDINGS` only if nothing of the OCR breaks on it (`ocr/mod.rs:442`; the OCR of an SVG must still be refused with the message it gives today); else test the ending in `kind_of` itself.
- When an image is taken in (`store_paths`/`enter_taken`, `attach`, `store_bytes` callers), its width and height are read with the `image` crate's `image::image_dimensions` (cheap, reads the header) and for SVG left none, as `pictures.rs` did (`Picture::width` none for svg). A file whose size cannot be read is still taken: the fields stay none.
- `Library::set_alt(hash, alt: &str) -> Result<FileView>`, trimmed, saved with the record.
- `Library::reconcile` (`files.rs:393`) reads the sizes of images it enters too.
- Tests: an image taken in has its size; an SVG has none; `set_alt`.

### 1.2 Thumbnails — `crates/core/src/library/small.rs` (new)

- `library/small/<hash>.png`, 480 wide (`SMALL_WIDTH` as `pictures.rs:47`), made when first asked for and kept for good; removed with the file (`Library::remove_file`, `remove_files`, `replace_file`: a replaced file's thumbnail goes with it).
- `Library::small(hash, tools, work) -> Result<Vec<u8>>`: an image resized as `Pictures::small` did (`pictures.rs:361`; move the resizing code over); an SVG given as it is (the page draws it small); a PDF's first page drawn by the child at 480 wide in colour through `ocr::pages_at` with the pages cache off (`pages_at(.., cache: None, &[0], 480, ..)`, `ocr/mod.rs:1737`), kept as the thumbnail; any other kind an error `core-library-no-small` (new key in `core-library.ftl`, where the core's words of the library are), which the interface shows as the icon.
- A thumbnail is made at most once at a time per hash (a mutex or a set of hashes in the making), so that a grid asking for the same file twice does not draw it twice.
- Tests: an image's thumbnail is 480 wide and kept; a PDF's thumbnail is its first page (`fixture::porson_pdf()` or `e2e/fixtures/structure.pdf` through the test tools as `ocr/view_tests.rs` does it); a second ask reads the kept file.

### 1.3 A figure's file — `crates/core/src/library/figures.rs` (new)

- Move `prepared`, `kind_of` (the private one), `is_svg`, `lighter`, `MAX_BYTES` from `pictures.rs` here, as free functions over bytes. `pictures::is_svg` is used by `ocr/mod.rs:1102`; point it here.
- `Library::for_figure(hash) -> Result<FileView>`: the file as it is where it is PNG, JPEG or SVG and `prepared` leaves the bytes unchanged; else the prepared bytes stored as a file of their own (`store_bytes`, then `enter_taken` into the same folder with the name of the original and the prepared kind's ending, `origin` the original's origin, `made_from` the original's hash), recorded once: asked again, the copy already made is given back (found by `made_from` and kind). A file over `MAX_BYTES` is refused as the store of pictures refused it.
- Tests: a PNG is its own figure file; a BMP gives a PNG copy beside it, in the same folder, named after it, and the same copy the second time.

### 1.4 The migration — `crates/core/src/library/migration.rs` (new), `src-tauri/src/state.rs`

- `Library::take_in_pictures(pictures_dir: &Path) -> Result<Migrated { moved, same, problems }>`, run by `AppState::open` (`state.rs:96-143`) where `pictures_dir.join("pictures.json")` exists, after `Library::open` and in place of the `adopt` loop (`state.rs:104-108`), which goes with the store of pictures; the old per-project picture directories (`Projects::picture_directories`, `projects.rs:200`) are taken into the library the same way where they still exist (a file named by its hash, with no record: the name is the hash, the ending its own).
- For each record of `pictures.json` (read as the old `Picture` struct, kept private in this module): the file `files/<hash>.<ext>`; its hash checked against the bytes (`hash_file`); moved into the store with `store_file` (which dedups by hash) under the name `<name>.<ext>` (`shown_name` as `pictures.rs:564` gave it); recorded with `added`, width, height and `alt` in the folder *Images* (`folder_named` with `files-images-folder`'s English, made once, only where there is at least one picture to move); `caption` and `note` not read. A file already in the store by that hash gets only its image facts where the record lacks them. A picture whose file is missing or whose hash does not match is a problem, said in the log, and skipped.
- Then the directory is renamed `pictures.old-<yyyy-mm-dd>` (next to it; `small/` within it is left as it is). The log says *n images taken into the library, m were there already, k could not be*. Running again finds no `pictures.json` and does nothing.
- The projects' notes under `picture:<hash>` are not touched by the core; the interface stops reading them (stage 2).
- Tests: a store of pictures with two pictures, one of which is also in the library, migrates into the folder *Images* with their sizes and alt, the old directory set aside, and a second run does nothing; a picture with a wrong hash is a problem and the rest go through.

Commit: *The library's store holds images: their size and words, thumbnails kept beside the files, the file an image becomes a figure as, and the store of pictures taken into the library once.*

### 1.5 The readers of the store of pictures — every `use crate::pictures`

Replace `Pictures` with `&Library` (or the data directory's library path where only bytes are read):

- `sharing.rs:572` `sync_pictures(room, token, &Pictures, &[Used])` → `sync_figures(room, token, &Library, &[Used])`: sends with `attachment_path`/`find_by_hash`, takes in with `store_bytes` + `enter_taken` into the folder *Images* (made if needed; an image that arrives from the others is recorded with its name from `Used.name` and its size). Bound `MAX_BYTES` from `figures.rs`.
- `projectfile.rs:291` `take_pictures(store, ..)`: into the library the same way; the manifest's layout within the `.glaukopis` file stays (`pictures/<hash>.<ext>`, `pictures.json` with name, size, width, height, alt; caption and note written empty and ignored when read, so that old files still open). `to_bytes`/`write` read the bytes from the library.
- `readable.rs:46-143`: the readable copy's `pictures/<hash>.<ext>` hard-linked from the library's file; read back into the library.
- `import/document.rs:362,410,539`: `read(.., &Library, ..)` stores the pictures of a document brought in as files (folder *Images*, origin the document's path); `forget` removes them where the dialog is cancelled only if nothing else names them (`entries_with_file_hash` empty, no project uses them: pass the check in, or leave them, which is the plainer thing: a file taken in stays; say which you chose).
- `export/mod.rs:294-345` `place_files`: `Context.pictures: &Path` becomes the library's directory and `file_in` becomes `find_by_hash` + `absolute`; `lighter` from `figures.rs`.
- `ocr/mod.rs` the OCR of a picture (`ocr_picture` in `src-tauri/src/commands/ocr.rs:306`) reads the file by hash from the library.
- `projects.rs:100-103,821` `ProjectInfo.pictures`, `Summary.pictures`: unchanged (hashes of the figures' files); `picture_directories` and `Pictures::adopt` go (1.4 covers the old directories).
- Delete `pictures.rs` and `core-pictures.ftl`'s keys that nothing uses; keep `fixtures::PNG`, `SVG` where tests need them (move to `library/figures.rs` tests or `test_support`).
- The server (`crates/server`) is untouched.
- Tests: `projectfile/tests.rs:135,162`, `readable.rs:159`, `import/document/tests.rs:883`, `sharing` tests, `export/mod.rs` tests that place pictures: rewritten over a `Library` in a temporary data directory; `projects.rs:966` (`where_projects_kept_pictures_of_their_own`) moves to the migration's tests.

### 1.6 The commands — `src-tauri/src/commands/pictures.rs`, `files.rs`, `viewer.rs`, `lib.rs`, `contract.rs`

- `pictures.rs`: `picture_list`, `picture_get`, `picture_add_file`, `picture_add`, `picture_update`, `picture_remove`, `picture_sync` go. In `files.rs`: `file_small(hash) -> tauri::ipc::Response` (the thumbnail's bytes; `picture_read` with `small` becomes this, and plain reads go through `file_read` of `api/system.ts`, which exists, by `file_path`), `file_set_alt(hash, alt) -> FileView`, `file_for_figure(hash) -> FileView`, `files_add_image(name, content: base64) -> FileView` (a pasted picture: `files_take_in` for paths, this for bytes; into the folder given or *Images*), `files_sync(id, used: Vec<Used>) -> Synced`. `file_to_picture` and `picture_to_file` go. `math_render` stays where it is or moves to a `math.rs`; it is not a picture.
- `viewer.rs:113` `stored(state, hash)`: the library alone; the fallback to the store of pictures in the interface goes (stage 2).
- `AppState` (`state.rs:21-49`) loses `pictures`; every `&state.pictures` (`projectfile.rs:48,64`, `readable.rs:51,71`, `reading.rs:53`, `clipboard.rs`, `ocr.rs:306`) takes the library.
- `contract.rs`: `"picture","pictures.Picture"` and `"synced","pictures.Synced"` go; `synced` comes from `files.Synced` (or `sharing.Synced`); `FileView` with its new fields; `cargo test -p glaukopis contract` writes `src/lib/api/contract.generated.ts`.
- `cargo clippy -p glaukopis --all-targets`.

Commit: *The store of pictures goes: sharing, the project file, the readable copy, documents brought in and made, and the OCR read the library's one store; the commands of pictures become commands of files.*

## Stage 2 — the interface's model: figures over the files

### 2.1 The API — `src/lib/api/pictures.ts`, `files.ts`

- `pictures.ts` keeps only `mathRender` and its types (rename to `math.ts` and fix the imports, or leave the file; say which). `files.ts`: `FileView` gains `width`, `height`, `alt`, `madeFrom`; `fileSmall(hash): Promise<ArrayBuffer>`, `fileSetAlt`, `fileForFigure`, `filesAddImage(name, base64, folder)`, `filesSync(id, used)`; `fileToPicture` and `pictureToFile` go. `Synced` and `UsedPicture` move here.

### 2.2 The figures' store — `src/lib/figures/pictures.svelte.ts`

- The class `Pictures` stays as the one reader figures use, over the files store: `load`/`reload` → `files.load`/`reload`; `all` → the images among `files.files` (`kind === 'picture' && exists`), newest first; `get(hash)` → `files.get`; `of(hash, ext, small)` reads `fileSmall` for small and `fileRead(filePath(hash))` for full (`api/system.ts`), keeps the blob URLs and the `absent`/`sync`/retry behaviour as it is (`#read`, `#later`, `#retry`), the sync through `filesSync`; `addFile(path)` → `takeIn([path], imagesFolder)` then `fileForFigure`, giving the `FileView` the figure names; `addBlob` → `filesAddImage` then `fileForFigure`; `update` → `fileSetAlt` only; `nameFrom(used)` → `renameFile` where the file has no name (keep); `remove` → `removeFile` of the files store. `isPictureName(hash, ext)` accepts `jpeg` too. `pictureMatches` searches name and alt.
- `PICTURE_ENDINGS` stays the interface's list for drops; the core decides the kind.
- `Picture` as a type becomes `FileView` everywhere the figures used it (`insertFigure`, `addFigure`, `FigureView`, `TargetPicker`, `hydrate`): `extension` is the file's ending from its name (`fileEnding`, `util/file-name.ts`), lowercased.

### 2.3 The caption and the note go — `src/lib/editor/commands.ts`, `src/lib/figures/views.svelte.ts`, `src/lib/project/model/changing/references.ts`, `src/lib/pictures/store.svelte.ts`

- `insertFigure` (`commands.ts:526`) and `addFigure` (`references.ts:46`): the content is an empty caption; `alt` from the file.
- `FigureView`: `kept()`, `own()`, `#keepCaption`, `#takeCaption` (`views.svelte.ts:527-590`) and their controls go, with their words (`figures-keep-caption*`, `figures-take-caption*`); `#replace` takes a `FileView`.
- `noteKey`, `pictureHasNotes` (`pictures/store.svelte.ts:42-49`) go; `search/everything.ts:131,181,524` skips notes whose key begins with `picture:`; `rewrite-refs.ts` is untouched. `project.setNote` is never called with a `picture:` key any more.
- `CaptionField.svelte` and `captionSchema`: used by the figure's caption in the text? If only by the pane of a picture, it goes; `captionNodes`/`captionOf` stay where the text needs them.

### 2.4 Where pictures were taken in and shown — the callers

- `project/drops.ts:40`, `editor/RichText.svelte:381-399,648-657`, `editor/plugins.ts:304`/`RichText.picture()`, `figures/views.svelte.ts:378` `choosePicture`, `project/text/MapText.svelte:1205`, `project/diagram/MapDiagram.svelte:606`: through `pictures.addFile`/`addBlob` as today, which now take into the library; the drag of `PICTURES_DRAGGED` carries a `FileView` (or the hash, looked up).
- `project/PicturePanel.svelte`: rows from `project.usedPictures` merged with `files.get`, or `pictures.all` for the scope *the library* (`project-pictures-library`); *not on computer* for a hash the library lacks; add through `takeIn` into *Images*; the note marker and `captionHtml` go; the pane opened from the row's menu is the file's pane (`files/FilePane.svelte`, stage 3) in a dialog, or the row goes to the files view at the file (`router.go({ view: 'files', file })`): the plainer thing is the files view; say which.
- `project/shared-pictures.ts` and `ProjectView.svelte:463-512`: `pictures.open`, `shared`, `sync` as today over `filesSync`.
- `documents/DocumentDialog.svelte:70-122`: `pictures.reload()` → `files.reload()`; `documentForget` as 1.5 decided.
- `viewer/viewers.svelte.ts:172`: `fileFacts` alone, `gone` when the library lacks the hash; `ImageSource = { path }`; `viewer/ImageView.svelte:40` reads `fileRead` alone; `FilePath.svelte:90` keeps the icon by `facts.picture`.
- `viewer/LibraryTrees.svelte`: one tree, *Files*, the images in their folders; `viewer-tree-images` goes, `viewer-trees` becomes *Files*; `file-view.mjs`'s checks of the trees follow.
- `files/store.svelte.ts:562` `toPictures` and `files/FilePane.svelte`'s `to-pictures` action, `FilesView.svelte:275` *To pictures*, `pictures/PicturePane.svelte`'s `attachTo`: go, with their words (`files-to-pictures*`, `pictures-attach*`).

### Verify

- `pnpm check`, `pnpm test` (`figures/pictures.test.ts` rewritten over the files store).
- `e2e/figures.mjs` (a picture dropped becomes a figure kept in the library by hash; caption; width and alt), `e2e/placing.mjs`, `e2e/pointers.mjs`, `e2e/passing.mjs`, `e2e/sharing.mjs` (*a picture of one reaches the other*), `e2e/file-view.mjs`, `e2e/documents.mjs`: adjust their expectations where they looked into the store of pictures (`#/pictures`, `data-picture`, `pictures.json`), and make them pass.
- `e2e/taken-in.mjs`: becomes the test of the migration: a data directory with a `pictures/` store of the old layout (write `pictures.json` and the files by hand from the fixtures), the application started, the images in the folder *Images* of the files view with their sizes, the figure of a project that named one still shown, `pictures.old-<date>` beside.

Commit: *Figures are made of the images of the library: a caption only in the document, no note on an image, the pictures' ways in taking into the one store.*

## Stage 3 — the one Files view

### 3.1 Modes and order — `src/lib/files/FilesView.svelte`, `FileList.svelte`, `FileGrid.svelte` (new), `order.ts`, `store.svelte.ts`

- At the head: a segmented control *List* / *Thumbnails* (`files-as-list`, `files-as-grid`), and in thumbnails a menu of the size (`files-size-*`); a switch *Include subfolders* (`files-include-subfolders`; the existing `below` filter, given a face); a menu *Sort by* name, kind, date added (`order.ts`: `FileSortKey` gains `kind`; `size` and `reference` stay available in the list's column heads where they exist). Mode, size, sort and the switch are kept in the settings, not per folder: a part `files: { mode, size, sort, descending, below }` of `AllSettings` (`src/lib/state/settings.svelte.ts`), read and written through `settings.value` (`src/lib/state/settings.svelte.ts`, which saves a moment after a change); today `sortKey` and `descending` live in `FilesView.svelte:81` and are forgotten with the view.
- The list gains the columns: name, kind, date added, *Used in* (`files-column-used`: the references' short labels and `files-used-figure(s)`, from `references` and the projects whose `ProjectInfo.pictures` name the hash, through `projects.list`), and the folder when the switch is on. Keep the virtualised list and the multi-select.
- `FileGrid.svelte`: tiles with the thumbnail (`Thumb` of 2.2, moved to `src/lib/files/Thumb.svelte`, reading `fileSmall`; a PDF's thumbnail the same way; the kind's icon where there is none), the name under, a small mark where the file is used; the three sizes as a CSS variable (96, 160, 240 px); the same selection, keys, menu, drag and drop as the list (`PicturesView.svelte`'s grid keys are the model: Arrow keys by rows). The thumbnail is asked for when the tile comes into view (an `IntersectionObserver`), not for every file at once.
- The filters by kind and *unassigned only* and the search stay as they are.

### 3.2 The pane — `src/lib/files/FilePane.svelte`

- Above the facts, the preview: the thumbnail of an image or a PDF, at most the pane's width and some 240 px high, a press on it showing the file in a side (`showFile`); the kind's icon with `files-preview-none` for other kinds.
- For an image: `files-pixels`, the field *What it shows, in words* (`files-alt`, debounced 700 ms as `PicturePane` did it, through `fileSetAlt`), and *Used in*: the projects that use it as a figure, each a link to the project (`router.go` to the project, or to the element through `onenter` where it is the open project, as `PicturePane.svelte` did with `usersOf`; move `usersOf` to `files/store.svelte.ts`). A file made for figures says `files-made-for-figures` with a link to its original.
- Removal: `removeFile` says the projects too (`files-remove-used`), beside the references it says today; removal is never blocked.
- The actions of an image: *Show*, *Read the text…*, *Open in another program*, *Show in folder*, *Export…*; *To pictures* is gone (2.4).

### 3.3 The images view goes — `src/lib/pictures/`, `src/App.svelte`, `src/lib/shell/Rail.svelte`, `src/lib/state/router.svelte.ts`, `src/lib/shell/keys.svelte.ts`, `KeySheet.svelte`

- Delete `PicturesView.svelte`, `PicturePane.svelte`, `Thumb.svelte` (moved), `CaptionField.svelte` (if 2.3 found it unused), `pictures/store.svelte.ts` (what the picture panel still needs, `showPictures`, `picturesUi`, `takeIn`, `addPictures`, `usersOf`, `removePicture`, moves to `files/store.svelte.ts` or `project/PicturePanel.svelte`).
- The route `pictures` (`router.svelte.ts:12,47,95`): parsed as `{ view: 'files', file: picture }` so that old links still land; not written any more. `App.svelte:31,262,290` mounts no `PicturesView`; `Rail.svelte:58-75` loses the images' place; `keys.svelte.ts:102` `pictures` Ctrl+3 goes (left unbound), the place `store` and `store-find` go, `files-find` serves; `keys.ftl` follows; `shell-pictures` goes.
- The picture panel's *Images* tab of the document pane (`document-pane.svelte.ts:199`, `WritingTools.svelte:333`) stays.

### Verify

- `pnpm check`, `pnpm test`.
- `e2e/files.mjs` grows with what `e2e/pictures.mjs` covered and loses what is gone: the modes (list, thumbnails in three sizes, the tiles' thumbnails present as `img` with a blob source for the PNG and the PDF), *Include subfolders* (a file of a subfolder listed with its folder column), sorting by kind and date, the preview in the pane of a PDF and of an image, the alt text written and kept, *Used in* naming the project after a figure was made of the image (make one through `insertFigure`'s way: drop the image on a text as `figures.mjs` does, or through the picture panel), removal saying the project. The checks of `pictures.mjs` on the panel (scopes, dragging into a text, onto an element, from the writing tools, drop on the panel, put into the text from the menu, removal from the project and from the store) move into `e2e/figures.mjs` or a new `e2e/picture-panel.mjs`; the checks on caption and notes go. Delete `e2e/pictures.mjs`. `e2e/library.mjs`, `e2e/documents.mjs`, `e2e/ocr.mjs` (`ocr_picture` by hash), `e2e/as-left.mjs`, `e2e/maps.mjs`, `e2e/path.mjs` pass.
- Screenshots: `files-1-list`, `files-2-grid-small`, `files-3-grid-large`, `files-4-pane-pdf`, `files-5-pane-image`; look at them.

Commit: *One Files view: a list or thumbnails in three sizes, with or without the subfolders, sorted; a preview and the image's words in the pane; the images view gone.*

## Stage 4 — the words, the guide, the record

- `docs/guide.md`: the section *Images* (line 865) is folded into *The files of the library* (line 1166): what the one store is, that an image is a file like the others, the folder *Images* the migration made, the modes, the switch, the sorting, the preview, the pane of an image (its size, what it shows, where it is used), that a figure's caption is the document's and an image has no note, and that an image of another kind becomes a figure through a copy made beside it. *Figures* (line 390) and *The document pane* where they say *the store*: *the library*. *A file in a view*: an image is a file of the library. The *Keys* section: Ctrl+3 gone, the place *In the images* gone.
- `locales/*`: prune with `scripts/prune-locales.mjs`; `e2e/languages.mjs` in Norwegian.
- `docs/brief.md`: nothing; the owner's words are there.
- An addendum to the record, *as built*: what departs from the plan, the choices you made alone, the counts.

## At the end

- Run every e2e script this plan names, and `e2e/maps.mjs`, `e2e/as-left.mjs`, `e2e/path.mjs`, `e2e/list.mjs`, `e2e/library.mjs`, `e2e/documents.mjs`, `e2e/figures.mjs`, `e2e/sharing.mjs`, `e2e/file-view.mjs`, `e2e/taken-in.mjs`, `e2e/languages.mjs`.
- Report: what was built, stage by stage, with the commits; what was left and why; the choices made alone (the forgetting of a cancelled document's pictures, where the panel's row opens, the size of the preview, anything else); the counts of `pnpm check`, `pnpm test`, `cargo test`, `cargo clippy`, and every e2e script with its ok/FAIL counts; the paths of the screenshots to look at.
