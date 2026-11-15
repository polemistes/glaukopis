# The notebook — the build plan

From the owner's words of 2026-11-15 (the last section of `docs/brief.md`: read it first, every quotation and what they settle). This is the plan of the whole. **Nothing is built yet.** Each stage is given its detailed part here (the files, the words, the checks) when it is begun, after the code it touches has been read, and its record when it is built.

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
| A page of the web | Its address, its title, when it was read | The plugin; a paste from the browser, where the clipboard says the page (to be tried on each system) |
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

## What may go wrong

- **The editor.** See above. Cut the seam first, alone, with every test and script of the editor passing, before anything of the notebook stands on it.
- **The size.** This is a program within the program. Stage 1 is the thin line for that reason; nothing of stages 2 to 5 is begun before the line holds.
- **What the clipboard says of a page** differs between browsers and systems. Where it says nothing, the source is given by hand, and the plugin is the sure way.
- **Years of notes in one document.** Should it grow slow to open, boxes can be put away into documents of their own; built when it is needed.

## What holds throughout

`CLAUDE.md` holds: the owner's real data is never read or written; nothing connects to a service Glaukopis does not already use, and no personal detail is sent anywhere; every word the user sees is a Fluent message in English and Bokmål; a part is named for what it is or does; icons come from Lucide; what is new stands in components and modules of its own, not added to the largest files.
