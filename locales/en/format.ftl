# Document formats: their kinds, and the editor of a format.

## The kinds of document format, as the formats are grouped by them.

format-kind-own = Your own
format-kind-general = General
format-kind-style-guide = Style guides
format-kind-publisher = Publishers
format-kind-journal = Journals
format-kind-fiction = Fiction
format-kind-stage = Stage and screen
format-kind-poetry = Poetry

## The format editor.

format-editor = Document format
format-name = Name of the format
# The name a format of one's own is first given, made from that of the format it is made from.
format-name-changed = { $name }, changed
format-sections = Parts of the format
format-sample-page = Sample page { $number }
format-bundled = Formats that come with Glaukopis stay as they are. Your changes are saved as a format of your own.
format-delete = Delete this format
format-save-own = Save as my own
format-saved = “{ $name }” is saved among your own formats
format-read-failed = The format could not be read.
format-sample-failed = The sample could not be made.
format-save-failed = The format could not be saved.
format-delete-failed = The format could not be deleted.
format-delete-title = Delete the format “{ $name }”?
format-delete-message = Maps that use it will use the general manuscript format instead.
format-delete-confirm = Delete format
format-leave-title = Leave without saving?
format-leave-message = The changes you have made to the format will be lost.
format-leave-confirm = Leave
format-leave-cancel = Go on editing

## The parts of a format, as they are chosen at the left.

format-section-page = Page
format-section-type = Type and spacing
format-section-paragraphs = Paragraphs
format-section-headings = Headings
format-section-title = Title and abstract
format-section-quotations = Quotations
format-section-kinds = Kinds of paragraph and words
format-section-notes = Notes
format-section-bibliography = Bibliography
format-section-figures = Figures, tables, equations
format-section-margins = Page numbers and running head
format-section-limits = Limits
format-section-about = About this format

## Words that stand in several parts.

format-size = Size
format-bold = Bold
format-italic = Italic
format-letters = Letters
format-alignment = Alignment
format-line-spacing = Line spacing
format-as-the-text = As the text
# Beside a size of 0, in the place of its unit.
format-as-the-text-zero = as the text
format-size-zero-hint = 0 for the size of the text
# Beside a number of 0, in the place of its unit.
format-not-said = not said
format-no-limit = no limit
format-unless-said = Unless something else is said of one
format-as-it-will-stand = As it will stand
format-align-left = Left
format-align-center = Centred
format-align-right = Right
format-align-justified = Justified
format-align-ragged = Left, ragged right
format-case-none = As written
format-case-upper = CAPITALS
format-case-smallcaps = Small capitals
format-spacing-single = Single
format-spacing-one-and-a-half = One and a half
format-spacing-double = Double
format-stands-left = To the left
format-stands-center = In the middle
format-stands-right = To the right

## The page.

format-page-custom = Another size
format-page-width = Width
format-page-height = Height
format-margins = Margins
format-margin-top = Top
format-margin-bottom = Bottom
format-margin-left = Left
format-margin-right = Right
format-lengths-hint = Lengths are written with their unit: 2.5cm, 1in, 25mm, 12pt.
format-line-numbers = Number the lines
format-line-numbers-hint = As some journals ask for review

## Type and spacing, and paragraphs.

format-typeface = Typeface
format-typeface-hint = Where it is not installed, the nearest is used in the preview
format-hyphenate = Divide words at the ends of lines
format-paragraphs = Paragraphs are told apart by
format-paragraphs-indent = An indented first line
format-paragraphs-spaced = Space between them
format-indent = Indent
format-indent-first = Also after a heading
format-indent-first-hint = Typographic custom leaves the first paragraph unindented; APA and others indent it
format-space-between = Space between paragraphs
format-italics = Italics are set
format-italics-italic = As italics
format-italics-underline = Underlined, as typewritten manuscripts had them

## Headings.

format-numbered = Numbered
format-level = Level { $number }
# What a level of headings is, in short, beside its number: "14 pt, bold, centred".
format-level-size = { $size } pt
format-level-bold = bold
format-level-italic = italic
format-level-capitals = capitals
format-level-small-caps = small capitals
format-level-centred = centred
format-level-right = right
format-level-run-in = runs into the text
format-level-indent = Indented as a paragraph is
format-level-run-in-label = Runs into the text
format-level-run-in-hint = The heading begins the paragraph and ends with a full stop
format-level-new-page = Begins a new page
format-level-new-page-hint = As the chapters of a book do
format-level-new-page-said = on a new page
format-space-before = Space before
format-space-after = Space after
format-level-add = A deeper level
format-level-remove = Remove the deepest
format-levels-hint = Headings deeper than the deepest level described are printed as that level.

