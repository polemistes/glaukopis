# The editor of texts: the tools for writing, citations and notes.
# See locales/README.md.

## The marks and the kinds of paragraph, in the bar over a selection and in
## the tools over the text.

editor-format = Format
editor-writing = Writing
editor-italic = Italic
editor-bold = Bold
editor-small-capitals = Small capitals
editor-superscript = Superscript
editor-subscript = Subscript
editor-struck = Struck through
editor-quotation = Quotation
editor-block-quotation = Block quotation
editor-list = List
editor-text = Text
editor-text-hint = A paragraph
editor-quotation-hint = Words of another, set apart from the text
editor-list-hint = A point of a list; an indent makes a list within the list
editor-numbered-list = Numbered list
editor-numbered-list-hint = A point of a list that is counted; an indent makes a list within the list
editor-verse = Verse
editor-verse-hint = A line of poetry, drama or a transcript, kept as a line
editor-speaker = Speaker
editor-speaker-hint = Who speaks: on a line of its own, or as words within a line
editor-direction = Stage direction
editor-direction-hint = What is done on the stage: on a line of its own, or as words within a line
editor-line-numbers = Numbers
editor-line-numbers-hint = Number these lines: how they are counted, from which number, every how many and on which side; and say what is said of the line the cursor is in. Lines numbered together with the same settings are counted as one, whatever their kinds.
editor-line-numbers-from = Number from
editor-line-numbers-from-hint = The first line that is counted is given this number, and the count goes on from it.
editor-line-numbers-every = Show a number every
editor-line-numbers-number = A whole number is wanted.
editor-line-this = This line
editor-line-number = Its number or label
editor-line-number-placeholder = Counted as the others are
editor-line-number-hint = 1234, 567a: always shown; the lines after it are counted on from it.
editor-line-uncounted = Not counted
editor-line-uncounted-hint = As the second half of a line shared between speakers: the count passes over it.
editor-line-hidden = Counted, its number not shown
editor-line-hidden-hint = The count goes on through it as through any line, but no number stands beside it in the document, even where one would fall. Where you write, it stands in parentheses.
editor-line-number-held = Counted, and not shown in the document. Press to give it a number of its own.
editor-line-margin = Words in the margin
editor-line-margin-placeholder = A metre, another edition's number
editor-line-margin-hint = Shown in the margin beside it, across from the numbers; not counted.
# How the lines of a stretch are numbered: see ADR 0041.
editor-numbering = Numbering
editor-numbering-none = Not numbered
editor-numbering-counted = Counted from the first number given
editor-numbering-given = Only the numbers given
editor-line-numbers-every-layout = As the layout: every { $every }
editor-line-numbers-side = Numbers on the
editor-side-layout = Side the layout says ({ $side })
editor-side-left = Left
editor-side-right = Right
# The first counted line of the stretch is the one the cursor is in: its number is where the count begins.
editor-line-number-first-hint = The count begins here.
# Over a number in the margin of the text, which opens a field for it when pressed.
editor-line-number-press = The number of this line: press to change it

## Numbers belong to what they number (ADR 0041): the Numbers menu offers
## the three, each saying what it numbers.
editor-numbers = Numbers
editor-numbers-hint = Number the lines you write, mark a place in prose, or number the lines of the page
editor-numbers-lines = Number these lines…
editor-numbers-lines-hint = The lines of the paragraphs where the cursor is, or of those selected: from which number, every how many, on which side
editor-numbers-refmark-hint = A place in prose, by a verse, a page or a number of an edition: 3:16, 327a
editor-numbers-page = Number the lines of the page
editor-numbers-page-hint = Every line of the printed page, numbered in the margin, in this document and those under it

