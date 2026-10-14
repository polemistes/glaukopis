# 0043 — The files of the library

Date: 2026-10-14. Status: accepted by the owner on 2026-10-14; to be built from `docs/plans/the-files-of-the-library.md`. Amends 0004 (files stored by hash and named in the `file` field) and 0018 (where a PDF of the library is made searchable or read).

## Context

Files that belong to references have been kept since the start: copied into `library/attachments/` under the hash of their content, named in the entry's `file` field, which Zotero and JabRef read too, and reached only from the pane of the one reference they belong to, where a PDF can be opened, made searchable or read into elements. A file was deleted when the last reference that named it was removed, and could not exist without one.

The owner has a store of hundreds of PDFs, books and articles, kept in folders, and a library with references to most of them, and wants the store inside Glaukopis: every file findable, each with its reference where it has one, assigned by hand where the machine cannot tell, never removed behind the writer's back, and exportable again in folders under readable names. Whether the files should share one store with the pictures, ordered by kind of file, was asked and weighed. A first proposal, that every file must have a reference and that files go with their references, was set aside at the owner's objection: it would estrange the writer from how things belong together.

## Decision

### Two stores, one line between them

- **The files of the library stay a store of their own**, beside the pictures. A picture is material of a document: it has a caption and what it shows, it is sent to those who share the project and travels in the project file. A file of the library is a source: it is read, it belongs to references, and it is private to this computer. The same JPEG can be either; what divides them is their role, not their kind, so there is no store by kind of file.
- **A file crosses on purpose.** *Take into the pictures*, from a file of the library, makes a picture of it, so that it can become a figure. *Attach to a reference…*, from a picture of the store, makes a file of it. Each store keeps its own copy under its hash.
- **Any kind of file is taken.** What can be done with a file depends on its kind. A PDF is opened, made searchable, or read into elements. A picture is opened, has its text read into elements, or is taken into the pictures. A document Pandoc reads (Word, OpenDocument, EPUB, HTML, Markdown, Org, plain text) is opened or brought in as elements. Anything else is kept and opened with the system's program. Nothing is turned away at the door: the import from Zotero brings whatever Zotero had.

### Files, references and folders

- **A file may belong to no reference, to one, or to several**: a chapter and its book, a review and the work. The store keeps the file once. A file that belongs to none is *unassigned*, which the files view shows and filters by, so that what remains to be gone through is a click away any day, not only on the day of the import.
- **Files are never removed with a reference.** Removing a reference leaves its files in the store, unassigned, unless *Remove its files too* is ticked in the confirmation, which removes those that belong to no other reference. A file leaves the store only by *Remove* on the file itself, which says which references it belongs to before it goes.
- **Folders of their own, nested.** Each has a name, a parent and an order; a file stands in one folder, or at the top in none. The folders are not the collections: a collection is a selection of works, and a work may be in several; a folder is where a file is kept, one place each. Deleting a folder moves what is in it up to where the folder was. A folder taken in from disk keeps its structure: its subfolders become folders of the store.
- **The record.** `library/files.json`, beside the store, holds the folders and, of each file, its hash, its stored path, its name, its folder, where it came from and when it was taken in. The files on disk stay under `library/attachments/<2>/<hash>/<name>` as they are, and the entries of the library keep naming them by stored path. Mirroring the folders on disk would read better in a file manager, and the paths in the BibLaTeX file would mean something to other programs; but every move or rename would then move files and rewrite the paths in every reference that names them, and a crash between the two would leave the library pointing at nothing. The readable layout is had from the export instead. Files in the store that the record does not know, from before this record, are entered into it when the library is read, in no folder.

### The files view

- **A view of its own, in the library's place.** A switch at the head of the library, *References* and *Files*; the rail's library place is current for both. The tree of folders stands at the left, where the collections stand for references; the files of the folder in view at the right, one line each, with the name, the kind, the size and the reference; filters by kind and *unassigned only*; a search over the folder in view or over all; several selected at once; dragging between folders.
- **The pane of a file** shows its name, its folder, the references it belongs to, each a link, where it came from and when, its kind, its size, and for a PDF how many pages it has and whether it has text; and the actions of its kind, then *Assign to a reference…*, *Move to folder*, *Rename*, *Export…* and *Remove*. The pane of a reference keeps its list of files, with the same actions.
- **Taking in.** *Add files…* and *Add a folder…* at the head, and files or folders dropped on the view, into the folder in view, a folder with its structure. Taking in copies; a file whose content is in the store already is the same file, said so and left where it was. A PDF dropped on the references, or added to a reference, is taken as today: it becomes a reference, or a file of the one it was dropped on, and stands in the record in no folder.

### The going-through

Assigning files to references is a step the writer goes through, with the machine proposing and the writer deciding.

- **Finding out** goes on in the background over the files chosen, several at a time, with how far it has come shown and a way to stop. Of each file is found out what the PDF import finds out today: a DOI, an ISBN or an arXiv number in its first pages, read by Tesseract where it is a scan, and a title and authors in its metadata. New are what its **name** says, parsed as the common schemes name files (*Author - Year - Title*, *Author_Year_Title*, *Author (Year) Title*, *AuthorYear Title*), and what its **first page** says, where a line or two of it agrees with the title of a work in the library whose author's name is on the page.
- **Proposing.** A work of the library found by an identifier is proposed for certain; one found by name or by first page is proposed as probable; where an identifier is known to the services and not to the library, a new reference is proposed from what they say. The reason stands beside every proposal, in words.
- **Deciding.** A list, one row a file, with its proposal; for each, *This one*, *Another…*, which searches the library as when citing, *New reference…*, from the lookup or from the form, or *Later*. A row at the head answers for all in the same case, as the import has. The window may be closed at any time: what was decided is kept, and what is left stays unassigned and visible.

### Exporting

- **A folder, chosen files or the whole store** is written into a folder the writer chooses: the folders of the store become folders on disk; every file is named by its reference where it has one, *Author Year - Title*, with the editors where there are no authors, and by its own name where it has none; a second file of one work keeps its own name after the dash; names that would collide are numbered. Beside the files, when asked, a `references.bib` of the works concerned, whose `file` fields name the exported files by relative path, so that another program reads the export whole.

### What stays as it is

Files are not shared with a project and do not go into a project file; the pictures do both. A PDF made searchable takes the place of its scan in the store, and the record follows it: the new file keeps the folder, the name and the origin of the old. The import from Zotero brings the files of its references into the store in no folder.

## Later

- The pages of a PDF shown within the application, so that a file is read where it is cited.
- A note on a file, as a picture has one; for now what is said of a work is said in its reference's notes.
- Folders for the pictures, should the store of pictures grow the same way.

## Consequences

- `library/files.json` is new; what the interface knows of a file grows by what the record says. The `file` field of the entries keeps its form.
- Unlinking a file from a reference and removing references stop deleting files; the one way out of the store is the file's own removal.
- The PDF import's finding-out is shared with the going-through, and gains the name and the first page.
- The guide gains a section on the files of the library; the sentences on attachments under *Working together* and *Keeping things safe* are kept true.
- The words of the other languages lag, as usual.

## Why not otherwise

- *One store for pictures and files, by kind of file*: the role divides them, and the stores differ in what is shared and what travels; a photograph meant as a figure and a scan of an article's page look alike and are not alike.
- *Every file must have a reference, made by the machine where none is found*: the owner's objection, and a right one; files would go with references they were never really of, and the writer would not know how things belong together.
- *Folders on disk*: see the record above.
- *The collections as the folders of files*: a file without a reference has no collection, and a reference may be in many; files want one place each.
