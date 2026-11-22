# One form, and the order of the tree

From the owner's words of 2026-11-22 (the last section of `docs/brief.md`).
Three stages; each is checked and committed before the next. The records are
written with the stages: 0118 for the first, 0119 for the second and third.

## What is to be true at the end

1. A document is printed in the order of its tree. No kind of element has a
   place; a kind says what an element is and how it is set.
2. What Glaukopis makes itself is an element of a kind of its own, printed
   where it stands and nowhere where there is none: the title page, the half
   title, the keywords, the table of contents, the lists of figures and of
   tables, the bibliography.
3. A document type suggests parts and informs about their usual order; the
   requirements of a journal or a publisher are said, never enforced.
4. One form says how a document is made, for one document and for a document
   type. "Template" and "layout" are not said to the writer.

## Stage 1: the order of the tree

**The kinds.** `project/parts.ts` and `crates/core/src/templates/kinds.rs`
get the kinds of what is made: `title-page`, `half-title`, `keywords`,
`contents`, `list-of-figures`, `list-of-tables`, `bibliography`, each marked
as made. `place` stays in the catalogue only as what a cover is (printed on
no page); front and back are no longer read for the order.

**The walk** (`project/model/document.ts`). The children of every element in
tree order: no front, rest, back. Under the element at the top, a child of a
part kind is a part as before (its text at level 0, the kind's look), a
child of a made kind is a made thing, and everything else is the text. The
document carries `order`: the made things, the parts and the runs of
sections, as they stand. Deeper down a made kind prints nothing in this
document: it belongs to the element it stands under, and is printed when
that element is the document. Of a kind a document has one of, the first is
used, as before.

**The core** (`export/mod.rs`). `Document.order` is honoured; without it the
order is the type's contents, as before, for what is made elsewhere (the
sample pages of a layout, the tests of a target). The text is no longer one
item: `Item::Body` has the run of sections it prints. The contents, the
lists and the bibliography are headed by the element's name, and print
nothing over them where it has none.

**The notes** stay as the layout has them, at the foot of the page or at the
end before the bibliography: they are the writer's text and are never left
out. Placing them is not in this plan.

**The type** (`templates`). `contents` is what the type suggests, in its
usual order: read by the form and the checklist, by nothing that prints. The
changes of a document that turned parts on and off (`composition.contents`)
are no longer read; the limits are, as before.

**The form, as far as this stage needs it.** *Parts of the document type* in
Look becomes **Parts**: what the type suggests, in its usual order, each
with the elements of that kind in the document, which go to them, or
**Add**, which makes one, last under the document's element, named in the
language of the document. The switch *A title page* of the front page goes.

**The checklist** says what there is to know and moves nothing: works are
cited and there is no bibliography; where the type is a journal's, a
publisher's or a guide's, which of its parts the document lacks, and where
its parts stand in another order than it asks.

**No project is changed.** A document made before prints without what its
type used to add until the parts are placed (the owner's word of
2026-11-19: nothing made so far must be kept).

**Checks.** The walk and the checklist in vitest; the order in the core's
tests; `e2e/templates.mjs` and `e2e/preview.mjs` rewritten to place what
they read, with a helper in the harness; a new `e2e/parts-in-order.mjs`;
then every script that reads a title page or a bibliography, found by what
it reads.

## Stage 2: one form

**Look is the form.** Its line *These changes hold for* gets the document
type as a third choice, where the type is the writer's own: what is set
then is written into the type, for every document of it. For a type that
came with Glaukopis the form says **Save as document type…**, which makes a
type of the writer's own of the type and this document's changes, and gives
it to the document.

**What the editor of a template had and Look had not** becomes parts of the
form, shown where the type is what is set: its name and description, the
kinds of paragraph and of words it offers first with their keys, the kinds
of file it is exported as. The editor of a template is removed.

**The parts** are one list (stage 1), in the type too: what it suggests, to
add to, take from and put in order.

**A layout is no thing of its own to the writer.** A type of the writer's
own holds its pages (underneath, a layout of its own, made with it). The
part *Layout* of the form goes; **Take the look from…** gives a document or
a type the pages of another type. The changes of a document are listed
under **Changed in this document**, each with **Reset**.

**The chooser.** **New document type…** at its top asks for a name and
*Start from*, a type or nothing, makes it, gives it to the document and
opens the form at the type. A type of the writer's own has **Edit** and
**Delete** on its row.

## Stage 3: the words

"Template" is "document type" in every message of `en` and `nb`, in the
guide and in the names the writer sees; nothing is "as the … has it" or "my
own from this": a value is named with where it is from (*Chicago, from
Novel*), a button says what it makes. Then a round of translation for the
languages offered.

## Not in this plan

A bibliography, notes or a table of contents of one chapter within a book;
placing the notes; a cover as an output of its own; "part" as the word for a
kind of element.
