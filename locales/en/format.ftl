# Layouts, which the files and the code call formats: their kinds, and the rows by which their looks are set in the look of a document.

## The kinds of document layout, as the layouts are grouped by them.

format-kind-own = Your own
format-kind-general = General
format-kind-style-guide = Style guides
format-kind-publisher = Publishers
format-kind-journal = Journals
format-kind-fiction = Fiction
format-kind-stage = Stage and screen
format-kind-poetry = Poetry

## Layouts of the writer's own, kept from the changes of a document.

format-name = Name of the layout
# The name a layout of one's own is first given, made from that of the layout it is made from.
format-name-changed = { $name }, changed
format-saved = “{ $name }” is saved among your own layouts
format-save-failed = The layout could not be saved.
format-delete-failed = The layout could not be deleted.
format-delete-title = Delete the layout “{ $name }”?
format-delete-message = Elements that use it will use the general manuscript layout instead.
format-delete-confirm = Delete layout

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
format-columns-heading = Columns
format-columns = Columns
format-column-gap = Gap between columns
format-lengths-hint = Lengths are written with their unit: 2.5cm, 1in, 25mm, 12pt.
## Numbers belong to what they number (ADR 0041): the lines one numbers
## are shown as the layout says where they do not say otherwise; the lines
## of the page are the layout's alone.
format-verse-every = Show a number every
format-verse-side = Numbers on the
format-side-left = Left
format-side-right = Right
format-numbers-page = The lines of the page
format-line-numbers = Number the lines

## Type and spacing, and paragraphs.

format-typeface = Font
format-hyphenate = Divide words at the ends of lines
format-indent-first = Also after a heading
format-space-between = Space between paragraphs
format-italics = Italics are set
format-italics-italic = As italics
format-italics-underline = Underlined, as typewritten manuscripts had them
format-refmarks = Reference marks are set
format-refmarks-raised = Small and raised in the line
format-refmarks-margin = In the margin beside their line

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
format-level-begins-text = In the text
format-level-begins-page = On a new page
format-level-begins-right-page = On a right-hand page
format-level-right-page-said = on a right-hand page
format-level-numbering = Numbering
format-level-numbering-as-above = As the level above
format-level-numbering-none = None
format-level-numbering-arabic = 1, 2, 3
format-level-numbering-alpha = A, B, C
format-level-numbering-alpha-lower = a, b, c
format-level-numbering-roman = I, II, III
format-level-numbering-roman-lower = i, ii, iii
# How a level is numbered, said among its look: "numbered I, II, III".
format-level-numbered-as = numbered { $style }
format-level-not-numbered = not numbered
format-level-new-page-said = on a new page
format-space-before = Space before
format-space-after = Space after
format-level-add = A deeper level
format-level-remove = Remove the deepest

## The title and the abstract.

format-title-placement = The title stands
format-title-top = At the top of the first page
format-title-own-page = On a page of its own
format-title-authors = Authors
format-title-affiliations = Their affiliations
format-title-date = Date
format-title-abstract = Abstract and keywords
format-title-abstract-label = Heading of the abstract
format-title-keywords-label = Word before the keywords

## Quotations, notes and the bibliography.

format-quote-from-words = From this many words
format-quote-from-lines = Or this many lines
format-notes-kind = Notes stand
format-notes-footnotes = At the foot of the page
format-notes-endnotes = At the end of the text
format-notes-title = Heading of the notes
format-bibliography-title = Heading
format-bibliography-new-page = Begins on a new page
format-bibliography-hanging-indent = Hanging indent
format-bibliography-entry-spacing = Space between entries

## The kinds of paragraph and of words: how each differs from the kind it
## is based on. The rows are those of the dialog for a kind of one's own
## too; what is not said is as the base has it.

format-kind-based-on = based on { $base }
# Of the kind Text, which the parts for type and paragraphs set.
format-kind-text-note = as the type and the paragraphs of the layout have it
# At the right of a kind's line where this layout says nothing of it.
format-kind-as-base = as the base
format-kind-resolved = As it will stand: { $look }
format-kind-resolved-nothing = As it will stand: as the text around it
format-kind-resolved-failed = How it will stand could not be worked out: { $reason }
format-as-the-base = As the base
# "As the base", with what the base comes to: "As the base (Yes)", "As the base (11 pt)".
format-as-the-base-is = As the base ({ $value })
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
format-captioned-reference = Where the text points to it
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
    [figure] Below the image
   *[table] Below the table
}
format-caption-above = { $kind ->
    [figure] Above the image
   *[table] Above the table
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
format-captioned-end-title = { $kind ->
    [figure] Heading over the figures
   *[table] Heading over the tables
}
# What is left in the text where a figure or table gathered at the end belongs.
format-captioned-placeholder = Line left in the text
format-captioned-placeholder-missing = It must hold {"{}"}, where the word and number go
format-table-rules = Lines
format-table-rules-horizontal = Over, under, and under the headings
format-table-rules-grid = Around every cell
format-table-rules-none = None
format-table-header-bold = Headings in bold
format-equations = Equations
format-equations-stand = Equations stand
format-equations-before = Before the number
format-equations-after = After the number

## Page numbers and the running head.

format-page-numbers = Page numbers
format-page-numbers-show = Pages are numbered
format-page-numbering = Style of the numbers
format-number-arabic = 1, 2, 3
format-number-roman = I, II, III
format-number-roman-lower = i, ii, iii
format-number-letters = A, B, C
format-number-letters-lower = a, b, c
format-page-restart = Begins counting the pages anew here
format-margin-header = Header
format-margin-footer = Footer
format-margin-shown = Shown
format-margin-first-page = On the first page too
format-margin-openers = On the pages where a chapter or a part begins too
format-margin-alternate = Different on left and right pages
format-margin-right-pages = On right pages
format-margin-left-pages = On left pages
format-margin-place-left = Left
format-margin-place-center = Centre
format-margin-place-right = Right
format-margin-add = Add…
# Said of an item in a place of the header or the footer.
format-margin-remove = Take away { $item }
format-margin-separator = Between the items
format-margin-text-placeholder = Your words
format-item-page-number = Page number
format-item-title = Title
format-item-author = Author
format-item-chapter = Chapter
format-item-date = Date
format-item-text = Words of my own

## About the layout: where its requirements are from.

format-description = Description
format-source = Where the requirements are from
# The date the source was read on.
format-source-read = Read { $date }.
format-source-high = The values are those of the source.
format-source-medium = The source could only be read in part or in an earlier state: check what matters to you.
format-source-low = Little could be verified: treat the values as a beginning.

## Fewer words, stage 3: the rows of Look in plain words.

format-level-begins-paragraph = Begins the paragraph
format-level-placement = Placement
format-title-include = Include
format-title-formatting = Formatting
format-title-anonymize = Anonymize the front page
format-table-inside = Inside the table

## Fewer words, stage 4: the two lengths of paragraphs, and the warning of long quotations.

format-indent-first-line = Indent first line
format-quote-warn = Warn about long inline quotations

## The contributors, stage 3: the lines of the editors and the translators on the front page, and their items.

format-title-roles = Editors and translators
format-item-editor = Editor
format-item-translator = Translator

## The numbering of lines, stage 2: the side of the annotations of lines.
format-verse-annotations = Annotations on the
format-verse-annotations-other = Other side from the numbers

## Where a line begins, stage 4: the step of an indent.
format-indent-step = Indentation step
