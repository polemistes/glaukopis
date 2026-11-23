# 0101 — The notebook: from a thing collected to a citation in a text

Date: 2026-11-15. Status: built on 2026-11-15, as stage 1 of `docs/plans/the-notebook.md`, from the owner's words of the same day (the last section of `docs/brief.md`) and their word to build the plan. It stands on record 0100. The later stages (the surface, boxes and tags; the plugin for Firefox; the wider finding; import) are not built.

## Context

- **The owner asked for a place of its own for what is collected**: "collecting anything that turns up", then "finding things, modifying them, organizing them, connecting them", and in the end using some of it in a project, "while also keeping track of where everything comes from". A note is no element, and the notebook no project: "Why not just make a notes project, then?"
- **What makes it worth building here** is the line from a thing collected to a citation in a text. Stage 1 is that line, thin, and nothing else.
- **The plan's proposals** (one notebook; a note as one sheet written in the editor of the texts; sources as records that pieces share; a passage keeps its first reading; a used note stays; the ways out as a rule; the same store of files underneath; one document) were read by the owner and not confirmed. They are built as proposed, and await the owner with the choices below.

## Decision

1. **One notebook, one document.** A Yjs document kept under `notebook/` in the data folder as a project's is (a state, a log of the changes after it, states kept now and then), by a keeping of its own in the core that tells nobody of projects (`crates/core/src/notebook.rs`). It is read when the page or the list of notes is first shown. A change made in one window is passed to the others, as a project's is.
2. **What it holds**: `notes` (each a text, a name where one is given, when it was made, and what became of it), `sources`, `passages` and `files`. One history of undo over all of it.
3. **A note is written in the editor of the texts** (record 0100), with the tools of writing as they are where there is no project. Words taken in carry the mark `taken` with the id of their passage; an image is a figure; any other file is the node `file`, shown by its name and opened from there. Both are in the one schema of the texts, so that a piece is the same thing in a note and on its way into a text; a text of a project keeps neither.
4. **The writer's own, or taken in.** What is pasted from another program is taken in, as one passage; what is copied in Glaukopis is pasted as it is. A paragraph taken whole has a faint line beside it, taken words among the writer's own a faint dotted line under them. A passage keeps how it read when it was taken.
5. **Sources.** A source is a record of one of four sorts, shared by all that came from it: a file (its name, its own time, of a photograph when and where it was taken, read by the crate `kamadak-exif` before the file is copied), a page of the web (address, title, day), a reference of the library with a place in it, or the writer's own words for it. A file's source is given by the program. The rest is given in the window of a source, where it is also made a reference (the library's own window, filled in), a changed passage is brought back, and what was pasted and was the writer's own is said to be so.
6. **The files of notes are in the library's store and not among the library's files.** A record of a file says whether the notebook holds it beside the library (`also`) or alone (`only`). The library's lists, and what goes through them, leave out `only`. The library removing a file the notebook holds leaves it in the store for the note. When the notebook is first read in a run, it says which files its notes hold: one held alone that no note holds any more leaves the store.
7. **The page** (the route `notebook`, the third place in the row at the top, Ctrl+3): the notes at the left, newest first, found by their words, with **New note** and **Add files…**; the note chosen at the right with its name, its text, its sources and what became of it. Files dropped on the page are a note each; a paste while no text has the cursor is a new note.
8. **In a project**, **Notes** is the third tab of the document pane: the notes as cards of their pieces, found by words, dragged whole or piece by piece.
9. **The ways out are one conversion** (`src/lib/notebook/out.ts`), used wherever something of a note comes into a text of a project: dropped on a text being written, dropped on an element, put in from the menu, pasted. Own words arrive as they are. A passage arrives as paragraphs of the kind *Quotation* with the citation of its source after the last. Taken words within a paragraph of the writer's own stay, with the citation after them. An image arrives as a figure, and its file is from then one of the library's, with its origin. A file that is no image does not go into a text. A source that is no reference is made one first (a page of the web: *Web page* with its address, title and day), said in a message with **Show**; what has no source arrives without a citation. The note records where its pieces went.

## Tried

- **What the clipboard says of a page**, which the plan left to be tried on each system. With Firefox 159.0.1 on Linux, off-screen, a selection copied from a page at `http://host/a/b/page?x=1`: the clipboard carries `text/x-moz-url-priv`, the application reads it through GTK, and it says `http://host`. **Firefox says the site, not the page.** A paste from Firefox therefore has the site as its source by itself, and the rest of the address and the title are the writer's to add; the plugin is the sure way to the page. Not tried: Windows and macOS, where the paste is the web view's own and says nothing more than the words; other browsers.

## Chosen in the building, and not asked

The place and the page:

- The notebook's keys are Ctrl+3 for the place (free since the images lost theirs), and on the page Ctrl+F to find, Ctrl+N for a new note, and undo and redo for what is done to the notes outside a text. *Notes* in the document pane has no key of its own; the palette finds it.
- No note is chosen where the place names none. A new note takes the cursor in its text. After a deletion the neighbouring note is chosen, and **Undo** in the message brings the notes back.
- A note without a name is shown by how it begins; one that holds only a file, by the file's name.
- The list of notes is as wide as it was left (a setting of this computer). In a narrow window it stands over the note.
- The days in the list are said as the list of the library's files says them.

Taking in:

- A note's time is kept to the thousandth of a second, so that notes made one right after another stand in that order; files taken in together stand in the order they were given.
- A photograph that is turned upright, or made PNG, to be shown is a copy; the notebook holds the original too, and the source stands on both.
- What a photograph says is read from files that end as images do, up to 256 MB; a date that cannot be is passed over.
- A web page given by hand is dated by when its words were taken in.
- The same source again is the one that is there: a page by its address, a reference by itself and its place, words by the words, a file by its name and time.
- Pieces: a run of the writer's own paragraphs goes on across empty ones; a paragraph is taken whole by its text alone, whatever notes and citations stand in it.

The files:

- A file the notebook held alone that the library takes in, or that a reference is given, is the library's as well from then.
- *To the library* puts an image that was held alone among the images, as images taken in to be figures are; its origin is set where the record had none or only a path.
- The sweep holds, beside what the page says, what the notebook said when it was last saved, so that a page that read too little cannot take away a file a saved note holds; a file some reference still has is not removed.

The ways out:

- Own words that are one paragraph go in at the point, as a paste does; anything else stands as paragraphs of its own at the nearest place they can stand. Dropped on an element whose text is not being written, in the text or the diagram, it goes at the end of that text.
- Figures, tables and equations are given new ids on the way in, so that one dropped twice is two.
- Where a run of taken words ends in a space, no second space goes before its citation.
- A paste is converted where it holds taken words, a file, or an image the notebook holds alone; any other paste is untouched and costs nothing.
- After a paste the notes that hold the passages pasted say where they went; own words pasted cannot be traced to a note.
- Making a source a reference is part of the notebook's history: undone in the notebook, the source is no reference again, and the reference stays in the library.

## Left for later, and not forgotten

- The surface, boxes, tags, Join and Divide, links: stage 2, detailed in the plan.
- The plugin for Firefox, and a passage or a part of a page from a file read in Glaukopis: stage 3.
- The other filters, words read from images, lists to tick, starting texts, notes in the search through everything, the notebook as Org: stage 4. Import: stage 5.
- A reference in the library showing the notes that hold something from it: the notebook can say which (`notesFrom`); nothing shows it yet.
- A file of a note opened in a view leaves the page of the notebook for the window's sides.
- The words are in English and Bokmål; the other languages wait for the next round.

## Checked

`pnpm check`, `pnpm test`, `cargo test --workspace`, `cargo clippy --workspace --all-targets -- -D warnings`. Against the built application: `e2e/notebook.mjs` (38 checks: the place and its key, the empty page, notes written and found, a paste from outside and its source given by hand, My own words, files dropped, the hook for Add files, delete and undo, a second window, and the notes there after the application is closed and opened) and `e2e/notebook-out.mjs` (22 checks: the list in the pane, own words, a passage and an image dragged into a text, the reference made once, the file in the library's list, Used in, and the same by copy and paste); the commands of the shell by a script of their own; and the scripts of the parts it touches: the editor's twenty, `window-row`, `languages`, `pane-adding`, `picture-panel`, `files`, `library`, `file-view`, `image-editing`, `documents`, `associations`, `maps`, `tree-keys`, `ordering`, `as-left`, `windows`, `data-folder`.

## Addendum, 2026-11-19: the notebook stands in the library's place

On the owner's word: "Could you move the notebook from the main screen to inside Library, between References and Files?"

- **The notebook has no place of its own in the row at the top of the window any more.** It is in the library: *Notebook*, between *References* and *Files*, in the switch that stands in the row over the library (0097), which stands over the notebook's page as well. The row at the top has the house, the library and the list's button at its start.
- **The library's place is lit** while the notebook is shown, and goes back to whichever of the three was shown last: the references, the notebook or the files, each as it was left.
- **Ctrl+2 goes to the references**, as they were left, and no longer to whichever of the library's was shown last: with three in the library and a key for each of the other two, it would have done nothing in the notebook, as it did nothing in the files. **Ctrl+3 goes to the notebook** as before, from anywhere, and Ctrl+4 to the files; and everything that goes to a note (a note that has arrived, *Show*, what is found by the search, the list of notes in the document pane) goes there as before. The address is the same, `#/notebook`.
- **The page itself is as it was.**
- **Words**: the switch is named *References, the notebook or files*; its middle choice is *Notebook*, *Notatblokk*.
- **Choices not asked about**: that Ctrl+3 stays, with Ctrl+4 for the files, and what Ctrl+2 now does; that the library's place remembers the notebook as it remembers the files.
- **Checked**: `e2e/notebook.mjs` (no place of its own in the row; the switch with Notebook between References and Files, which goes there; Ctrl+3; the library's place lit and Notebook chosen in the switch; the library's place going back to the notebook) and `e2e/window-row.mjs` (the places of the row and their order in every view); `e2e/files.mjs`, which uses the switch. The guide says where it is.

## Addendum, 2026-11-23: the sweep judges what the notebook held when the run began

Found by reading, while the pictures of the owner's notes that do not open on the phone were looked into; it was not their cause (they wait behind a full home: the addendum of this day to record 0120).

- **The fault.** The page that reads the notebook asks for the sweep with the files its notes hold, and does not wait for it (`open.svelte.ts`). The first window takes what lies in the inbox as soon as the notebook is read (`arriving.svelte.ts`), which puts a picture into the store as the notebook's alone. Both wait for the library, and neither is first by any rule: since the synchronization came, its round at a start may hold the library while both wait. Where the taking came first, the sweep found a file the notebook held alone that was in no list, and took it out of the store with its record. What the plugin collects while the application is closed is taken in at exactly that moment, and is nowhere else once it has left the inbox. The same held for a picture pasted or a file dropped into a note in the first moments of a run, and for a file of the library dropped into a note then, whose mark was taken off.
- **The rule.** The sweep of a run judges only the files the notebook held when the run began, and of those none that a note was given since (`Library::notebook_sweep_of_run`). The library remembers which those are from the moment it is opened; every way a note is given a file takes the file out of them (`enter_held`, `notebook_hold`, the copy a figure shows). What became the notebook's in the run by any other way, as by what another device said, was not the notebook's when the run began, and is not judged either. It is all left to the sweep of the next run, whose list is read after it.
- **Why in the core and not in the page.** An order in the page would hold for the page that keeps it; the rule holds for whatever asks.
- **Not changed.** `Library::notebook_sweep` judges every file, as before: it is the rule itself, and what the tests of the rule and of the synchronization call.
- **Checked**: `the_sweep_of_a_run_judges_what_the_notebook_held_when_the_run_began_and_nothing_a_note_was_given_since` beside the code, and in the shell `a_picture_taken_from_the_inbox_before_the_sweep_is_kept_and_the_file_of_a_note_deleted_before_the_run_is_swept`, which failed with the sweep as it was.

