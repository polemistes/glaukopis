# Glaukopis, for whoever works on the code

Glaukopis is a desktop application for writing. A project is one tree of
elements, read as a diagram, as text and as the finished document, with a
library of references, files and pictures beside it. It is made with Tauri 2
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

`App.svelte` composes the window: the rail (`lib/shell/Rail.svelte`), the list
of projects at the left (`lib/home/`), the view the route names
(`lib/state/router.svelte.ts`: start, project, library, files, search), the
settings window, and the hosts of menus, dialogs, toasts and drags. One folder
per part under `src/lib/`:

| Folder | What it is |
| --- | --- |
| `api/` | The calls to Rust, one file per area, named as `src-tauri/src/commands/` names them. `contract.generated.ts` is written by a Rust test; never change it by hand. |
| `home/` | The list of projects, which is the one tree: rows, folders, keys (`list-keys.ts`), menus and actions (`ProjectList.svelte`, `project-actions.svelte.ts`), changes with undo (`changes.ts`), the start screen. |
| `project/` | A project open in the window: `ProjectView.svelte` with its sides (`sides.svelte.ts`, `SideView.svelte`), the path over them, the panes. `model/`: the Yjs document of a project, its elements, blocks, kinds, families, lines, import and migration. `diagram/`: the map drawn (layout, camera, keys). `text/`: the map as text, folding, outline. |
| `editor/` | The ProseMirror editor of an element: schema, commands, keys (`keys.ts`), kinds of paragraph and of words (`kinds.ts`), citations, numbers, brackets, clipboard. |
| `look/` | The Look panel: how a document looks, in one place. |
| `document/` | What a document is: about this document, its template, composition, checklist. `documents/`: documents brought in from files. |
| `preview/` | The typesetting pane: pages, zoom, export, the CSL styles and their editor. `print/`: printing through the system dialog. |
| `library/` | The reference library: pane, collections, filters, lookup, citing. `files/`: the files of the library in their own view. `viewer/`: a file (PDF or image) shown in a side, its tabs and bookmarks, the image editor. |
| `figures/`, `tables/`, `timeline/`, `comments/`, `review/`, `history/`, `sharing/`, `search/`, `found/`, `spelling/`, `ocr/`, `org/`, `mindmaps/`, `words/`, `languages/`, `settings/` | Figures and mathematics; tables; timelines; comments; reviewing changes; the full history (in a worker); working together; search (in a worker); citations found in documents brought in; spelling; text read from scans; every project kept as Org; mind maps of other programs; the words of the interface as a project of their own; language packages; the settings window. |
| `shell/` | The rail, the keys of the window (`keys.svelte.ts`, the sheet, the palette), the test hooks (`testing.ts`), the page log. |
| `state/` | The router, the open projects, the library, the settings, closing, the window's place. |
| `ui/`, `util/`, `theme/`, `i18n/` | Widgets (buttons, dialogs, menus, popovers, toasts, drag); small helpers; own colours; the words (`t`). |

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
| `net.rs`, `paths.rs`, `settings.rs`, `shelf.rs`, `sidefile.rs`, `notices.rs`, `error.rs` | One network client that says who asks, one request at a time; where data is kept; settings; things kept as JSON files; a store's own files; what the core tells the user; errors. |

`crates/pdf-text` is the vendored PDF text extraction with glyph names;
`crates/server` the collaboration server (rooms, registry, files, secrets).

### The shell, `src-tauri/src`

The window and the commands, one file per area in `commands/`, each a thin
call into the core. `contract.rs` is the test that writes
`src/lib/api/contract.generated.ts`. `lib.rs` sets what the web view needs on
Linux. A command that can wait long or be called many times at once runs on
`spawn_blocking` (see `commands/viewer.rs`), never as a plain synchronous
`#[tauri::command(async)]`: the runtime's workers are few.

### The rest

- `locales/<tag>/<part>.ftl`: every word the user sees, in Fluent; English is
  the source, Bokmål written with it; `core-<part>.ftl` for the core's words.
- `resources/`: what comes with the application: CSL styles, formats,
  templates, Typst and Pandoc pieces, BibLaTeX, the owl (`brand/`, the owner's
  own drawing, under its own licence).
- `e2e/`: scripts that drive the real application off-screen; `harness.mjs`
  is the client, `run.mjs` runs them. The first comment of each script says
  what it covers.
- `scripts/`: checks of the locales and templates, the language packages, the
  Norwegian dictionaries, the CSL update.
- `packaging/`: `arch/` (PKGBUILD, and `release/` for the tagged one),
  `linux/`, `server/`, `web/`, `release-x.y.z/` (the website folder of a
  release, uploaded by the owner by hand), `languages/`.
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
  through GTK; Skia composition is off on Linux (records 0048, 0049).
- **Rust.** The core knows nothing of Tauri; commands are thin; what can
  crash or hang runs in a child with limits; `clippy` is clean.
- **Never** read or write `~/.local/share/glaukopis` (the owner's real data)
  or `~/.local/share/org.glaukopis.Glaukopis` (the older application). Tests
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
`src-tauri/tauri.conf.json`, `packaging/arch/PKGBUILD` and
`packaging/arch/release/PKGBUILD`; a `v*` tag starts the Installers workflow;
the Arch package is built from `packaging/arch` in a capped unit; the website
folder `packaging/release-x.y.z/` gets the files, checksums and notes, and the
owner uploads it. Language packages come from
`scripts/make-language-packages.py` into `packaging/languages/out`, uploaded
by the owner too.
