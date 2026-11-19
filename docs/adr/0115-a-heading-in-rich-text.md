# 0115 — A heading in rich text is a paragraph, and no element

Date: 2026-11-19. Status: built on 2026-11-19, on the owner's "Yes, let us try that"; its choices beyond what was proposed not yet confirmed. From the owner's words of the same day (the last section of `docs/brief.md`): "At least some way to make headings is needed in the rich text. Perhaps not implement kinds. Perhaps headings in rich text are not elements? What do you think is best?" Builds on 0112 and 0113.

## Context

- **A heading is an element** everywhere else: its name is the heading, its look is the Look's, and it is numbered, stands in the outline, the diagram and the table of contents, and can be pointed to.
- **A sheet of rich text stands in the text of one element.** A heading that was an element would cut the sheet in two, and its look would be the Look's, which is what the sheet is there to get away from.
- **Size and bold by hand already make something that looks like a heading**, each one set separately, and with nothing to keep it from standing alone at the foot of a page.
- **The owner would rather not have the looks of the kinds of paragraph drawn on the sheet** (0113, its fourth addendum, left them out).

## Decision

1. **A heading in rich text is a paragraph that looks like a heading, and nothing more.** It is not numbered, does not stand in the outline, the diagram or the table of contents, and cannot be pointed to. Structure stays with the elements; the sheet is a look. This is what tells someone that they want an element instead.
2. **Two of them: *Heading* and *Subheading*.** *Heading* is set as the Look sets the headings one level under the element the text is of; *Subheading* as those two under it. So a heading on a sheet matches the real headings of the document without anything being set, and one in a chapter is not as large as the chapter's own title. Deeper than the layout has levels, both are as its last.
3. **The first tool in the head of a sheet** is a list: *Text*, *Heading*, *Subheading*. It says what the paragraphs selected are, and makes them one. Where the head is narrow it is kept longest, before the font.
4. **It is kept as part of what is set by hand of the paragraph** (`heading: 1 | 2` in `HandLook`, `byhand/hand.ts`), and is no kind of paragraph. So it lives only on a sheet, by the rule that is there (0113); *Clear formatting* makes it text; *Make it ordinary text* takes it away, and says so in its warning; it is written to Org and handed to the core with the paragraph; and the kinds, their menu, their keys and their looks know nothing of it.
5. **What else is set by hand of a heading is laid over it**: a font, a size, a colour of its words; its alignment, its spacing, its indents.
6. **Enter at the end of a heading goes on in text.** In a heading that holds nothing, Enter makes it text, as an empty point of a list becomes text. Within a heading it splits it in two.
7. **A heading is a paragraph of text.** Chosen for a point of a list or a paragraph of another kind, the paragraph is made text first; a heading made a point of a list, or of any other kind, is a heading no more (`byhand/rule.ts`, in the same step).
8. **Drawn on the sheet as the Look sets the level** (`byhand/sheet.ts`, `app.css`): its size, bold and italic, capitals and small capitals, its alignment, whether it is set in as a paragraph is, and the room over and under it counted as the typesetter leaves it. What follows it is the first of a run, and begins in only where the layout sets every paragraph in. A change in the Look is drawn at once, and the same where the text is only shown. In a note of the notebook, which is of no document, a heading is bold and larger, a subheading bold and a little larger.
9. **Set in every kind of document** by one pass before the document is written (`crates/core/src/document/headed.rs`): the size, the weight and the case of the level are put onto the words, and its alignment, single spacing, space before and after and first line into what is said of the paragraph by hand, each only where nothing was said by hand already; by the layout in force where the paragraph stands, that of an element with a look of its own too (0059). Every writer then sets it as any paragraph that stands by hand (0113), and is told two things more: it is **kept with what follows it** (a sticky block in Typst, no break under it in LaTeX, `break-after: avoid` on a page of the web, *keep with next* in the style made for it in Word and Writer), and in Typst the space before and after it is all the room about it, as about a heading, and not added to what stands between paragraphs.
10. **In Org** it is said of the paragraph, on the line before it: `#+ATTR_GLAUKOPIS: :heading 1`. It is no headline of Org, which is an element.
11. **The form of the texts is not raised** (0111): no version that knows rich text and not its headings has been released. A package built to try rich text before this one reads a heading as a paragraph of text and leaves it be.

## Choices made in building this, which the owner has not been asked about

1. **The words**: *Text*, *Heading*, *Subheading*; *Tekst*, *Overskrift*, *Mellomtittel*; the list's own name, *Text or heading*.
2. **Two levels and no more.**
3. **Kept with what is set by hand** (4), so that *Clear formatting* makes a heading text.
4. **Enter** (6).
5. **In Word and Writer it is not one of their own headings**: it would stand in their navigation and their tables of contents, which the document's own headings are in. It is a style made for it, named *Rich text … heading …*.
6. **Markdown has the words**, in bold where the level is bold, and no `#`.
7. **In a note** (8): bold, and 1.4 and 1.15 of the size of the text.
8. **While the tools show, they stand in the place of the sheet's name**, of which the sign of the grip is left, with the grip under it: with the list of headings there was no longer room for every tool beside the name at the usual width of a text, and bold, italic and the lists were folded away. The list of fonts is 24 points narrower for the same reason, and its *As the document* is cut short there. At the usual width every tool is in the row again.

## Not done

- **After a heading, LaTeX, Word and Writer begin the next paragraph as the layout begins any**, set in where the layout sets paragraphs in; Typst and the sheet begin it with the rest, as after a real heading.
- **A level that begins on a new page, or begins its paragraph** (run in), is not followed: a heading on a sheet is a paragraph of its own where it stands.
- **The other languages** have the English words until their next round.
- **No way from a heading on a sheet to an element** is offered beyond what is there for any paragraph.

## Checked

- `crates/core/src/document/headed.rs`: the level under the element and the one under that, deeper than the layout has levels, what was said by hand staying, the room wide lines ask for in Typst, a heading only as a paragraph of text in a box, and the look of an element with a look of its own. `crates/core/src/export/mod.rs`, `a_heading_of_rich_text_in_every_kind_of_document`, with the real Typst, LaTeX and Pandoc: the block and the words in Typst and its pages made; no break under it in LaTeX and the PDF made; the page of the web; the styles of Word and Writer with *keep with next*; Markdown; and in none of them a heading of the document.
- `src/lib/byhand/`: `hand.test.ts` (as it is kept, and drawn), `box.test.ts` (Enter), `rule.test.ts` (a paragraph of text, and only in a box), `sheet.test.ts` (what is said of the two levels, and the room about them). `src/lib/org/org.test.ts` (written and read back). `src/lib/project/model/html.test.ts` (where a text is shown).
- `e2e/rich-text-headings.mjs`, in the running application: the list in the head and what it offers; a heading made, Enter going on in text, a subheading; a subheading set to the right by hand; the size of the first level changed in the Look and drawn on the sheet in proportion; the typesetting pane setting a block kept with what follows, in that size, and no heading of the document; a heading made a point of a list, and undo; the readable copy; the same where the text is only shown, and nothing moving when it is pressed. Looked at: the page and the sheet agree.
- `e2e/rich-text.mjs`, `rich-text-look.mjs`, `dragging.mjs`, `note-window.mjs`, `languages.mjs` again.
