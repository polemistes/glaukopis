# The notebook — the build plan

From the owner's words of 2026-11-15 (the last section of `docs/brief.md`: read it first, every quotation and what they settle). This is the plan of the whole. The owner asked for it to be built on the same day. Each stage is given its detailed part here (the files, the words, the checks) when it is begun, after the code it touches has been read, and its record when it is built. **Built**: the seam of the editor (record 0100), stage 1 (record 0101), stage 3 (record 0102, the plugin not yet signed), stage 2 (record 0103), stage 4 (record 0104) and stage 5 (record 0105; OneNote's own files tried and left out). Each record says what was chosen in the building and not asked, what was tried and what was not.

## What it is

The notebook is a third store beside the references and the files of the library: one for everything, outside all projects. Anything that turns up is put in it as a note. Notes are found, changed, arranged on a surface, connected, joined and divided. What proves useful goes into a project as whatever it then is: a reference, an image, a quotation, text, a file of the library. Through all of it, where each piece came from is kept.

What makes it worth building in Glaukopis, and not using another program beside it, is the line from a thing collected to a citation in a text. Every stage is judged by whether it serves that line.

## Decided by the owner

1. **The names**, for now: *Notebook* and *notes*; in Bokmål *Notatblokk* and *notater*.
2. **A note is not an element, and the notebook is not a project.** "Why not just make a notes project, then?"
3. **A note may become many things**: a reference, an image, a quotation, text worked into a text, a file of the library, "and probably many other things I have not thought about".
4. **The point**: collecting anything that turns up; then finding, modifying, organising, connecting, merging into bigger wholes and splitting into smaller units; in the end using some of it in a project; all "while also keeping track of where everything comes from".
5. **A surface** to arrange notes on and look at them together, "and then arrange them into units, or divide them, whatever seems right".
6. **Boxes**, and rearranging. **Tags.**
7. **Different kinds of notes, lists and plans.**
8. **Import** from other programs.
9. **A plugin for the browser**: Firefox only, for now. **Nothing that costs a fee**, as things are now.
10. **No phone, no app, no watched folder**, for now. What is on a phone is brought to the computer by its owner and added as files or dropped. An app, should it come, must show projects as well, through the server.

## Proposed in the conversation, and not confirmed

The owner has read these and not objected; none is confirmed. They are the assistant's, to be told of again when they are built, with the other choices that await the owner.

1. **One notebook**, reached from the row at the top of the window, and as a third list, *Notes*, in the document pane of every project, beside the references and the images.
2. **A note is one sheet that holds anything**: words, lists, pictures, passages taken from elsewhere, links, files; one thing or many. It is written in the editor of the texts, so that what goes from a note into a text arrives as it was. It has nothing else of an element: no place in a tree, no heading, no document.
3. **Sources are the backbone** (see *Sources* below): every piece taken in has a source; a source is a record of its own that many pieces share; it can be made a reference; it follows its piece down to the words, through changing, joining, dividing and out into a project.
4. **A passage taken keeps how it read when it was taken**, so that a note can say it has been changed since, and bring the first reading back.
5. **A note that has gone somewhere stays** in the notebook and says what became of it, until it is deleted.
6. **The ways out are a rule, not a list**: any piece is dragged or pasted wherever in Glaukopis its kind can go, and its source goes with it. The named ones (make a reference, to the library's files, quote in a text) are shortcuts.
7. **The surface**: each box is a surface, panned and zoomed as the map; new notes arrive in a strip at its side, newest on top, and are dragged onto it; a card shows the note itself; **Join** makes one note of several and **Divide** cuts one at the cursor or lifts the selection out; links are drawn from card to card as the associations of the map are, with words, arrows and colours. The same notes are shown as a list with filters, for finding.
8. **The pictures and the files of notes** are listed apart from the library's, in the same store underneath, so that the viewer, the image editor and the reading of text serve notes without being built twice. "Copied into the library" is then a file named in the library's record as well.
9. **The plugin** adds the page (its address, its title, and its text, since pages disappear), the selection, a picture, or a marked part of the page as a picture, each with the page's address and title. It hands them to a small helper program that comes with Glaukopis and that the browser starts (Firefox's native messaging); no port is opened and nothing leaves the computer. It is signed by Mozilla, which costs nothing and needs a Mozilla account, the owner's to make with the public address.
10. **Kept as one document**, as a project's is, in a folder of its own in the data folder: so that one undo takes in a joining and a dividing, two windows show the same notebook, and a server could keep it one day.
11. **The order of the stages** below: the thin line first.
12. **Left out**: drawing in Glaukopis (a drawing comes in as a picture); comments, timelines and the history of versions for notes; the reading of handwriting; days and reminders on notes.

