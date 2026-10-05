# 0031 — Folders of projects

Date: 2026-10-05. Status: accepted.

## Context

The page of projects shows every project as a card. After tens of projects
it is a wall; after hundreds, unusable. The projects of one writer fall into
groups, by subject or by period of their life, and the writer wants to put
them into folders and see the few last worked on without the rest. There
was also a wish, rarely to be used, to see all one's projects as one map.

## Decision

- **Two forms of the page**, chosen at its head and remembered: the last
  used projects as cards, at most twelve, as before; and all projects as a
  compact list, a line each, in folders that nest, with a field that finds
  a project by name. The list is made for hundreds: no cards, no pictures.
- **Folders are kept on this computer**, not in any project:
  `projects/folders.json` in the data directory holds the folders, each with
  an id, a name, its parent and an order, and which form the page shows; a
  project's own `project.json` says which folder it is in. A project is a
  document shared with others (ADR 0002), and where one writer puts it among
  their projects is nobody else's concern: a folder in the document would
  move the project about in every collaborator's list. `project.json` is
  already the file of what this computer keeps about a project and the
  document does not.
- **Deleting a folder keeps what is in it**: the folders and projects in it
  move up to where it was. A folder cannot be moved into itself or under
  itself; the core refuses it.
- **A map of the projects** is a new project, whose one map has the folders
  as elements, nested as the folders are, and under each the projects in it,
  with the description of each project as its text; or, when everything is
  wanted, under each project its maps, and under each map its tree of
  elements, names and texts copied as they are, so that citations keep their
  references. It is made by reading each project from disk without opening
  it for writing. It is a copy, not a view: the projects stay as they were,
  and the new project is theirs no longer.
- **A new project opens on its text** the first time: a project begins with
  writing, and the diagram is a key away.

## Why not otherwise

- *Folders in a setting*: the settings are the settings of the interface,
  and the folders are a thing of the projects, read and written beside them
  by the same code that lists them.
- *A folder as a field of the shared document*: see above; and a project
  that is not shared would carry a field only one computer reads.
- *A map that follows the projects as they change*: a view of all projects
  is a search, which exists (ADR 0019); a map that is also a copy is what
  can be rearranged, written in and exported, which is what a map is for.

## Consequences

- `ProjectInfo` gains `folder`; `Folder` is a type of the contract.
- A project whose folder is gone, as when `folders.json` is lost, is shown
  in no folder; nothing is broken by it.
- The map of the projects is not kept up to date with them, and the dialog
  says what does not come along: cross-references and comments.
