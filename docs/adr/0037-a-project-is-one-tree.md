# 0037 — A project is one tree, entered at any element

Date: 2026-10-11. Status: accepted. Stages 1 and 2 built on 2026-10-11; stage 3, templates, to come.

## Context

A project held maps, and a map held a centre, elements under it, and loose
elements beside it (ADR 0003). The one the application is made for found the
hierarchy hard to tell: the map was itself an element of the map; a thought
beside it was of a third kind; a centre could not be deleted, moved or
outdented into, and a command was needed to make a loose element the centre.
A first remedy, maps of several top elements and no centre, was weighed and
set aside: it left the question of what a map is.

They described how they work: several trees in a project in which nothing is
yet part of the text; the elements that will be are moved into a fitting
hierarchy later; one of the trees becomes the document, while a small project
is the document itself. They want everything in the application seen as one
map, from the owl down to a paragraph, any element printable as a document,
and templates to attach to elements later. Nobody uses the application in
earnest yet: what is there need only open and look right.

## Decision

- **A project is one tree.** Its document keeps the elements as before, in
  one table; the table of maps goes. One element, with the fixed id
  `project`, is the top: its name is the project's name, its text the
  project's preamble, it has no parent, and it cannot be moved, copied, cut
  or deleted, since to delete it is to trash the project. Every other element
  has a parent. There are no loose elements: a thought with no place yet is a
  tree of its own under the project, or sits in one.
- **A view is an element of a project.** The diagram draws the element in
  view at the centre, its branch balanced to both sides as the centre was
  drawn, and never folded; the text reads the branch as a document; the
  timeline shows it, each of its children a lane unless lanes are chosen on
  it. An element is entered by a button on it, by Ctrl+Enter, or from its
  menu; Alt+Up, or the parent's name in the bar, goes up. The router keeps
  the project and the element in view. Positions are relative to the parent,
  as before, so an element placed by hand stands the same from above and
  from within.
- **Any element is a document.** Printing it: its name is the title, its
  text stands before the first section, its children are the sections at the
  first level, and so on down, as a map's centre was printed. *Leave out of
  the document* is the one mark: it leaves the element and all under it out
  of any document that holds it, and is as good a place as any for what is
  not yet decided.
- **What was said of a map is said of an element, and inherited.** The
  document settings (title, subtitle, authors, abstract, keywords, date,
  style, format, language, cover) and the timeline's axis and unit sit on
  elements. What an element does not set is taken from the nearest ancestor
  that sets it, then from the application's defaults; the interface shows
  where an inherited value comes from. The title, the subtitle and the
  abstract are an element's own, never inherited: a chapter printed alone is
  not titled as the book. The title is the element's name until a title is
  written, shown as a placeholder and never copied, so that the two cannot
  drift apart. The lanes of a timeline are of the element in view. The kinds
  in hand are of the project.
- **Templates, when they come**, are named by id in those settings as the
  format and the citation style are, and bundle fields, format and style;
  the default is the title field alone. Nothing more of them is decided here.
- **An element may include another element** of the project, as it could
  include a map; a loop is refused. In the document the including element's
  name is the heading, the included element's text follows, and its children
  stand one level below.
- **Where one is, is always shown**, fully in one place and briefly
  elsewhere, since an element is entered as much to hide the rest of the
  project as to see the part. The pane of projects expands to the whole
  tree: folders, projects, and under an open project its elements down to
  the one in view, which is marked; a closed project is read when expanded,
  as the search reads it. In the bar over the map, where the map's name stood
  and pulled the maps down, stands the name of the element in view, pulling
  down its siblings, and before it, small, the parent's name, which goes up.
- **Side by side may show two projects.** When it does, the project's name
  stands in full in both bars with its badge, the divider is doubled, and a
  drop across it says what it will do before it is released: across projects
  a move is a copy there and a removal here (ADR 0033).
- **The owl map** is a third form of the home page, beside the cards and the
  list: the owl at the centre, the folders as plain labels without a box,
  nesting as they do, the projects as cards, one badge for a project shared
  and another for one joined, laid out automatically. Entering a project
  opens it; going up from the project element returns here. Its elements
  look unlike those in a project, so that the top map is not taken for one.
  The badge of a project is the same here, in the pane and in the bar.
- **Old projects open as they are.** A document with a table of maps is
  changed once on opening, outside undo: the project element is made with
  the project's name; each map's centre becomes a child of it in the maps'
  order, folded, with the map's settings on it; the map's loose elements
  become children of the project after the maps; what included a map
  includes its centre; the table of maps goes. The past is read through the
  same change, so that the history shows one shape. A project shared across
  versions must be opened by the new one on every side.
- **In three stages**, each of use alone: the project as one tree, entered
  and left, with the pane, the bar and the split as above; the owl map; the
  templates.

## Why not otherwise

- *Maps of several top elements, no centre*: simpler than before, but a map
  remained a thing beside elements, loose elements still needed a rule for
  printing, and a document still had to be named. An element that is both a
  place in the tree and a document needs none of that.
- *A flag on each element for what is in the document*: the one who writes
  moves elements into the document's tree when they are ready; a flag would
  say again what the place says. Exclusion remains for the exceptions.
- *Documents designated on chosen elements*, so that the diagram could show
  which tree is the manuscript: every element prints, so there is nothing to
  designate; the tree's name says what it is.
- *The owl map as the only home page*: the list is made for hundreds of
  projects and the search is in it; the map is a picture of the same list.

## Consequences

- Everything keyed by a map is keyed by an element: document, preview,
  export, timeline, search, history, the router, the dialogs that pick a
  map. *New map*, *Duplicate map*, *A map from a document…*, *New map from
  this branch*, *Copy to map* and *Move to map* go, or become the plain
  making, copying and moving of elements, with a tree to choose the target
  in. ADR 0003 is superseded in its first three points and its fifth; ADRs
  0012, 0018, 0026, 0031, 0033 and 0034 hold with "map" read as "element": a
  document brought in, a PDF read, the library, the words of a language and
  the map of the projects each become a tree under the element in view.
- The words of the interface change wherever they name maps, in every
  language; "map" stays the word for the view of an element.
- The project's text takes the place of its description on the cards and in
  its dialog.
- The map of the projects (ADR 0031) remains as a copy that can be exported;
  the owl map is the live picture.
- Every end-to-end script waits for the centre of a map; all are revisited.
