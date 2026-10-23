# 0064 — Equal sides, the typesetting pane, the document pane, and the bars

Date: 2026-10-23. Status: accepted by the owner on 2026-10-23, from their comments after trying what 0063 built and an assessment with suggestions, which they confirmed with corrections; to be built from `docs/plans/the-sides-the-panes-and-the-bars.md`. Amends 0063 (the second project as a guest; the ⋯ after the path; the top row and the bars under it, which were left as they were "for now"), 0037 (side by side: the first project owns the panels), 0054 (the chooser of what you are writing over the preview), 0042 (Look as a tab of the panel at the side), 0039 (the menu of numbers in the toolbar), 0029 and 0040 (the toolbar of kinds and marks), 0024 (the comment button), 0006 (sharing from the toolbar) and 0010 (the store of pictures, now the images).

## Context

The owner, after trying the build of 0063: the dropdown of the path should go down to the deepest element of any project, opened at the current path; there is no visible way to switch sides; the outline opens for both sides at once; a project opened from the list should open in the active side and leave the other as it was. Then a reworking of the panes and the toolbars: the preview is wrongly named, since it is where the typesetting happens, and it holds the preview and the look; *About this document* does not belong there; the panel at the side mixes Look, which belongs to the typesetting, with the references, the pictures, the comments, the loose citations, the history and the changes, which are about the document in the active side and need a pane of their own, reachable with the typesetting closed; the typesetting pane shows the side whose button was pressed and not the side with the focus; its open state is the window's, not the project's. The ⋯ after the path goes; *What this document is* becomes a tab, *Document type*, of *About this document*, renamed *Document properties*, reached from the element's menu and from Look by a button that does not look like a dropdown; the chooser over the preview goes and the Look button takes its place. The button of the list goes to the far left of the top row; a bar of icons with tooltips per side: the outline, the views, the kinds, undo and redo, spelling, the marks of whitespace, Insert, Typesetting, Document; *New element* goes to the context menu; the two menus of kinds must be made clear; line numbering leaves the toolbar; the sign of breaks becomes the marks of all whitespace, hard spaces told from soft; *Citation*, *Note* and *Comment* go into Insert, whose hints go and whose items are renamed; *Share* goes to the project's menu in the list.

What the assessment found, and the owner confirmed:

- **Four of the points run into one wall.** Opening into the active side, a document pane that follows the active side, a typesetting pane that shows a chosen side, and a bar per side all assume that both sides are the same kind of thing. They are not: the first is the project of the view, which owns the panels, the sharing, the history and the saved view; the second is a guest with a diagram and a text. Each point could be built on that with a special case, and each special case would surprise later, as the map's seam at the project did (0062). The owner confirmed equal sides in this round. Their two worries are no obstacle: each project keeps its own history on disk and its own connection to the others already.
- **The marks and the kinds of words are two things, but the toolbar hides it.** Italic, bold, small capitals, underline, superscript, subscript, struck and code are marks: a look chosen by hand, on any run of letters. A kind of words is a role, such as a term, the title of a work, foreign words in a language, a mention of a word, whose look the format gives, so that a term is a term in every format and exports as a style. The toolbar had three marks as buttons and five more in the *Words* menu beside the kinds. The owner chose: all the marks in one menu, no buttons; italic and bold keep their keys.
- **The "#" menu held three things**: numbering the lines of the page, which is a document setting; numbering a stretch of paragraphs, which is done on those paragraphs; and the reference mark, which is something inserted.
- **The name.** English *Typesetting*: the correct word, naming what happens there rather than what is seen. *Preview* is what the owner objects to, *Layout* names the template's layout already, *Page* collides with the sides. Norwegian *Ombrekking*: the standard printing term for setting text into pages, in Bokmålsordboka, known to anyone near publishing; *sats* is the typeset matter and obscure, *typografi* names the look of type, which is only the Look half, *oppsett* is plain but vague, *layout* is taken. *Document*, *Document properties* and *Document type* are *Dokument*, *Dokumentegenskaper* and *Dokumenttype*.

## Decision

### Equal sides

- A side is a self-contained thing: its project, open with its own sharing, its own saved view, its own folding, its own outline, its element in view, its way of showing it, its undo. The window shows one or two sides. Nothing is "the project of the view" any more; what is of the window reads the active side, the one with the focus.
- **The window keeps its arrangement**: the sides, each by its project, its element in view and its view; which has the focus; whether they are switched; how the room is shared; the typesetting pane and which side it shows; the document pane and its tab; whether the marks of whitespace are shown. The arrangement is written with the settings, a moment after it changes and before the window closes, and the window opens with it. **A project keeps what is its own**: the cameras of its diagrams, what is folded in its text, the element at the top of its text, and the sizes of its own things; not whether a pane was open.
- **The place** names the active side: `#/project/<id>/<at>?mode=` is the active side's project, element and view, so that links and the history of back and forward hold. A link goes to the active side.
- **Opening a project** from the list, from the start screen, from a link or from the path's dropdown opens it in the active side, in the place of what was there; the other side stays as it was. *Open beside* opens it in the other side, making one where there is one side. *Close* in the list closes the sides that show the project; the × of a side and Ctrl+W close that side; with one side left, the start screen comes.
- **The outline** is each side's own.