## What stands in the code today

Read on 2026-11-15, each to be read again by whoever builds on it.

- **The editor** (`src/lib/editor/RichText.svelte`) takes `project: Project` and a `Y.XmlFragment`, and asks the project for the comments, the language, the look and the numbering of lines, the kinds of paragraph, the references, undo and redo, the awareness and the words spelling is to pass over. A note's editor needs that cut out as what the editor asks of whatever holds the text, which a project answers as it does today and the notebook answers in its own small way. This is the one real risk to what exists: it touches the heart of the writing.
- **The library's files** are a store by the hash of what a file holds (`crates/core/src/library/attachments.rs`) and a record beside it (`library/files.json`, `files.rs`): what a file is called, its folder, its `origin` and when it was `added`.
- **Tags** exist nowhere: references have BibLaTeX keywords, the library has collections, files have folders.
- **Lists** have points and numbered points and nothing to tick (`src/lib/editor/kinds.ts`).
- **The viewer** of a file lets words be selected and copied as letters; nothing carries the reference and the page along.
- **The search through everything** reads the projects only; the library's own search has a filter button (kind, publisher, year).
- **The map** (`src/lib/project/diagram/`): `camera.ts` and `lines.ts` stand apart; the associations are drawn inside `MapDiagram.svelte`, one of the largest files, and are to be lifted out along a seam, not copied.
- **The document pane** has its lists in `src/lib/project/ReferencePanel.svelte` and `PicturePanel.svelte`.
- **The server** keeps shared projects and knows nothing of the notebook. Nothing in this plan changes it.

## The design, part by part

### A note and its pieces

A note is a text as the texts are: paragraphs of kinds, lists, tables, figures, citations, languages. Beside what a text holds it may hold a **file** (shown by its name, opened in a view) and, from stage 4, lists to tick. A note has a name where it is given one, else it is shown by how it begins.

What is in a note is either **the writer's own** or **taken in** from somewhere. The program knows which, word by word, and shows it: a faint line beside what was taken, and its source named. What the writer writes around what was taken is the annotating the owner asked for.

### Sources

A source is a record of the notebook, of one of four sorts:

| Sort | What is known of it | Where it comes from |
| --- | --- | --- |
| A page of the web | Its address, its title, when it was read | The plugin; a paste from Firefox says the site and not the page (tried on Linux, record 0101), so the rest is given by hand |
| A reference of the library | The reference, and a place in it: a page, or what a citation's locator takes | A passage or a part of a page from a file read in Glaukopis; chosen by hand for a book on the desk |
| A file | Its name, its own time, and what it says of itself: for a photograph when and where it was taken | A file added or dropped |
| Words of the writer | What they say: a broadcast and its day, a place, a person | Written by hand |

- Every piece taken in carries its source: words by a mark on them, a picture or a file by a property. What the writer writes has none.
- A source is shared by all that came from it. A page of the web can be **made a reference** of the library (an `online` reference from its address, title and day, or by the lookup where the page names a DOI), and all its pieces then cite that.
- A reference in the library shows the notes that hold something from it.
- The source goes with its piece when notes are joined and divided, when a piece is copied from note to note, and out into a project: as the citation of a quotation, as the origin of a file in the library's record.
- A passage taken is also kept as it read when taken (proposal 4).

### Boxes, the surface, tags

