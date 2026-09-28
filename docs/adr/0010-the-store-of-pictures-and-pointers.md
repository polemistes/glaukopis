# 0010 — The store of pictures, and words that point

Date: 2026-09-28. Status: accepted. Replaces, of ADR 0009, where pictures are
kept and how figures are numbered where the text is written.

## Context

ADR 0009 kept the pictures of a project with the project. The one the
application is made for asked for something else, the same day: a store of
pictures, to be looked at for the map, for the project and whole, "somehow
like references"; with captions and notes of their own; and one in which
"all projects and maps using an imported picture" share the same. And for a
way to refer to what stands in the text, and to the parts of the document.

## Decision

### The store

- **Pictures are kept in one store for the application**, beside the library:
  `pictures/files/<hash>.<extension>`, named by the SHA-256 of what they
  hold as before, and `pictures/pictures.json` with what is known and said
  of each. A project keeps no pictures. What projects kept by themselves is
  taken into the store when the application starts.
- **A picture and a figure are two things.** The picture is the file, with
  what is said of it in the store. A figure is a picture as it stands in a
  text: it names its picture, and has a caption, a width and a number of its
  own.
- **The store keeps, of each picture**: what it is called; a caption, which
  figures made with the picture begin with; what it shows, in words; and
  notes. The caption is text with marks, as the interface keeps text; the
  core keeps it without reading it.
- **The caption of a figure is the figure's own.** It begins as that of the
  picture and can be changed without changing it; it can be kept with the
  picture, and taken from it again. Nothing is changed behind the writer's
  back in texts that are written.
- **Notes are of two kinds, as those on references are** (ADR 0008): for all
  projects, in the store; and for a project, in the project, under the key
  `picture:<hash>` among its notes, where they are with everyone the project
  is shared with.
- **Which pictures a project uses is read from its texts**, not kept apart:
  a picture belongs to a map and to a project by being a figure there, as a
  reference does by being cited. Each project says in what is kept about it
  (`project.json`) which pictures it uses, so that the store can say where
  a picture is used without opening the projects.
- **A shared project sends the pictures of its figures**, and no other
  picture of the store. What arrives from the others goes into the store.

### Words that point

- **A pointer is part of the text**, as a citation is: it names what it
  points to and how, and what it says is made where it is shown and where
  the document is made. It says what the document calls the thing: the word
  of the format and the number for a figure, the number as it stands beside
  it for an equation, the number or the name for a part.
- **Figures and equations are pointed to by ids of their own**, given when
  they are made. A part of the document is pointed to by the id of the
  element it is made from. One that is copied within a text is given an id
  of its own; one that is moved keeps its id, so that what points to it
  still does.
- **The numbers are counted in one place for the interface**
  (`figures/numbering.svelte.ts`), from what is kept about each element,
  as the core counts them when the document is made. They are the numbers
  of the document of the map, through maps that stand in the place of
  elements. Figures and equations are no longer numbered by the page where
  the text is written (ADR 0009): the box of an element in the diagram
  showed *Figure 1* for every first figure.
- **In PDF, LaTeX, Typst, Markdown and HTML a pointer leads** to what it
  points to. In Word and OpenDocument it is words: a link is set in colour
  there, which a manuscript is not to have.
- **What points to nothing is shown as such**, where the text is written and
  in the document, and the preview remarks on it.

## Consequences

- A picture removed from the store is removed for every project. The store
  says where it is used before it is removed.
- A picture stays in the store when no figure uses it any more. That is what
  a store is for.
- A figure copied to another project arrives with its picture, since there
  is one store.
- The word before the number of a part, *section* or *chapter*, is written
  by the writer. So are *see* and *cf.*
- Notes cannot be pointed to yet, nor pages.
- An element that stands twice in a document, where a map is in the place of
  an element of another more than once, is pointed to where it stands first.

## Alternatives considered

- *A store for each project, with copying between them*: what was asked for
  is the opposite.
- *Captions kept only in the store*, so that changing one changes every
  figure: a figure in a text that is written would change without the one
  who wrote it knowing, and a shared project would say different things to
  different people.
- *References made by the programs that set the pages* (`\ref`, `@label`,
  fields in Word): each counts in its own way, and the application numbers
  figures itself (ADR 0009).
