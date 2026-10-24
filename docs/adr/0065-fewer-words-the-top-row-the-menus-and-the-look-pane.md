# 0065 — Fewer words: the top row, the menus, and the Look pane in plain words

Date: 2026-10-24. Status: accepted by the owner on 2026-10-24, from their comments after trying what 0064 built, an assessment with questions, and their answers (both in the brief, last section); to be built from `docs/plans/fewer-words-the-top-row-the-menus-and-the-look-pane.md`. A few choices made in writing this remain unasked (see below). Amends 0064 (the list's button at the far left of the top row; the × at the right end of a side's bar), 0063 (the list, with the count of projects on a folder), 0042 and 0054 (the words of Look), 0038 and 0055 (the parts of a document, front and back, in Look), 0040 (the quotations part of a layout), 0029 (the hints of the menus), 0019 (the words of folding and of the element's menu), the element that stands for another (0037's include), and the element's switch *Print the name as a heading*.

## Context

The owner, after trying the build of 0064: the owl in the upper left corner goes and the button of the list of projects takes its place; no count of projects on a folder; the × that closes a side goes into the top row, at the right, before Split view; Split view gets a background of its own, with one side too. The help texts go from the diagram's right-click menu, the element's menu (with *Print the name as a heading*, which is not wanted, and a question about *Stand for another element*), the library's menu beside *New reference*, and all of Look, since they say obvious things and the guide says the rest. In Look: two lengths in centimetres for paragraphs in place of *Paragraphs are told apart by*; the quotations rows questioned; the kinds of paragraph and of words apart; *Begins the paragraph*, *Placement*, *Line numbers*; no example rows; *The table itself* not understood; *Front page* smaller than *Equations*; *Include*, *Formatting*, *Anonymize the front page*, which must leave the authors out of the exports' metadata too; *Parts of document type*, *Moveable parts*, *Placed parts*; against elements hard-coded to the front or the back, acknowledgements among them; *Requirements of document type*; *Layout* with *Choose a layout*; *Modifications to the layout*; the source of the requirements gone. In the loose citations: *Plain text citations*, without the line about programs and tags. Then, in their answers: the standing element is a **clone**, without text or sub-elements of its own, and the original appears at its own place too; the words of folding say *unfold*; *Add child element*, *Add sibling element*, *Time stamp…*, and the two delete items say what happens to what is under the element; the library's *Import a file…* is *Import Bib(La)TeX…* with *Import from Zotero…* under it; older projects need not be spared. And the three things 0064 left: *picture* in the words, the menu that loses the focus, the review and the other side.

What the assessment found:

- **Stand for another element** (`project-stand-for`, `node.include`): an element can have another element's tree printed in its place. It is how a book is assembled from chapters kept as trees elsewhere in the project, and the only way one text is printed in two documents without a copy. Today the standing element prints its own name as the heading, then its own text, then the original's text and sub-elements, then its own sub-elements (`model/document.ts`, `walkBranch`); the original prints at its own place as well where it is within the document; only a cycle is refused (`wouldLoop`). The owner's rule, no text and no sub-elements of its own, removes the arbitrariness; the one step further taken here is the name.
- **Print the name as a heading** is a switch per element (`node.heading`): off, the name is a label for the writer, and only the text is printed. Removing it means every name is printed as a heading, in older projects too, which the owner accepts.
- **The quotations rows** (`quote.indentLeft`, `indentRight`, `size`, `lineSpacing`, `italic`) are the base look of the kind Quotation: the core builds the kind from them (`Resolved::quote`), and the kinds list below sets the same kind over them. Two places set one thing, and the hint said something else. The thresholds *From this many words* and *Or this many lines* are used nowhere in the core. Fifteen layouts give words, seven give lines, six lines only. How many lines a quotation takes is known only after typesetting, from the measure, the type size and the font; the checklist reads the text before anything is set, so it can only estimate.
- **Front and back.** The document type orders the parts: its contents list says where the title page, the abstract, the preface, the acknowledgements, the text, the appendices and the bibliography come, and Bloomsbury's type prints the acknowledgements after the preface. The catalogue's *front* and *back* (`templates/kinds.rs`, `parts.ts`) are only the fallback for a kind the type does not place, the grouping of the kind menus, and the words "printed at the back" beside a kind in Look and in the text. The layout says nothing of the order.
- **Anonymity.** While *Without the names of the authors* is on, every export already leaves the authors out of its metadata: Word's and Writer's properties (`after.rs`), Typst's `set document`, LaTeX's `pdfauthor`, the `author-meta` of HTML and EPUB; the running head's author item too. The requirement of a document type is shown in Document properties and does nothing else.
- **The library's menu** under the arrow beside *New reference* (`LibraryView.svelte`, `addMenu`): *Import a file…* with the hint *BibLaTeX or BibTeX*, *Paste references…*, *Add PDF files…* with a hint, *Import from Zotero…*, then the duplicates and the map. The file import takes `.bib`, `.bibtex` and `.biblatex`, so the owner's name for it is exact.
- ***Front page* smaller than *Equations***: *Equations* is a `heading` row of the settings component, rendered as an `h3` the Look's styles do not reach.
- **The hints of Look** are of five kinds: the small words under a row, the paragraphs under a subheading, the notes among the rows, the words under the Document type button and the scope line, and the status words under the switches of the generated parts. All go; what warns of a fault that must be mended stays.

