# The preview, and the making of documents: the panel beside the map, the
# details of a document, and the export.

## The details of a document: what stands on its first page.

preview-details-dialog = The document
preview-details-dialog-subtitle = What stands on its first page
preview-details-title = Title
preview-details-title-placeholder = The name of the centre of the map
preview-details-title-hint = Left empty, the name of the centre of the map is the title.
preview-details-subtitle = Subtitle
preview-details-authors = Authors
preview-details-name = Name
preview-details-author-name = Name of author { $number }
preview-details-affiliation = Affiliation
preview-details-author-affiliation = Affiliation of author { $number }
preview-details-email = E-mail
preview-details-author-email = E-mail of author { $number }
# Beside a plus, under the authors: adds one.
preview-details-add-author = author
preview-details-abstract = Abstract
preview-details-words = { $count ->
    [one] { $count } word
   *[other] { $count } words
}
# The words of the abstract, and the most the format allows.
preview-details-words-of = { $limit ->
    [one] { $count } of { $limit } word
   *[other] { $count } of { $limit } words
}
preview-details-keywords = Keywords
# The keywords given, and the most the format allows.
preview-details-keywords-of = { $count } of { $limit }
preview-details-keywords-placeholder = Separated by commas
preview-details-date = Date
preview-details-date-placeholder = As it is to be printed
preview-details-language = Language of the text
# A map that was given no language is printed in English.
preview-details-language-none = Not stated (English)
