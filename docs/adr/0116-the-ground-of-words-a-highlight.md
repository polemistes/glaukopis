# 0116 — The ground of words: a highlight with a colour, a mark as bold is, set in every document

Date: 2026-11-19. Status: built on 2026-11-19, and changed the same day on the owner's word; holds. From the owner's words of that day (the last two sections of `docs/brief.md`): "The background colour of the text should also be adjustable. This should also be possible in the normal editor. Highlighting text should be generally possible." And, of what was first built: "The point of the highlight is for it to go into the document too. … To me it seems strange for it to be treated differently than bold and italics … it should be easy to set a highlight in any colour from the text editor." Builds on 0111 and 0113; takes the place of the highlight that was a kind of words (0040, 0029).

## Context

- **There was a highlight already**, a kind of words under *Words kind*: yellow, one colour, "for the eye on the screen: it goes into no document". Words have one kind, so highlighted words could be nothing else, a title or a term. It was not where one looks for it.
- **A kind has one look**, which the layout gives it and the Look sets, for all words of the kind. The colour of a highlight is chosen where it stands. So it is no kind with a look: it is a mark with what it holds, as a link holds its address.
- **Bold and italic are marks**, set by hand on any words, and go into every document. The owner asked why a highlight should be otherwise. There is no reason.

## Decision

1. **The ground of words is a mark of its own**, `ground`, with the colour it holds (`#rrggbb`), in every text that is written in: the text of an element, a sheet of rich text, a note at the foot, a note of the notebook. Not in a name. It goes with any kind of words and any other mark.
2. **It is called Highlight** in the interface.
3. **Every kind of document sets it, wherever it stands** (`crates/core/src/document/pandoc.rs`, `HandWords`; `grounds.rs`). Typst: `#highlight(fill: …)` about the words. LaTeX: a command of the document's own, `\gkground`, which the header has only where a document has a ground; with LuaLaTeX and `lua-ul` it breaks with the line, else it is a box of the colour about the words, which does not. A page of the web and a book for e-readers: `background-color` in a span. Word and Writer: shading in a style made for it, *Highlight FFE066* (Word's own highlight has sixteen colours). Markdown has the words alone.
4. **Easy from the text**, three ways:
   - **A highlighter in the bar of a text, beside Marks**: *None*, seven colours of marker pens (yellow, green, blue, pink, orange, purple, grey) and *Another…*, which opens the system's own chooser for any colour. Under it a line in the colour of what is selected.
   - **Ctrl+Alt+H**, as in Word: highlights what is selected in the colour chosen last (the yellow until one is chosen), and takes a highlight away where any of what is selected has one. As bold is turned on and off.
   - **Marks › Highlight**, which does what the key does, and shows the key.
   - On a sheet of rich text the same highlighter stands in the head as well, beside the colour of the words.
5. **Set of the words selected**, or of what is written next where nothing is selected. One colour at a time.
6. **Drawn in its colour, with dark words on it**, whatever the scheme of the window: a highlight is made to be read on with dark ink, and that is how the document has it. On a sheet of rich text the words keep the colour they are set in by hand. The same where a text is only shown.
7. **The highlight that was a kind of words** is no longer under *Words kind*. In a text that has it, it is read and drawn as before, and still goes into no document; the tools show such words as yellow, a colour chosen for them puts the ground in the kind's place, and the key or *None* takes it away.
8. **In Org** it is said as what is set by hand of words is: `[words]{ground=#ffe066}`. `[words]{highlight}` is still the kind.
9. **The form of the texts** (0111): the mark is new to the schema, and a document says the second form before the first ground is put into one of its texts, in the editor (`saysForm`, which asks it of the marks a change brings and not of the blocks alone) and where a text is written without an editor (`blockElements`, `sayFormOf`). **Nothing is asked and nothing is held back for the sake of earlier versions**: the owner's word is that there are two or three test users and nothing made so far that must be kept. So it is offered in every build, with or without rich text, and a shared project is not asked about its first highlight.

## As it was first built, and why it was changed

For an hour the ground went into a document only from a sheet of rich text, and was "for the eye on the screen" in ordinary text, drawn faint there: the rule of the kind it replaced, and of 0029 and 0040, that ordinary text has no look of its own in a document. It was under *Marks › Highlight* as a menu of colours, was offered only with rich text, and was asked about in a shared project. The owner: the point of a highlight is that it goes into the document, and it is strange to treat it otherwise than bold and italics. Bold and italics are the answer to the rule too: marks have always been a look set by hand in ordinary text. What is kept to the sheet is the font, the size, the colour of the letters and how a paragraph stands.

## Choices made in building this, which the owner has not been asked about

1. **The key, Ctrl+Alt+H**, and that it sets the colour chosen last, which is forgotten when the application is closed.
2. **A button of its own in the bar**, and *Highlight* among the marks as well.
3. **The seven colours.**
4. **Dark words on a highlight in a dark scheme** (6).
5. **The kind is left in the texts that have it** (7), not rewritten, and still goes into no document.
6. **In the head of a sheet** the lines between the groups of tools stand closer, and the lists of headings and of fonts are a little narrower, so that every tool is still in the row at the usual width of a text.
7. **In the window of a note alone** a ground is kept where it comes with what is pasted; there is no tool for it there.

## Not done

- **The system's chooser of colours** is opened by a field made for the purpose; no script can press it, and it was not tried by hand here.
- **Whether LaTeX breaks a long highlight with the line** was not looked at: the test makes the PDF with the engine this computer has.
- **The other languages** have the English words until their next round.

## Checked

- `crates/core/src/export/mod.rs`, `the_ground_of_words_is_set_in_every_kind_of_document_wherever_it_stands`, with the real Typst, LaTeX and Pandoc: the highlight in Typst, in a text and on a sheet, alone and about words of a size, and its pages; the command in LaTeX, its definition only where it is needed, and the PDF; the page of the web; the styles of Word and Writer; Markdown. `crates/core/src/document/grounds.rs`: a document asked whether it has one, in a note at the foot too.
- `src/lib/editor/ground.test.ts`: set in a text and on a sheet; one colour at a time; of what is written next; what is no colour; turned on in the colour last chosen and off, and off where only some of what is selected has one; the kind it takes the place of, the other kinds left; the colours offered; what another program has marked. `src/lib/editor/form.test.ts`, `src/lib/project/model/boxes.test.ts`: the form said before the first ground, in the editor and without one; kept in every text and in a note at the foot. `src/lib/org/org.test.ts`, `src/lib/project/model/html.test.ts`.
- `e2e/highlight.mjs`, in the running application: the highlighter in the bar and what it offers; a colour set, drawn in its colour with dark words, shown by the button; another in its place; None; the key on and off; Marks with Highlight and its key; the form on disk; no Highlight under Words kind; the highlighter of a sheet, showing what is set, any colour; every tool of the head still in the row; the typesetting pane setting the grounds of the text and of the sheet, and its pages; the readable copy; opened again and drawn the same. Looked at: the page has the highlight of the ordinary text.
- `e2e/rich-text.mjs`, `rich-text-headings.mjs`, `rich-text-look.mjs`, `dragging.mjs`, `note-window.mjs`, `languages.mjs`, `kinds.mjs`, `keys.mjs` again.
