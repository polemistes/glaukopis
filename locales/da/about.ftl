# Document properties: what an element's document says of itself, its
# details, its type (what you are writing, its template), its language and
# the checklist of what its template requires. How it looks and what it
# contains are set in Look.

about-window = Dokumentegenskaber
# In the menu of an element, and at the foot of Look.
about-menu = Dokumentegenskaber…
about-sections = Vinduets dele

## The parts of the window, as they stand down its left.

about-section-details = Oplysninger
about-section-language = Sprog
about-section-checklist = Tjekliste

## The template.

## The details: what stands on the first page, and in the metadata of the files.

about-title = Titel
about-title-placeholder = Elementets navn
about-subtitle = Undertitel
about-name = Navn
about-affiliation = Tilhørsforhold
about-email = E-mail
about-orcid = ORCID
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
about-requirement-anonymous = Til fagfællebedømmelse: bidragyderne udelades af dokumentet.

## The sides, the panes and the bars, stage 2: the typesetting pane, the document pane, Document properties.

# The tab of what the document is: what you are writing, its template.
about-section-type = Dokumenttype

## Fewer words, stage 3: the source of a layout's requirements, under the layout the type brings.

about-layout-source = Kilde: { $name }

## The contributors, stage 3: the persons of a document, each with a role.

about-contributors = Bidragydere
# Beside a plus, under the contributors: adds one.
about-add-contributor = Tilføj en bidragyder
about-contributor-role = Rolle for bidragyder { $number }
about-role-author = Forfatter
about-role-editor = Redaktør
about-role-translator = Oversætter
about-contributor-name = Navn på bidragyder { $number }
about-contributor-affiliation = Tilhørsforhold for bidragyder { $number }
about-contributor-email = E-mail for bidragyder { $number }
about-contributor-orcid = ORCID for bidragyder { $number }
# Under the details: whether every line of the printed page is numbered in the margin.
about-page-lines = Nummerer hver linje på den trykte side
