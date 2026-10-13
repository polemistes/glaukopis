## The look of a document, in one place: the panel beside the preview where
## everything is set that decides how the pages look. What is changed there
## is kept as the document's own changes over its layout.

look-title = Look
look-open = The look of this document: template, layout and citations
look-between = Between the text and the look of the document
look-whole = What makes the look

look-template = Template
look-template-hint = What the document consists of: its parts, and what they require
look-layout-hint = How the page looks: page, type, spacing, headings, the looks of the kinds
look-citations-hint = How citations and the bibliography are written

# After the name of the layout at the top of the panel: "Manuscript · 2 changes".
look-changes = { $count ->
    [one] { $count } change
   *[other] { $count } changes
  }
look-no-changes = no changes
# Under a setting the document sets otherwise than its layout.
look-changed-here = Changed here
# A change made on an element over this one, as a book over its chapters.
look-changed-in = Changed in “{ $name }”
look-take-again = take { $layout }’s again

look-open-preview = Open the preview to see the changes as you make them.
look-open-preview-button = Open the preview
look-search = Find a setting: font, margins, page numbers…
look-search-nothing = No setting has these words.
look-sections = Parts of the look

look-section-type = Type
look-section-page = Page
look-section-paragraphs = Paragraphs
look-section-headings = Headings
look-section-kinds = Kinds
look-section-quotations = Quotations
look-section-numbers = Numbers
look-section-notes = Notes
look-section-bibliography = Bibliography
look-section-figures = Figures and tables
look-section-title = Title and abstract
look-section-about = About the layout

look-kinds-in-use = In this document
look-heading-levels = Levels of headings
look-quotations-hint = Quotations that are set off from the text by their length, wherever they are not marked as quotations themselves. The kind Quotation is set in the part of the kinds.

look-keep = Keep these changes as a layout of my own…
look-keep-save = Keep
# Where the layout is one of the writer's own.
look-put-into = Put these changes into “{ $name }”
look-delete-layout = Delete this layout of mine…
look-bundled = The layouts that come with Glaukopis stay as they are. What you change here is kept with the document, or, when you choose, as a layout of your own.
