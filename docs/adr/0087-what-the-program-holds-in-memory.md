# 0087 — What the program holds in memory

Date: 2026-11-06. Status: built in part on 2026-11-06 (decisions 1, 2, 3 and 6; decision 4, the text view drawing what is near, left on the owner's word), its choices not yet confirmed by the owner; proposed on 2026-11-06, from the owner's question of the same day ("Even before I started to contemplate implementing more than one open window, I thought that the program consumes too much memory. If I had specified more than one open window and that we should optimize on memory use, would you have chosen the same frameworks and solutions for making Glaukopis in the first place?"), with the plan `docs/plans/the-data-folder-more-than-one-window-favourites-and-the-copied-space.md`; to be built when the owner has read it. Builds on 0023 (Typst within the application), 0064 (the typesetting pane), 0072 (a child keeps a file open and draws its pages) and 0085 (more than one window), whose consequence it measures.

## Context

The question was answered by measuring, not by reasoning. The installed release of 0.2.8 was run off-screen by the e2e harness, with two books made from Org files, one of 44,000 words in 12 chapters and one of 432,000 words in 60 chapters, and the memory of each of its processes was read from the kernel as its proportional set size (PSS: a process's own memory, and its share of what it shares with the others). The harness runs under Xvfb with software rendering, so what the graphics take differs from the desktop; the rest carries over.

| State | Rust process | Web process | Network process | Together (MB) |
| --- | --- | --- | --- | --- |
| Start screen, nothing open | 121 | 146 | 35 | 301 |
| A new, empty project open | 129 | 173 | 34 | 337 |
| 44,000 words, text view | 126 | 235 | 35 | 396 |
| 432,000 words, text view, just opened | 140 | 496 | 35 | 671 |
| The same, ten seconds later | 137 | 266 | 35 | 437 |
| 432,000 words closed, fifteen seconds later | 137 | 255 | 35 | 426 |
| Typesetting pane on the 44,000 words | 279 | 285 | 36 | 599 |
| Typesetting pane on the 432,000 words | 1529 | 334 | 36 | 1898 |
| The same, project closed, twenty seconds later | 1529 | 336 | 36 | 1900 |

The search through everything added some 30 MB to the page; each PDF shown in a side added a child of some 20 MB; the big book opened and closed seven times did not make the page grow. What the table says:

- **Three hundred megabytes is the price of a web view**, paid before any project is open: GTK and WebKit's own side in the Rust process, a web process with the interface loaded, a network process. Every program made on a web view pays it; one that brings its own browser pays more.
- **The project's data is the small part.** A book of two megabytes of text costs some 110 MB in the page at rest, as Yjs items, ProseMirror nodes and the page's state, and near 500 MB while the text view makes an editor for every one of its elements at once, 4,800 paragraphs in 60 editors, none of them drawn only when in sight. It is given back within ten seconds of closing.
- **The typesetting is what is felt.** Typst sets the document inside the Rust process, and the core keeps the last four documents it set, whole, to draw pages from as they come into view (`KEPT` in `crates/core/src/export/mod.rs`); Typst's own cache of what it set is let go only ten settings later (`comemo::evict(10)` in `typeset.rs`). So the big book's 1.5 GB stays after its project is closed, four such projects would keep four, and nothing gives it back but ending the program. Memory freed inside a long-lived process is not always returned to the system either; a child process that ends returns all of it.
- **What a window costs.** On Linux every window Tauri makes is a WebKitWebProcess of its own unless it is built as a related view of another, which shares that one's process; Tauri 2.12 offers `with_related_view` on Linux and uses it by itself only for pages a page opens. A window of its own costs the web process's baseline of some 150 MB, and then the page's copy of what it shows: the open project's document, 30 MB for a novel and 110 MB for the big book, and the list of projects, the library's summaries and the settings, a few megabytes together. The Rust process is one for all windows: the library, the files, the fonts, Typst and the reading of scans are held once. So the fear that every window holds all the data is true of the page's part alone, and the page's part is the smaller.

**Would other frameworks have been chosen with these two things in the brief from the first day?** No. The editor decides it: ProseMirror is the one mature structured editor with marks, inline objects, tables and a collaborative binding, and it runs only in a web view. Weighed and set aside: a native GTK 4 interface in Rust (60 to 100 MB a window, at home on the owner's desktop, but a plain text widget with anchors, a year's work for the editor, foreign on Windows and macOS); Qt 6 (a real rich-text document, 100 to 150 MB a window, but C++ or a bridge, no structured editing, no CRDT binding, foreign on GNOME); the Rust-native toolkits (text layout and editing not mature for writing: input methods, bidirectional text, inline objects); Flutter (a bundled engine of Google's, which the owner's own rules exclude, and weak rich text); Electron and CEF (excluded by the owner, and heavier than the system's view); Servo embedded (not ready for editable text). Yjs stays with it: a Yjs document is what makes a project in two windows one document, and its memory is modest. What would have been different lies inside the architecture, and is decided here.

## Decision

1. **Typst in a served child.** The typesetting pane's document is set and kept by a child of `glaukopis-isolated` with a bound on its memory, as a PDF shown in a side is kept open by one (0072): the child sets `document.typ` from the pane's work folder, keeps what it set, and draws the pages it is asked for, the pages for printing, and the places and spots of the chips, each written as a file for the core to take. The core keeps no typeset document. Where the child cannot be started, the core sets in the process as today, keeps one document at most, and lets it go when the pane closes.
2. **The typesetting's memory is the pane's.** The child ends when the pane closes, when the project whose pane it is closes, when nothing has been asked of it for ten minutes, and when more are served than there are panes to serve; a pane whose child ended sets again, from the file, when it next asks. An export that sets in the process lets Typst's cache go when it is done.
3. **A window shares the web process where that is measured to pay.** On Linux a new window is built as a related view of the first, so that every window's page is in one web process, where the measurement of a second window shows it to save memory and the scripts pass; else each window is its own process. A crash of a shared process ends every window's page, which the continuous saving of every change makes bearable.
4. **The text view draws the elements near the view.** An element far from what is in view has no editor, only a placeholder of its last measured height, or of a height from its words before it was ever shown; the editor is made within two screens of the view, and whatever brings an element into view, the cursor, the keys, the search, the outline, the path, a comment, mounts it first. Nothing else about the text view changes.
5. **The frameworks stand**: Tauri on the system's web view, Svelte, ProseMirror, Yjs, and the core in Rust.
6. **A script measures.** `e2e/memory.mjs` runs the application through the states of the table and prints what each process holds; it fails only where the Rust process, twenty seconds after a typeset project is closed, holds much more than it did at the start screen, or a child of the typesetting is still alive then. It is run before and after every stage that is about memory, and its tables go in the report.

## Choices made in writing this

1. **A child, not a bound in the process.** A bound in the process (fewer kept documents, dropped on close) is less work, but what a long-lived process frees it does not always give back, a huge document could still take the application down, and the served child is a pattern the core has. The one cost is the child's start before the first page, which stage 4 of the plan measures.
2. **Ten minutes idle**, not the ninety seconds of a served file: a writer reads a page, writes, and comes back to the pane; a file is read and turned.
3. **The shared web process decided by the numbers**, not by principle: it saves the engine's baseline, not the page's own heap, and how much is to be measured.
4. **The text view by element**, not by paragraph: an element is what has an editor, and a placeholder per element is one thing to keep right; the big book's elements are chapters, and that is where the peak was.
5. **The frameworks weighed in the record**, so that the question is not asked of the code again.
6. **A generous budget in the script**, since the allocator keeps some of what was freed; the script is to catch a document kept, not a megabyte.

## Consequences

- One process more for each typesetting pane, bounded; the pages cross as files, as a served file's pages do; the first page comes a little later, by the child's start.
- The Rust process stays near what it was at the start screen while nothing is typeset, whatever was typeset before.
- The page's memory is of what is shown, not of the project, once the text view draws only what is near.
- Every window's page in one web process on Linux, where that is kept; the windows are then one crash domain.
- Nothing changes in the frameworks, in what the user sees, or in the words.

## As built, 2026-11-06

- **The typesetting is bounded.** Typst sets and keeps the pane's document in a served child of its own (`export/served.rs`, the task `typeset-serve`), with half the available memory and 512 MB at least, two minutes for a setting and thirty seconds for pages; at most three are served, and one is ended with its pane and with its project. `KEPT` is gone. The child is started as the document is readied, so its fonts load while Pandoc runs. Where no child can start, the core sets in its own process and keeps one document at most. The export sets in the process and lets Typst's cache go when done; it does not ask the child, whose document has the large pictures made small. A fault found on the way: a project closed with its pane open asked the core to stop with an empty key, so nothing was let go; the pane now takes its key when it starts. And the allocator kept some 90 MB of what readying the document took after the pane closed: on Linux the core gives it back (`malloc_trim`) when a pane closes.
- **Measured** with `e2e/memory.mjs` (PSS in MB, debug builds under Xvfb, a book of 40,377 words):

  | State | Rust before | Rust after | Web after | Typesetting after |
  | --- | --- | --- | --- | --- |
  | Start screen | 146 | 146 | 152 | 0 |
  | The book in the text view | 148 | 149 | 220 | 0 |
  | The pane open, its first pages come | 304 | 219 | 301 | 116 |
  | Pane and project closed, twenty seconds later | 304 | 154 | 293 | 0 |
  | Opened, typeset and closed again with its pane open | 304 | 155 | 382 | 0 |

  Before, the Rust process held 158 MB over the start screen after the project was closed; after, 8. The first page of the book came in 2.0 to 2.5 s, where it had come in 4.0 to 6.5; of `e2e/preview.mjs`'s document in 0.7 s, where it had come in 0.8 to 1.3.
- **A second window** at the start screen: with the web process shared, 39 MB (24 in the web process, 16 in the Rust process); with a process of its own, 102 (77 and 26). The shared process is kept (record 0085).
- **Left out, on the owner's word**: decision 4, the text view drawing only the elements near the view.
- **Counts.** Four tests of the served child with the real child; `memory` 7, `preview` 48, `print` 30, `look` 82, `the-document` 29 and `large` 7, all passing.
