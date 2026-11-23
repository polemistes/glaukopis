# Glaukopis, for whoever works on the code

Glaukopis is a desktop application for writing. A project is one tree of
elements, read as a diagram, as text and as the finished document, with a
library of references, files and pictures beside it, and a notebook, outside
all projects, where anything that turns up is collected as notes. It is made with Tauri 2
on the system's web view, a Rust core with no Tauri in it, Svelte 5 with
runes, TypeScript, ProseMirror for the text and Yjs for the project. Pandoc,
Typst and Tesseract are used as installed programs. GPL-3.0-or-later.

This file is the map. Read it, then the code of the part you change. The
records are history, not a map: read the one your work touches, not the rest.

## Where the words are

- `docs/brief.md`: the owner's own words, dated. The last sections are what is
  being built now. Where the brief and anything else disagree, the brief wins.
- `docs/adr/`: the decisions, one record each, numbered. `docs/adr/README.md`
  says which still hold and which were superseded; look there before reading
  a record. Every decision that changes what the program does or how it looks
  gets a record (or an addendum to one); a build of several stages gets a plan
  in `docs/plans/`.
- `docs/guide.md`: the user's guide. Every change the user can see is written
  into the guide in the same commit, in the guide's own plain voice.
- `docs/server.md`, `docs/language-packages.md`, `locales/README.md`,
  `locales/TRANSLATING.md`, `locales/GLOSSARY.md`: the server, the language
  packages, the words and their translation.
- `README.md` is for GitHub. `PLAN.md` is from the first weeks and not kept up.

## The map

### The interface, `src/`

`App.svelte` composes the window: the list of projects at the left
(`lib/home/`), the view the route names (`lib/state/router.svelte.ts`: start,
project, library, files, search) with the row at its top (the places of the
window at both ends, `lib/shell/RowStart.svelte` and `RowEnd.svelte`, which
stand in the list's head and the project's top row, and in
`lib/shell/TopRow.svelte` over the other views), the settings window, and
the hosts of menus, dialogs, toasts and drags. The routes are start, project,
library, files, notebook and a file in a side. The notebook stands in the
library's place, between its references and its files
(`files/LibrarySwitch.svelte`). One folder per part under
`src/lib/`:

