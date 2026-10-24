# Document properties: what an element's document says of itself, its
# details, its type (what you are writing, its template), its language and
# the checklist of what its template requires. How it looks and what it
# contains are set in Look.

about-window = Dokumenteigenskapar
# In the menu of an element, and at the foot of Look.
about-menu = Dokumenteigenskapar …
about-sections = Delane av vindauget

## The parts of the window, as they stand down its left.

about-section-details = Opplysningar
about-section-language = Språk
about-section-checklist = Sjekkliste

## The template.

## The details: what stands on the first page, and in the metadata of the files.

about-title = Tittel
about-title-placeholder = Namnet på elementet
about-subtitle = Undertittel
about-name = Namn
about-affiliation = Tilknyting
about-email = E-post
about-orcid = ORCID
about-date = Dato
about-date-placeholder = Slik den skal stå i dokumentet
about-keywords = Nøkkelord
about-keywords-placeholder = Skilde med komma
about-keywords-count = { $count ->
    [one] { $count } nøkkelord
   *[other] { $count } nøkkelord
}
# The keywords given, and the most the template allows.
about-keywords-of = { $count } av { $limit }
about-identifiers = Identifikatorar
about-identifier-isbn = ISBN
about-identifier-edition = Utgåve
about-identifier-publisher = Forlag
about-identifier-place = Stad
about-identifier-doi = DOI
about-identifier-name = Namnet på ein annan identifikator
about-identifier-name-placeholder = ISSN, LCCN …
# Beside a plus: adds the identifier named.
about-identifier-add = identifikator

## The parts: the kinds of elements the template gives the document a place for.

## The look: the layout and the citations, which are chosen and set in the
## panel beside the preview, where the rest of the look is.

## The language.

about-language = Språket i teksten

## The checklist: what the template requires, against what the tree holds.

about-checklist-hint = Det malen krev, mot teksten og treet. Ingenting blir kutta.
about-checklist-clear = Ingen merknader.
about-requirement-words = Ord i teksten
about-requirement-anonymous = Til fagfellevurdering: bidragsytarane blir utelatne frå dokumentet.

## The sides, the panes and the bars, stage 2: the typesetting pane, the document pane, Document properties.

# The tab of what the document is: what you are writing, its template.
about-section-type = Dokumenttype

## Fewer words, stage 3: the source of a layout's requirements, under the layout the type brings.

about-layout-source = Kjelde: { $name }

## The contributors, stage 3: the persons of a document, each with a role.

about-contributors = Bidragsytarar
# Beside a plus, under the contributors: adds one.
about-add-contributor = Legg til ein bidragsytar
about-contributor-role = Rolla til bidragsytar { $number }
about-role-author = Forfattar
about-role-editor = Redaktør
about-role-translator = Omsetjar
about-contributor-name = Namnet på bidragsytar { $number }
about-contributor-affiliation = Tilknytinga til bidragsytar { $number }
about-contributor-email = E-posten til bidragsytar { $number }
about-contributor-orcid = ORCID til bidragsytar { $number }
# Under the details: whether every line of the printed page is numbered in the margin.
about-page-lines = Nummerer kvar linje på den trykte sida
