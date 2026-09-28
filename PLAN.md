# Glaukopis — plan

Glaukopis is a desktop application where the work on an academic book or article
is done in one place: collecting references, developing ideas in mind maps,
writing, and producing the manuscript. It suggests a workflow led by references
and ideas, without enforcing one.

The owner's description is kept verbatim in [docs/brief.md](docs/brief.md). This
plan answers it. Decisions that shape the whole application are recorded one by
one in [docs/adr/](docs/adr/).

## 1. Languages and frameworks

**Recommendation: Tauri 2 with a Rust core and a Svelte 5 front end.** This is
the combination the brief leans towards, and it is the right one.

| Layer | Choice | Why |
|---|---|---|
| Application shell | Tauri 2 | Uses the webview the system already has (WebKitGTK on Linux, WKWebView on macOS, WebView2 on Windows), so no browser engine is shipped. One code base gives Linux, macOS and Windows. Small binaries, low memory use. |
| Core | Rust | The reference library, imports, duplicate detection, network lookups and export are data work where correctness matters. Rust gives that, and the same code serves the collaboration server. |
| Interface | Svelte 5, TypeScript, Vite | Compiles to small, fast code with little ceremony. Fine-grained reactivity suits a canvas with hundreds of elements. |
| Rich text | ProseMirror | The most dependable foundation for structured rich text: citations and footnotes are real objects in the text, not markup the user can break. |
| Shared editing | Yjs in the application, `yrs` (its Rust port) in the server | A CRDT: every copy of a project can be edited offline and merged without conflicts. The same mechanism gives undo, local saving and collaboration. |
| Citations and export | Pandoc with citeproc; Typst for preview and PDF | Pandoc writes LaTeX, ODT and DOCX reliably and formats citations from CSL styles, of which more than ten thousand exist. Typst compiles pages in milliseconds, which makes a true page preview possible. |
| Package manager | pnpm | |

Alternatives considered and set aside:

- **A native Rust interface (GTK 4, Iced, Slint, egui).** Rich-text editing with
  embedded citations and footnotes, right-to-left and polytonic Greek input, and
  collaborative cursors would all have to be built by hand. The web platform has
  these solved. The cost of the webview is small with Tauri.
- **Electron.** Ships its own Chromium; heavy, and not wanted.
- **Qt with C++ or Python.** Mature, but slower to develop in, harder to make
  elegant, and the collaborative text editing would again be hand-built.

Pandoc and Typst are used as installed programs, not compiled in. On Linux they
are package dependencies. For AppImage, macOS and Windows they will be bundled
next to the executable.

Licence: GPL-3.0-or-later.

## 2. The central idea: a map is a document

The brief names the document editor as the hardest part. The plan rests on one
decision (ADR 0003):

> **A mind map and a document are the same thing seen in two ways.** There is no
> separate document that text must be moved into.

Each **element** has a name, a text (rich text with citations and footnotes),
a place in the hierarchy, and a position on the canvas. A **map** is a tree of
elements plus associative links between them.

- In **Diagram** view the elements are placed on a canvas. Straight lines show
  the hierarchy, curved lines the associations. Hovering shows the text;
  double-clicking opens the edit box.
- In **Text** view the same map reads as a manuscript. Element names are the
  headings, the hierarchy is the section structure, and associations are narrow
  lines in the left margin. Text is edited in place.
- **Preview** shows the map as the formatted, paginated document, in a panel
  that is hidden until asked for.

Writing the article is therefore not a separate stage with a separate tool. It
is the same map, maturing. What this needs in order to work in practice:

1. **An element's name need not be a printed heading.** Ideas have names;
   paragraphs do not. Each element can be set to contribute only its text to the
   document, keeping its name as a working label in the margin. This is what
   lets a map of ideas become continuous prose.
2. **Elements can be left out of the document** without being deleted: notes to
   self, discarded lines of thought, material for later.
3. **Loose elements.** An idea that has no place yet can sit on the canvas
   unattached. It is never exported.
4. **Working across maps.** Two maps can be open side by side. Elements, with
   everything under them, are dragged or copied from one to the other. A copy
   remembers where it came from, so the origin can be found again.
5. **Keeping the valuable map.** "Duplicate map" and "New map from this branch"
   make a working copy in one step, so the original survives being reduced to a
   manuscript. Snapshots of the project are kept automatically.
6. **Books.** An element can *include* another map. The book map has one
   element per chapter, each including the chapter's own map. Exporting the
   book expands them; each chapter can also be previewed and exported alone. A
   map for a theme that spans the book is an ordinary map; its elements can be
   copied, or linked by association, to where they are used.

## 3. The reference library

- One library for all projects, stored as a **BibLaTeX file** in the
  application's own data directory, written atomically, with attachments (PDFs)
  copied into the store beside it. Nothing links back to imported files.
- Each entry has a stable identity that survives changes of citation key.
- **Collections** hold links to entries, never copies. Editing an entry changes
  it everywhere. Collections can be nested.
- What is cited in a text is thereby a reference of its map and of the
  project. (The brief asked for references and collections to be added to
  projects and elements by hand as well; this was tried, and taken out on
  2026-09-28 as complexity without use.)
- **The form** shows the usual fields for the publication type; every other
  BibLaTeX field is one menu away. The raw entry can be edited behind a
  discreet "Source" disclosure.
- The same form, the same search and the same import actions are available in
  the library, in the text editor and in the map: one component, used everywhere.
- **Import:** `.bib` files; Zotero data directories (its database and stored
  files); PDFs (DOI and metadata extracted, then looked up); identifiers and
  searches against external databases.
