# The window of an element's document settings (ADR 0038): its template,
# the details that stand on its first page, its parts, its layout and
# reference style, its language, and the checklist.

about-window = Documentinstellingen
# In the menu of an element, and the button over the preview.
about-menu = Documentinstellingen…
about-sections = Delen van het venster

## The parts of the window, as they stand down its left.

about-section-details = Gegevens
about-section-language = Taal
about-section-checklist = Controlelijst

## The template.

## The details: what stands on the first page, and in the metadata of the files.

about-details-hint = Wat op de eerste pagina staat, en wat de bestanden als metadata meedragen. Al het andere wordt in de boom geschreven.
about-title = Titel
about-title-placeholder = De naam van het element
about-title-hint = Blijft dit leeg, dan is de naam van het element de titel.
about-subtitle = Ondertitel
about-authors = Auteurs
about-name = Naam
about-author-name = Naam van auteur { $number }
about-affiliation = Instelling
about-author-affiliation = Instelling van auteur { $number }
about-email = E-mail
about-author-email = E-mail van auteur { $number }
about-orcid = ORCID
about-author-orcid = ORCID van auteur { $number }
# Beside a plus, under the authors: adds one.
about-add-author = auteur
about-date = Datum
about-date-placeholder = Zoals die moet worden gedrukt
about-keywords = Trefwoorden
about-keywords-placeholder = Gescheiden door komma's
about-keywords-count = { $count ->
    [one] { $count } trefwoord
   *[other] { $count } trefwoorden
}
# The keywords given, and the most the template allows.
about-keywords-of = { $count } van { $limit }
about-identifiers = Identificaties
about-identifier-isbn = ISBN
about-identifier-edition = Druk
about-identifier-publisher = Uitgever
about-identifier-place = Plaats
about-identifier-doi = DOI
about-identifier-name = Naam van een andere identificatie
about-identifier-name-placeholder = ISSN, LCCN…
# Beside a plus: adds the identifier named.
about-identifier-add = identificatie

## The parts: the kinds of elements the template gives the document a place for.

## The look: the layout and the citations, which are chosen and set in the
## panel beside the preview, where the rest of the look is.

## The language.

about-language = Taal van de tekst

## The checklist: what the template requires, against what the tree holds.

about-checklist-hint = Wat het sjabloon eist, tegenover de tekst en de boom. Er wordt niets ingekort.
about-checklist-clear = Niets op aan te merken.
about-requirement-words = Woorden in de tekst
about-requirement-anonymous = Voor beoordeling: de auteurs worden uit het document weggelaten.