## The title and the abstract.

format-title-placement = The title stands
format-title-top = At the top of the first page
format-title-own-page = On a page of its own
format-title-shown = What is shown
format-title-anonymous = Without the names of the authors
format-title-anonymous-hint = For review: the authors are left out everywhere, the running head too
format-title-authors = Authors
format-title-affiliations = Their affiliations
format-title-date = Date
format-title-abstract = Abstract and keywords
format-title-abstract-label = Heading of the abstract
format-title-keywords-label = Word before the keywords

## Quotations, notes and the bibliography.

format-quotations = Quotations set off from the text
format-quote-indent-left = Indent on the left
format-quote-indent-right = Indent on the right
format-quote-when = When a quotation is set off
format-quote-from-words = From this many words
format-quote-from-words-hint = A reminder: the writer decides
format-quote-from-lines = Or this many lines
format-notes-kind = Notes stand
format-notes-footnotes = At the foot of the page
format-notes-endnotes = At the end of the text
format-notes-title = Heading of the notes
format-bibliography-title = Heading
# Headings a bibliography may have.
format-bibliography-title-hint = Bibliography, References, Works Cited
format-bibliography-new-page = Begins on a new page
format-bibliography-hanging-indent = Hanging indent
format-bibliography-entry-spacing = Space between entries
format-bibliography-style = Reference style
format-bibliography-style-hint = The one this format goes with; it is taken when the format is chosen
format-bibliography-style-none = None in particular

## The kinds of paragraph and of words: how each differs from the kind it
## is based on. The rows are those of the dialog for a kind of one's own
## too; what is not said is as the base has it.

format-kinds-hint = Each kind is set as the kind it is based on, with the differences given here. What is not said is as the base has it.
format-kind-based-on = based on { $base }
format-as-the-base = As the base
# In an empty field for a size, in the place of its number.
format-as-the-base-blank = as the base
format-yes = Yes
format-no = No
format-underline = Underlined
format-equal-width = Letters of equal width
format-equal-width-hint = As code is set
format-indent-left = Indent on the left
format-indent-right = Indent on the right
format-first-line = First line
format-first-line-hint = How far it begins in, beyond the rest
format-keep-with-next = Kept with the next
format-keep-with-next-hint = Not left alone at the foot of a page
format-new-page = Begins a new page
format-break-text = What stands in a break
format-break-text-hint = * * * where nothing is said; # for a manuscript
# What a look says, in short, on the line of its kind: "10 pt, italic, centred".
format-look-not-bold = not bold
format-look-not-italic = not italic
format-look-underlined = underlined
format-look-not-underlined = not underlined
format-look-as-written = as written
format-look-left = left
format-look-justified = justified
format-look-indent-left = { $length } in on the left
format-look-indent-right = { $length } in on the right
format-look-first-line = first line { $length }
format-look-space-before = { $length } before
format-look-space-after = { $length } after
format-look-line-spacing = spacing { $spacing }
format-look-equal-width = letters of equal width
format-look-not-equal-width = letters of unequal width
format-look-kept = kept with the next
format-look-not-kept = not kept with the next
format-look-no-new-page = no new page
format-look-text = “{ $text }” in a break

## Figures and tables, which are told alike. The kind is figure or table: where
## English has the same words for both, another language may not (the caption
## of a figure and of a table can have different names).

