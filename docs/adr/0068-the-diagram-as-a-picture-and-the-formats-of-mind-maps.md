# 0068 — The diagram as a picture, and the formats of mind maps

Date: 2026-10-26. Status: accepted by the owner on 2026-10-26 ("Do also 3-5"), from the owner's request of 2026-10-26 (two more export formats, the diagram as SVG and as an image) and their question about the formats of mind maps that could be imported and exported; to be built from `docs/plans/the-diagram-as-a-picture-and-the-formats-of-mind-maps.md`. The picture (stages 1 and 2 of the plan) is asked for; the formats (stages 3 to 5) are proposed, and await the owner's word. Relates to 0005 (export through Pandoc and Typst: this one does not go through them), 0012 (documents brought in: OPML is among them), 0033 (elements in a form another project can take: what a mind map file carries), 0036 and 0041 (a project saved as one file and as Org: the forms a project is saved as today), 0050 (the diagram behaves as a tree), 0052 (nothing fails quietly), 0065 (fewer words).

## Context

The owner asks for the diagram as SVG and as an image, and whether there are other well-known formats of mind maps that Glaukopis could import and export.

What was found:

- **What the diagram is made of.** The diagram is drawn by the page, not by the core. `layout.ts` places each element's box (`Placed`: centre, width, height, side, depth) from sizes the boxes report of themselves; `lines.ts` gives the straight line from each element to the one it stands under and the curve of each association, with the point where its label stands. `MapDiagram.svelte` draws them in one `svg.lines` inside a `div.world` that the camera moves and scales (`transform: translate() scale(k)`), the labels of associations as spans over it, and the comment cards; `DiagramNode.svelte` draws each box: the name as HTML with the four marks a name can have (italics, small capitals, raised, lowered: `titleHtml`), the marks after it (status with its word count, a clone, text, left out, open comments), the fold badge with the count of what is hidden, the corner button, the association handle, the initials of the others who are at the element. The styles are the theme's tokens in `app.css` (light, dark, mellow and the user's own), the fonts Literata Variable and Inter Variable, which come with the application from `@fontsource-variable`, split into files by range of letters (Latin 52 KB, Latin extended 43 KB, Greek, Cyrillic, Vietnamese each their own) and declared with `unicode-range`. What the picture should show is therefore on the screen already, laid out, wrapped and coloured; what it should not show is also there (selection, hover, buttons, handles, the others, the cards).
- **How files are made today.** The Export dialog of the typesetting pane offers the kinds of file the core makes of the document through Pandoc and Typst (`ExportDialog.svelte`, `documentExport`, `Target` in `export/mod.rs`), with the save dialog of the dialog plugin and a *Show in folder* after. The project's menu in the list has *Save as a file…* and *Save as Org…* (`project-actions.svelte.ts`), the *+* at the head of the list *A project from a document…*, *Open a project file…* and *Open an Org file…*. Bytes the page has made cross to the core in a raw request with a head before them (`project_file_write`, `withHead`); no command writes bytes the page made to a path the user chose, and none reads a file's bytes for the page.
- **What the webview can do.** Linux has WebKitGTK (2.54 here), Windows WebView2 (Chromium), macOS WKWebView. In all three a page can turn an SVG string into an image, draw it on a canvas and read the canvas back as PNG, as long as the SVG holds no `foreignObject`; an SVG shown as an image sees none of the page's fonts, only fonts embedded in it as data. Canvases have a largest size (16384 pixels a side in the engines of today). `resvg` is in the dependency tree through `typst-pdf`, but reads no WOFF2 and knows nothing of the fonts the application ships; Typst's own fonts are not the diagram's.
- **What a project has that a mind map file can take.** Elements with a name (and its four marks), a text (paragraphs of kinds, lists, quotations, notes, citations, figures, tables, equations), a kind of the project's own, a status (idea, draft, done), a time, whether it is folded, whether it is left out of the document, where it was put by hand; associations with a few words. `portable.ts` already gives exactly this of any element with all under it, in a form that holds nothing of the project (`Portable`: elements with name, text, facts, children; links; kinds; references), and `makePortable` lays such a form into a project; `intoProject` makes a project of an Org form the same way. Comments, the standing of a clone and pictures do not cross, by that record. The paste path parses HTML into the editor's model (`DOMParser.fromSchema` in `editor/clipboard.ts`); the core has the `zip` crate, and reads OPML as a document through Pandoc (`Format::Opml` in `import/document.rs`).
- **The formats of mind maps.** The file of **Freeplane** and **FreeMind** (`.mm`) is XML, open, and read and written by nearly every mind map program there is (XMind, MindManager, MindMeister, Coggle, SimpleMind, iThoughts, the plug-ins of Obsidian and Logseq): the lingua franca of the field. It carries a tree of nodes with a text (plain, or HTML for a rich name), notes as HTML, folding, the side of a first-level node, icons, attributes (name and value), and arrow links between any two nodes with labels; FreeMind is unmaintained since 2014 and Freeplane is its living fork, whose files FreeMind still opens. **XMind** (`.xmind`) is the program most used; its file is a zip, with `content.xml` in XMind 8 and `content.json` since XMind 2020, and both are read by the current program: sheets with a tree of topics, notes (plain and HTML), labels, markers (among them the task markers from not begun to done), folding of a branch, and relationships with a title. **OPML** is the outline format that outliners (Workflowy, Dynalist, OmniOutliner, Logseq) and feed readers share: a tree of `outline` elements with a text and, by convention, a `_note`; no associations. Pandoc reads and writes it, and Glaukopis reads it as a document already. **Markdown lists and headings** are what the newer tools build maps from (Markmap, the mind map plug-ins of Obsidian, XMind's import), and Glaukopis writes and reads Markdown already. **Mermaid** and **PlantUML** have mind map diagrams in text, hierarchy only, rendered by GitHub, GitLab and Notion. The rest are proprietary or small: MindManager (`.mmap`, a zip of undocumented XML), iThoughts (`.itmz`), SimpleMind (`.smmx`), MindNode (a bundle of property lists), MindMeister (a web program, exporting `.mm`), Scapple (writers' freeform notes with connections, no tree), CmapTools (`.cxl`, concept maps whose links are phrases), TheBrain; every one of them reads or writes `.mm` or OPML.

## Decision

### The diagram as a picture

- **Two items in the menu of the diagram's background**, after *Show the whole map* and *Tidy the whole map*: ***Save the diagram as SVG…*** and ***Save the diagram as an image…***. Each asks where with the save dialog, the file named after the element in view (as a document is named after the element printed), and says in a message that the diagram was saved, with the file's name and, for the image, its size in pixels. The Export dialog is the document's and stays so.
- **The picture is the diagram as it stands**: the element in view in the middle, what is unfolded under it where it is laid out or was put, the lines of the hierarchy, the associations with their words, each box with its name and the name's marks, the kind's colour at its edge, the status and its count of words, the marks of text, clone and left out, the badge of what is folded with its count; the colours of the theme in use, the background filled with the canvas colour, a margin of 48 pixels around the whole. Not in it: the selection, what is lit under the pointer, the buttons at the corners, the association handles, the initials of the others, the comment cards and the mark of open comments, the frame of a selection being drawn. Folded stays folded: whoever wants the whole tree unfolds it first.
- **Drawn from the screen.** The SVG is written by the page from what is drawn: the boxes' places and computed styles, the line boxes of the names as the browser broke them, the icons as the inline SVG they are, the lines and curves of `svg.lines` with their computed strokes. Nothing is styled a second time by hand, so the picture follows every theme, the user's own included, and whatever is later changed in the diagram's look. One unit of the SVG is one pixel of the diagram at its actual size, whatever the zoom.
- **The fonts go into the file**, as `@font-face` with the WOFF2 data of the files the page itself uses, only the ranges of letters and the styles (upright, italic) that the picture needs: a Latin map adds about 100 KB, and looks the same in every browser, Inkscape and LibreOffice. The names in the SVG stay text, to be found and copied. Where the fonts cannot be read from the page's stylesheets, the file is written without them, naming the fonts, and the message says so.
- **The image is a PNG** at two pixels for every pixel of the diagram, made in the page from the same SVG drawn on a canvas; where that would exceed what a canvas can be (16384 pixels a side), the scale is lowered to fit, and the message says the size. Where the engine will not draw the SVG on a canvas or will not use its fonts there, the shapes are drawn on the canvas directly, from the same list the SVG is written from; the plan has the builder settle this in the harness before building further.
- **One new command of the core writes bytes** the page has made to a path the user chose (`file_write`, atomically, as the core writes files), and one reads a file's bytes for the page (`file_read`, bounded), for the formats below. Both say what went wrong.

### The formats of mind maps (if the owner says so)

- **Freeplane and FreeMind (`.mm`), in and out.** The format every program reads; written as Freeplane 1.x writes it, which FreeMind opens.
- **XMind (`.xmind`), in and out.** Read from `content.json` where there is one, else from `content.xml`; written with both, so that XMind 8 and the XMind of today read it.
- **OPML, out.** It is read already, as a document (*A project from a document…*).
- **Where**: ***Open a mind map…*** in the *+* at the head of the list, beside *Open an Org file…*, for `.mm`, `.xmind` and FreeMind's files, and a dropped file of these kinds makes a project as a dropped document does; ***Save as a mind map…*** in the project's menu, after *Save as Org…*, one item, the kind chosen among the save dialog's filters (Freeplane, XMind, OPML) and read from the ending of the name.
- **What crosses**, both ways where the format has it:

  | Glaukopis | Freeplane `.mm` | XMind | OPML |
  | --- | --- | --- | --- |
  | The project's name | the root node's text | the sheet's title and the root topic | the head's title and the one outline |
  | An element's name, with its marks | `TEXT`; `richcontent TYPE="NODE"` as HTML where it has marks | `title` (plain) | `text` (plain) |
  | Its text | `richcontent TYPE="NOTE"` as HTML | `notes.realHTML` and `notes.plain`; `notes/html` and `notes/plain` in XML | `_note`, plain |
  | Folded | `FOLDED="true"` | `branch: "folded"` | — |
  | Status | icons `idea`, `pencil`, `button_ok` | markers `task-start`, `task-half`, `task-done`; any other task marker reads as a draft | — |
  | Kind | attribute *Kind*, and the edge in the kind's colour | a label with the kind's name | — |
  | Time | attribute *Time* | a label *Time: …* | — |
  | Left out of the document | attribute *Left out* | a label *Left out* | — |
  | Side of a first-level element | `POSITION="left"`/`"right"` | — | — |
  | Associations and their words | `arrowlink` with `DESTINATION` and `MIDDLE_LABEL`, no arrowheads | `relationships` with `end1Id`, `end2Id`, `title` | — |
  | Citations in the text | the words of author and year, with the pages: *(Nagy 1979, 12)* | the same | the same |
  | Notes in the text | in square brackets where they stand | the same | the same |
  | Figures, tables, equations | the caption; an HTML table; the equation's source | the same | the caption or source |

  Positions of elements moved by hand, pictures, comments, clones' standing, the look of documents and the project's references as records do not cross. Several sheets of an XMind file become elements under the project, one each, with the sheet's root under it; floating topics stand under the sheet's root. Reading a file says what was left out and how much (images, clouds, summaries, boundaries, hyperlinks, unknown icons), as a document brought in says of itself.
- **Not**: Mermaid, PlantUML and Markdown outlines (hierarchy only, and Markdown is there), MindManager, iThoughts, SimpleMind, MindNode, MindMeister, Scapple, CmapTools, GraphML. Each would be a menu item and a reader for what `.mm` and OPML already reach.

## Choices made in writing this, which the owner has not been asked about

1. The two items stand in the diagram's own menu, not in the Export dialog: the picture is of the map on the screen, folded as it is folded and entered where it is entered, while the Export dialog makes documents of an element through the core, and may be open for another side.
2. The picture shows what the map says and not the conversation about it: open comments, their cards and their counts are left out, as are the collaborators' initials.
3. The colours are those of the theme in use, the background filled: a user who wants a light picture from a dark screen switches the theme first. No choice of transparent background.
4. The fonts are always put into the SVG, by the ranges needed, with no checkbox: a picture is meant to look the same everywhere, and the cost is about 100 KB for a Latin map.
5. The image is made at two pixels a pixel and nothing is asked: the SVG is the form that scales. A choice of size would be one more dialog.
6. The file is named after the element in view, as a document after the element printed.
7. The fold badge with its count is in the picture (it says something is there), the mark of text too; the hover-only corner button and handle are not.
8. Of the formats, `.mm` and XMind both ways and OPML out; nothing else. One item saves as a mind map and the filter chooses the kind, rather than three items.
9. Statuses map to Freeplane's `idea`, `pencil` and `button_ok` icons and to XMind's task markers (start, half, done); kinds become an attribute and the edge's colour in Freeplane, a label in XMind. Nothing is invented in the files beyond what the programs show.
10. Texts cross as HTML in notes, citations as the words of author and year with their pages, since neither program has citations; the project's records of the works are not written into the file.
11. Positions given by hand do not cross either way: Freeplane's offsets and Glaukopis's places are measured differently, and *Tidy* lays out a map in a moment.
12. Several sheets of an XMind file become elements under the project rather than several projects.

## Why not otherwise

- **Not the core drawing the SVG from the model.** It would need a layout of its own, the measuring of names in the fonts and a second rendering kept alike with the page's; the page has all of it drawn already.
- **Not a library that photographs HTML** (html2canvas, html-to-image, dom-to-image). They serialise the whole DOM into a `foreignObject`, which canvases refuse to read back in WebKit, and they are large dependencies for a known handful of shapes.
- **Not `resvg` in the core for the image.** It is in the tree, but reads no WOFF2, and the fonts of the diagram are the page's; the page draws the same SVG itself with its own fonts.
- **Not OPML through Pandoc from the document export.** That pipeline makes documents, with title pages, parts and page breaks; an outline of names and notes is a few lines in the page, beside the other writers.
- **Not Mermaid or PlantUML.** Hierarchy only, no associations, and every host that renders them takes Markdown too.

## Consequences

- A module of the diagram's picture (`src/lib/project/diagram/picture.ts` and its PNG), two items and their words in `diagram.ftl`, two commands of the core (`file_write`, `file_read`) in `commands/system.rs`, a paragraph in the guide's *The diagram*, an e2e script that saves both and shows them.
- If the formats are built: a module `src/lib/mindmaps/` with a reader and writer for each format over `Portable`, the text to and from HTML on the writer the text view has, fixtures of each format in the tests, two zip commands of the core, the two menu items and dropped files, their words in `home.ftl`, a passage in the guide's *Keeping things safe*.
- Nothing of the model changes; the Org form and the project file stay as they are.

## Addendum, 2026-10-26: as built — the diagram as a picture

Built as decided, in `src/lib/project/diagram/picture.ts` and `fonts.ts`, with the command `file_write`. What departs from the plan, or was settled in the building:

- **WebKitGTK draws the SVG on a canvas with its fonts**, so the PNG is made from the SVG itself; the fallback of drawing the shapes on the canvas was not needed and was not built.
- **Every run of words stands where the browser set its first letter**, each with its own place in the file, so that how another program spaces words cannot move a run out of its box. The lines of a name are found by reading the place of each letter.
- **The picture is read with nothing lit**: a state of the diagram, while it is read, takes away the selection, what is lit under the pointer, the marks of comments and every transition, so that no colour is caught on its way.
- **The save dialog cannot be answered off-screen**, and the page does not let the call to the core be replaced; a hook for the e2e scripts gives the path the dialog would, as the hook for Org files does.
- **Size**: a map with Latin and Greek names carries five faces of the fonts, about 250 KB; a Latin one about half that.
- **Other programs**: the file is valid XML, and librsvg draws it in its own fonts, since it reads none put into a file; every word stays inside its box.
- The two items are disabled while a name is written or something is dragged.
