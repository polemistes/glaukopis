# Document properties: what an element's document says of itself, its
# details, its type (what you are writing, its template), its language and
# the checklist of what its template requires. How it looks and what it
# contains are set in Look.

about-window = Document properties
# In the menu of an element, and at the foot of Look.
about-menu = Document properties…
about-sections = Parts of the window

## The parts of the window, as they stand down its left.

about-section-details = Details
about-section-language = Language
about-section-checklist = Checklist

## The template.

## The details: what stands on the first page, and in the metadata of the files.

about-details-hint = What stands on the first page, and what the files carry as metadata. Everything else is written in the tree.
about-title = Title
about-title-placeholder = The name of the element
about-title-hint = Left empty, the name of the element is the title.
about-subtitle = Subtitle
about-authors = Authors
about-name = Name
about-author-name = Name of author { $number }
about-affiliation = Affiliation
about-author-affiliation = Affiliation of author { $number }
about-email = E-mail
about-author-email = E-mail of author { $number }
about-orcid = ORCID
about-author-orcid = ORCID of author { $number }
# Beside a plus, under the authors: adds one.
about-add-author = author
about-date = Date
about-date-placeholder = As it is to be printed
about-keywords = Keywords
about-keywords-placeholder = Separated by commas
about-keywords-count = { $count ->
    [one] { $count } keyword
   *[other] { $count } keywords
}
# The keywords given, and the most the template allows.
about-keywords-of = { $count } of { $limit }
about-identifiers = Identifiers
about-identifier-isbn = ISBN
about-identifier-edition = Edition
about-identifier-publisher = Publisher
about-identifier-place = Place
about-identifier-doi = DOI
about-identifier-name = Name of another identifier
about-identifier-name-placeholder = ISSN, LCCN…
# Beside a plus: adds the identifier named.
about-identifier-add = identifier

## The parts: the kinds of elements the template gives the document a place for.

## The look: the layout and the citations, which are chosen and set in the
## panel beside the preview, where the rest of the look is.

## The language.

about-language = Language of the text

## The checklist: what the template requires, against what the tree holds.

about-checklist-hint = What the template requires, against the text and the tree. Nothing is cut.
about-checklist-clear = Nothing to remark on.
about-requirement-words = Words of text
about-requirement-anonymous = For review: the authors are left out of the document.

## The sides, the panes and the bars, stage 2: the typesetting pane, the document pane, Document properties.

# The tab of what the document is: what you are writing, its template.
about-section-type = Document type
# Under the details: whether every line of the printed page is numbered in the margin.
about-line-numbers = Number the lines of the page
about-line-numbers-hint = Every line of the printed page, numbered in the margin, in this document and those under it.
