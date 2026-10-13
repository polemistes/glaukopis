# 0042 — The look of a document, in one place

Date: 2026-10-13. Status: accepted by the owner on 2026-10-13; built from `docs/plans/the-look-of-a-document.md`. Amends 0038 (templates, layouts and the document settings) and 0029 (kinds and looks).

## Context

Five things shape a printed document: the template (what it consists of), the layout (how the page looks: page, type, spacing, and the look of every kind), the reference style (how sources are cited), the kinds of paragraph and of words (what a piece of text is), and the kinds of element (abstract, appendix, which decide where an element is printed). Each is sound on its own. But the interface is organised by what is *stored*, not by what is *seen*: to change the font, the writer had to know that fonts belong to the layout, find the layout behind the kind menu or behind the document settings, and open its editor in a window of its own; and changing one value there made a copy of the layout, "Manuscript, changed", to be named, kept and chosen. Nothing showed where a look came from. The owner found the font only by chance, and asked that the whole be made streamlined, simple and intuitive.

## Decision

A document's look is one thing to the writer, so it has one place.

- **A panel named *Look***, in the panel at the side, beside the preview. It holds everything that decides how the page looks, in the order writers reach for it: type, page, paragraphs, headings, the kinds with their looks as they will stand, numbers, notes, bibliography, figures and tables, title and abstract, citations, and what is known of the layout. A search field at its top finds any setting by its words. Every change shows in the preview at once.
- **A document's changes belong to the document.** What is changed in Look is kept as the document's *changes* on top of its layout — a document setting, like its language, inherited by the elements under it, where a child may change further. A layout is never copied or renamed by a change. Every row says where its value comes from: *from Manuscript*, *changed here*, or *changed in The book* for a change made on an element above, with *Take Manuscript's again* beside it, which removes the change where it was made.
- **A layout of the writer's own is made on purpose.** *Keep these changes as a layout of my own…* asks for a name and makes a layout of the layout with the changes laid over it, which the document then uses with no changes of its own. Where the layout is already the writer's own, *Put these changes into it* does the same without a new name. A layout of the writer's own is deleted from Look's last part.
- **The whole, in one line.** At the top of Look: *Journal article → Manuscript · 2 changes → Chicago 18th*, the template, the layout and the citations, each clickable, each with a one-sentence hint of what it decides. The layout and the reference style are chosen there; the document settings window keeps the template, the details, the parts, the language and the checklist, and its former part for the layout becomes a line saying where the look is set, with a button.
- **Every door leads to Look.** The preview's bar; the foot of the kind menu, named for the kind the cursor is in (*How “Quotation” looks…*, with the kind's name as the catalogue has it, so that every language can say it), which opens Look at that kind; the document settings window; the command palette, which also lists *Change the font…*; and a key.
- **The layout window goes.** Look is the only editor of looks. Its rows and parts move into the panel; what was the editor's sample is the preview.

What is not changed: the layouts that ship stay as they are; the template editor and the reference style editor stay; the kinds of paragraph and their looks stay as decided in 0040 and 0041; the core receives, as before, a layout as it is to be used, and knows nothing of changes.

### The changes, as kept

`DocumentSettings.look`: the values the document sets otherwise than its layout, with the shape of a layout, each present only where set — page, font, text, headings, title, quote, notes, bibliography, figures, tables, equations, page numbers, running head, kinds (by id), parts (by id), verse. A list (the levels of headings) is taken whole. The changes of an element are laid over those of the elements above it, path by path, and the result over the layout: that is the layout the preview, every export and the looks of kinds are made with. The name `look` is stored in projects and must not change. In the Org form it stands as one property of the element's drawer, `LOOK`, one line of JSON, as the placement in time does.

## Later

Pointing at the preview: a click on a line of the page opens Look at what the line is — a quotation, a line of verse, the text — with its look. It needs the preview to know which kind each line belongs to, and is a step of its own.

## Consequences

- The document settings window loses the choosing of the layout and the style, which move to Look.
- The e2e scripts that opened the layout window are written to the panel, and a script of Look is added.
- The words of the other languages lag, as usual.
