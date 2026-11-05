# 0081 — An element marked as the document, and the numbers of headings in each view

Date: 2026-11-05. Status: accepted. Proposed on 2026-11-05 from the owner's question of 2026-11-05 ("Now, the heading numbering for documents are shown also in the text view editor and the diagram view. Is there an option to turn this on or off? If not, there should be separate options for both. Also, I think the way it works now, is that the "document" is always the head element, so when you go "into" an element, to show only that element and its children, this element becomes the document. I am not sure this is how it should work. I often want to go into a tree just to focus on one part of the document for a while. Then I am not interested in seeing a totally different preview. I think there should be way to mark any element in the tree as the current document. Then the preview and the numbering and all other document settings will be taken from what pertains to that element."). Accepted on 2026-11-05, the nine choices below as written; built the same day from `docs/plans/the-document-marked-in-the-tree.md` (see *As built*). Amends 0037 (the element in view is the document), 0064 (the typesetting pane shows the element in view of its side), 0054 (Document properties by its key) and 0079 (one setting hides the numbers in the text view and the diagram).

## Context

Since 0037 a project is one tree, any element of it is entered, and the element in view is the document: the typesetting pane sets it, the export and the printing make it, Look and Document properties (by their keys) are of it, the words are counted in it, and since 0079 the numbers of the headings in the text view, the diagram and the outline are counted from it. This was right for printing a chapter alone, and it is what makes "any element is a document" true. But it ties two things together that the owner wants apart: *where you are*, which narrows the view to one part of the tree so as to work on it, and *what you are making*, the document whose pages, numbers and settings are wanted while you work there. Entering chapter four of a book to write in it turns the typesetting pane from the book to a chapter printed alone, numbers its sections 1, 2, 3 where the book has 4.1, 4.2, 4.3, and makes Ctrl+Shift+D, Look's *Document type…* and *Export* about the chapter.

What the assessment found in the code:

- **The element in view is handed down as one value** (`at`), from the side to the text, the diagram, the outline, the editors, the typesetting pane, Look, the dialogs and the keys. Some of what reads it means the tree in view: the diagram and the text draw `project.tree(at)`, the outline lists it, the route and the path name it, the folds, the cameras and the top of the text are kept by it, the review of changes is of it. The rest means the document: `numbering.of(project, at)` in the three views and in the words that point, `documents.formatForCached(project, at)` and `project.documentOf(at)` for the look and the settings, `documentRequest(project, id, at)` for the pages and the export, `countWords(project, at)`, the checklist, the file name of an export, and the element Document properties and the chooser open for by their keys. The seam is clean: a second value beside `at`, the document, with the second group reading it, is a small change in many places rather than a rework of any.
- **The count already serves a document above the element in view.** `walkDocument(project, document)` gives every element of the document its level and its number; the text view and the diagram look their elements up in it by id. Counted from the book, chapter four and its sections have the numbers the book prints, and the title of the text view, which carries no number today since the element in view prints none, carries its own.
- **One setting**, `headingNumbers`, hides the numbers in both the text view and the diagram (0079). The settings are written whole, so a renamed key shows its default once (0063, as built).

The owner's workflow (0037): several trees in a project, one of which becomes the document; a small project is the document itself.

## Decision

### Two settings for the numbers

- The one setting of 0079 becomes two, under *Document structure* in the settings: *Numbers of the headings, as the document prints them*, with a row *In the text view* and a row *In the diagram*, each *Shown* or *Hidden*. Shown unless hidden. A writer who hid them keeps them hidden in both: the old key is read as the default of both new ones, once. The outline keeps them always, as 0079 decided.

### An element marked as the document

- **Any element of a project may be marked as the document**, the project's own element included: *Make this the document* in the element's menu, in the diagram and in the text. One element of a project is the document at a time; marking another moves the mark; choosing the item on the element that is the document takes the mark off. The item shows a check on the element that is the document.
- **While an element is marked, it is the document wherever you are in the project.** What is of the document is of the marked element: the typesetting pane sets it, with its pages following the text where the text is within it; *Export* and *Print* make it; the words are counted in it; Look is of it, with the chips of the pages still setting a change on the element of the line (0059); *Document type…* in Look, Ctrl+Shift+D and the palette's *Document properties* open it; and the numbers of the headings in the text view, the diagram and the outline are those the marked document prints, counted from it: the element in view carries its own number where it has one, and an element outside the document carries none, as it prints none. *Document properties…* in an element's menu stays of that element, as it is.
- **What is of the place does not change.** Entering and leaving, the diagram, the text, the outline's rows, the path, the route, the folds, the cameras, the top of the text, the review of changes and the gutter's number by depth are of the element in view, as they are. A document brought in goes under the element in view.
- **Nothing changes for a writer who marks nothing**: the element in view is the document, as it was; the chapter entered is the chapter printed alone.
- **The mark is shown** by the open book of the Typesetting button: before the name of the element's crumb in the path, where the element in view is the document or lies under it, and on the element's row in the list of projects, so that the mark is seen from above and beside as well. The typesetting pane's head names the document, with the same sign, where it is not the element in view of the side it shows, so that the pane says what it sets when the path does not.
- **The mark is kept with the project's own view**, on this computer, as the folds, the cameras and the top of the text are (0014, 0063): the project opened again has it. A marked element that is gone, deleted or taken back by undo, is the document again when it is back; meanwhile the element in view is the document. It is not written into the project, not shared, and has no place in the Org form.
- **Going to a place in the text from the pages** enters the document where the element lies within it and is not within view, rather than the top of its tree, so that a side stays within the document it sets.

## Choices made in writing this, which the owner accepted on 2026-11-05

