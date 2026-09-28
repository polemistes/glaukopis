# 0017 — Search, and search and replace

Date: 2026-09-28. Status: accepted.

## Context

The one the application is made for asked for search, and search and
replace, in the editors where much is written: the text of a map, and the
edit box of an element in the diagram. A search can take in the citations
and the other labels that stand outside the text itself; a replace cannot.
Both can be kept to the selected text. Besides, a search through
everything: in one project or in all, without replacing, which can take in
what stands outside the texts.

What the writer sees of a map is not one editor. The text of a map is the
elements one after the other, and only the few that were worked in last
have an editor; the others are drawn from what the project holds
(`MapText.svelte`, `TextSection.svelte`). Parts of what is shown are not
text: a citation shows what the style makes of it, "(Nagy 1979, 73)"; words
that point show "Figure 3"; a formula shows its mathematics.

## Decision

- **One search, three places.** What is searched is read from the project
  (the Yjs document), not from the editors that happen to be open: in the
  text of a map, all its elements, those folded away and those left out of
  the document among them; in the edit box, the element's name and text;
  in the search through everything, the projects.
- **The text, and what stands outside it.** The text is what was written:
  names, paragraphs, notes, what is said of figures and tables, cells. What
  stands outside it is what is shown in the text and not written there:
  citations as they are shown, words that point, formulas as they are
  written in TeX, and, in the search through everything, the details of a
  document, notes on references and the names of associations. A search
  takes these in only when asked to.
- **Replacing touches only the text**, and keeps its marks: what is put in
  takes the marks of what it replaces. All that is replaced at once is one
  step of undo.
- **Options:** capitals as they are written; whole words; letters with and
  without accents alike; regular expressions; only in the selection; and,
  for searching, what stands outside the text.
- **Keys:** Ctrl+F searches, Ctrl+H replaces, Enter and Shift+Enter go to the
  next and the one before (F3 and Shift+F3 as well), Escape closes.
- **What is found is shown in its place,** in the text that is drawn and in
  the editors alike, and going to it opens what it lies in: an element
  folded away is opened, an element without an editor is given one, a note
  is opened.
- **The search through everything is a place of its own** in the rail
  (Ctrl+Shift+F). It searches the project that is open, or all projects.
  What is found is listed by project, map and element, with the words
  around it; choosing one opens the map at it.

## Why not otherwise

- *Searching the editors*: most of the text has none, and a search that
  finds only what is open finds too little.
- *Replacing labels*: a citation shows what the style makes of it; changing
  that is changing the reference or the citation, which have their own
  places.
- *Replacing through everything*: not asked for, and a change in many
  projects at once is more than a writer can look over.

## Consequences

- A project that is not open is read for a search through everything, which
  takes a moment for a large one; it is read once, and kept while it does
  not change.
- A match cannot run across something that is not text, as a citation or a
  note, when what stands outside the text is not taken in.