### The typesetting pane

- The pane called *Preview* is **Typesetting** (*Ombrekking*): the pages as the document is set, and the **Look** beside them. The Look is a column of the typesetting pane, opened and closed by the Look button in the pane's head, where the chooser of what you are writing stood; Ctrl+Shift+A opens it, opening the typesetting pane where it is closed. Look is no longer a tab among the references and the rest.
- **Each side's bar has a Typesetting button.** Pressed while the pane is closed, it opens the pane for that side; while the pane shows another side, it turns the pane to this side; while the pane shows this side, it closes the pane. The button is lit in the bar of the side the pane shows. The pane does not follow the focus: the writer chooses. When the side it shows closes, the pane closes. Ctrl+P does what the button of the active side does.
- The pane's open state and which side it shows are the window's: a project closed and opened again does not bring the pane with it, but the window opens with the pane as it was.
- The pane's head keeps *Go to the text*, *Show the text* and *Export*; the chooser of what you are writing goes, and the button in Look that chose it becomes a plain button, **Document type…**, which opens Document properties at that tab.

### The document pane and Document properties

- The panel at the side becomes the **Document** pane (*Dokument*): the references, the images, the comments, the loose citations, the history and the changes of the document in the active side, one at a time, as tabs. It follows the focus: it always shows the active side's document, and its head names the project where two are shown. It opens and closes by the Document button in each side's bar, lit in the active side's bar while the pane is open, and by the keys of its tabs as today. Its open state and its tab are the window's.
- *About this document* is **Document properties** (*Dokumentegenskaper*), a window as today, with the tabs it has and one more, **Document type** (*Dokumenttype*), which is what *What this document is* was. It opens from the context menu of the element, in the diagram and in the text, as *Document properties…*; from the Document type button in Look; and by Ctrl+Shift+D. The line numbering of the page is a setting of it.
- **Presence**: a small sign in the head of the document pane while others are in the project; hovering it shows who. The state of the sharing stays on the project's badge, in the list and in the path.

### The bars

- **The top row**: the button of the list at the far left; a cell per side with its path and its dropdown; between the cells, where two are shown, a small button that switches the sides; *Split view* at the right end. The ⋯ after the path goes. The bar of the project under the top row goes.
- **A bar per side**, under its cell, of icons with tooltips, in this order: the outline; a separator; Diagram, Text, and Timeline where the element has times; a separator; *Paragraph kind*, *Words kind* and *Marks*, three menus, the two of kinds showing the name of the current kind, since that is information; a separator; undo and redo; a separator; spelling, and the marks of whitespace; a separator; *Insert*; a separator; *Typesetting* and *Document*; and at the right end the × that closes the side. While the side shows the diagram, the menus of kinds and marks, Insert and the whitespace marks are disabled; the box of an element in the diagram keeps its own writing tools.
- *Share* is not in any bar: **Share…** stands in the menu of a project in the list, which opens the sharing window for a project that is shown, and opens the project in the active side first where it is not.
- **Not saved** is a sign on the project's crumb in the path, with the fault in its tooltip, where the bar's words stood.

### The menus