- A note lies in one **box**. There is always a first box, where everything lands. Boxes are made, named, reordered and deleted; a box deleted gives its notes to the first.
- A box is shown as a **surface** or as a **list**. On the surface a note is a card where it was put, as wide as it was made; notes not yet put anywhere stand in the strip at the side. The list is for finding.
- **Join** and **Divide** are undone as one step each. A joined note keeps the tags and the links of all it was made of.
- A **link** goes from one note to another, with words, an arrow and a colour as an association has. Nearness on the surface says the rest; a named frame around notes is not proposed.
- A note has any number of **tags**, offered as they are typed. Tags are renamed and made one in one place.

### Finding

One field for words, and filters beside it as the library has: the box, the tags, what a note holds (pictures, passages, links, files, own words), when it was collected, where it came from, whether it has been looked at since, whether it has been used. From stage 4 the words include those read from pictures, by the reading of text Glaukopis has.

### Ways in

Writing; pasting words or a picture; files added through **Add files…** or dropped, many at once, each a note with its file's own time; the plugin (stage 3); a passage or a part of a page from a file read in Glaukopis, and a passage cut out of a text (stage 3); import (stage 5).

### Ways out

The rule of proposal 6. In stage 1: own words dragged or pasted into a text are text; a passage taken is a quotation with the citation of its source, which is made a reference first where it is none yet; a picture is a figure, and is then a file of the library with its origin. The note records where its pieces went.

### How it is kept

One document, saved as a project's is, under a folder of its own in the data folder; never among the projects, never shared. Its pictures and files are in the library's store, named by the notebook and not by the library's record until they are copied there. To be read before stage 1 is detailed: how a project's document is saved and read (`src/lib/project/model/saving.svelte.ts`, `crates/core/src/projects.rs`), how the windows pass a project's changes to one another, and how a stored file is removed, so that a file a note holds is neither removed with the library's listing of it nor kept for ever.

## The stages

Each stage ends with something the owner can use, with the guide, the words in English and Bokmål, its record, and a script in `e2e/` that covers it.

### Stage 1 — from a thing collected to a citation in a text

At its end: the notebook has a place in the row at the top. A note is written, or made by pasting words or a picture, or by adding or dropping files. What is taken in has a source, given by the program where it knows it and by hand otherwise. Notes are a list, newest first, found by their words. In a project, *Notes* in the document pane lists them, and a piece dragged into the text becomes text, a quotation with its citation, or a figure.

It builds: the notebook's document and its keeping; what the editor asks of its holder, cut out; the sources; the page of the notebook as a list; the list in the document pane; the three ways out.

It must not change how a text is written in a project: the tests and the scripts of the editor pass as before.

### Stage 2 — the surface

At its end: boxes; a box as a surface with its strip of new notes; cards moved and made wider; Join and Divide; links; tags; the list with the box and the tags as its first filters.

### Stage 3 — the Firefox plugin, and collecting from what is read in Glaukopis

At its end: the plugin and its helper, for Linux, Windows and macOS, signed by Mozilla and offered from its site or as a file from the owner's; and, in a file read in Glaukopis, a passage or a part of a page sent to the notebook with its reference and page. Separable from the stages around it: it may be built beside them in a working copy of its own.

To be tried: Firefox as a Snap (said to work since 2022) and as a Flatpak (uncertain).

### Stage 4 — finding widened, and what notes lack

