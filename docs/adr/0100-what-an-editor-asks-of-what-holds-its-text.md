# 0100 — What an editor asks of what holds its text

Date: 2026-11-15. Status: built on 2026-11-15, as the first step of the notebook (`docs/plans/the-notebook.md`, the owner's words of the same day in `docs/brief.md`), before anything of the notebook stands on it. Nothing the writer sees is changed by it.

## Context

- **The editor of the texts knew the project.** `src/lib/editor/RichText.svelte` took `project: Project` and asked it directly for thirteen things: undo and redo and their history, who else is in the text, the kinds of paragraph of the writer's own, the references the project keeps, the words spelling passes over, the element a text belongs to, the language of its document, the layout that numbers its lines, the keys of the kinds, the top of its tree, the comments on it, and how the reference style of its document writes a citation.
- **A note of the notebook is written in the same editor**, so that what goes from a note into a text arrives as it was (the plan, proposal 2), and a note is no element and stands in no project.
- **The rest of the editor falls back by itself.** The views of citations, notes, figures, tables and pointers ask a project that is "current" and the element the editor was told of; where there is neither they number nothing and show what they have.

## Decision

1. **The editor asks a holder, not a project.** `src/lib/editor/holder.ts` says what an editor asks of whatever holds its text (`TextHolder`), in the editor's own terms: each of the thirteen things above, and nothing else. `RichText.svelte` takes `holder` and knows no project.
2. **A project answers as before.** `src/lib/project/holder.ts` gives the holder of a project (`holderOf`), one for each project and the same whenever asked for, which answers each question exactly as the editor asked the project before: the code was moved, not changed. The three places a text of a project is written (`ElementBox`, `TextSection`, `DiagramNode`) pass it.
3. **Spelling asks the same way.** `spellingFor` (`src/lib/spelling/menu.ts`) takes the language, the words passed over and what keeps them, where anything does; `spellingOptions`, for a project and an element, is made of it. *Ignore in this project* is offered where the holder keeps such words.
4. **The tools and the pickers work with no project.** `WritingTools.svelte` and `EditorHost.svelte` take `project: Project | null`. With none, the tools offer what a text in no document can hold: the kinds of the catalogue, the marks, the kinds of words and the language of a passage, a citation, an image from a file, a table, a formula and an equation; and leave out what only a document has: the look of a kind, kinds of the writer's own, a note at the foot, a comment, a pointer, a number in the line, parallel texts and breaks. With a project they are as they were.

## Chosen in the building, and not asked

- The holder is asked by element where the answer is an element's (its language, its layout), and a holder whose texts belong to no element is asked with none: so the editor has no "if this is a note".
- The tools take a project or none, and not the holder: nearly all they ask (the type of the document, its layout, the kinds in use across the project) is a project's, and a second way of asking it would have been asked by one caller.

## Checked

`pnpm check`, `pnpm test` (the tests of the editor as before, and `src/lib/project/holder.test.ts` for the project as a holder), and the scripts of the editor against the built application: `smoke`, `kinds`, `kinds-of-passage`, `spelling`, `notes`, `figures`, `tables`, `paste`, `copying`, `comments`, `line-numbers`, `verse`, `brackets`, `numbers`, `pointers`, `language-of-passage`, `text-structure`, `runs`, `found`, `keys`.
