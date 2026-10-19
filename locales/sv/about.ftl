# The window of an element's document settings (ADR 0038): its template,
# the details that stand on its first page, its parts, its layout and
# reference style, its language, and the checklist.

about-window = Dokumentinställningar
# In the menu of an element, and the button over the preview.
about-menu = Dokumentinställningar…
about-sections = Fönstrets delar

## The parts of the window, as they stand down its left.

about-section-details = Uppgifter
about-section-language = Språk
about-section-checklist = Checklista

## The template.

## The details: what stands on the first page, and in the metadata of the files.

about-details-hint = Det som står på första sidan, och det som filerna bär med sig som metadata. Allt annat skrivs i trädet.
about-title = Titel
about-title-placeholder = Elementets namn
about-title-hint = Lämnas den tom är elementets namn titeln.
about-subtitle = Undertitel
about-authors = Författare
about-name = Namn
about-author-name = Namn på författare { $number }
about-affiliation = Tillhörighet
about-author-affiliation = Tillhörighet för författare { $number }
about-email = E-post
about-author-email = E-post för författare { $number }
about-orcid = ORCID
about-author-orcid = ORCID för författare { $number }
# Beside a plus, under the authors: adds one.
about-add-author = författare
about-date = Datum
about-date-placeholder = Som det ska skrivas ut
about-keywords = Nyckelord
about-keywords-placeholder = Åtskilda med kommatecken
about-keywords-count = { $count ->
    [one] { $count } nyckelord
   *[other] { $count } nyckelord
}
# The keywords given, and the most the template allows.
about-keywords-of = { $count } av { $limit }
about-identifiers = Identifierare
about-identifier-isbn = ISBN
about-identifier-edition = Upplaga
about-identifier-publisher = Förlag
about-identifier-place = Ort
about-identifier-doi = DOI
about-identifier-name = Namn på en annan identifierare
about-identifier-name-placeholder = ISSN, LCCN…
# Beside a plus: adds the identifier named.
about-identifier-add = identifierare

## The parts: the kinds of elements the template gives the document a place for.

## The look: the layout and the citations, which are chosen and set in the
## panel beside the preview, where the rest of the look is.

## The language.

about-language = Textens språk

## The checklist: what the template requires, against what the tree holds.

about-checklist-hint = Vad mallen kräver, mot texten och trädet. Inget skärs bort.
about-checklist-clear = Inget att anmärka på.
about-requirement-words = Ord i texten
about-requirement-anonymous = För granskning: författarna utelämnas ur dokumentet.
