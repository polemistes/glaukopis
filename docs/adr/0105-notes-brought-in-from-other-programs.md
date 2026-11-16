# 0105 — Notes brought in from other programs

Date: 2026-11-16. Status: built on 2026-11-16, as stage 5 of `docs/plans/the-notebook.md`, from the owner's words of 2026-11-15 (`docs/brief.md`): "And of course import from other programs." It stands on records 0101, 0103 and 0104, and on the reading of documents (record 0012). OneNote's own files were added the same day, when the owner named a file to try them with.

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
   - **OneNote's own files**: a section (`.one`), or the folder of a notebook with its sections (its table of contents, `.onetoc2`, chosen, is that folder). Each page is a note: its title the name, when it was made, its paragraphs with what is bold, in italics, struck out, raised or lowered, its links, its lists, its tables, its pictures and the files held in it. A tag with a box is a point to tick; the other tags on its paragraphs are the tags of the note. A link to another page read with it is a link between the notes. Handwriting and drawings are not read, and **To know** says how many pages hold some. What OneNote had thrown away (`OneNote_RecycleBin`) is not brought in.
4. **How they stand in the notebook.** In a box of their own, named after what was imported, not placed on its surface, each not looked at (record 0104). Each keeps its name, when it was made and its tags. A note that says the page it was clipped from is taken in from that page, as one passage with the page as its source; any other is the writer's own words. A picture of the text is a figure; any other file stands at the end of its note. Notes that link to one another are linked in the notebook. All of it is one step of undo, and a message says how many were imported, with **Show**, and what could not be read.
5. **The files** of what is read are taken into the store as the notebook's while it reads, outside the library's lists (record 0101). Where the reading is stopped, or the notes are never made, no note holds them, and the notebook's sweep at the next start takes them out again.
6. **A list to tick** in any of them comes as points to tick, ticked as they were (record 0104): Markdown's `- [ ]`, Keep's lists, Evernote's boxes, OneNote's tags with a box.
7. **OneNote's files are read in a process of its own** (`isolated.rs`), within bounds of time and memory, as PDFs are: a file made to do harm must not take the application with it. That process hands over what it read as plain values, with the pictures and files of the pages written into the reading's own folder of work; the notes are made of those in the application.
8. **A program or a script is never handed to the system to be opened.** A file held in a page of OneNote, or in a note of Evernote, may be made to be pressed on: such files are how OneNote's files have been used to do harm. Every stored file is opened through one command of the shell (`attachment_open`), for the library's files as for those of notes, and that command now refuses a file whose ending is one the system starts (`library::files::is_program`). The file is kept as any other; a press on it says that Glaukopis starts no programs.

## Tried

- **OneNote's own files.** The crate `onenote_parser` 2.1.0 (MPL-2.0) was first left out for want of a file to test it with. The owner then named one: a section made for testing mail filters, with a batch file held in its page (`onenote_one_embedded_bat.one` of delivr.to's `file-samples`; what was saved was GitHub's page about the file, so the file itself was fetched from the same address). The crate reads it: the section's name, its one page with its title and time, the paragraph, and the file `test.bat` of 45 bytes. In the built application, through the process of its own: the page is a note in a box named after the file, the batch file stands at its end, and two presses on it start nothing and say so. That sample is licensed for no commercial use and is not in the repository; no file of OneNote is. One section of one page is all that was tried: lists, tables, pictures, tags and links between pages are tested only on values the tests write themselves.
- **No real export of the other programs was at hand.** Their readers are tested against small exports the tests write themselves, after what is known of each program's format. This is the first thing to be unsure of.

## Chosen in the building, and not asked

The window:

- Import notes… is a button of its own beside Add files, not an item of the menu at New note.
- Where nothing read holds anything, no box is made, and the window says nothing was found to import.
- The system's dialog for a file offers `.enex`, `.md`, `.markdown`, `.txt`, `.one` and `.onetoc2`, and no "all files".
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

OneNote:

- The sections of a notebook are not kept: its pages come into one box, as the folders of a folder of Markdown are not kept either. A page under a page is a note as any other.
- A tag with a box is told by its sign, whichever of OneNote's boxes it is; a paragraph with one is a point to tick whether it is a point of a list or not. The names of the other tags are tags of the note, each once.
- A heading is a paragraph in bold. What is underlined is not marked, as in documents brought in.
- A link stays a link where it leads to the web or is an address for a letter. A link into OneNote that names a page read with it is a link between the notes; of any other link (a file, a program, a page not read) the words are kept and the link is not.
- The name of a file held in a page is its last part, without the signs that turn the direction of writing, by which a name is made to look as if it ended otherwise than it does.
- The look reads the files, since nothing else says how many pages they hold: of a large notebook the count takes its time to come.
- The reading may take a minute and a second for each megabyte, twenty minutes at most, and memory as a PDF may; given up, it says which of the two ran out. A section or a page whose reading breaks off is said, and the rest are read.
- The test that reads a real section runs only where one is named (`GLAUKOPIS_ONENOTE_SAMPLE`; for the script, `GLAUKOPIS_E2E_ONENOTE`), and is passed over otherwise.

Programs and scripts:

- Which files are programs is told by the ending alone, from a list of what Windows, macOS and Linux start (`.exe`, `.bat`, `.cmd`, `.ps1`, `.vbs`, `.js`, `.hta`, `.lnk`, `.sh`, `.desktop`, `.command` and their like, and the scripts of languages that run by their ending).
- It holds for every stored file, the library's own too: a script the writer put in the library is not opened from Glaukopis either. It can still be shown in its folder from the library.

## Left for later

- Of OneNote: handwriting, mathematics, a notebook packed as one file (`.onepkg`), and its sections as something of the notebook's.
- Joplin's addresses of its files, and Notion's properties.
- Real exports and real notebooks, tried with a writer's own notes.
- The words in the other languages.

## Checked

`cargo test --workspace` (the readers' nineteen tests among them, with Pandoc), `cargo clippy --workspace --all-targets -- -D warnings`, `pnpm check`, `pnpm test` (what is read made notes; the window mounted, with the core's calls mocked). Against the built application, `e2e/notebook-import.mjs` (28 checks): a folder of three Markdown notes written by the script, looked at and shown before anything is made; imported into a box named after it, with the message and Show; the notes in the strip of the surface and not looked at; the note clipped from a page a passage with the page as its source, and its tags; the picture drawn in its note; the list to tick as points to tick; the two notes that link, linked; the tags in the column; Undo; a file named as a section of OneNote that is none, said to be unreadable as one; and, with the sample named, its page imported as a note and its batch file not started. With it, the other scripts of the notebook (`notebook`, `notebook-out`, `notebook-boxes`, `notebook-surface`, `notebook-from-file`, `notebook-plugin`, `notebook-search`, `notebook-finding`), `todo`, `languages`, and `preview`, `lists-brought-in`, `documents`, `mindmaps`, `kinds` and `org`, which the reading of documents and the kinds of paragraph touch.
