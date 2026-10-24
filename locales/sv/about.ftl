# Document properties: what an element's document says of itself, its
# details, its type (what you are writing, its template), its language and
# the checklist of what its template requires. How it looks and what it
# contains are set in Look.

about-window = Dokumentegenskaper
# In the menu of an element, and at the foot of Look.
about-menu = Dokumentegenskaper…
about-sections = Fönstrets delar

## The parts of the window, as they stand down its left.

about-section-details = Uppgifter
about-section-language = Språk
about-section-checklist = Checklista

## The template.

## The details: what stands on the first page, and in the metadata of the files.

about-title = Titel
about-title-placeholder = Elementets namn
about-subtitle = Undertitel
about-name = Namn
about-affiliation = Tillhörighet
about-email = E-post
about-orcid = ORCID
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
about-requirement-anonymous = För referentgranskning: de medverkande utelämnas ur dokumentet.

## The sides, the panes and the bars, stage 2: the typesetting pane, the document pane, Document properties.

# The tab of what the document is: what you are writing, its template.
about-section-type = Dokumenttyp

## Fewer words, stage 3: the source of a layout's requirements, under the layout the type brings.

about-layout-source = Källa: { $name }

## The contributors, stage 3: the persons of a document, each with a role.

about-contributors = Medverkande
# Beside a plus, under the contributors: adds one.
about-add-contributor = Lägg till en medverkande
about-contributor-role = Roll för medverkande { $number }
about-role-author = Författare
about-role-editor = Redaktör
about-role-translator = Översättare
about-contributor-name = Namn på medverkande { $number }
about-contributor-affiliation = Tillhörighet för medverkande { $number }
about-contributor-email = E-post till medverkande { $number }
about-contributor-orcid = ORCID för medverkande { $number }
# Under the details: whether every line of the printed page is numbered in the margin.
about-page-lines = Numrera varje rad på den tryckta sidan
