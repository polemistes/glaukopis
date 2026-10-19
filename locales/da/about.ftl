# The window of an element's document settings (ADR 0038): its template,
# the details that stand on its first page, its parts, its layout and
# reference style, its language, and the checklist.

about-window = Dokumentindstillinger
# In the menu of an element, and the button over the preview.
about-menu = Dokumentindstillinger…
about-sections = Vinduets dele

## The parts of the window, as they stand down its left.

about-section-details = Oplysninger
about-section-language = Sprog
about-section-checklist = Tjekliste

## The template.

## The details: what stands on the first page, and in the metadata of the files.

about-details-hint = Det, der står på første side, og det, filerne har med som metadata. Alt andet skrives i træet.
about-title = Titel
about-title-placeholder = Elementets navn
about-title-hint = Står feltet tomt, er elementets navn titlen.
about-subtitle = Undertitel
about-authors = Forfattere
about-name = Navn
about-author-name = Navn på forfatter { $number }
about-affiliation = Tilhørsforhold
about-author-affiliation = Tilhørsforhold for forfatter { $number }
about-email = E-mail
about-author-email = E-mail for forfatter { $number }
about-orcid = ORCID
about-author-orcid = ORCID for forfatter { $number }
# Beside a plus, under the authors: adds one.
about-add-author = forfatter
about-date = Dato
about-date-placeholder = Som den skal udskrives
about-keywords = Nøgleord
about-keywords-placeholder = Adskilt af kommaer
about-keywords-count = { $count ->
    [one] { $count } nøgleord
   *[other] { $count } nøgleord
}
# The keywords given, and the most the template allows.
about-keywords-of = { $count } af { $limit }
about-identifiers = Identifikatorer
about-identifier-isbn = ISBN
about-identifier-edition = Udgave
about-identifier-publisher = Forlag
about-identifier-place = Sted
about-identifier-doi = DOI
about-identifier-name = Navnet på en anden identifikator
about-identifier-name-placeholder = ISSN, LCCN…
# Beside a plus: adds the identifier named.
about-identifier-add = identifikator

## The parts: the kinds of elements the template gives the document a place for.

## The look: the layout and the citations, which are chosen and set in the
## panel beside the preview, where the rest of the look is.

## The language.

about-language = Tekstens sprog

## The checklist: what the template requires, against what the tree holds.

about-checklist-hint = Det, skabelonen kræver, holdt op mod teksten og træet. Intet skæres væk.
about-checklist-clear = Intet at bemærke.
about-requirement-words = Ord i teksten
about-requirement-anonymous = Til fagfællebedømmelse: forfatterne udelades af dokumentet.
