# 0105 — Notes brought in from other programs

Date: 2026-11-16. Status: built on 2026-11-16, as stage 5 of `docs/plans/the-notebook.md`, from the owner's words of 2026-11-15 (`docs/brief.md`): "And of course import from other programs." It stands on records 0101, 0103 and 0104, and on the reading of documents (record 0012).

## Context

- **Whoever comes from another program has notes there.** The plan names what is to be read: a folder of Markdown or text (Obsidian, Joplin, what Notion and Bear export), Evernote's and Google Keep's exports, and OneNote through its export to Word, with its own files to be tried.
- **Much of the reading was there**: Pandoc reads Markdown and HTML into the blocks of a text (documents brought in); the notebook takes files into the store as its own; the page makes notes in one step of undo.
- **A note is no document**: it has no title page and no tree of headings. It has a name, a time, tags, perhaps the page it was clipped from, files, and links to other notes.

## Decision

1. **Import notes…** on the notebook's page, a button beside **Add files…** and among the offers of the empty notebook, opens a window that asks for a folder or a file. What was chosen is looked at first and shown before anything is made: which program's notes they are, what the folder or the file is called, how many notes and how many pictures and files, and under **To know** what the writer should know first. **Import** reads them, with the count said in the window and **Stop**, which makes nothing.
2. **The core reads, the page makes.** `crates/core/src/import/notes` looks (`look`: without Pandoc, taking nothing in) and reads (`read`: note by note, counted, stopped between notes; a note that cannot be read is said and the rest are read). What it read is handed over as notes, each with a key, its name, when it was made, its tags, the page it was clipped from, its text as blocks, the files taken in for it and the keys of the notes it links to. `src/lib/notebook/importing.ts` makes them notes of the notebook.
3. **What is read.**
   - **A folder of Markdown or text**: every `.md`, `.markdown` and `.txt` under it is a note, and a TextBundle is one. Whose it is is told by what lies there: `.obsidian` (Obsidian), a TextBundle (Bear), `_resources` (Joplin), names that end in Notion's long number (Notion), else Markdown and text. The lines before a text say its title, its tags, when it was made and where it was clipped from. The name is that title, else the heading the text begins with (taken off the text), else the file's name; the time is the one said, else the file's own. The tags are those before the text and those in it (`#word`, and Bear's `#several words#`), which stay in the text. The text is read by Pandoc as Markdown with its lines kept, `[[links]]`, lists to tick and `==marked==` words, and without citations, so that `@name` stays a word. Pictures are found by their path, `![[name]]` by name anywhere under the folder. `[[Name]]` and a path to another note are links between the notes.
   - **Evernote's export**, a file `.enex` or a folder of them: the title, when it was made, the tags, the page it was clipped from, and its text, made HTML for Pandoc; its files are in the export itself. What Evernote keeps encrypted is passed over, and said once for the reading. The export does not say which note a link leads to: the words of such links are kept, the links are not, and **To know** says so before anything is read.
   - **Google Keep's export** through Takeout, the folder `Keep`: the title, the text or the list to tick, the labels as tags, the first page it names as where it was clipped from, when it was made. A note in the bin is passed over.
   - **OneNote's own files are not read.** Chosen, the window says so, and that OneNote can export a page or a section as a Word file, which is brought in as a document.
4. **How they stand in the notebook.** In a box of their own, named after what was imported, not placed on its surface, each not looked at (record 0104). Each keeps its name, when it was made and its tags. A note that says the page it was clipped from is taken in from that page, as one passage with the page as its source; any other is the writer's own words. A picture of the text is a figure; any other file stands at the end of its note. Notes that link to one another are linked in the notebook. All of it is one step of undo, and a message says how many were imported, with **Show**, and what could not be read.
5. **The files** of what is read are taken into the store as the notebook's while it reads, outside the library's lists (record 0101). Where the reading is stopped, or the notes are never made, no note holds them, and the notebook's sweep at the next start takes them out again.
6. **A list to tick** in any of them comes as points to tick, ticked as they were (record 0104): Markdown's `- [ ]`, Keep's lists, Evernote's boxes.

## Tried