## Decision

### The top row and the rail

- **The list's button** stands at the top of the rail, where the owl was, with its key and its lit state; the owl stays on the start screen, in the settings and as the window's icon. The cell over the first side begins at the left edge.
- **Each side's ×** stands in the top row, at the right end of that side's cell, after its path; with two sides, the right cell's × stands just before Split view. The bar of a side ends with Typesetting and Document.
- **Split view** has a standing background and border in the top row, in both states; lit as today while two sides are shown.
- **No count** of projects on a folder in the list, nor in the path's tree.

### The menus

- The diagram's right-click menu, the element's menu, the submenu of its kind, the text's right-click menu and the library's menu have **no hints**.
- ***Print the name as a heading* goes**, and the flag behind it is no longer read: every element's name is printed as a heading, the levels of the text count every element, and the text shows no *Not printed*.
- **The clone.** *Stand for another element* is **Clone other element…**. A clone has no name, no text and no sub-elements of its own: it shows the original's name, greyed and with the clone's mark, in the diagram and in the text, and in the document the original's tree stands where the clone is, name and all, at the clone's level. The original is printed at its own place as well, where it is within the document. *Clone other element…* is offered on an element that has no text and no sub-elements, and disabled on one that has; on a clone the menu says *Clone of “…”*, with *Choose another element…*, *Go to the original* and *No longer a clone*. *Add child element*, *Write its text*, *Rename* and *Paste under it* are disabled on a clone, and nothing can be dropped onto it. A clone of a clone is a clone of the original. A cycle is refused as today. In the text, the clone is a row with the original's name and *Go to the original*; the text itself is read in the original.
- **The words of the element's menu**: *Add child element*, *Add sibling element*; *Time stamp…* for *Say when it is…* and *When it is…*, the dialog's title too; *Delete and promote sub-elements* for *Delete, keeping what is under it*, *Delete with sub-elements* for *Delete* on an element with sub-elements, and *Delete* where there are none.
- **The words of folding**: *Unfold this element*, *Fold this element*, *Unfold all sub-elements*, *Fold all sub-elements*, *Unfold all*; the outline's buttons, the tooltips of the fold marks and the keys' words say *fold* and *unfold* likewise.
- The kinds of the catalogue are listed **in one list, in the catalogue's order**, without the headings *Front matter*, *Back matter* and *Cover*, in the element's kind submenu and in the document type's editor; the words "printed at the front" and "printed at the back" go. *On the cover only* and *Not printed* stay.
- **The library's menu**: *Import Bib(La)TeX…*, *Import from Zotero…* directly under it, *Paste references…*, *Add PDF files…*, then as today. The button of the empty library says *Import Bib(La)TeX…* too.
- **Escape closes any open menu**, whoever has the focus: the menu host listens at the window. What takes the focus from the text's right-click menu is found and stopped besides.
- The loose citations say **Plain text citations** over the switches, and the line *What a program made, and tags* goes.

### The Look pane

- **No help text anywhere in Look.** Every `hint:` of a row, every `p.hint`, every `{ note }`, the words under the Document type button, the scope line's words, the status words under the generated parts' switches, and the paragraph about the layouts that come with Glaukopis go. A warning of a fault stays. The example rows *As it will stand* under the captions and under the equations go.
- **Paragraphs**: two lengths, always shown, **Indent first line** and **Space between paragraphs**, each nought for none, and *Also after a heading* while the indent is not nought. The core applies both: the first line's indent and the space after a paragraph are the two lengths, in Typst, LaTeX, Word, Writer and HTML alike. The choice `text.paragraphs` is no longer written; read from an older layout or an older document's changes, it zeroes the other length, so that nothing prints otherwise than it did.
- **Lengths in centimetres**: every length of Look is a number with *cm* after it, shown to two decimals; a length kept in inches, millimetres or points is shown converted, and written in centimetres when changed.
- **Quotations**: the subheading is *Quotations*. The five rows of the look go: the kind Quotation is set under *Paragraph kinds* as every kind is. Under *Quotations* stands a switch, **Warn about long inline quotations**, and while it is on, **From this many words** and **Or this many lines**. The checklist warns of a paragraph of plain text with a quotation between quotation marks that reaches either: the words counted, the lines estimated from the layout's measure and type size, and said as *about*.
- ***Paragraph kinds* and *Words kinds*** are two subheadings, each with its kinds, named as the bar's menus are.
- **Headings**: *Runs into the text* is **Begins the paragraph**; *Begins* is **Placement**.
- **Numbers** is **Line numbers**.
- **Figures and tables**: *The table itself* is **Inside the table**; *Equations* is a subheading of the same rank as *Figures* and *Tables*.
- **Front page**: *What is shown* is **Include**; *How it is set* is **Formatting**; *Without the names of the authors* is **Anonymize the front page**. The exports' metadata is without the authors while it is on, as it is already; the plan adds the tests that are missing.
- ***What the document contains* is *Parts of the document type***, and holds **one list in print order**: the parts the program makes, each with its switch, and the kinds of elements the type places, each with the elements under this document that fill it and *Make one*, in the order the type prints them. No words of front or back. Under it, **Requirements of the document type**: the limits, **Anonymous** in place of *Without the names of the authors*, and the type's own note. The checklist remarks where the type requires anonymity and the front page is not anonymous.
- **Layout**: the heading is *Layout*; the row is **Choose a layout**; the list of changes is **Modifications to the layout**; the description of a layout of one's own and *Keep these changes as a layout of my own…* stay; the block *Where the requirements are from* goes from Look. The source's name and link stand as one line in the Document type tab, under the layout the type brings.