The other filters; words read from pictures; lists to tick, in notes and in texts; starting texts for a new note, named by the writer as the kinds of elements are (the owner's kinds of notes, lists and plans); notes in the search through everything; the notebook written as Org beside the projects.

### Stage 5 — import

A folder of Markdown or text files (Obsidian, Joplin, the exports of Notion and Bear), with tags and the links between notes kept; Evernote's and Google Keep's exports; OneNote through its export to Word, which the import of documents reads. Whether OneNote's own files can be read is to be tried.

## Stage 1 in detail

Written on 2026-11-15, when the owner asked for the plan to be built, after the code it touches had been read. The seam of the editor is cut first and alone (record 0100, built and checked). What follows is built on it.

### What was found in the code, and what it settles

- **Saving is cut loose already.** `Saving` (`src/lib/project/model/saving.svelte.ts`) asks what it saves through `Saved` and writes through `Persistence`. The notebook's document is saved by the same class.
- **The core's `Projects` keeps any document in any root**, but every write of it tells every window that the projects changed, and its locks are the projects'. The notebook therefore has a small keeping of its own in the core, which uses the same log and the same states kept now and then, and tells nobody of projects.
- **The library's record enters every file of the store it does not know** (`Files::reconcile`), and the one way a file leaves the store is `Library::remove_file(s)`. A file of a note therefore has a record like any other, which says that the notebook holds it; the library's lists leave out those the notebook holds alone.
- **A text is read without an editor** by `readBody` and drawn by `blocksHtml` (`src/lib/project/model/text.ts`, `html.ts`). What they do not know they keep the text of, and marks are read whatever their names. A note is drawn in a list by these.
- **Nothing reads when and where a photograph was taken**; a file stored loses its own time. Both are read from the file before it is copied.
- **Dragging inside the window** is the application's own (`src/lib/ui/drag.svelte.ts`: `startDrag`, `dropTarget`), and files dropped from the system come by the same way (`kind: 'files'`). Pickers have no test hook; scripts drop files by emitting `tauri://drag-drop`.
- **Disk and memory**: one build directory for all (no room for a second), Rust built by one agent at a time, two jobs when memory is short.

### The document of the notebook

One Yjs document (`src/lib/notebook/model/notebook.svelte.ts`, class `Notebook`), kept under `<data>/notebook/`:

| Part | Holds |
| --- | --- |
| `notes` | By id, a map: `body` (the text, as an element's), `name` (given by the writer, or none), `made` (when it was collected, ISO), `went` (a list: what became of pieces of it). |
| `sources` | By id, a record: see *Sources* above. `sort` is `web` (`url`, `title`, `read`), `reference` (`reference`, `locator`, `label`), `file` (`name`, `time`, `taken`, `place`) or `words` (`words`); `reference` on any that has been made a reference. |
| `passages` | By id: `source` (or none, where it has not been given), `text` (how it read when taken), `taken` (when). |
| `files` | By the hash of a file a note holds: `name`, `extension`, `source` (or none), `taken`. |

- Words taken in carry the mark `taken` with the id of their passage; a picture is a `figure` and any other file a `file` (a new node, shown by its name), and the source of either is that of its hash in `files`.
- One history of undo over all four parts. An awareness that says nothing: nobody else is there.
- A note is read again when it changes, and only it: its **pieces**, its words for finding, how it begins, what it holds, its sources.
- A **piece** is what is dragged and what goes somewhere: a run of the writer's own paragraphs (which may hold taken words within a paragraph); a run of paragraphs taken whole in one passage; a picture; a file.

### What is built, part by part

**The core and the shell.**

- `crates/core/src/notebook.rs`: `Notebook` at `<data>/notebook` (`DataDir::notebook()`): `load`, `append`, `save_state` (the state before kept in `history/` now and then as a project's is, the log emptied, `notebook.json` written with how many notes there are and the files they hold).
- `FileRecord.notebook`: nothing, `also` or `only`. The notebook takes a file in: new to the store, `only`; known to the library, `also`. The library's lists, and everything that goes through them, leave out `only`. The library removes one the notebook holds: it leaves its references and its folder and is `only`, and stays in the store. A copy made of one that is `only` is `only`. *To the library*: `only` becomes `also`, with its origin. At the first loading of the notebook in a run, the notebook says which files its notes hold: `only` and not held, removed from the store; `also` and not held, the library's alone again.
- What a file says of itself: its own time, and of a photograph when and where it was taken (the crate `kamadak-exif`), read before it is copied.
- `src-tauri/src/commands/notebook.rs`, `src/lib/api/notebook.ts`: `notebook_load`, `notebook_append` (passed to the other windows as `notebook-update`), `notebook_save_state`, `notebook_take_files`, `notebook_take_image`, `notebook_hold`, `notebook_to_library`, `notebook_sweep`.
- The clipboard read through GTK also says the address of the page copied from, where Firefox says it (`text/x-moz-url-priv`).

**The editor**, on the seam.

- The schema: the mark `taken` and the node `file`, in the one schema of the texts, so that a piece is the same thing in a note and on its way into a text.
- The holder is asked three things more: to take in a picture pasted or chosen (a project puts it among the library's images as before; the notebook holds it itself); what it makes of what is pasted into it (the notebook marks what comes from outside Glaukopis as taken, with the page where the clipboard says it; a project makes of taken words a quotation with its citation); and for plugins of its own (the notebook's: the faint line beside what was taken).
- A file in a text is shown by its name, and opens in a view (a PDF, an image) or in its program.

**The page of the notebook** (`src/lib/notebook/`, the route `notebook`, the third place in the row at the top, Ctrl+3).

- At the left the notes, newest first, each by its name or how it begins, with its day and what it holds; over them one field that finds by words, **New note** and **Add files…**. At the right the note chosen: the tools of writing, its name, its text, and under it its sources, each named, and what became of it.
- Files dropped anywhere on the page are a note each. A paste outside a text is a new note.
- A source is given or changed in one window: a page of the web, a reference of the library with a place in it, words of the writer's. There too: **Make a reference**, **My own words** for a passage that was no taking, and how a passage read when it was taken, with **Bring back** where it has been changed.

**The list in the document pane** (`Notes`, the third tab).

- The same notes, found by the same field, each shown as its pieces. A note, or one piece of it, is dragged into the text: where it is dropped in a text being written, else at the end of the text of the element it is dropped on.
- Own words arrive as they are. A passage arrives as paragraphs of the kind *Quotation* with the citation of its source after it, the source made a reference first where it is none (a web page: *Web page* with its address, title and day; said in a message with **Show**); taken words inside a paragraph of the writer's stay where they are, with the citation after them. A picture arrives as a figure, and is from then a file of the library with its origin. A file that is no picture does not go into a text.
- The same holds for what is copied in a note and pasted in a text.
- The note says where its pieces went.

### The order, and who builds what

1. The seam (done). 2. This part of the plan, the calls of the interface (`src/lib/api/notebook.ts`) and what more the holder is asked (`src/lib/editor/holder.ts`), written by the main thread as what the parts agree on. 3. Side by side: the core and the shell; the model of the notebook; the editor's additions (main thread). 4. Side by side: the page; the list in the pane and the ways out. 5. The main thread merges, builds, runs the scripts and looks at the screenshots; the guide, the record (0101) and the choices that await the owner.

### Checked by

Tests beside the code (the model, the pieces, the sources, a passage made one's own and brought back, the ways out, the route, the row, the keys; in the core the keeping, the marks of files, the sweep, the times of a photograph, the contract). Scripts: `e2e/notebook.mjs` (the place in the row; a note written; words pasted and their source given; files dropped; found by words; there after the application is closed and opened; seen in a second window) and `e2e/notebook-out.mjs` (the list in the pane; own words, a passage and a picture dragged into a text; the reference made; the file in the library; the note says where it went). The scripts of the editor again, and `languages`.

## Stage 2 in detail

Written on 2026-11-15 while stage 1 was being built, from a reading of the diagram; nothing of it is begun before stage 1 holds in the running application.

### What was found in the code, and what it settles

- **`camera.ts` is geometry and nothing else**, and was used once before by another view. What makes a view pan and zoom is still inside `MapDiagram.svelte`: the wheel, the dragging of the ground, keeping the middle when the window changes its size, the first placing, telling the camera to be kept, the buttons of zoom, and the reckoning between the screen and the world. A surface needs all of it. It is lifted out first, alone, as the seam of the editor was: `MapDiagram` uses what was lifted and behaves as before, shown by its scripts (`maps`, `associations`, `diagram-picture`, `tree-keys`, `map-icons`, `ordering`).
- **An association is drawn from two boxes and a record** (`associationCurve`, `arrowheadsOf` in `layout.ts`; the curve, the heads, the words in the middle). What is a project's in it is which end is shown where an element is folded away, the menu (which takes a `Project`), and the changes. The drawing is lifted into two parts, the curves and the words, which stay where the picture of a diagram looks for them (`picture.ts` reads `svg.lines g.association` and `.world > .link-label`); the menu takes what holds the links, a project or the notebook.
- **A node of the diagram is as wide as its words** and cannot be made wider by hand; its place is kept relative to its parent. A card of the surface has a place and a width of its own: that is the notebook's, written new. The nearest thing in the diagram is the card of a comment, moved with the pointer held.
- **Joining two elements of a project loses things**: the text is cloned, and the element that goes takes its associations and its comments with it. The owner's Join keeps the tags and the links of all that is joined, so it is written for the notebook and not taken from there. Dividing an element goes through the editor (what follows the cursor becomes the new element's text, then is cut from the old), and a note is divided the same way.
- **There is no field that offers what was written before**, and no tags anywhere. The tags get a field of their own.
- **The filters of the library are one fixed record** shown in a popover, counted on their button. The notebook's are made the same way.

### What the document gains

| Part | Holds |
| --- | --- |
| `boxes` | By id: `name`, `order`. The first box has a fixed id and is always there, named *Unsorted* until it is given another name. |
| A note, more | `box` (none: the first), `at` (where it lies on the surface of its box; none: in the strip, not yet put), `width` (of its card), `tags` (a set of words). |
| `links` | By id: `from`, `to`, `label`, `arrow`, `colour`: as an association of a project, between two notes. One for each pair. |

Where each box was looked at (its camera, surface or list) is kept on this computer with the settings, not in the notebook.

### What is built, part by part

1. **The lifting** (alone, first): the view that pans and zooms, and the drawing of associations, out of `MapDiagram.svelte`; the menu of an association for whatever holds the links.
2. **The model**: boxes (made, named, reordered, deleted, the notes of a deleted box to the first); places and widths; tags (on a note; all tags with how many notes have each; a tag renamed everywhere, which makes it one with another of that name; a tag taken away everywhere); links (as a project's); **Join** (the notes selected become the first of them, in the order they lie: their texts one after another, their tags and links all kept, what became of each kept, the others gone; one step of undo) and **Divide** (at the cursor, or what is selected lifted out: a new note beside the old in the same box with the same tags; one step of undo).
3. **The surface**: a box as a surface; cards that show the notes themselves, moved, made wider by their edge, selected one or many (Ctrl, a band drawn with Shift); the strip of notes not yet put, newest on top, dragged onto the surface; links drawn from a handle of a card to another card, with their words, arrows and colours; the note opened beside the surface to be written; the keys of the diagram where they mean the same.
4. **Boxes, tags and the list**: the boxes at the head of the page; a note moved to another box (dragged onto it, or from its menu); the tags of a note under its name, offered as they are typed; the window where tags are renamed, made one and taken away; the filters of the list, the box and the tags first; Join and Divide in the menus and by keys.

## Stage 3 in detail

Written on 2026-11-15, when stage 1 held, from a reading of what Mozilla says of native messaging today (Firefox 160) and of the application's own start. Built beside stage 2, in working copies of its own.

### What was found, and what it settles

- **Firefox starts a program named in a small file** (the native manifest: `~/.mozilla/native-messaging-hosts/<name>.json` on Linux, `~/Library/Application Support/Mozilla/NativeMessagingHosts/` on macOS, a key under `HKCU\SOFTWARE\Mozilla\NativeMessagingHosts` on Windows), with the path of that file and the id of the plugin as its arguments, and speaks with it over its input and output: a length in four bytes, then JSON; up to 4 GB to the program, 1 MB back. No port is opened.
- **The application already starts itself in another role** (`--glaukopis-isolated`, decided first thing in `main`). The helper is therefore the application itself: started with the path of its own manifest as its first argument, it is the helper and nothing else. No second program is built or packaged.
- **The helper must not need the application to be running**, and the application must not be reached from outside. What the plugin hands over is therefore written into a folder of the notebook, `notebook/inbox/`, each thing a folder of its own, made whole before it is named; the application takes in what lies there when it starts and whenever the folder changes while it runs (it looks every second or two, which costs nothing). That folder is the application's own, in its data folder: it is no watched folder of the writer's.
- **Firefox as a Snap** (Ubuntu's) finds the manifest in the same place and asks the writer once whether the plugin may start the program; **as a Flatpak** it needs two settings made by hand, said in the guide. To be tried: neither is on this computer.
- **Signing costs nothing** but needs an account with Mozilla, the owner's; the signed file is offered from the owner's site. Without a signature the plugin runs only for a session, loaded by hand: that is how it is tried here.
- **What the plugin may ask for**: `activeTab`, `contextMenus`, `scripting` and `nativeMessaging` are enough for the page, the selection, a part of the page as a picture, and an image as it is shown; the only line the writer is shown at installing is that it exchanges messages with another program. An image is drawn from the page where the page allows it, else cut out of a picture of the tab: nothing is fetched, by the plugin or by the application.
- **What Mozilla asks a plugin to declare of the data it handles** counts what is handed to a program on the same computer. The plugin declares what it hands over (the address and the content of the page). The owner may judge otherwise when signing.

### What is built

1. **The helper and the inbox** (the core, `notebook/host.rs`, `notebook/inbox.rs`; `main`): the role, the messages (`hello`, and a thing collected: its kind, the page's address and title, when, its words and HTML, or a picture), each written into the inbox; the application's taking of what lies there (a picture into the store as any picture of a note); the looking while it runs, told to one window; and setting Firefox up: the manifest written, read and removed for this user, from the settings.
2. **The plugin** (`extension/firefox/`, no build step): the button in the bar (the selection where there is one, else the page with its readable text, by Mozilla's Readability), the same from the menu of the right button and by a key, **an image** from that menu, and **a part of the page as a picture**, marked with the pointer; its words in English and Bokmål; the owl for its icon.
3. **In the application**: each thing taken from the inbox a note (the page by its title with its text as a passage; a selection as it was marked up; a picture as a figure), with the page as its source; a message that says what arrived; the row in the settings that sets Firefox up and says whether it is.
4. **From a file read in Glaukopis** (after stage 2's page is settled): a passage selected, or a part of a page marked, sent to the notebook with the file's reference and the page as its source.

## Stage 4 in detail

Written on 2026-11-15 from a reading of the search, the reading of text, the kinds and the Org copy. Its parts are separable; those that touch the page wait for stage 2's page.

### What was found, and what it settles

- **The search through everything reads each project in a worker**, from its state on disk, and keeps what it read until the project changes. A note's pieces are read by code that needs only Yjs and the reading of a text (`pieces.ts`), so the same worker reads the notebook. What is found is shown project by project in the place of the tree; the notebook is one more heading there, and a hit goes to its note. (In that list, *note* already means what is written about a work cited: the notebook's hits are said to be in the notebook.)
- **Text read from an image is not kept anywhere**: it is read by hand in a window and shown. For finding, what is read of a picture of a note is kept with the notebook's record of that file. It is read when asked for, not by itself: a photograph of a street yields noise, and the program cannot know which pictures hold words.
- **A point of a list is a kind of paragraph** (`item`, `numbered`), drawn by the style sheet, written to Org as `-` and `1.`, and typeset as Pandoc's lists. A point to tick is one more kind with one more thing said of it, ticked or not; it touches the catalogue on both sides, the paragraph's attributes, the drawing, Org (`- [ ]`, `- [X]`) and what is typeset (a box before the point).
- **A kind of element may begin with a text** (lines, each a paragraph, of a kind of paragraph); the names of kinds are remembered across projects, their texts are not. The starting texts of notes are the notebook's own, kept in its document.
- **A project's readable copy** is written into its folder a moment after its state is saved: `project.org`, the works cited, the pictures. The marks of what was taken in are not something Org has; a passage is written as a quotation with its source under it.

### What is built

1. **The other filters** of the notebook's list, in a window at a button beside the field, counted on the button as the library's are: what a note holds (images, files, words taken in, links to other notes), when it was collected (from, to), where it came from (a page of the web, a reference, a file, other, no source), whether it has been looked at since it was collected, whether it has been used. A note taken in is **not looked at** until it is chosen; it shows a small dot in the list until then.
2. **Words read from images**: *Read the text* on an image of a note (in the window of its source, and for the notes selected from their menu) reads it with the reading of text Glaukopis has, in the languages of the settings; what is read is kept with the file and found by the field. Not there where Tesseract is not installed: the window says so, as the reading of text does.
3. **Lists to tick**: a kind of paragraph, *To do*, in notes and in texts: a box before the point, ticked by a press on it or by a key; `[ ] ` at the start of a paragraph makes one; in Org `- [ ]` and `- [X]`; typeset with a box.
4. **Starting texts** for a new note, named by the writer: *New note* has a menu of them; each has a name, its lines and the kind of paragraph its lines are (a list to tick for a plan); made, changed and deleted in one window.
5. **Notes in the search through everything**: read in the search's worker, shown under *Notebook* among what is found, a hit going to its note.
6. **The notebook as Org**: `notebook.org` in the notebook's folder, with its pictures and files beside it, written a moment after the notebook is saved: a heading for each box, under it one for each note with when it was made and its tags, its text as Org, a passage as a quotation with its source. It is a copy to be read; it is not read back.

## Stage 5 in detail

Written on 2026-11-15 from a reading of how a document is brought in today and of what each program's export holds.

### What was found, and what it settles

- **A document is read by Pandoc into sections of blocks** (`crates/core/src/import/document.rs`), with its pictures taken in among the library's images. A note is the same reading with three differences: the sections become one text (a heading inside a note is a paragraph in bold: there is no kind of paragraph that is a heading); the pictures are the notebook's, out of the library's lists; and what a note says of itself before its text (its name, when it was made, its tags, where it was clipped from) is read by the core, since Pandoc's reading keeps only some of it.
- **What the exports hold**: a folder of Markdown (Obsidian: `[[links]]`, `![[embeds]]`, `#tags`, tags in the lines before the text; Joplin with those lines: title, created, source, tags, and `_resources/`; Notion: names with a long number after them, links as paths; Bear: `#tags#`, TextBundle folders with `assets/`); Evernote's `.enex` (XML: title, the text as HTML, created, tags, where it was clipped from, the files in base64, found in the text by the MD5 of what they hold); Google Keep's folder from Takeout (a `.json` for each note: title, text or a list with ticks, labels, the pages it names, attachments beside it).
- **OneNote**: its own export gives Word files, page by page or section by section, which the reading of documents takes already; a notebook whole cannot be exported so. A library that reads OneNote's own files exists (`onenote_parser`, MPL-2.0). It is tried last, and left out if it does not hold.
- **Links between notes** are by name in these exports (Obsidian, Notion, Joplin's paths), or cannot be told (Evernote names the note linked only by words). They are made links of the notebook where the name is one of the notes imported with it.
- **Whose words**: a note that says where it was clipped from is taken in from that page, as one passage; any other is the writer's own.

### What is built

1. **The readers** (the core, `import/notes/`): what is there is looked at first (which program's, how many notes, tags, pictures and files), then read with a count that can be stopped: each note its name, when it was made, its tags, its source, its text as blocks, its pictures and files taken into the store as the notebook's, and the names of the notes it links to.
2. **Import notes…** on the notebook's page, as the library's import from Zotero is made: a folder or a file is chosen; what was found is shown before anything is made; the notes are made in a box of their own, named after what was imported, in one step of undo; what could not be read is said.

## What may go wrong

- **The editor.** See above. Cut the seam first, alone, with every test and script of the editor passing, before anything of the notebook stands on it.
- **The size.** This is a program within the program. Stage 1 is the thin line for that reason; nothing of stages 2 to 5 is begun before the line holds.
- **What the clipboard says of a page** differs between browsers and systems. Tried with Firefox on Linux: it says the site, not the page. The source is completed by hand, and the plugin is the sure way.
- **Years of notes in one document.** Should it grow slow to open, boxes can be put away into documents of their own; built when it is needed.

## What holds throughout

`CLAUDE.md` holds: the owner's real data is never read or written; nothing connects to a service Glaukopis does not already use, and no personal detail is sent anywhere; every word the user sees is a Fluent message in English and Bokmål; a part is named for what it is or does; icons come from Lucide; what is new stands in components and modules of its own, not added to the largest files.