- **Paragraph kind**: the kinds of paragraph, the writer's own, *Make a kind of paragraph…*, and the look of the kind as the format has it, as the menu has them today; its button shows the current kind.
- **Words kind**: the kinds of words of the catalogue (foreign words with their language, the title of a work, a term, a mention, a highlight, a speaker and a stage direction within a line), the writer's own, the language of the passage, and *Make a kind of words…*; its button shows the current kind, or nothing.
- **Marks**: italic, bold, small capitals, underline, superscript, subscript, struck, code, each with its key where it has one; italic and bold keep Ctrl+I and Ctrl+B, the others keep the keys they have. No mark is a button.
- **Insert**: *Citation*, *Note*, *Comment*; then *Image*, *Table*, *Table from a file…*, *Formula*, *Equation*, *Cross-reference…*, *Inline number…*, *Two texts side by side*, *Page break*, *Column break*. No hints: the names say what they are. *Image* is one item, which opens the images of the project in the document pane, from which an image is put in; adding an image from a file is done there. *Inline number* is what the reference mark was: a verse, a page or a number of an edition in the line.
- **The element's context menu**, in the diagram and the text, gains what the ⋯ had and the menu lacks: *Document properties…* and *A document into it…*; *Rename*, *New element under it* and *Delete* it has. *Loose citations* are a tab of the document pane. *Languages* are in Document properties.
- **Line numbering**: *Number the lines of the page* is a setting in Document properties. *Number these lines…*, of a stretch of paragraphs, is in the right-click menu of the text, on the paragraphs where the cursor or the selection is.
- **The marks of whitespace** replace the sign of a break: one toggle in the bar, with a pilcrow, which shows ¶ at the end of every paragraph, ↵ at a break within a paragraph, and a ring for a hard space. Ordinary spaces are not marked: marking every space in a text of a hundred thousand words costs work in proportion to the text, and the ring alone tells the hard from the soft. A **hard space** is written with Ctrl+Shift+Space, and goes into every document as a non-breaking space. There are no tabs: the kinds give indentation.
- **The images**: the store of pictures is called **Images** (*Bilder*) wherever the user sees it, in the rail, the document pane, the insert menu and the words; the code keeps its names.

### The dropdown of the path

- The chevron at the start of a path opens a tree, not nested menus: the list of projects as the list at the left has it, with its field, unfolded along the path to the current element, which is marked; a project chosen opens at its top, an element chosen is entered, in that side. A closed project's tree is read from disk, as the list reads it.

## Choices made in writing this, which the owner has not been asked about

1. **The × of a side stands at the right end of its bar**, since the top row holds the paths and Split view alone.
2. **The Typesetting button is a toggle of three states** (open for this side, turn to this side, close), so that one button does everything and the lit one says which side the pane shows.
3. **The Look is a column within the typesetting pane**, to the right of the pages, as it stood before, opened by a button in the pane's head and by Ctrl+Shift+A.
4. **Ordinary spaces are not marked, only hard ones**, for the cost said above. Tabs are not added.
5. **The hard space is Ctrl+Shift+Space**, the key of every word processor.
6. **Share… on a project that is not shown opens it first**, in the active side, then the sharing window: the sharing needs the project open.
7. **The presence is a sign in the document pane's head**, with the names on hover, as the owner asked; the state of the connection stays on the badge.
8. **The kind menus keep the name of the current kind on their button**; the rest of the bar is icons.
9. **The place names the active side**, so that a link opens where the writer works.
10. **Undo and redo are per side**, each project's own, and the bar's buttons act in their side.
11. **The whitespace marks are a setting of the window**, kept with the arrangement, not of the project.
12. **The keys**: Ctrl+P is the typesetting of the active side, Ctrl+Shift+A its Look, Ctrl+Shift+D Document properties, the document pane's tabs keep theirs, *Share* loses its entry, the Document pane itself has none; Ctrl+Alt+C stays for a comment and Ctrl+Alt+F for a note, from the Insert menu.

## Why not otherwise

- *Keep the guest and special-case the four points*: see the assessment; it would have put a hidden seam back.
- *Marks as buttons beside a menu*: the owner wants one menu; the keys serve the two marks used often.
- *Mark every space*: work in proportion to the whole text on every change of the marks, against the rule of 0052's brief; the hard space's ring is what tells.
- *Nested submenus for the dropdown*: six levels deep are hard to use, and a menu cannot be opened along a path.
- *The typesetting pane follows the focus*: the owner wants to choose, so that one side can be written in while the other is set.

## Consequences

- `ProjectView.svelte` becomes a shell of sides: `SideView.svelte` (new) holds what was per project; `panes.svelte.ts` (new) holds the typesetting and document panes of the window; the arrangement of the window is kept in the settings, the project's view keeps its cameras, folds, tops and sizes.
- `PreviewPanel.svelte` becomes the typesetting pane with the Look column; `SideTabs.svelte` and `side.svelte.ts` become the document pane; `AboutDocumentWindow.svelte` gains the Document type tab from `TemplateChooser.svelte`.
- `WritingTools.svelte` becomes the bar of a side; `Path.svelte` loses the ⋯ and gains the Not saved sign and the tree dropdown; `MapText.svelte`'s right-click menu gains the numbering of lines; the schema gains the hard space; the sign of breaks becomes the marks.
- The words: *Typesetting*, *Document*, *Document properties*, *Document type*, *Image*, *Inline number*, *Marks*, *Paragraph kind*, *Words kind*, in English and Norwegian Bokmål; *picture* becomes *image* wherever the user sees it.
- The scripts find the view chooser in a side's bar, not in a header over both; the harness's helpers change with it.