| Folder | What it is |
| --- | --- |
| `api/` | The calls to Rust, one file per area, named as `src-tauri/src/commands/` names them. `contract.generated.ts` is written by a Rust test; never change it by hand. |
| `home/` | The list of projects, which is the one tree: rows, folders, keys (`list-keys.ts`), menus and actions (`ProjectList.svelte`, `project-actions.svelte.ts`), changes with undo (`changes.ts`), the start screen. |
| `project/` | A project open in the window: `ProjectView.svelte` with its sides (`sides.svelte.ts`, `SideView.svelte`), the path over them, the panes. `model/`: the Yjs document of a project, its elements, blocks, kinds, families, lines, import and migration. `diagram/`: the map drawn (layout, camera, keys). `text/`: the map as text, folding, outline. |
| `editor/` | The ProseMirror editor of a text: schema, commands, keys (`keys.ts`), kinds of paragraph and of words (`kinds.ts`), citations, numbers, brackets, clipboard. It asks what holds its text through `holder.ts` (record 0100): a project (`project/holder.ts`) or the notebook. |
| `byhand/` | A box of rich text (records 0111 to 0113; the plan `docs/plans/a-box-of-rich-text.md`): a stretch of a text in which the look is to be set by hand, the block `rich` of the editor's schema. `box.ts`: putting it in, leaving it, making it ordinary text; `view.ts` and `BoxHead.svelte`: the sheet and its head; `put.ts`: the asking in a shared project; what is set by hand in it (record 0113): `hand.ts` (a font, a size, a colour, a paragraph's measures, as they are kept: the one place they are read through), `commands.ts`, `rule.ts` (it lives only in a box), the tools in the head (`BoxHead.svelte`, `now.svelte.ts`), `sheet.ts` (the document's own look as the sheet draws it, and the headings of a sheet, which are paragraphs and no elements: record 0115, set for a document by `crates/core/src/document/headed.rs`; the sheet is moved by its name, `editor/dragged.ts`, record 0114); the colour behind words, a highlight, is no part of this: a mark of every text as bold is, set in every document (`editor/ground.ts`, record 0116); It is offered in every build from 0.2.14. Outside the editor a text is read as if there were no box, each block saying that it stands in one (`Boxed` in `project/model/text.ts`). `editor/form.ts` is the form of the texts, which a document says and no version opens beyond what it knows. |
| `look/` | The Look panel: how a document looks, in one place. |
| `document/` | What a document is: about this document, its template, composition, checklist. `documents/`: documents brought in from files. |
| `preview/` | The typesetting pane: pages, zoom, export, the CSL styles and their editor. `print/`: printing through the system dialog, and the document of a side printed and exported with the pane closed. |
| `library/` | The reference library: pane, collections, filters, lookup, citing. `files/`: the files of the library in their own view. `viewer/`: a file (PDF or image) shown in a side, its tabs and bookmarks, the image editor, and To the notebook. |
| `notebook/` | The notebook (records 0101 to 0105; the plan `docs/plans/the-notebook.md`). `model/`: its Yjs document (notes, sources, passages, files, boxes, tags, links, starting texts), read note by note into pieces. `open.svelte.ts`: the one notebook of the window. `holder.ts`: the notebook as what holds the texts of its notes. The page (`NotebookView.svelte`, `BoxColumn`, `NoteList`, `NoteEditor`, `SourceDialog`, `FilterPopover`, `surface/`), the list in the document pane (`NotesPanel`, `NoteCard`), the ways into a text (`out.ts`), taking in (`taking.ts`, `inbox.ts` for the plugin, `from-file.ts`), `org.ts`, the import of other programs' notes. `window/`: a note written in a window of its own (record 0109): the page of `glaukopis --note`, the text's editor with a holder of its own, mounted by `src/main.ts` in place of `App.svelte` where the window's label is `note`. |
| `phone/` | The page of the phone (records 0121 to 0124; the plan `docs/plans/an-app-for-android.md`), mounted by `src/main.ts` where the window is labelled `phone`: `mount.ts`, `PhonePage.svelte`, the places and their own steps (`places.svelte.ts`, which answers Android's Back through Tauri's event; a place arrived at from outside leaves the app by Back), the notes (`NotesPlace`, `NoteRows`, `FilterSheet`, `Line`), a note (`NoteView`, `ToolRow`, with *Photograph* and *Picture or file*, a file sent in pieces by `taking.ts`), what the Android part asks of the page (`asked.ts`: the note of a thing shared, a new note from the icon), the settings (`SettingsPlace`); `hover.test.ts` holds every file it draws to showing nothing under a pointer where there is none. Scripts `e2e/phone-*.mjs` through `glaukopis --phone`, and `e2e/android/` on the emulator. |
| `sync/` | Synchronization between the writer's computers (record 0120), of which the work is the core's (`crates/core/src/sync/`): what the window knows of it (`sync.svelte.ts`), the section in the settings (`SyncSettings.svelte`), and what is told when a project was written in on two computers apart (`apart.svelte.ts`, `ApartHost.svelte`, which asks the review to open from the moment kept through `review/asked.svelte.ts`). `settings.test.ts` holds every setting of the interface to be in one of the core's two lists: those that follow the writer, and those that stay on the computer. |
| `help/` | Help, not offered for now (the switch `HELP_OFFERED` in `help-ui.svelte.ts`, off on the owner's word of 2026-11-16; everything kept and tested): `docs/guide.md` in a window over the view (F1, the question mark in the row), read by a Markdown reader of its own (`markdown.ts`, a test holds it to the whole guide), in chapters and found in (`guide.ts`), opened at the part about where one is (`where.ts`). |
| `figures/`, `tables/`, `timeline/`, `comments/`, `review/`, `history/`, `sharing/`, `chat/`, `search/`, `found/`, `spelling/`, `ocr/`, `org/`, `mindmaps/`, `words/`, `languages/`, `settings/` | Figures and mathematics; tables; timelines; comments; reviewing changes; the full history (in a worker); working together; the chat of a shared project; search (in a worker); citations found in documents brought in; spelling; text read from scans; every project kept as Org; mind maps of other programs; the words of the interface as a project of their own; language packages; the settings window. |
| `shell/` | The places of the window in the row at its top (`RowStart`, `RowEnd`, `TopRow`), the keys of the window (`keys.svelte.ts`, the sheet, the palette), the test hooks (`testing.ts`), the page log. |
| `state/` | The router, the open projects, the library, the settings, closing, the window's place. |
| `ui/`, `util/`, `theme/`, `i18n/` | Widgets (buttons, dialogs, menus, popovers, toasts, drag; the emoji picker, `EmojiPicker.svelte`, its list made by `scripts/make-emoji-list.py`; the view that pans and zooms, `pan-zoom.svelte.ts` with `camera.ts`, which the diagram and the notebook's surface share); small helpers; own colours; the words (`t`). |

Tests are `*.test.ts` beside the code (vitest with jsdom). Reactive modules
are `*.svelte.ts`. The largest files are `look/LookPanel.svelte`,
`project/diagram/MapDiagram.svelte`, `project/text/MapText.svelte` and
`project/ProjectView.svelte`; when you change one, split along its seams
rather than add to it.

### The core, `crates/core/src`

No Tauri in it; everything that is data and not interface.

| Module | What it is |
| --- | --- |
| `projects.rs`, `projectfile.rs`, `readable.rs`, `history.rs`, `sharing.rs` | Projects on disk and what is known of them; a project as one file; the readable Org copy; the history; sharing. |
| `library/`, `duplicates.rs`, `bib/`, `lookup/`, `styles.rs` | The library (entries, collections, attachments, files, figures, keys, schema, migration, export); duplicates; BibLaTeX read and written; lookup by DOI, Crossref, arXiv, PubMed, SRU/MARC and from text; CSL styles. |
| `import/` | What is brought in: `.bib` files, Zotero (`zotero/`), documents through Pandoc (`document/`), PDFs, tables; proposals of what was found. |
| `document/`, `export/`, `formats/`, `templates/`, `written/` | A document as the interface hands it over; preview and export, typeset by Typst or LaTeX or through Pandoc; the formats (how a manuscript looks); templates (what a document of a kind consists of); the small forms of what is written (identifiers, locators, pages, roman numbers). |
| `ocr/`, `isolated.rs` | Tesseract in a child process (`child.rs`; a served child, `server.rs`), the pages cache, layers, searchable PDFs, rules, schemes of glyph names; child processes with time and memory limits (binary `glaukopis-isolated`), for anything that can crash or hang. |
| `found/`, `spelling/`, `languages.rs`, `i18n.rs` | Citations found in texts written elsewhere; spelling; language packages; the core's words (`tr!`). |
| `notebook.rs`, `notebook/`, `library/notebook.rs`, `import/notes/` | The notebook's document on disk, kept as a project's is; what a file says of itself; the inbox the plugin's helper and the window of a note write into (`note_window.rs`: the note kept unsent, and sent), and what another app shares on a phone (`shared.rs`, record 0124), a file the phone's page sends in pieces (`pieces.rs`), the helper Firefox starts (the application itself in another role, `host.rs`), setting Firefox up, the readable Org copy; the files of notes in the library's store, out of its lists; the readers of other programs' notes. |
| `sync/` | The same on every computer of the writer (record 0120; the plan `docs/plans/the-same-on-every-device.md`): a writer's computers share a home on a server. `engine.rs`: the one thread that makes the rounds, one request at a time; `whole.rs`: a document from its bytes on disk, with no document made of it; `remote.rs`: the calls to the server, the exchange of one document among them; `kept.rs`: what this computer keeps of it (`sync/` of the data folder, and `sync.json` with each document); `home.rs`: the home document, maps of strings for what is no document on disk; `mirror.rs`: a store brought to be the same as its map three ways, with what both agreed on last; the stores themselves in `arrangement.rs` (folders, favourites), `facts.rs` (what the list shows of a project, how it is shared), `settings.rs` (the settings that follow the writer and those that stay, by name) and `shelves.rs` (the writer's own styles, formats, templates and words); `library.rs` and `files.rs`: the library as a document of its own, a reference field by field, and the files that follow their records, streamed (the library's doors for what comes from elsewhere are `library/elsewhere.rs`); `wrote.rs`: the mark of a project the writer wrote in. The engine and the server are tried together in `crates/server/tests/synchronization.rs` and `synchronized_library.rs`. |
| `net.rs`, `paths.rs`, `settings.rs`, `shelf.rs`, `sidefile.rs`, `notices.rs`, `error.rs` | One network client that says who asks, one request at a time; where data is kept; settings; things kept as JSON files; a store's own files; what the core tells the user; errors. |

`crates/pdf-text` is the vendored PDF text extraction with glyph names;
`crates/server` the collaboration server (rooms, registry, files, secrets; and the homes of writers' computers, `homes.rs` and `homes_api.rs`, whose documents are rooms too).

### The shell, `src-tauri/src`

The window and the commands, one file per area in `commands/`, each a thin
call into the core. `contract.rs` is the test that writes
`src/lib/api/contract.generated.ts`. The application is built in its roles,
a file each: `application.rs`, itself on a computer (`run`, its windows and
every command); `note_window.rs`, the window of a note alone (`glaukopis
--note`, with the few commands of `commands/notewindow.rs`); `phone.rs`, the
phone (below); and `starting.rs`, what every role starts with (the data
folder opened and claimed, the language, what is told to the windows, what
is said where starting fails, the compositor of WebKitGTK on Linux).
`lib.rs` holds only the modules and what `main.rs` and Android call; the
roles without a window, the Firefox helper and the reading of a PDF, are
taken in `main.rs`. A command that can wait long or be called many times at once runs on
`spawn_blocking` (see `commands/viewer.rs`), never as a plain synchronous
`#[tauri::command(async)]`: the runtime's workers are few.
`commands/sync.rs` makes the engine that keeps this computer the same as the
writer's others (the core's `sync`), started with the windows: it is told of
every change written (`touched`), and what another computer wrote goes to the
windows as a change of another window does.

**On a phone** (record 0121; the plan `docs/plans/an-app-for-android.md`) the
same sources are a second package, `src-phone`, whose library is
`src-tauri/src/lib.rs`: built for Android alone, empty where it is built for
anything else, so that a build for a computer makes nothing for it. Its role
is `src-tauri/src/phone.rs`: its folder opened as the application's, the
engine told that the device takes the notes alone (the core's `sync::Takes`),
the window labelled `phone`, showing the phone's own page (`src/lib/phone/`),
and only the commands that page calls (a test in `phone.rs` holds the list). The door (`door.rs`, record 0124) is what the part in Kotlin calls with no window, by JNI: a thing shared put into the inbox, a round of the synchronization that Android's WorkManager runs with the app closed; it keeps one opening of the data folder in a process, which the role takes over when it starts (`glaukopis --phone --round` is the round on a computer). `glaukopis --phone` is the same role on a
computer, for trying it, never in the application's own data folder;
`e2e/phone-role.mjs` tries it with a server. What is a computer's alone
stands behind `cfg(desktop)`. On Android a body of bytes arrives as JSON, and `with_head` (`commands/projects.rs`) takes both forms. The launcher starts `StartActivity`,
which looks at the web view before anything of Glaukopis loads (its words
are Android's string resources), and then `MainActivity`, the page. Share,
the menu over selected words and *New note* on the icon start it too: it
reads what was handed over and puts it through the door (`Door.kt`,
`Sharing.kt`) before the page; `Round.kt` is the round of WorkManager. Its dependencies are those of
`src-tauri/Cargo.toml` without what is a computer's: keep them the same. The
Android project, `src-phone/gen/android`, is kept in git: the manifest, the
activity that keeps the page clear of the system's bars and the keyboard, the
icon. Source `packaging/android/env.sh` for a build (Rust's own toolchain in
`~/.rustup`, the SDK, the NDK), and run Tauri's tool from `src-phone` by its
place, `../node_modules/.bin/tauri android build …`, never through pnpm,
which starts it where it takes `src-tauri` for the application.

### The rest

- `locales/<tag>/<part>.ftl`: every word the user sees, in Fluent; English is
  the source, Bokmål written with it; `core-<part>.ftl` for the core's words.
- `resources/`: what comes with the application: CSL styles, formats,
  templates, Typst and Pandoc pieces, BibLaTeX, the owl (`brand/`, the owner's
  own drawing, under its own licence).
- `extension/firefox/`: the plugin for Firefox (record 0102): plain
  JavaScript, no build step, Mozilla's Readability as it is in `vendor/`.
  Its README says how it is tried unsigned and how it is signed.
- `e2e/`: scripts that drive the real application off-screen; `harness.mjs`
  is the client, `run.mjs` runs them. The first comment of each script says
  what it covers.
- `e2e/android/`: the app on an emulator without a window (`emulator.sh`, a
  new Android and the oldest the app runs on, each a capped unit on a port
  of its own; never beside another capped unit): `device.mjs` reaches the
  system by `adb` and the page by the web view's door for debugging,
  `gboard.mjs` types on the real keyboard key by key. A script names its
  device (`ANDROID_SERIAL`), and never reaches a phone that is plugged in.
- `scripts/`: checks of the locales and templates, the language packages, the
  Norwegian dictionaries, the CSL update.
- `packaging/`: `android/` (what a build for Android needs of the machine,
  `env.sh`; the owl set for a launcher, `make-icon.py`; `out/`, not in git,
  for an app built to be tried), `arch/` (PKGBUILD, and `release/` for the tagged one),
  `macos/` (Tesseract built from its sources for the oldest macOS, for the installers),
  `linux/` (the desktop file, the command `glaukopis-note`, and the file that
  tells Firefox of the helper, which the packages put in the system's
  place), `server/`, `web/`, `release-x.y.z/` (the website folder of a
  release, uploaded by the owner by hand), `languages/`, `firefox/` (the
  plugin as Mozilla signed it, which goes with the packages; its README says
  how a new version of it is signed).
- `.github/workflows/`: `tests.yml` on every push; `installers.yml` on a `v*`
  tag (Windows, macOS on Apple silicon and Intel, deb, rpm, server packages).

## Finding a thing

- **A word the user sees.** Grep the English text in `locales/en/` to get the
  message's name; grep the name in `src/lib` (or `crates/` for `core-` names)
  to get the code. The file's name is the part.
- **A key.** `shell/keys.svelte.ts` for the window, `home/list-keys.ts` for
  the list, `project/diagram/keys.ts` and `project/text/` for the tree,
  `editor/keys.ts` for the text. Ctrl+Alt+digits are the kinds.
- **A setting.** `state/settings.svelte.ts`, shown in
  `settings/SettingsView.svelte`.
- **A call into Rust.** `src/lib/api/<area>.ts`, then
  `src-tauri/src/commands/<area>.rs`, then the core.
- **What is printed.** `crates/core/src/export/` (Typst in `typeset.rs`,
  LaTeX in `latex.rs`), `formats/`, `templates/`, `document/`.
- **The script that covers a part.** `grep -l` the button's English words in
  `e2e/*.mjs`, or read the first comment lines.

## How the code is written

- **Words.** Every word the user sees is a Fluent message in English and
  Bokmål, written together; `t('part-name')` in the interface (reactive: in
  markup or `$derived`, not once at the top of a script), `tr!("core-…")` in
  the core. Names begin with the file's part; `common.ftl` is used, not added
  to. The other languages are translated in rounds, not with each change.
  Few words, no hints in menus, nothing explained that should be obvious.
- **Names.** A function or a part is named for what it is or does, never for
  one use of it ("the tabs", not "sources").
- **Design.** Glaukopis is for anyone working with texts: find structure,
  never assign a meaning the program cannot know; the plain, conventional
  interface first; an action on a project must not require closing it first.
- **Icons** come from Lucide (`@lucide/svelte`). Nothing is drawn by hand; the
  owl is the owner's artwork, only cropped and scaled.
- **Dialogs the harness cannot drive** (file pickers, printing) get a test
  hook through `shell/testing.ts` (`window.__glaukopis…`), never a stub.
- **WebKitGTK.** Identical `innerHTML` strings come back with the nodes of the
  last rendering, marks and all: strip foreign marks before marking. Paste goes
  through GTK; Skia composition is off on Linux (records 0048, 0049). Never
  `display: contents` on what there may be thousands of: WebKit goes through
  all of them for each one under which something moves.
- **Many of a thing.** What is drawn once for each element of a project is
  measured together after it is drawn, never as each is put on the page
  (`project/diagram/measuring.ts`): a size told in the middle makes what
  the next one reads stale, and it is worked out anew for each.
  `e2e/huge-shared.mjs` measures a project of thousands of elements.
- **Rust.** The core knows nothing of Tauri; commands are thin; what can
  crash or hang runs in a child with limits; `clippy` is clean.
- **Never** read or write `~/.local/share/glaukopis` (the owner's real data)
  or `~/.local/share/org.glaukopis.Glaukopis` (the older application), nor
  the owner's `~/.mozilla`: what sets Firefox up is given a folder of its
  own in tests and scripts (`GLAUKOPIS_FIREFOX_HOSTS_DIR`). Tests
  make directories of their own. Never fetch the first attempt's repository.
  Nothing connects to any service the application does not already use, and
  no personal detail is sent anywhere.
- **Ligatures are letters** in OCR output: ſ is s, ff fi ſt ch ck come out as
  letters; ß æ Æ œ Œ & stay themselves.

## Checking, in this order

1. **Edit first, format after.** `cargo fmt --all`; `pnpm format` (Prettier
   over `src/` only; never over `e2e/`, which is not Prettier-formatted).
   Exact-string edits break after a reflow.
2. **The interface.** `pnpm check` (svelte-check) and `pnpm test` (vitest);
   about half a minute each. The tests check that every message name used
   is in both languages with the same variables.
3. **The core.** `cargo test --workspace` (a minute or two) and
   `cargo clippy --workspace --all-targets -- -D warnings`. The contract test
   rewrites `contract.generated.ts`: commit it with the change.
4. **The running application, off-screen.** `pnpm e2e:build` (Vite, then
   `cargo build -p glaukopis --features custom-protocol`), then
   `timeout 300 node e2e/<name>.mjs > <log> 2>&1`, or `pnpm e2e <word>` for
   every script whose name contains the word. Xvfb and WebKitWebDriver;
   screenshots land in `e2e/output/`: look at them. A script takes two to
   three minutes; run those of the part you changed, not all. A hang means a
   loop in the page: kill by PID only, never `pkill -f`. Never drive the
   owner's own screen or keyboard. `e2e/languages.mjs` finds English left in
   the Norwegian interface.

   **Which checks, when** (the owner's word, 2026-11-05):
   - *Every change*: steps 2 and 3 (step 3 where the Rust changed), and the
     scripts whose part the change touches, picked by the files changed: a
     new script for what is new, the script of each part whose look or
     behaviour changed (the path, the typesetting pane, Look …), and
     `languages` where words were added. Not the scripts of parts the change
     does not reach.
   - *Before a release, or a package the owner is to rely on*: every script
     (`pnpm e2e`), as a capped unit (step 5).
   - *Never in the way*: a package the owner asks for to try is built at
     once; it does not wait for scripts. Two capped units at once compete for
     memory and slow both: run one after the other.
5. **Heavy builds** (makepkg, a release build, a full e2e run) run as a capped
   systemd unit of their own: `./capped.sh <name> <command>` (output in
   `run-<name>.log`). An out-of-memory kill inside the editor's scope takes
   the whole editor down, and with it the session.

CI (`tests.yml`) runs `pnpm build`, `cargo fmt --check`, clippy with
`-D warnings`, `cargo test --workspace --locked`, `prettier --check src`,
`pnpm check` and `pnpm test`.

## Committing

- Commit verified work without asking. Push, tag, or start the Installers
  workflow only when asked.
- A commit message is full sentences in plain words, saying what changed and
  why, for someone reading the log a year on: the first line a sentence
  (often long), no prefix, no ticket. It ends with
  `Co-Authored-By: <the model that did the work> <noreply@anthropic.com>`.
- A change carries with it: the guide, the Fluent files in `en` and `nb`, the
  tests, a record or an addendum where a decision was made, and
  `contract.generated.ts` where the contract changed.
- **Agents in worktrees** read `.claude/briefs/common.md`, commit every step
  on their branch, and keep a progress note at the worktree root. A merged
  worktree is removed (`git worktree remove`): each holds its own `target/`,
  tens of gigabytes.

## Releases, only when asked

The version in `Cargo.toml`, `Cargo.lock`, `package.json`,
`src-tauri/tauri.conf.json`, `src-phone/tauri.conf.json` (the app for Android, whose file `glaukopis-x.y.z.apk` is signed with the release key in `~/.android/`), `packaging/arch/PKGBUILD`,
`packaging/arch/release/PKGBUILD` and `packaging/web/packages/version.json`
(which tells the installations of Windows and macOS that it is out); a `v*` tag starts the Installers workflow;
the Arch package is built from `packaging/arch` in a capped unit; the website
folder `packaging/release-x.y.z/` gets the files, checksums and notes, and the
owner uploads it. Language packages come from
`scripts/make-language-packages.py` into `packaging/languages/out`, uploaded
by the owner too.

A release on GitHub is a release, not a pre-release, named *Glaukopis
x.y.z* and nothing more: never "a version to test", and no paragraph about
testing in its notes. The only
warning that a version is for testing is the one at the top of the page of
packages (the owner's word, 2026-11-13, in the brief).
