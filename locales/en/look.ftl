## The look of a document, in one place: the column of the typesetting pane where
## everything is set that decides how the pages look. What is changed there
## is kept as the document's own changes over its layout.

look-title = Look
look-between = Between the pages and the look of the document
look-whole = What makes the look

# Under the button at the top of Look that names what the document is.
look-what-hint = What you are writing decides the parts, the pages and the citations; any of them is changed below.
look-scope = These changes hold for
# The whole document, by the name of its element.
look-scope-document = The whole document: { $name }
# Only one element under the document, by its name.
look-scope-only = Only { $name }
look-scope-hint = Changes here hold for { $name }, wherever it is printed. Page settings begin it on a new page.
# The line under it, which goes down to the layout at the foot of Look; the count of changes follows it.
look-layout-line = Layout: { $layout }
look-layout-hint = How the pages look: the page, the type, the spacing, the headings, the looks of the kinds
look-citations-hint = How citations and the bibliography are written

# After the name of the layout at the top of the panel: "Manuscript · 2 changes".
look-changes = { $count ->
    [one] { $count } change
   *[other] { $count } changes
  }
# Under a setting the document sets otherwise than its layout.
look-changed-here = Changed here
# A change made on an element over this one, as a book over its chapters.
look-changed-in = Changed in “{ $name }”
look-take-again = take { $layout }’s again

look-search = Find a setting: font, margins, page numbers…
look-search-nothing = No setting has these words.
look-sections = Parts of the look

look-section-page = Page
look-section-type = Type
look-section-paragraphs = Paragraphs
look-section-headings = Headings
look-section-numbers = Numbers
look-section-notes = Notes and citations
look-section-figures = Figures and tables
look-section-front = Front page
look-section-contents = What the document contains
look-section-layout = The layout

look-kinds-in-use = In this document
look-heading-levels = Levels of headings
look-quotations-hint = Quotations that are set off from the text by their length, wherever they are not marked as quotations themselves. The kind Quotation is set under the kinds of paragraph and of words, below.
# The first rows of Look, which most writers reach for; each is also in its part further down.
look-first-type-size = Type size
look-first-page-size = Page size
look-first-headings-numbered = Headings are numbered
# Headings within the parts of Look.
look-at-quotations = Long quotations
look-at-kinds = Kinds of paragraph and of words
look-at-citations = Citations
look-at-bibliography = Bibliography
look-layout-changes = What this document changes

look-keep = Keep these changes as a layout of my own…
look-keep-save = Keep
# Where the layout is one of the writer's own.
look-put-into = Put these changes into “{ $name }”
look-delete-layout = Delete this layout of mine…
look-bundled = The layouts that come with Glaukopis stay as they are. What you change here is kept with the document, or, when you choose, as a layout of your own.

## What the document contains, a section of Look: the parts the program
## makes itself, the kinds of elements given a place of their own, and what
## is required. What is changed there is kept as the document's own changes
## over what it is. The name in quotes is what the document is: "Journal
## article", "Novel".

look-contents-parts = The parts of the document
look-contents-parts-hint = As “{ $template }” has them. A part turned on or off here is changed for this document and those under it, and nowhere else.
# Under the parts that are always made: when each is printed.
look-contents-part-body = Always in the document
look-contents-part-notes = Wherever the text has notes
look-contents-part-bibliography = Wherever the text cites a work
look-contents-part-keywords = Printed where the document has keywords
look-contents-kinds = Elements with a place of their own
look-contents-kinds-hint = The kinds of elements “{ $template }” gives a place to, and the elements under this one that fill each. Each is an element like any other: its text is written in the tree.
look-contents-kinds-none = “{ $template }” gives no kind of element a place of its own.
look-contents-kinds-missing = None yet
look-contents-kinds-make = Make one
# On the second element of a kind a document has one of.
look-contents-kinds-doubled = Only the first is used
look-contents-requirements = What is required
look-contents-requirements-hint = As “{ $template }” asks, unless it is changed here. The checklist and the preview count against these limits; nothing is cut.
look-contents-limit-words = Words of the text, at most
look-contents-limit-abstract-words = Words of the abstract, at most
look-contents-limit-keywords = Keywords, at most
# What the limits count, as what the document is says it.
look-contents-requirements-note = What the limits count: { $note }

# A layout, a style or a template that is neither chosen nor inherited: the one from the settings, named.
look-usual = Your usual ({ $name })
# The first choice of a layout or a style: what the template brings, named.
look-as-template = As the template has it ({ $name })
# The first choice where an element over this one has chosen: the element, and what it chose.
look-from-with = From { $name } ({ $what })
look-layout = Layout
look-style = Reference style
look-style-change = Change this reference style…

# The switch of the title page, first in the part of the front page.
look-front-title-page = A title page
look-front-title-page-hint = Whether the document has one at all; the same switch as under What the document contains

# The groups of the fonts to choose from.
look-fonts-document = In this document
look-fonts-project = Elsewhere in this project
look-fonts-all = All fonts

## The sides, the panes and the bars, stage 2: the typesetting pane, the document pane, Document properties.

# Opens Document properties at what the document is.
look-document-type = Document type…
look-hide = Hide the look