format-figures = Figures
format-tables = Tables
format-captioned-called = { $kind ->
    [figure] A figure is called
   *[table] A table is called
}
# Words a figure or table may be called by.
format-captioned-called-hint = { $kind ->
    [figure] Figure, Fig., Abbildung
   *[table] Table, Tab., Tabelle
}
format-captioned-reference = Where the text points to it
format-captioned-reference-hint = { $kind ->
    [figure] fig., figure; empty for the same word
   *[table] tab., table; empty for the same word
}
format-captioned-label-bold = The word and number in bold
format-captioned-label-italic = The word and number in italic
format-captioned-between = { $kind ->
    [figure] Between the number and the caption
   *[table] Between the number and the caption
}
# What stands between the number and the caption; called is the word and number, "Figure 1".
format-between-stop = { $kind ->
    [figure] Full stop ({ $called }. Caption)
   *[table] Full stop ({ $called }. Caption)
}
format-between-colon = { $kind ->
    [figure] Colon ({ $called }: Caption)
   *[table] Colon ({ $called }: Caption)
}
format-between-line = { $kind ->
    [figure] Caption on a line of its own
   *[table] Caption on a line of its own
}
format-between-other = Other…
format-captioned-separator = What stands between them
format-captioned-separator-hint = Spaces count: write them where they are wanted
format-captioned-own-line = { $kind ->
    [figure] Then the caption on a line of its own
   *[table] Then the caption on a line of its own
}
format-caption = { $kind ->
    [figure] Caption
   *[table] Caption
}
format-caption-stands = { $kind ->
    [figure] The caption stands
   *[table] The caption stands
}
format-caption-below = { $kind ->
    [figure] Below the picture
   *[table] Below the table
}
format-caption-above = { $kind ->
    [figure] Above the picture
   *[table] Above the table
}
format-caption-align-hint = { $kind ->
    [figure] Of a figure that stands at a side, the caption stands at that side
   *[table] Of a table that stands at a side, the caption stands at that side
}
# In the example of how the number and the caption will stand.
format-caption-example = { $kind ->
    [figure] Caption
   *[table] Caption
}
format-captioned-where = { $kind ->
    [figure] Where figures stand
   *[table] Where tables stand
}
format-captioned-stand = { $kind ->
    [figure] Figures stand
   *[table] Tables stand
}
format-captioned-wrap = The text flows around them
format-captioned-placement = In the document
format-captioned-in-text = In the text
format-captioned-at-end = Gathered at the end
format-captioned-placement-hint = Many journals ask for them at the end of a manuscript
format-captioned-end-title = { $kind ->
    [figure] Heading over the figures
   *[table] Heading over the tables
}
format-captioned-end-title-hint = { $kind ->
    [figure] Figures, Illustrations; empty for none
   *[table] Tables; empty for none
}
# What is left in the text where a figure or table gathered at the end belongs.
format-captioned-placeholder = Line left in the text
# The braces are written as they are; line is how the line will stand.
format-captioned-placeholder-shown = {"{}"} stands for the word and number: { $line }
format-captioned-placeholder-missing = It must hold {"{}"}, where the word and number go
format-table-itself = The table itself
format-table-rules = Lines
format-table-rules-horizontal = Over, under, and under the headings
format-table-rules-grid = Around every cell
format-table-rules-none = None
format-table-rules-hint = Books and journals have the first
format-table-header-bold = Headings in bold
format-equations = Equations
format-equations-stand = Equations stand
format-equations-before = Before the number
format-equations-after = After the number

## Page numbers and the running head.

format-page-numbers = Page numbers
format-page-numbers-show = Pages are numbered
format-page-numbers-where = Where
format-page-numbers-first = On the first page too
format-position-top-left = Top, left
format-position-top-center = Top, centre
format-position-top-right = Top, right
format-position-bottom-left = Foot, left
format-position-bottom-center = Foot, centre
format-position-bottom-right = Foot, right
format-running-head = Running head
format-running-head-content = At the top of every page
format-running-head-none = Nothing
format-running-head-title = The title
format-running-head-author = The authors
format-running-head-author-title = Authors and title
format-running-head-text = Words of my own
format-running-head-words = The words

## Limits.

format-limits-hint = The preview counts the words of the text against these, and the dialog for title and abstract counts against the others. Nothing is cut.
format-limits-words = Words of text
format-limits-abstract-words = Words of abstract
format-limits-keywords = Keywords
format-limits-note = What the limits count
format-limits-note-placeholder = Notes included; bibliography not

## About the format: where its requirements are from.

format-description = Description
format-source = Where the requirements are from
# The date the source was read on.
format-source-read = Read { $date }.
format-source-high = The values are those of the source.
format-source-medium = The source could only be read in part or in an earlier state: check what matters to you.
format-source-low = Little could be verified: treat the values as a beginning.
format-source-changed = You have changed this format; the source describes what it was made from.
format-source-none = This format follows no publisher’s requirements in particular.
