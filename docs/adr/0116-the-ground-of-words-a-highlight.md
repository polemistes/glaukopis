# 0116 — The ground of words: a highlight with a colour, in every text

Date: 2026-11-19. Status: built on 2026-11-19; its choices not yet confirmed by the owner. From the owner's words of the same day (the last section of `docs/brief.md`): "The background colour of the text should also be adjustable. This should also be possible in the normal editor. Highlighting text should be generally possible." Builds on 0111 (the form of the texts) and 0113 (the look set by hand); takes the place of the highlight that was a kind of words (0040, 0029), where it is offered.

## Context

- **There was a highlight already**, a kind of words under *Words kind*: yellow, one colour, "for the eye on the screen: it goes into no document". Words have one kind, so highlighted words could be nothing else, a title or a term. It was not where one looks for it, and the owner asked for highlighting as for something that was not there.
- **On a sheet of rich text the colour behind words is part of their look**, as their colour is: what is seen there is what the document has.
- **Ordinary text has no look of its own in a document** (0029, 0040): its looks are its kinds' and the layout's.
- **A mark is new to the schema**, and an earlier version takes words with a mark it does not know out of a shared project (0111).

## Decision

1. **The ground of words is a mark of its own**, `ground`, with the colour it holds (`#rrggbb`), in every text that is written in: the text of an element, a sheet of rich text, a note at the foot, a note of the notebook. Not in a name. It goes with any kind of words and any other mark.
2. **It is called Highlight** in the interface, as the kind was.
3. **From the Marks menu of the bar**, in any text: *Highlight* opens *None*, seven colours of marker pens (yellow, green, blue, pink, orange, purple, grey) and *Another…*, which opens the system's own chooser. **From a tool in the head of a sheet of rich text**, a highlighter beside the colour of the words, with the same menu and a line under it in the colour that is set.
4. **Set of the words selected**, or of what is written next where nothing is selected. One colour at a time: another takes the place of the first, *None* takes it away.
5. **In a text it is for the eye on the screen, and goes into no document**, as the highlight before it. **On a sheet of rich text it is the look of the words, and every kind of document sets it.** The rule is the one that is there: only on a sheet does anything look in the document as it was set by hand.
6. **Drawn so**: in a text faint, at half its strength, so that the words are read on it in a dark scheme as in a light one; on a sheet as it is. The same where a text is only shown.
7. **The highlight that was a kind of words is left as it is in the texts that have it**, read and drawn as before. It is no longer under *Words kind* where the new one is offered. The new tool shows such words as yellow; a colour chosen for them takes the kind away and puts the ground in its place, and *None* takes it away.
8. **In a document** (`crates/core/src/document/grounds.rs`): before a document is written, one pass says of the grounds of the words of paragraphs on a sheet that they are set; the writers set those and no others. Not of a note at the foot written on a sheet, nor of what is said of a figure there: their look is the layout's. Typst: `#highlight(fill: …)` about the words. LaTeX: a command of the document's own, `\gkground`, which the header has only where a ground is set; with LuaLaTeX and `lua-ul` it breaks with the line, else it is a box of the colour about the words, which does not. A page of the web and a book for e-readers: `background-color` in the span of the words. Word and Writer: shading in the style made for the words (*Rich text … on FFE066*), since Word's own highlight has sixteen colours. Markdown has the words alone.
9. **In Org** it is said as what is set by hand of words is: `[words]{ground=#ffe066}`, on a sheet and in a text alike. `[words]{highlight}` is still the kind.
10. **The form of the texts** (0111): the ground came with the second form, as the box did, since no version that knew the box and not the ground was released. A document says the second form before the first ground is put into one of its texts: in the editor by `saysForm`, which now asks it of the marks a change brings and not of the blocks alone, without going through the words that were there; where a text is written without an editor, by what writes it (`blockElements` and `sayFormOf`). A text is asked for its form by the marks of its words too (`formOfText`).
11. **In a shared project the first highlight with a colour is asked about**, as the first sheet is: *Highlighting in colours is new. Those who share this project with an earlier version of Glaukopis are kept out of it until they have updated. What they write meanwhile is kept, and brought along then.* Not asked where the project has rich text or a ground already, is not shared, or the text is a note.
12. **Offered with rich text**, by the same switch (0112, 16): until then Marks has no *Highlight*, and *Words kind* has its *Highlight* as before. A version with the switch off knows the mark, draws it, keeps it and sets it, so that those who have it are not kept out.

## Choices made in building this, which the owner has not been asked about

1. **That it goes into the document on a sheet and not in ordinary text** (5). The other ways: into every document, as Word has it; or a switch in the Look. Either is a small change from here.
2. **That it takes the place of the kind** (7), and that the kind is left in the texts that have it and not rewritten.
3. **The seven colours**, and that any colour can be chosen everywhere, not on a sheet alone.
4. **Faint in a text, as it is on a sheet** (6).
5. **Under Marks** in the bar, in a menu of its own; **no key**.
6. **The words**: the names of the colours; *None*; the question in a shared project. *Utheving* in Bokmål, as the kind was.
7. **In the head of a sheet** the lines between the groups of tools stand closer, and the lists of headings and of fonts are a little narrower, so that every tool is still in the row at the usual width of a text.
8. **In the window of a note alone** a ground is kept where it comes with what is pasted; there is no tool for it there.

## Not done

- **The system's chooser of colours** is opened by a field made for the purpose; no script can press it, and it was not tried by hand here.
- **The question in a shared project** is the one the first sheet asks, by the same code, with other words; it was not tried with the server and two applications for a highlight.
- **The guide** says nothing of it while it is not offered; what it is to say is in the plan (`docs/plans/a-box-of-rich-text.md`), where the three places that speak of the old highlight are named.
- **The other languages** have the English words until their next round.
- **Whether LaTeX broke a ground with the line** was not looked at: the test makes the PDF with the engine this computer has.

## Checked

- `crates/core/src/document/grounds.rs`: set on a sheet and nowhere else. `crates/core/src/export/mod.rs`, `the_ground_of_words_is_set_on_a_sheet_of_rich_text_in_every_kind_of_document_and_nowhere_else`, with the real Typst, LaTeX and Pandoc: the highlight in Typst, alone and about words of a size, and its pages; the command in LaTeX, its definition only where it is needed, and the PDF; the page of the web; the styles of Word and Writer; Markdown; and in none of them the ground of words that stand in ordinary text.
- `src/lib/editor/ground.test.ts`: set in a text and on a sheet, staying outside a sheet; one colour at a time; of what is written next; what is no colour; the kind it takes the place of, the other kinds left; the colours offered; what another program has marked. `src/lib/editor/form.test.ts`: the form said before the first ground, on words that were there and on words put in, in a change of its own that is sent first; asked of the marks of a text. `src/lib/project/model/boxes.test.ts`: kept in every text and in a note at the foot; the form said where a text is written without an editor, and not by a text written after it. `src/lib/org/org.test.ts`, `src/lib/project/model/html.test.ts`.
- `e2e/highlight.mjs`, in the running application: the menu under Marks and what it offers; a colour set, another in its place, None; drawn faint; the form on disk; no Highlight under Words kind; the highlighter of a sheet, drawn as it is, showing what is set, any colour; every tool of the head still in the row; the typesetting pane setting the grounds of the sheet and not that of the text, and its pages; the readable copy; opened again and drawn the same. Looked at.
- `e2e/rich-text.mjs`, `rich-text-headings.mjs`, `rich-text-look.mjs`, `dragging.mjs`, `note-window.mjs`, `languages.mjs` again.