## The bracket at the left of paragraphs of one kind standing together (a
## run), named by the kind; its menu says what is said of them.
# After the name of the kind, where the lines of the run are numbered: "Verse · numbered".
editor-bracket-numbered = numbered
editor-run-label-hint = { $kind } · press for what is said of these paragraphs
editor-run-numbers = Numbers…
editor-run-numbers-hint = How the lines here are counted, from which number, every how many and on which side
editor-run-select = Select these paragraphs
editor-run-to-text = Make it text
editor-run-to-text-hint = The paragraphs of this kind become text; their lines, and everything else, stay as they are
editor-run-begin = Begin a new run here
editor-run-begin-hint = The paragraph the cursor is in begins a bracket of its own, though the one before is of the same kind
editor-run-join = Join with the run before
editor-run-join-hint = These paragraphs are one with those of the same kind before them again
editor-kinds-text = Text
editor-kinds-quotation = Quotation
editor-kinds-verse = Verse
editor-kinds-script = Script
editor-kinds-list = List
editor-kinds-more = More
editor-kinds-words = Words
editor-attribution = Attribution
editor-attribution-hint = Whose words a quotation is
editor-epigraph = Epigraph
editor-epigraph-hint = A quotation at the head of a part
editor-headword = Headword
editor-headword-hint = The word a glossary explains
editor-gloss = Gloss
editor-gloss-hint = What the headword means
editor-code = Code
editor-code-hint = A line of code or of anything kept letter for letter
editor-break = Break
editor-break-hint = A pause between parts, with the sign the layout gives it
editor-draft = Draft note
editor-draft-hint = For your eyes: it goes into no document
editor-foreign = Foreign words
editor-foreign-hint = Words in another language, which spelling follows
editor-title-of-work = Title of a work
editor-title-of-work-hint = The title of a book, a play, a painting
editor-term = Term
editor-term-hint = A term where it is first used
editor-mention = Mention
editor-mention-hint = A word spoken of as a word, in quotation marks
editor-highlight = Highlight
editor-highlight-hint = For the eye on the screen: it goes into no document
editor-underline = Underlined
editor-code-words = Code in the line
editor-code-words-hint = Letters of equal width, within the line
editor-scene = Scene heading
editor-scene-hint = Where and when a scene is: INT. HOUSE – NIGHT
editor-action = Action
editor-action-hint = What is seen and done
editor-character = Character
editor-character-hint = Who speaks the dialogue that follows
editor-dialogue = Dialogue
editor-dialogue-hint = What is said
editor-parenthetical = Parenthetical
editor-parenthetical-hint = How a line is said
editor-transition = Transition
editor-transition-hint = How one scene gives way to the next: CUT TO:
editor-comment = Comment
editor-comment-hint = A comment on what is selected
editor-comment-element-hint = A comment on this element; select words to comment on them
editor-parallel = Two texts side by side
editor-parallel-hint = An original and its translation, each a text of its own
editor-page-break = Page break
editor-page-break-hint = What follows begins on a new page
editor-column-break = Column break
editor-column-break-hint = What follows begins at the top of the next column, where the layout sets the text in columns
editor-paragraph-kind = Kind of paragraph
# Said of the button that shows the kind of paragraph the cursor is in.
editor-paragraph-kind-now = Kind of paragraph: { $kind }

## The kind menu: the kinds written with those where the cursor is, the kinds at hand,
## the whole catalogue under "More…", and the layout that sets them at its foot.
## The words menu, with the kinds of words. And a kind of the writer's own, in its dialog.

editor-kinds-menu-more = More…
editor-kinds-mixed = Mixed
editor-kinds-own = Your own
editor-kinds-make = Make a kind…
editor-kinds-change-own = Change a kind of your own…
# Over the item that opens the look of the document at the kind the cursor is in.
editor-kinds-set-by = Set as “{ $format }” has them
editor-kinds-change-look = How “{ $kind }” looks…
editor-kinds-change-look-hint = Its look in this document, and the rest of the page
editor-words = Words
editor-words-hint = Underlining, superscript, code; the language of a passage, foreign words, the title of a work, a term, a speaker within a line
editor-words-make = Make a kind of words…
# Beside the language of the map, first among the languages foreign words may be in.
editor-foreign-of-text = The language of the text
# What a kind of words is based on when it is based on no kind in particular.
editor-plain-words = Plain words
# The language of a passage, from a word to many paragraphs: it has no look of its own.
editor-language = Language
editor-language-of-text = The text's own language
editor-language-other = Other language…
editor-language-other-title = The language of the passage
editor-language-tag = Language tag
editor-language-no-tag = That is not a language tag: a tag is such as “grc”, “la” or “de-CH”.
editor-language-unnamed = A language the system has no name for: the tag is kept as it is written.
editor-language-suggested = Languages often quoted
editor-language-other-hint = The passage is checked by the dictionary of its language, where one is imported, and left alone where none is; a document that is made tells the language to Word, OpenDocument, Typst and LaTeX.
editor-own-kind-new = A kind of your own
editor-own-kind-change = Change the kind
editor-own-kind-name = Name
editor-own-kind-name-placeholder = Letter, telegram, prayer…
editor-own-kind-words-placeholder = Ship’s name, Latin, a key word…
editor-own-kind-name-taken = There is a kind of that name already.
editor-own-kind-based-on = Based on
editor-own-kind-based-on-hint = What is not said below is as this kind has it
editor-own-kind-look = How it differs
editor-own-kind-create = Create
editor-own-kind-delete-title = Delete the kind “{ $name }”?
editor-own-kind-delete-message = { $count ->
    [0] No text is of it.
    [one] What is of it in one element stays as it is, and is set as text in documents.
   *[other] What is of it in { $count } elements stays as it is, and is set as text in documents.
}

