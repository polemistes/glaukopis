# 0065 — Fewer words: the top row, the menus, and the Look pane in plain words

Date: 2026-10-24. Status: proposed, from the owner's comments after trying what 0064 built, and an assessment with questions, which the owner has not yet answered (see "Choices made in writing this"); to be built from `docs/plans/fewer-words-the-top-row-the-menus-and-the-look-pane.md`. Amends 0064 (the list's button at the far left of the top row; the × at the right end of a side's bar), 0063 (the list, with the count of projects on a folder), 0042 and 0054 (the words of Look), 0038 and 0055 (the parts of a document, front and back, in Look), 0040 (the quotations part of a layout), 0029 (the hints of the menus), and the element's switch *Print the name as a heading* (0019's text view).

## Context

The owner, after trying the build of 0064: the owl in the upper left corner goes and the button of the list of projects takes its place; no count of projects on a folder; the × that closes a side goes into the top row, at the right, before Split view; Split view gets a background of its own, with one side too. The help texts go from the diagram's right-click menu, the element's menu (with *Print the name as a heading*, which is not wanted, and a question about *Stand for another element*), the *New reference* button, and all of Look, since they say obvious things and the guide says the rest. In Look: two lengths in centimetres for paragraphs in place of *Paragraphs are told apart by*; the quotations rows questioned; the kinds of paragraph and of words apart; *Begins the paragraph*, *Placement*, *Line numbers*; no caption example; *The table itself* not understood; *Front page* smaller than *Equations*; *Include*, *Formatting*, *Anonymize the front page*, which must leave the authors out of the exports' metadata too; *Parts of document type*, *Moveable parts*, *Placed parts*; against elements hard-coded to the front or the back, acknowledgements among them; *Requirements of document type*; *Layout* with *Choose a layout*; *Modifications to the layout*; the source of the requirements gone. In the loose citations: *Plain text citations*, without the line about programs and tags. And the three things 0064 left: *picture* in the words, the menu that loses the focus, the review and the other side.

What the assessment found:

- **Stand for another element** (`project-stand-for`, `node.include`): an element can have another element's tree printed in its place. The document holds that tree where this element stands; the timeline brings its placed elements. It is how a book is assembled from chapters kept as trees elsewhere in the project, and the only way one text is printed in two documents without a copy. The guide says it under *One tree, entered anywhere*. Since any element is a document now (0037, 0063), it is needed less often, but nothing else does what it does.
- **Print the name as a heading** is a switch per element (`node.heading`): off, the name is a label for the writer, and only the text is printed; the text view shows *Not printed*. Removing it means every name is printed as a heading, in older projects too where it was turned off.
- **The quotations rows** (`quote.indentLeft`, `indentRight`, `size`, `lineSpacing`, `italic`) are the base look of the kind Quotation: the core builds the kind from them (`Resolved::quote`), and the kinds list below sets the same kind over them. Block quotations are paragraphs of that kind, written or imported alike. Two places set one thing, and the hint said something else. The thresholds *From this many words* and *Or this many lines* are used nowhere in the core: they record the publisher's rule and do nothing. Fifteen layouts give words, seven give lines, six lines only.
- **Front and back.** The document type orders the parts: its contents list says where the title page, the abstract, the preface, the acknowledgements, the text, the appendices and the bibliography come, and Bloomsbury's type prints the acknowledgements after the preface, in the front. The catalogue's *front* and *back* (`templates/kinds.rs`, `parts.ts`) are only the fallback for a kind the type does not place, the grouping of the kind menus, and the words "printed at the back" beside a kind in Look and as a tag in the text. The layout, the format, says nothing of the order; what the owner calls the layout here is the document type.
- **Anonymity.** While *Without the names of the authors* is on, every export already leaves the authors out of its metadata: Word's and Writer's properties (`after.rs`), Typst's `set document`, LaTeX's `pdfauthor`, the `author-meta` of HTML and EPUB; the running head's author item too. The requirement *Without the names of the authors* of a document type is shown in Document properties and does nothing else.
- **The *New reference* button** has no help text that could be found: its tooltip is its name, in the references tab, the library and the citation picker alike. The owner is asked where they saw one.
- ***Front page* smaller than *Equations***: *Equations* is a `heading` row of the settings component, which renders an `h3` the Look's styles do not reach, while the parts' headings are styled smaller.
- **The hints of Look** are of five kinds: the small words under a row (`hint:`), the paragraphs under a subheading (`p.hint`), the notes among the rows (`{ note }`), the words under the Document type button and the scope line, and the status words under the switches of the generated parts (*Always in the document*). All go; what warns of a fault that must be mended stays (a placeholder without its `{}`).

## Decision

### The top row and the rail

- **The list's button** stands at the top of the rail, where the owl was, with its key and its lit state; the owl stays on the start screen, in the settings and as the window's icon. The cell over the first side begins at the left edge.
- **Each side's ×** stands in the top row, at the right end of that side's cell, after its path; with two sides, the right cell's × stands just before Split view. The bar of a side ends with Typesetting and Document.
- **Split view** has a standing background and border in the top row, in both states; lit as today while two sides are shown.
- **No count** of projects on a folder in the list, nor in the path's tree.

### The menus

- The diagram's right-click menu, the element's menu and the submenu of its kind have **no hints**: *New element here*, *Enter*, *Tidy the whole map*, *Associate with…*, *Leave out of the document*, the kinds, say what they are.
- ***Print the name as a heading* goes**, and the flag behind it is no longer read: every element's name is printed as a heading, the levels of the text count every element, and the text shows no *Not printed*. The flag stays in older projects' data, unread.
- ***Stand for another element* stays**, as it is, until the owner says otherwise (see below).
- The kinds of the catalogue are listed **in one list, in the catalogue's order**, without the headings *Front matter*, *Back matter* and *Cover*, in the element's kind submenu and in the document type's editor; the words "printed at the front" and "printed at the back" go from the menus and the text's tags. *On the cover only* and *Not printed* stay.
- **Escape closes any open menu**, whoever has the focus: the menu host listens at the window. What takes the focus from the text's right-click menu is found and stopped besides.
- The loose citations say **Plain text citations** over the switches, and the line *What a program made, and tags* goes.

### The Look pane

- **No help text anywhere in Look.** Every `hint:` of a row, every `p.hint`, every `{ note }`, the words under the Document type button, the scope line's words, the status words under the generated parts' switches, and the paragraph about the layouts that come with Glaukopis go. A warning of a fault stays.
- **Paragraphs**: two lengths, always shown, **Indent first line** and **Space between paragraphs**, each nought for none, and *Also after a heading* while the indent is not nought. The core applies both: the first line's indent and the space after a paragraph are the two lengths, in Typst, LaTeX, Word, Writer and HTML alike. The choice `text.paragraphs` is no longer written; read from an older layout or an older document's changes, it zeroes the other length, so that nothing prints otherwise than it did.
- **Lengths in centimetres**: every length of Look is a number with *cm* after it, shown to two decimals; a length kept in inches, millimetres or points is shown converted, and written in centimetres when changed. The note about writing lengths with their unit goes.
- **Quotations**: the subheading is *Quotations*. The five rows of the look go: the kind Quotation is set under *Paragraph kinds* as every kind is, over the base the layout's file holds. Under *Quotations* stands a switch, **Warn about long inline quotations**, and while it is on, **From this many words**. The checklist warns of a paragraph of plain text with a quotation between quotation marks of that many words or more. A layout that gives lines only counts about twelve words a line, and the remark says *about*; the lines stay in the layout's file, unshown.
- ***Paragraph kinds* and *Words kinds*** are two subheadings, each with its kinds, named as the bar's menus are.
- **Headings**: *Runs into the text* is **Begins the paragraph**; *Begins* is **Placement**.
- **Numbers** is **Line numbers**.
- **Figures and tables**: the example *As it will stand* under the caption rows goes (the equation's example stays); *The table itself* is **Inside the table**; *Equations* is a subheading of the same rank as *Figures* and *Tables*, so that *Front page* is no longer the smaller.
- **Front page**: *What is shown* is **Include**; *How it is set* is **Formatting**; *Without the names of the authors* is **Anonymize the front page**. The exports' metadata is without the authors while it is on, as it is already; the plan adds the tests that are missing.
- ***What the document contains* is *Parts of the document type***, and holds **one list in print order**: the parts the program makes, each with its switch, and the kinds of elements the type places, each with the elements under this document that fill it and *Make one*, in the order the type prints them, the kinds the type does not place where the document will print them. No words of front or back. Under it, **Requirements of the document type**: the limits, **Anonymous** in place of *Without the names of the authors*, and the type's own note of what the limits count. The checklist remarks where the type requires anonymity and the front page is not anonymous.
- **Layout**: the heading is *Layout*; the row is **Choose a layout**; the list of changes is **Modifications to the layout**, since it lists what the document sets otherwise than its layout; the description of a layout of one's own and *Keep these changes as a layout of my own…* stay; the block *Where the requirements are from* goes from Look. The source's name and link stand as one line in the Document type tab, under the layout the type brings, where the layout has one.

### The three things left

- **Image** for *picture* wherever the user reads it: the words of documents, formats, styles, files, credits and the core's messages, in English and Bokmål. The code keeps its names.
- **Escape** closes the text's right-click menu, as above.
- **A script** checks that a review in progress closes when the other side takes the focus.

## Choices made in writing this, which the owner has not been asked about

1. ***Stand for another element* is kept.** The owner asked what it is before deciding; the plan keeps it and says what to remove if they decide otherwise.
2. **One list in print order** in place of the two headings *Moveable parts* and *Placed parts*. The two would keep the question of what is moveable; one list in the type's order shows the whole document as it will print and needs no front or back.
3. **The source of a layout's requirements** is kept as one line in the Document type tab, not lost: it says where a publisher's layout comes from and when it was read.
4. **The flag of the heading is no longer read** rather than kept without its switch, since the owner does not want the feature; older elements with it off will print their names.
5. **Centimetres only**, no inches: a setting for the unit can come when someone asks.
6. **The warning counts words**; lines are approximated at twelve words a line for the six layouts that give lines only, and said as *about*.
7. **The equation's example stays**; only the caption examples go.
8. **The list's button on the rail works in the project view and on the start screen**, and is disabled elsewhere, where there is no list to show.
9. **The hints of other menus stay** (the text's menu, the review, the tables, the files, the library): the owner named four places; the builder lists the rest in the report for the owner to decide at once.

## Why not otherwise

- *Keep the quotations rows beside the kinds list*: two places for one look, with a hint that misdescribed them.
- *Drop the thresholds*: the publishers' rules are worth keeping, and the owner's words make them useful.
- *Two headings for the parts*: see choice 2.
- *Keep front and back in the words*: the type's order is the truth, and the words only confused.
- *Keep the heading flag, unread but settable in the data*: a feature that cannot be reached is a trap.

## Consequences

- `Rail.svelte` gains the list's button and loses the mark; `ProjectView.svelte` loses the list cell and gives each cell its ×; `SideBar.svelte` loses its ×; `ProjectList.svelte` its count.
- `elements.ts`, `MapDiagram.svelte` and `TemplateEditor.svelte` lose their hints and group headings; `document.ts`, `layout.ts`, `MapText.svelte` and `TextSection.svelte` stop reading `heading`; `MenuHost.svelte` listens for Escape at the window; `FoundPanel.svelte` changes its words.
- `LookPanel.svelte`, `ContentsSection.svelte` and `Settings.svelte` lose every hint and example and take the new words; `Settings.svelte` shows lengths in centimetres; `checklist.ts` gains the quotation and the anonymity remarks; `AboutDocumentWindow.svelte` gains the source line.
- `formats/kinds.rs`, `formats/typst.rs`, `export/latex.rs`, `export/reference.rs` and `export/mod.rs` apply both paragraph lengths; `DocumentFormat::modernise` and `changes.ts` read the old choice; `modernise-formats.mjs` rewrites the layouts that ship.
- `locales/en` and `locales/nb`: the words renamed under new ids, the hints removed and pruned from every language, *picture* become *image*; the guide follows.
- The scripts find the list's button in the rail and the × in the top row; a script checks the review and the other side.