1. **The mark holds wherever you are in the project**, in another tree and at the project's top as well, until it is moved or taken off. The other way, the marked element as the document only while the element in view lies within it and the element in view otherwise, was weighed: it needs no sign in the typesetting pane, and a letter entered beside the book prints alone without touching the mark; but it is two rules, and at the project's top it would set the whole project, notes and all, where the book was marked. The owner's words say one rule.
2. **One mark per project**, not per side: it is a mark on the tree, and two sides of one project set the same document; two projects each have their own.
3. **Kept on this computer**, with the project's view, not in the project: what the writer is making this week is theirs, as what they fold away is (0014); the project's elements, their settings and the Org form do not change. If the owner wants collaborators and other computers to share it, it goes into the project element's settings instead, and the Org form gains a property; the rest of the record stands.
4. **The sign is the Typesetting button's open book**, so that the mark reads as "this is what the typesetting sets"; nothing new is drawn.
5. **The typesetting pane names the document only where it is not the element in view** of the side it shows; otherwise its head is as it is.
6. **The words**: *Make this the document* (nb *Gjør dette til dokumentet*), checked on the element that is; the sign's tooltip *The document* (*Dokumentet*); the settings' rows *In the text view* (*I teksten*) and *In the diagram* (*I diagrammet*).
7. **Ctrl+Shift+D, *Document type…* in Look and the palette open Document properties of the document**, not of the element in view: they are the document's doors; the element's own door is its menu.
8. **No key for the act**; the palette has it, as *Make this the document*, on the element in view.
9. **The element in view shows its own number** in the text view's title and the diagram's centre where the document above gives it one.

## Why not otherwise

- *The nearest element above that has been given a document type as the document, with no mark*: nothing to do for a writer who chose *Novel* on the book; but it is hidden, it cannot be taken off, a book given no type gets nothing, and a project element given a title makes the whole project the document of every tree in it. The mark is one act, seen, and reversible.
- *A pin on the typesetting pane alone*, keeping the pages of the document it was opened for while the side enters elements: it would mend the pages and leave the numbers in the views, Look, the keys and the export as they are; the owner asked for all of them.
- *A flag on elements saying what is in the document*: refused in 0037 and still: every element prints, and a mark says which document is wanted now, not what is in it.
- *Renaming "Enter" or changing what entering does*: entering narrows the view; the owner wants that kept, with the document apart from it.

## Consequences

- `state/settings.svelte.ts`: `headingNumbersText` and `headingNumbersDiagram` in place of `headingNumbers`, which is read once as their default; `SettingsView.svelte`: two rows; `MapText.svelte` and `MapDiagram.svelte` read their own.
- `project/layout.ts`: `Memory.document`, `StoredView.document`, kept where the element is there; `documentOf(marked, elements, at)`, the one rule; `open-projects.svelte.ts`: `OpenProject.document`.
- `SideView.svelte`: the side's document, derived; given to `MapText`, `MapDiagram`, `Outline`, `ElementBox` as `document` beside `at`, and read by `holding`. `ProjectView.svelte`: the typesetting pane and Look are given the document of the side they show; the keys `document-settings` and `what-document` open for the active side's document; a palette entry `mark-document`.
- `TextSection.svelte`: the number of the element in view where it has one; `elements.ts`: the item *Make this the document*; `Path.svelte` and `ProjectList.svelte`: the sign; `PreviewPanel.svelte`: the name of the document in the head where it differs.
- Words in English and Bokmål; the guide's *The text*, *One tree, entered anywhere*, *Typesetting* and *Document properties*; `e2e/numbers.mjs` for the two settings, `e2e/the-document.mjs` for the mark; the index of the records, where 0037, 0064 and 0079 hold in part.

## As built

Built on 2026-11-05 as the plan has it, with these departures:

- **`documentAt`, not `document`.** The side's document is handed to the text, the diagram, the outline and the text of an element as `documentAt` beside `at`: a prop named `document` would hide the page's own `document` in the components that read `document.activeElement`. The registry's field is `OpenProject.document`, as planned.
- **A citation that was found, pressed in the text, is gone through for the element in view**, not for the document: the panel of citations found enters the element it is asked for, and the document above would have taken the side up out of the chapter. The editor is told the element in view apart from the document it numbers in (`inView` beside `at`, in `RichText` and the editor's hooks).
- **The menu's item is checked only on the marked element.** A menu with any item that says whether it is checked draws a column of checks for every item; the item says nothing on the other elements, so that their menus keep their shape.
- **The path's sign has no tooltip of its own**: a tooltip inside the crumb's button would contend with the button's; the crumb's tooltip ends with *· The document* instead. The pane's head has the name whole in its tooltip, since a narrow head cuts it short.
- **The attributes** are `data-document-sign` on the signs and `data-marked` on the list's row, `data-document` being a button's in the bar already; the settings' rows are `data-heading-numbers-view="text"` and `"diagram"` under `data-heading-numbers`.
- **The settings are kept as they were read**: the old `headingNumbers` is not dropped from the settings file, which keeps whatever it does not know; it is only read where neither new setting is kept.
- **The notes beside a marked book are numbered**, being within it: the plan's script expected no number there. An element outside the marked document carries none, as the record says; the script checks it with a part marked.
- **No test hook** was made to set the mark before the menu could: the views were checked in the running application with the item, in the new script.

## Addendum, 2026-11-05: the sign in the diagram

The owner asked the same day for a visible sign on the marked element in the diagram. The box of the marked element carries the open book before its name, as the path's crumb does, on any element of the diagram and on the element in view at its centre; its tooltip says *The document*. The picture saved of the diagram (0068) leaves the sign out with the rest of what belongs to working on the map: the mark is of this computer's view of the project, not of the project. The text view has no sign of its own, which the owner has not been asked about: its title is the element in view, whose crumb in the path carries the sign where it is marked; the heading of a marked element under the one in view carries none.
