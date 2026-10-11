# The window of an element's document settings (ADR 0038): its template,
# the details that stand on its first page, its parts, its layout and
# reference style, its language, and the checklist.

document-window = Document settings
# In the menu of an element, and the button over the preview.
document-window-menu = Document settings…
document-window-sections = Parts of the window
# A layout, a style or a template that is neither chosen nor inherited: the one from the settings, named.
document-window-usual = Your usual ({ $name })
# The first choice of a layout or a style: what the template brings, named.
document-window-as-template = As the template has it ({ $name })
# The first choice where an element over this one has chosen: the element, and what it chose.
document-window-from-with = From { $name } ({ $what })

## The parts of the window, as they stand down its left.

document-window-section-template = Template
document-window-section-details = Details
document-window-section-parts = Parts
document-window-section-layout = Layout and citations
document-window-section-language = Language
document-window-section-checklist = Checklist

## The template.

document-window-template-hint = What the document consists of: its parts in their order, the kinds it puts in hand, what it requires, and the layout and reference style it brings.
document-window-template-search = Search the templates
document-window-template-search-placeholder = A kind of text, a journal, a publisher…
document-window-template-none-found = No template goes by that name.
# Takes the template of the element over this one again, in place of this element's own.
document-window-template-again = Take it from { $name } again
document-window-template-usual-again = Take your usual again
document-window-template-layout = Layout: { $layout }
document-window-template-style = Reference style: { $style }
document-window-template-change = Change this template…
document-window-template-new = New template…

## The details: what stands on the first page, and in the metadata of the files.

document-window-details-hint = What stands on the first page, and what the files carry as metadata. Everything else is written in the tree.
document-window-title = Title
document-window-title-placeholder = The name of the element
document-window-title-hint = Left empty, the name of the element is the title.
document-window-subtitle = Subtitle
document-window-authors = Authors
document-window-name = Name
document-window-author-name = Name of author { $number }
document-window-affiliation = Affiliation
document-window-author-affiliation = Affiliation of author { $number }
document-window-email = E-mail
document-window-author-email = E-mail of author { $number }
document-window-orcid = ORCID
document-window-author-orcid = ORCID of author { $number }
# Beside a plus, under the authors: adds one.
document-window-add-author = author
document-window-date = Date
document-window-date-placeholder = As it is to be printed
document-window-keywords = Keywords
document-window-keywords-placeholder = Separated by commas
document-window-keywords-count = { $count ->
    [one] { $count } keyword
   *[other] { $count } keywords
}
# The keywords given, and the most the template allows.
document-window-keywords-of = { $count } of { $limit }
document-window-identifiers = Identifiers
document-window-identifier-isbn = ISBN
document-window-identifier-edition = Edition
document-window-identifier-publisher = Publisher
document-window-identifier-place = Place
document-window-identifier-doi = DOI
document-window-identifier-name = Name of another identifier
document-window-identifier-name-placeholder = ISSN, LCCN…
# Beside a plus: adds the identifier named.
document-window-identifier-add = identifier

## The parts: the kinds of elements the template gives the document a place for.

document-window-parts-hint = The kinds of elements this template gives a place to, and the elements under this one that fill each. A part is an element: its text is written in the tree.
document-window-parts-none = This template has no parts beyond the body.
document-window-parts-missing = None yet
document-window-parts-make = Make one
# On the second element of a kind a document has one of.
document-window-parts-doubled = Only the first is used

## The layout and the citations.

document-window-layout = Layout
document-window-layout-hint = How the page looks: page, type, spacing, headings, the looks of the kinds
document-window-layout-change = Change this layout…
document-window-style = Reference style
document-window-style-hint = How citations and the bibliography are written
document-window-style-change = Change this reference style…

## The language.

document-window-language = Language of the text

## The checklist: what the template requires, against what the tree holds.

document-window-checklist-hint = What the template requires, against the text and the tree. Nothing is cut.
document-window-checklist-clear = Nothing to remark on.
document-window-requirement-words = Words of text
document-window-requirement-anonymous = For review: the authors are left out of the document.