- **OneNote's own files.** The crate `onenote_parser` 2.1.0 (MPL-2.0) builds here and offers to read a section or a notebook. It was not taken in: there was no file of OneNote to test it with (OneNote is not on this machine, the crate writes no files and ships no samples). Left out, as the plan allowed.
- **No real export of any of the programs was at hand.** The readers are tested against small exports the tests write themselves, after what is known of each program's format. This is the first thing to be unsure of.

## Chosen in the building, and not asked

The window:

- Import notes… is a button of its own beside Add files, not an item of the menu at New note.
- Where nothing read holds anything, no box is made, and the window says nothing was found to import.
- Of a file of OneNote no count is said, only what can be done, and Import is off.
- The system's dialog for a file offers `.enex`, `.md`, `.markdown`, `.txt` and `.one`, and no "all files".
- The message stays 8 seconds, 15 where something could not be read; it names the first three things that could not.

The notes made:

- A note that says no time is made now, in the order read.
- A box's name is taken whatever its capitals: the second *Vault* is *Vault 2*.
- The files of a note that was not clipped from a page have no source.
- In a note clipped from a page, the words of its paragraphs are taken in (those in tables and in parallel texts too), not what is said under a figure or a table, nor a note at the foot.
- A page that several notes of one import were clipped from is one source. Two notes that link to each other have one link.

The readers:

- The lines before a text are read by a small reader of the shapes notes have, not of all that YAML can say; what it does not know it passes over.
- A heading within a note is a paragraph in bold: a note has no tree.
- `[[name]]` is looked for in the note's own folder first. A path to a `.md` file is also found by the file's name, which is how Notion's pages under pages are found.
- The words of a link to another note stay, without the mark of a link: the link is the notebook's. A link to a page of the web stays a link. A link to another file in the folder takes that file in, at the end of the note.
- Raw HTML in Markdown is read where it is a line break or a picture, and dropped otherwise, as documents brought in do.
- Not read: Joplin's own addresses of its files (`:/id`), said as a picture that was not found; Notion's lines of properties, which stay text.
- Evernote: a paragraph that begins with a box is a point to tick; where several lines of one paragraph begin with boxes, each line is one. Files the text shows no picture of stand at the note's end. The source's title is the note's name.
- Keep: its pictures stand before the text, as Keep shows them; Takeout's mixing of `.jpg` and `.jpeg` is seen through; a note without a title has no name, and is shown by how it begins.
- One Markdown file chosen by itself finds its pictures by their paths only: the folder it lies in is not searched, so that a home folder is never walked.
- Not read: a note's file over 50 MB, an export of Evernote over 1 GB (it is read whole), a file of Keep over 16 MB; each is said.
- The files of Evernote's export are found by the MD5 of what they hold: the crate `md-5` (RustCrypto, already among what the application is built from) is taken in by the core for it, and credited.
- What a file taken in says of itself is defined in the core with the shape the shell's has (`HeldFile`, `NotebookFile`): twice, for now.

## Left for later

- OneNote's own files, when there is a file to test with.
- Joplin's addresses of its files, and Notion's properties.
- Real exports, tried with a writer's own notes.
- The words in the other languages.

## Checked

`cargo test --workspace` (the readers' nineteen tests among them, with Pandoc), `cargo clippy --workspace --all-targets -- -D warnings`, `pnpm check`, `pnpm test` (what is read made notes; the window mounted, with the core's calls mocked). Against the built application, `e2e/notebook-import.mjs` (28 checks): a folder of three Markdown notes written by the script, looked at and shown before anything is made; imported into a box named after it, with the message and Show; the notes in the strip of the surface and not looked at; the note clipped from a page a passage with the page as its source, and its tags; the picture drawn in its note; the list to tick as points to tick; the two notes that link, linked; the tags in the column; Undo; and a file of OneNote told to be one, with what can be done. With it, the other scripts of the notebook (`notebook`, `notebook-out`, `notebook-boxes`, `notebook-surface`, `notebook-from-file`, `notebook-plugin`, `notebook-search`, `notebook-finding`), `todo`, `languages`, and `preview`, `lists-brought-in`, `documents`, `mindmaps`, `kinds` and `org`, which the reading of documents and the kinds of paragraph touch.