### The three things left

- **Image** for *picture* wherever the user reads it, in English and Bokmål. The code keeps its names.
- **Escape** closes the text's right-click menu, as above.
- **A script** checks that a review in progress closes when the other side takes the focus.

## Choices made in writing this, which the owner has not been asked about

1. **The clone shows the original's name and cannot be renamed.** The owner asked for no text and no sub-elements; the name is the step further, so that a clone is what the word says. The clone's own name, where older data has one, is not shown.
2. ***Time stamp…*** is the owner's word; *Place in time…* was offered instead, since a time stamp usually names when something was recorded. One word changes if the owner prefers it.
3. ***Delete with sub-elements* and *Delete and promote sub-elements***, in place of the owner's *content*, which also names the text, deleted in both cases; plain *Delete* where there are no sub-elements.
4. **The text menu's four hints go too** (*Enter*, *Split*, *Fold all sub-elements*, *Number these lines…*), since the owner reworded that menu; the other hints of the application (the review, the tables, the files, the library's references) stay and are listed in the report.
5. **One list in print order** in place of *Moveable parts* and *Placed parts*: it shows the whole document as it will print and needs no front or back.
6. **The source of a layout's requirements** is kept as one line in the Document type tab.
7. **Centimetres only**, no inches, until someone asks.
8. **The lines are estimated from the layout**, not asked of Typst: typesetting on every check is too heavy for a checklist.
9. **The list's button on the rail works in the project view and on the start screen**, and is disabled elsewhere.
10. **The disabled *Clone other element…*** on an element with text or sub-elements carries no reason, since the menus have no hints; the guide says it.

## Why not otherwise

- *Keep the quotations rows beside the kinds list*: two places for one look.
- *Drop the thresholds*: the publishers' rules are worth keeping, and a warning makes them useful.
- *A flat count of words a line*: the layout knows its measure and type; an estimate from them is nearer the publisher's rule.
- *A clone with its own name*: a heading of one name over the text of another is the hybrid the owner found random.
- *Two headings for the parts*: see choice 5.
- *Keep front and back in the words*: the type's order is the truth, and the words only confused.
- *Keep the heading flag, unread but settable in the data*: a feature that cannot be reached is a trap.

## Consequences

- `Rail.svelte` gains the list's button and loses the mark; `ProjectView.svelte` loses the list cell and gives each cell its ×; `SideBar.svelte` loses its ×; `ProjectList.svelte` its count.
- `elements.ts`, `MapDiagram.svelte`, `MapText.svelte`, `TemplateEditor.svelte` and `LibraryView.svelte` lose their hints and group headings and take the new words; `document.ts`, `layout.ts`, `MapText.svelte` and `TextSection.svelte` stop reading `heading`; the clone's rules go into `model/changing/elements.ts`, `document.ts`, `TextSection.svelte`, `DiagramNode.svelte` and `elements.ts`; `MenuHost.svelte` listens for Escape at the window; `FoundPanel.svelte` changes its words.
- `LookPanel.svelte`, `ContentsSection.svelte` and `Settings.svelte` lose every hint and example and take the new words; `Settings.svelte` shows lengths in centimetres; `checklist.ts` gains the quotation and the anonymity remarks; `AboutDocumentWindow.svelte` gains the source line.
- `formats/kinds.rs`, `formats/typst.rs`, `export/latex.rs`, `export/reference.rs` and `export/mod.rs` apply both paragraph lengths; `DocumentFormat::modernise` and `changes.ts` read the old choice; `modernise-formats.mjs` rewrites the layouts that ship.
- `locales/en` and `locales/nb`: the words renamed under new ids, the hints removed and pruned from every language, *picture* become *image*; the guide follows.
- The scripts find the list's button in the rail, the × in the top row and the menu items by their new words; a script checks the review and the other side.
