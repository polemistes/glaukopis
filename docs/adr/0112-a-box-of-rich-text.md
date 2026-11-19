# 0112 — A box of rich text

Date: 2026-11-19. Status: the box itself built on 2026-11-19 (the second stage of `docs/plans/a-box-of-rich-text.md`), with nothing in it set by hand yet; its choices not yet confirmed by the owner. From the owner's words of the same day (the last section of `docs/brief.md`). Builds on 0111 (the form of the texts); sets aside, within a box and nowhere else, the rule of 0029 and 0040 that there is no direct formatting.

## Context

- **The owner asked for it with reluctance**: "users are frustrated about not being able to work as they are used to". It is for "a simple text that they just want to make look this way or that, as they are used to in Word", shown as "a rich text editor in place, with all the formatting tools on the top of the stretch (but not scrolling off screen), where the writing surface is white if the background is white", "a real and clearly marked wysiwyg editor for the stretch".
- **Decided by the owner**: the name is *Rich text*, in Bokmål *Formatert tekst*; the page stays in the Look; the guard against older versions goes out a release ahead (0111); the box is offered in a note, on the notebook's page and in the window of a note alone; *Make it ordinary text* warns before it takes away what was set by hand.
- **A paragraph has one kind** (0040), so rich text cannot be a kind of paragraph: it has lists and quotations in it.
- **What is said of a stretch is kept on each of its paragraphs** (0041): how it is numbered, its language. Passages are seen, not stored.
- **The plan feared the many places that must know a box**: every reader of a text that knows two texts side by side, in the interface and in the core.

## Decision

1. **The box is a block of its own in the editor, and nowhere else.** The schema has a block `rich` (`editor/schema.ts`) that holds what a text holds, each paragraph of its own kind, and neither another box nor texts side by side; it stands at the top of a text only. It is a block for the editor's sake: so that the sheet is one, and its head can stay in view by the plainest means the web view has.
2. **Everything else reads a text as if there were no box.** What the interface reads of a text is a run of blocks, as before, and each block that stands in a box says so: `rich: 'first'` for the first of a box, `'in'` for those after it (`Boxed` in `project/model/text.ts`). Blocks that stand together and say so are one box; a `first` among them begins another. This is the form 0041 has for what is said of a stretch. So what counts words, finds citations, numbers figures and notes, searches, checks spelling, writes Org and hands the document to the core reads the same blocks with a box and without it.
3. **The rule, held by a test**: take the box away, and nothing but the look changes. The text that uses everything there is, read once as it is and once whole in a box, is the same block for block, in its words, and in what is counted of it (`project/model/boxes.test.ts`).
4. **The core is not told of the box**, and sets what is in one as it sets any text. What will be set by hand comes to it on the paragraphs and the words themselves.
5. **A box is read again paragraph by paragraph** (`BodyReading`): a text written whole in a box is no slower to write in than one that is not.
6. **Made** from *Insert › Rich text* (`byhand/box.ts`, `byhand/put.ts`): in the place of an empty paragraph; around the blocks a selection touches; else after the block the cursor is in. Not within a box, and not around two texts side by side.
7. **Left** by Enter in an empty paragraph of text that is the last of the box and not all it holds: the paragraph goes out, to stand after the box, as an empty point leaves a list. **Backspace** in a box that holds one empty paragraph takes the box away.
8. **Its head** (`byhand/view.ts`, `BoxHead.svelte`) has its name and, at the right, a menu: **Select**, **Make it ordinary text**, **Delete**. The head stays at the top of what is seen while the box is scrolled through. The tools that set the look by hand come to stand in it.
9. **The sheet is white whatever the scheme of the window**, and what stands on it is drawn in the colours of the light scheme, set anew on the sheet; a test holds them to `:root`'s (`byhand/sheet.test.ts`).
10. **Where a text is only shown**, not written in, the sheet is drawn with the same head and the same room about what it holds, from the name the sheet says, so that nothing moves when the text is pressed and the editor takes its place.
11. **In Org** a box is `#+BEGIN_rich … #+END_rich` around the blocks that stand in it, each written as it would be without the box. `rich` is no name for a kind of the writer's own. An Org file with such a block, written by hand, is read as a box.
12. **The texts are of the second form** (0111): `FORM` is 2. The document of a text says so before the first box is put into the text: in the editor by `saysForm`, asked of every change, a command, a paste, a drop or an undo; where a text is written without an editor (`writeBody`, a note put at the end of a text, a note that comes through the inbox) by the writer of it. A project in which no box was ever made stays of the first form, open to every version.
13. **A project file is written in the form of its texts** (`projectfile.rs`, `FORMAT` now 2, held to `FORM` by a test): one of a project that holds a box is refused by the versions that are out, by the guard they have always had.
14. **In a shared project the first box is asked about**: *Rich text is new. Those who share this project with an earlier version of Glaukopis are kept out of it until they have updated. What they write meanwhile is kept, and brought along then.* A second box is not asked about, nor is a box in a project that is not shared, or in a note.
15. **In a note** the box is offered by Insert on the notebook's page, and by a button of its own in the row of the window of a note alone; a note written there with a box comes through the inbox with it.
16. **It is not offered yet.** One switch, `RICH_TEXT_OFFERED` (`byhand/offered.ts`), false, keeps *Rich text* out of the Insert menu and out of the row of the note window. Everything else is built in: a version with the switch off knows the box, shows one it is given with its head and its menu, keeps it and writes in it. So that version is the release the owner chose to send ahead of the box (0111), and those who have it are not kept out of a project when someone later puts a box in. It stays off until what a box is for is built: a white sheet that does nothing is not to be offered. The scripts that drive the running application are offered it whatever the switch says. The guide says nothing of rich text while it is off; what it is to say is kept in the plan.