## Citing, notes, and what is put into the text.

editor-cite = Cite
editor-cite-here = Cite a work here
editor-cite-at-cursor = Cite a work where the cursor is
editor-note = Note
editor-note-selection = Make the selection a note
editor-note-hint = A note, at the foot of the page or the end
editor-insert = Insert
editor-insert-hint = A picture, a table, mathematics, a cross-reference
editor-new-element = New element
editor-new-element-hint = A new element after this one, or under it
editor-new-after = New element after this one
editor-new-under = New element under this one
editor-new-split = Split here
editor-new-split-hint = What follows the cursor becomes a new element
editor-spelling-on = Spelling is checked as you write · press to stop
editor-spelling-off = Spelling is not checked · press to check it
editor-break-signs = The sign of a break within a paragraph
editor-break-signs-on = A break within a paragraph is shown by ↵ · press to hide the sign
editor-break-signs-off = A break within a paragraph is not shown · press to show it by ↵
editor-picture-file = Picture from a file…
editor-picture-file-hint = A figure, with what is said of it
editor-picture-store = Picture from the store…
editor-picture-store-hint = Those you have are shown at the side
editor-equation = Equation
editor-equation-hint = Mathematics on a line of its own
editor-table = Table…
editor-table-hint = Of so many rows and columns
editor-table-file = Table from a file…
editor-table-file-hint = CSV, or a sheet of LibreOffice or Excel
editor-formula = Formula
editor-formula-hint = Mathematics in the line
editor-pointer = Cross-reference…
editor-pointer-hint = To a figure, a table, an equation or a part: “see figure 2”
editor-refmark = Reference mark…
editor-refmark-hint = A verse, a page or a number of an edition: 3:16, 327a
editor-refmark-title = Reference mark
editor-refmark-label = Label
editor-refmark-placeholder = 3:16, 327a, 1094a1
editor-refmark-dialog-hint = The mark is no part of the words: spelling, search and the count of words pass over it. The layout says whether it is raised in the line or set in the margin.
# What a picture that was pasted without a name of its own is called in the store of pictures.
editor-pasted-picture = picture

## More.

editor-found = Loose citations…
editor-found-count = { $count } to go through, and make citations of
editor-found-none = And text that looks like citations, in this map

## Choosing a work to cite.

editor-picker = Choose a reference
editor-picker-placeholder = Cite: author, title, year
editor-picker-search = Search references
editor-picker-results = References
editor-picker-in-project = In this project
editor-picker-recent = Recently added
editor-picker-empty = Your library is empty.
editor-picker-no-match = Nothing in your library holds these words.
editor-picker-type = Type to search your library.
editor-picker-new = New reference…
editor-picker-import = Import…

## A citation, and each work in it.

editor-citation = Citation
editor-citation-add = Add a work
editor-citation-add-purpose = Add a work to the citation
editor-citation-in-text = Author in the text: Nagy (1979)
editor-citation-remove = Remove the citation
editor-citation-split = Part the words from the citation
editor-citation-split-hint = The words before and after become text of the line, and each work a citation of its own, with its page and nothing else
editor-citation-not-in-library = This reference is not in your library.
editor-citation-edit-reference = Edit the reference
editor-citation-before = Before
editor-citation-before-placeholder = see, cf.
editor-citation-after = After
editor-citation-after-placeholder = and passim
editor-citation-locator-kind = Kind of place
editor-citation-suppress-author = The author is named in my sentence: give the year only
editor-citation-remove-work = Remove this work
# Stands in the text in place of a citation of a work that is in neither the library nor the project.
editor-citation-missing = [reference not found]
# Stands in the text in place of a citation of no work.
editor-citation-empty = (citation)

## The kinds of place in a work a citation can point to, as the menu of a
## citation names them.

editor-locator-page = Page
editor-locator-chapter = Chapter
editor-locator-section = Section
editor-locator-paragraph = Paragraph
editor-locator-line = Line
editor-locator-verse = Verse
editor-locator-book = Book
editor-locator-volume = Volume
editor-locator-part = Part
editor-locator-column = Column
editor-locator-folio = Folio
editor-locator-figure = Figure
editor-locator-note = Note
editor-locator-number = Number
editor-locator-sub-verbo = Sub verbo

## A note, in the panel it is written in.

# The number is that of the note, or a letter for a note that stands in a place of its own.
editor-note-numbered = Note { $number }
editor-note-place = Where the note stands
editor-note-place-format = Where the layout has its notes
editor-note-place-foot = At the foot of the page
editor-note-place-end = At the end of the text
editor-note-placeholder = The text of the note
