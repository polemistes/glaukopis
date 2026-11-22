# 0118 — A document is printed in the order of its tree, and what Glaukopis makes only where an element places it

Date: 2026-11-22. Status: built on 2026-11-22; holds. The first stage of `docs/plans/one-form-and-the-order-of-the-tree.md`. From the owner's words of that day (the last section of `docs/brief.md`): "Why must parts of documents have a specific place in the document, and not just come in the order the elements come? … we should not need to enforce it." And: "I prefer placeable elements, and that no title page, table of contents etc. is shown unless it is placed somewhere. I find it confusing that text is put on pages that I have not done anything to get there. I also think things should not be placed at the standard place, but rather where the user puts them." Takes the place of the order of 0038 (the contents of a template place the parts) and of the switches of 0054 and 0056 (parts turned on and off for a document).

## Context

- **A type placed the parts.** Its contents said the order: the title page, every abstract, the text, every appendix, the bibliography. An abstract written last in the tree was printed first. So the same tree could be an article for one journal and a chapter of a book without anything being moved; and so the pages were in another order than the tree and the text showed.
- **What Glaukopis makes was turned on.** A title page, a table of contents and the lists had switches in Look, on or off as the type had them; the bibliography was printed wherever works were cited. A writer got pages nothing in the tree stood for.
- **Two lists said the same.** The editor of a type had the parts under *Contents*, each with a cross, and again under *Kinds of elements* with a box that could not be unticked while the part stood in the contents: the owner could not take a part away from a novel.

## Decision

1. **Every element is printed where it stands in the tree.** No kind moves an element. A kind of the catalogue says what the element is and how it is set; `place` in the catalogue now says only what is on no page, a cover.
2. **What Glaukopis makes is an element of a kind of its own**: `title-page`, `half-title`, `keywords`, `contents`, `list-of-figures`, `list-of-tables`, `bibliography`, named as the parts are (`GeneratedPart::of_kind`). It is printed where the element stands, and nothing of the kind where there is none. A new document is its text.
3. **The name of the element is the heading** over the table of contents, the lists and the bibliography; with no name there is none. The title page, the half title and the keywords print no name. Text the element has of its own is printed after what it makes.
4. **A part is of the element it stands directly under**, as before. Under the element printed, an element of a kind of the catalogue is a part of the document; deeper down, one of a kind Glaukopis makes prints nothing in this document, and is printed when the element it stands under is the document. Of a kind a document has one of, the first is used.
5. **The document says its order** (`Document.order`): the parts and the runs of the text as they stand, from the walk of the tree (`project/model/document.ts`). The core prints by it (`export/mod.rs`, `order_of_tree`), and where no bibliography is placed tells Pandoc to add none. A document made elsewhere than of a tree, the sample pages of a layout, has no order and is ordered by its type's contents as before.
6. **A type suggests, and informs.** Its contents are the parts it suggests, in its usual order, read by Look and the checklist and by nothing that prints. **Parts** in Look lists them, each with the elements of that kind under the document and **Add**; **Another part…** has the rest of the catalogue. What is added stands last under the document's element, where the writer moves it; a table of contents, a list and a bibliography are first named with the word documents print there, in the language of the document.
7. **The checklist says, and mends nothing**: that works are cited and the document has no bibliography, unless its reference style lists no works; and in what order the type has the parts, where those the document has stand otherwise.
8. **Gone**: the switches of the parts in Look and the switch *A title page* over the front page. What a document said with them (`composition.parts`) is kept where it is and read by nothing.
9. **No project is changed.** A document made before prints without what its type added, until the parts are placed: the owner's word of 2026-11-19 is that nothing made so far must be kept, and to add elements to old projects would again be text the writer did not put there.

## Consequences

- An element's own text is printed before what stands under it, so an abstract under an article that has text of its own comes after that text. The checklist says so, as an order other than the type's.
- A chapter printed alone has a title page and a bibliography only where it has its own.
- Between two journals that want the parts in different orders, the writer moves an element.

## Choices made in building this, which the owner has not been asked about

1. **The notes are not placed.** They stand at the foot of the page or at the end before the bibliography, as the layout says: they are the writer's text and must never be left out. Placing them is for later.
2. **The keywords and the half title are placed too**, as the title page is.
3. **The name of the element is the heading** (3), where the layout's word stood before; **Add** names it with that word, so that a bibliography in an APA document is first called *References*.
4. **Added last** (6), and not where the type has the part.
5. **Deeper down, a title page or a bibliography prints nothing in the larger document** (4): one bibliography for each chapter of a book is not built.
6. **The remark on the order** names the parts the document has, in the type's order, for every type and not only for a journal's or a publisher's.
7. **The scripts** that read a title page or the editor of a type are rewritten with the second stage, which changes Look and takes that editor away; `e2e/parts-in-order.mjs` tries this stage in the running application.