## What the plan said otherwise

- **The plan had the box known in every place that knows two texts side by side, the core among them.** By 2 it is known in the editor, where blocks are read from the document and written into it, and where Org and the drawn text wrap it; the core, the search, the counts and the rest are untouched.
- **The plan had the arrows leave a box, making a paragraph where nothing follows.** Not built: the arrows go into and out of a box where there is a line to go to, as in any text, and at the end of a text Arrow down goes on to the next element, as it does from a table. To write after a box that ends a text: Enter in an empty paragraph at its end. To write before one that begins a text: press just above it, as above a table.

## Choices made in building this, which the owner has not been asked about

1. **The switch** (16), and that a release with it off is the one that goes ahead, in the place of a release with the guard alone.
2. **The guide and the interface never say "box"**, which is the notebook's word for where notes are kept: the thing is *Rich text*, and the guide calls what is seen a sheet.
3. **Where the box is put** (6): in the place of an empty line, around what is selected, else after the paragraph the cursor is in, and not around the paragraph the cursor is in.
4. **Enter leaves only from an empty paragraph at the end** (7), so that an empty line can be made anywhere else in a box.
5. **The menu** (8): *Select*, *Make it ordinary text*, *Delete*, with no asking before *Delete*, which undo takes back. *Make it ordinary text* does not ask yet: there is nothing set by hand to lose.
6. **The head shows its menu always**, small, and not only while the cursor is in the box.
7. **The words** of the question in a shared project (14), and its button, *Put it in*.
8. **The icon** in the Insert menu and in the row of the note window: a small and a large A.
9. **The form is raised by the first box and never lowered** (12), though the box is taken away again.
10. **Two boxes that stand together stay two**, and are not made one.

## Left for the stages that follow

- **Setting the look by hand** (stage 3): the font, the size and the colour of words; alignment, spacing and indents of a paragraph; the tools in the head; an empty paragraph as a blank line in the document; the warning of *Make it ordinary text*; the rule that nothing set by hand lives outside a box.
- **The other forms of a document** (stage 4), and **what is around it** (stage 5): the colours of what is drawn over a text in a dark scheme (the selection, what Find found, spelling, comments, changes), which the sheet has as the light scheme has them, are to be looked at one by one; the tools folded in small places; copying between boxes; the other languages.

## Checked

- `src/lib/byhand/box.test.ts`: putting a box in, in each of the three ways and where it is not put; leaving it; taking an empty one away; from its head, ordinary text with the selection kept, selecting, deleting.
- `src/lib/project/model/boxes.test.ts`: the box as the project keeps it, begun anew by a first, read back as it was written, never written within a side; the text that uses everything there is in one box; the rule (3); the reading part by part (5); the form said when a text is written with a box.
- `src/lib/editor/form.test.ts`: the form said before the box is put in, in a change of its own that is sent first; `FORM` and the core's `FORMAT` alike.
- `src/lib/org/org.test.ts`, with boxes in the project that uses everything (`fixtures.ts`): the form in Org, two boxes together, the words that look like signs in a box, a name written in capitals, a kind of the writer's own called Rich, an empty box.
- `src/lib/project/model/html.test.ts`: the sheet where a text is only shown, one for each box, a list ending with its box. `src/lib/notebook/window/text.test.ts`: a box through the inbox. `crates/core/src/projectfile/tests.rs`: a file written in the form of its texts.
- `e2e/rich-text.mjs`, in the running application: the box put in on an empty line and written in; a list in it; leaving it; its words counted; Find finding a word in it; white with dark words in the light scheme and the dark; the head in view while a long box is scrolled through; the menu, ordinary text and undo; around a selection; not offered within a box; Delete; Backspace in an empty one; the typesetting pane; the second form on disk; the block in the readable copy; opened again, shown as a sheet, and nothing moving when it is pressed; a box in a note.
- `e2e/sharing.mjs`: with the real server and two applications, the first box asked about, not put in before the answer, with the other after it, both staying connected; a second not asked about. `e2e/note-window.mjs`: the button in the row, the box written in and left, and in the notebook after the note is sent.
- Not tried by a script: comments and the review of changes on words in a box, spelling in a box, a box dragged or pasted. What is read of a text for each is the same with a box (3); how each is drawn on the sheet is for stage 5.

## Addendum, 2026-11-19: offered, and nothing asked in a shared project

At the release of 0.2.14 the owner was asked whether rich text should be offered in it, and answered "Offer it". Earlier the same day, of the highlight: "Do not worry about anyone using earlier versions. We are two-three test users, and nothing we have made must be kept yet."

- **Rich text is offered in every build**: 16 above no longer holds. The switch is gone (`byhand/offered.ts`), with what the Arch recipe passed to the building of the interface for a package to try it in. *Insert › Rich text* is in every text, and the button in the row of the window of a note.
- **The first rich text in a shared project is not asked about**: 14 above no longer holds. It is put in, the project comes to be of the second form, and those who share it with an earlier version are kept out until they have updated, as the guard has it (0111), which stays. The words of the question are gone from the Fluent files.
- **The release with the guard alone, a release ahead of the box**, which the owner had chosen (0111), does not come: 0.2.14 has the guard and rich text together.
- **The guide has its section**, *Rich text*, before *Kinds of paragraph and of words*, and names it among what Insert puts in and in the row of the window of a note; *Working together* names it among what an earlier version does not know.
- **Checked**: `e2e/rich-text.mjs`, in a window as someone works in it, started without what the harness asks for: Insert has Rich text. `e2e/sharing.mjs`, with the real server and two applications: rich text put in without a question, with the other within a moment, both staying connected. `e2e/note-window.mjs`.

