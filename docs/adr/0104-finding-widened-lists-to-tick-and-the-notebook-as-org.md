# 0104 — Finding widened, lists to tick, starting texts, and the notebook as Org

Date: 2026-11-16. Status: built on 2026-11-16, as stage 4 of `docs/plans/the-notebook.md`, from the owner's words of 2026-11-15 (`docs/brief.md`): the notebook "should then provide strategies for finding things"; "One should of course be able to write different kinds of notes, lists and plans". It stands on records 0101 and 0103. The kind of paragraph it adds is for every text, not for notes alone: it adds to record 0041.

## Context

- **The list of notes was found by words, a box and tags.** The plan names more to find by: what a note holds, when it was collected, where it came from, whether it has been looked at since, whether it has been used.
- **Text read from an image was kept nowhere**: it was read in a window, shown, and gone.
- **A list had points and numbered points and nothing to tick.**
- **The search through everything read the projects only**, and every project has a readable copy as Org while the notebook had none.

## Decision

1. **The filters of the list**, in a window at a button beside the field, counted on the button as the library's are: **Holds** (an image, a file, words taken in, a link to another note), **Collected** (from a day, to a day), **From** (a page of the web, a reference, a file, other, no source), **Not looked at**, and **Used in a project** or **Not used**. They hold with the words searched, the box and the tags; they are not kept across runs.
2. **Looked at, or not.** A note taken in from elsewhere (files, a paste outside a text, the plugin, a file read) is not looked at until the writer chooses it, and shows a dot until then; a note the writer makes is looked at from the start. Kept with the note, outside undo.
3. **Words read from images.** **Read the text**, on an image of a note (in the window of its source, and for the notes selected from their menu), reads it with the reading of text Glaukopis has, in the languages of the settings, one image after another, said at the foot of the window and stopped there. What is read is kept with the notebook's record of the file, found by the notebook's field and by the search through everything, and shown under **Text read**; it is not put into the note. Nothing is read by itself: the program cannot know which images hold words.
4. **A point to tick** is a kind of paragraph, **To do**, of the group of lists, with one more thing said of it, whether it is ticked (said only where it is). A box stands where a point has its dot; a press on it, or Ctrl+Enter, ticks and unticks; `[ ] ` at the start of a paragraph makes one, `[x] ` a ticked one; Ctrl+Shift+9 makes the paragraph one. In Org it is `- [ ]` and `- [X]`; typeset, a box stands before the point in every kind of document; a document or a mind map brought in with such points keeps them.
5. **Starting texts** for a new note, named by the writer and kept in the notebook's document: a name, its lines, and the kind of paragraph its lines are (text, a point, a numbered point, a point to tick). **New note** has an arrow beside it with a menu of them; **Starting texts…** makes, changes, orders and deletes them in one window.
6. **Notes in the search through everything.** The search's worker reads the notebook with the projects (from what is open in the window, else from the disk), with the same matcher; what is found stands under **Notebook** after the projects, and a hit goes to its note. With only the last project searched, the notebook is not.
7. **The notebook as Org.** A moment after the notebook is saved, `notebook.org` is written in its folder with `pictures/` and `files/` beside it: a heading for each box, under it one for each note with its tags, when it was made and what became of it, its text as Org, a passage as a quotation with its source under it, a file as a link, the links between notes as links to their ids. A copy to be read; nothing reads it back.

## Chosen in the building, and not asked

Finding:

- A note the page chooses by itself right after taking it in is shown and stays not looked at; with **Not looked at** on, a note chosen stays in the list until the filters change.
- The days are typed (`2026`, `2026-11` or `2026-11-16`), not picked.
- **No source** passes a note that has something without a source, and one that has nothing taken in; **A reference** means a source that is a reference from the start; **A link** means a link between notes, not a link in the text.
- The filters hold in the list; on a surface every note of the box is shown, and only cards that are placed show the dot.
- An image the notebook holds alone is read by its place in the store.

Lists to tick:

- **Org written elsewhere changes its meaning here**: `- [ ] words` in an Org file not written by Glaukopis is read as a point to tick, as Org means it; before, it was a point whose words began with a box. What Glaukopis writes keeps a plain point plain (`- \[ ] words`).
- The tick is said of a point to tick only: a paragraph made another kind loses it.
- Org's half-ticked box `[-]` reads as not ticked.
- Ctrl+Enter ticks all the points selected where any is not, else unticks all; outside a point to tick it does what it did.
- Enter in a point to tick gives a new one, unticked; on an empty one, text.
- The box is drawn, not a letter of a font; ticked words are fainter, not struck through.
- Typeset by Typst, the box is drawn where the list's dot would stand, so that it needs no font that has the sign and no dot stands before it; the words of the page hold no sign for it. A plain point among points to tick keeps its dot. What is handed to Typst still says each point with `☐` or `☒` before its words: the rule that draws the box is in what the format says before the text (`crates/core/src/formats/typst.rs`).
- In Word the box is the list's own sign; in a mind map written out it is a sign among the words.

Starting texts:

- Changes are kept as they are typed, each undone by the notebook's undo.
- A note begun from one has the box in view and the tags that are on, and the cursor at the end of its first line.

The search and the Org copy:

- The notebook stands after the projects; the count says *in one project and the notebook*.
- The words of the choice of what is searched still say projects, while all projects now takes the notebook with them: the guide says so.
- In the Org copy, tags keep letters, digits and `_@#%`, anything else is `_`; two files of one name are told apart by a number; a name that would lead out of the folder of files is not written.

## Left for later

- Words read from images by themselves, should the owner want it for some notes.
- The words of the search's choices, should they be made to name the notebook.
- The new words in the other languages.

## Checked

`cargo test --workspace`, `cargo clippy --workspace --all-targets -- -D warnings`, `pnpm check`, `pnpm test`. Against the built application: `e2e/notebook-finding.mjs` (the filters, the dot of what is not looked at, Read the text, starting texts), `e2e/todo.mjs` (a point to tick typed, ticked by its box and by the key, copied as Org and pasted, typeset with its box drawn and no dot, there after the project is closed and opened, and the same in a note across a restart), `e2e/notebook-search.mjs` (notes in the search through everything, and the Org copy written), the other scripts of the notebook, and the editor's scripts that a new kind of paragraph could touch (`kinds`, `kinds-of-passage`, `org`, `paste`, `copying`, `documents`, `mindmaps`, `preview`, `text-structure`, `lists-brought-in`, `keys`, `runs`, `brackets`).
