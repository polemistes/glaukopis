# 0036 — A project as one file

Date: 2026-10-08. Status: accepted.

## Context

The one the application is made for asked for projects to be saved and
opened as single files, with the references that are in both the file and
the library resolved in the process, unless they are identical.

A project is a folder of the data directory (`project.json`, its state, the
log of its changes, its history). It cites works by the ids of the library's
entries, and keeps a record of each work it cites (`refs` in the document),
so that a shared project is whole; its figures name pictures of the store by
the hash of what they hold.

## Decision

- **Save as a file…** (in the menu of a project, on the home page and in the
  pane of projects) writes a `.glaukopis` file: a zip of a `manifest.json`
  (the format, the name and description of the project, when it was
  written, by which version), the project's document as it is now (one state
  of Yjs, without its history and its log), the pictures of the store that
  its figures show, with what the store says of them, and `references.bib`,
  the works it cites as BibLaTeX, for anyone who would read them without
  Glaukopis. Before it is written, the record of each work cited is brought
  up to date from the library, so that the file carries the works as the
  library has them.
- **Open a project file…** (on the home page, and in the pane of projects)
  makes a new project of a file, with a new id, never in the place of one
  that is there; its name is the file's, with a number where a project of
  that name exists. Sharing does not come with it.
- **The pictures** are taken into the store by their hash: one the store has
  already is the same picture, and what the store says of it is kept; what
  it lacks is added.
- **The references** are resolved against the library, each by what the
  file's record of it is:
  - the library has an entry of the same id, and they are the same (type,
    key, fields and names): nothing is asked;
  - the library has an entry of the same id, and they differ: the choice is
    to keep the library's (the project then shows the library's), to take
    the file's into the library, or to keep both, the file's as a new entry;
  - the library has no entry of the id, and none like it: it is added to the
    library under its id, so that the citations hold as they are;
  - the library has no entry of the id but one that is the same work by its
    DOI, its ISBN or its title, authors and year (as `duplicates` finds): the
    choice is to cite the library's (it may gain what it lacks from the
    file's), or to add the file's as another work.
  The choices are made in one dialog before the project is made; what is
  not asked is said. Where a reference is to be cited by another id than it
  has in the file, the citations of the project are written anew to that id,
  and its record with them.
- Everything in the project's document comes with it, its comments among
  them. The views of its maps, the folder it was in and its history do not,
  nor attachments of the library, which are the library's own.

## Consequences

- A project file can be opened more than once, each time as a project of
  its own.