- **External databases:** only those that permit it and are reliable. Which
  ones is being verified by calling them; the outcome is recorded in
  [docs/research/bibliographic-apis.md](docs/research/bibliographic-apis.md).
- **Duplicates:** every addition is checked, whatever its route. An identical
  DOI or ISBN is a certain match. Matching title, first author and year is a
  probable match. The user is shown the two side by side and chooses: keep the
  existing one, merge, or keep both. A PDF already in the store is recognised
  by its content. "Find duplicates" checks the whole library.

## 4. Preview and export

- **Export:** LaTeX (with BibLaTeX commands or formatted citations), ODT, DOCX,
  PDF, and Markdown.
- **Preview:** paginated, through Typst, refreshed as the text changes. A
  toggle; hidden by default.
- **Reference styles:** a curated set of the standard styles is included (the
  Chicago, MLA, APA, MHRA, Harvard, Oxford, Vancouver, IEEE families and those
  of the major humanities fields). Any other style from the CSL repository can
  be fetched by name, and `.csl` files can be imported.
- **Style editor:** three levels. Common adjustments as plain choices (how many
  authors before "et al.", name order, initials, "and" or "&", page ranges,
  ibid., punctuation between parts). Then the structure of the citation and the
  bibliography entry, part by part. Then the CSL source. A live sample from the
  user's own references is shown throughout. An altered style is saved as the
  user's own.
- **Document formats:** page, type, spacing, headings, quotations, notes, title
  page. Presets for the well-known style guides, publishers and journals, from
  their published requirements, each citing its source and the date checked
  ([docs/research/](docs/research/)). Every parameter can be edited and the
  result saved as the user's own format.

## 5. Collaboration

- `glaukopis-server`: one small program, one data directory, no database to
  administer.
- The owner enters the server's address in the project's sharing panel. The
  project is published there and the owner receives **invitation codes** to
  send to collaborators.
- A collaborator enters the same address and the code. The project appears
  among their own and is edited simultaneously, with the others' cursors visible.
- Everyone keeps a complete copy. Work continues offline and merges on reconnect.
- A shared project carries the references it uses, so citations resolve for
  every collaborator. Joining offers to add them to one's own library, with the
  usual duplicate check.
- The owner can withdraw a code or a collaborator's access.

## 6. Interface principles

1. **Simplicity.** A new project opens on an empty canvas with one element and
   a cursor. Toolbars are short. Anything else appears in context: on
   selection, on hover, or from the command palette.
2. **Intuitiveness.** Established conventions are followed: Tab for a child and
   Enter for a sibling in the map; `@` to cite while writing; drag to move;
   double-click to edit; Ctrl+Z undoes anything, in the map or the text.
3. **Attractiveness.** Quiet, typographic, paper-like. A humanist serif for the
   researcher's text, with full polytonic Greek; a plain sans for the
   interface. A restrained palette built on *glaukos*, the grey blue-green of
   the owl-eyed goddess. Light and dark themes.

## 7. Structure of the code

```
crates/core      glaukopis-core: library, BibLaTeX, imports, duplicates, lookups,
                 documents, styles, formats, export. No dependency on Tauri.
crates/server    glaukopis-server: the collaboration server.
src-tauri        The desktop application: window, commands calling the core.
src              The interface (Svelte).
resources        Bundled CSL styles, locales, document formats, templates.
docs             Brief, decisions, research, user guide.
packaging        Arch first; others later.
```

Data on disk (XDG data directory, `glaukopis/`):

```
library/library.bib          the references
library/collections.json     collections
library/attachments/         stored files, by content
styles/  formats/            the user's own styles and formats
projects/<id>/               project state, its change log, snapshots
```

## 8. Milestones

Each milestone ends with the application building, its tests passing, and the
new parts exercised in the running application.

| # | Milestone | Contents |
|---|---|---|
| 0 | Foundation | Workspace, application shell, design system, navigation, settings. |
| 1 | Library | BibLaTeX reading and writing, the store, the reference form, collections, `.bib` import, duplicates, attachments. |
| 2 | Maps | Project model, saving, Diagram view, Text view, the element editor, citations and footnotes, the citation picker, undo. |
| 3 | Documents | Working across maps, duplicates of maps, inclusion of maps, project references. |
| 4 | Preview and export | Pandoc and Typst pipeline, styles, formats, preview panel, export. |
| 5 | Sources | Lookup by DOI, ISBN and search; PDF import; Zotero import. |
| 6 | Editors | Reference style editor; document format editor with the researched presets. |
| 7 | Collaboration | The server, sharing panel, invitation codes, presence. |
| 8 | Packaging | Arch package, user guide; then deb, rpm, AppImage, macOS, Windows. |

### Where the work stands (2026-09-28)

Milestones 0 to 7 are built, and each is exercised in the running application
by a script in `e2e/`. Of milestone 8, the settings, the package for Arch
Linux (`packaging/arch`), the guide (`docs/guide.md`) and the guide to the
server (`docs/server.md`) are done. The packages for other systems are not.

Added since, at the wish of the one the application is made for, and recorded
in `docs/brief.md`: notes on references (ADR 0008), a PDF that is set by
LaTeX, and figures and mathematics (ADR 0009). Tables, and pointing to a
figure or an equation by its number, are the next of that kind.

## 9. Not in the first version

Annotation of PDFs inside the application; synchronising the library itself
between machines; end-to-end encryption of shared projects; translation of the
interface; mobile.
