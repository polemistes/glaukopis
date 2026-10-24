## The look of a document, in one place: the column of the typesetting pane where
## everything is set that decides how the pages look. What is changed there
## is kept as the document's own changes over its layout.

look-title = Look
look-between = Between the pages and the look of the document
look-whole = What makes the look

look-scope = These changes hold for
# The whole document, by the name of its element.
look-scope-document = The whole document: { $name }
# Only one element under the document, by its name.
look-scope-only = Only { $name }
# The line under it, which goes down to the layout at the foot of Look; the count of changes follows it.
look-layout-line = Layout: { $layout }

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
look-section-notes = Notes and citations
look-section-figures = Figures and tables
look-section-front = Front page

look-kinds-in-use = In this document
look-heading-levels = Levels of headings
# The first rows of Look, which most writers reach for; each is also in its part further down.
look-first-type-size = Type size
look-first-page-size = Page size
look-first-headings-numbered = Headings are numbered
look-at-citations = Citations
look-at-bibliography = Bibliography

look-keep = Keep these changes as a layout of my own…
look-keep-save = Keep
# Where the layout is one of the writer's own.
look-put-into = Put these changes into “{ $name }”
look-delete-layout = Delete this layout of mine…

## What the document contains, a section of Look: the parts the program
## makes itself, the kinds of elements given a place of their own, and what
## is required. What is changed there is kept as the document's own changes
## over what it is. The name in quotes is what the document is: "Journal
## article", "Novel".

look-contents-parts = The parts of the document
look-contents-kinds = Elements with a place of their own
look-contents-kinds-missing = None yet
look-contents-kinds-make = Make one
# On the second element of a kind a document has one of.
look-contents-kinds-doubled = Only the first is used
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
look-style = Reference style
look-style-change = Change this reference style…

# The switch of the title page, first in the part of the front page.
look-front-title-page = A title page

# The groups of the fonts to choose from.
look-fonts-document = In this document
look-fonts-project = Elsewhere in this project
look-fonts-all = All fonts

## The sides, the panes and the bars, stage 2: the typesetting pane, the document pane, Document properties.

# Opens Document properties at what the document is.
look-document-type = Document type…
look-hide = Hide the look

## Fewer words, stage 3: the parts and the headings of Look in plain words.

look-section-line-numbers = Line numbers
look-section-type-parts = Parts of the document type
look-section-the-layout = Layout
look-choose-layout = Choose a layout
look-layout-modifications = Modifications to the layout
look-at-quotations-warning = Quotations
look-at-paragraph-kinds = Paragraph kinds
look-at-words-kinds = Words kinds
look-type-requirements = Requirements of the document type
