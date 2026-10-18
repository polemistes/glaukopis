# The window of an element's document settings (ADR 0038): its template,
# the details that stand on its first page, its parts, its layout and
# reference style, its language, and the checklist.

document-window = Documentinstellingen
# In the menu of an element, and the button over the preview.
document-window-menu = Documentinstellingen…
document-window-sections = Delen van het venster
# A layout, a style or a template that is neither chosen nor inherited: the one from the settings, named.
document-window-usual = Je standaard ({ $name })
# The first choice of a layout or a style: what the template brings, named.
document-window-as-template = Zoals in het sjabloon ({ $name })
# The first choice where an element over this one has chosen: the element, and what it chose.
document-window-from-with = Van { $name } ({ $what })

## The parts of the window, as they stand down its left.

document-window-section-template = Sjabloon
document-window-section-details = Gegevens
document-window-section-parts = Onderdelen
document-window-section-look = Vormgeving
document-window-section-language = Taal
document-window-section-checklist = Controlelijst

## The template.

document-window-template-hint = Waaruit het document bestaat: zijn onderdelen in hun volgorde, de soorten die het sjabloon klaarlegt, wat het eist, en de lay-out en citeerstijl die het meebrengt.
document-window-template-search = De sjablonen doorzoeken
document-window-template-search-placeholder = Een soort tekst, een tijdschrift, een uitgever…
document-window-template-none-found = Geen sjabloon heet zo.
# Takes the template of the element over this one again, in place of this element's own.
document-window-template-again = Weer overnemen van { $name }
document-window-template-usual-again = Je standaard weer gebruiken
document-window-template-layout = Lay-out: { $layout }
document-window-template-style = Citeerstijl: { $style }
document-window-template-change = Dit sjabloon wijzigen…
document-window-template-new = Nieuw sjabloon…
# A template the project carries a copy of, that is not among the writer's own on this computer.
document-window-template-of-project = Bewaard in het project: niet bij je eigen sjablonen op deze computer.

## The details: what stands on the first page, and in the metadata of the files.

document-window-details-hint = Wat op de eerste pagina staat, en wat de bestanden als metadata meedragen. Al het andere wordt in de boom geschreven.
document-window-title = Titel
document-window-title-placeholder = De naam van het element
document-window-title-hint = Blijft dit leeg, dan is de naam van het element de titel.
document-window-subtitle = Ondertitel
document-window-authors = Auteurs
document-window-name = Naam
document-window-author-name = Naam van auteur { $number }
document-window-affiliation = Instelling
document-window-author-affiliation = Instelling van auteur { $number }
document-window-email = E-mail
document-window-author-email = E-mail van auteur { $number }
document-window-orcid = ORCID
document-window-author-orcid = ORCID van auteur { $number }
# Beside a plus, under the authors: adds one.
document-window-add-author = auteur
document-window-date = Datum
document-window-date-placeholder = Zoals die moet worden gedrukt
document-window-keywords = Trefwoorden
document-window-keywords-placeholder = Gescheiden door komma's
document-window-keywords-count = { $count ->
    [one] { $count } trefwoord
   *[other] { $count } trefwoorden
}
# The keywords given, and the most the template allows.
document-window-keywords-of = { $count } van { $limit }
document-window-identifiers = Identificaties
document-window-identifier-isbn = ISBN
document-window-identifier-edition = Druk
document-window-identifier-publisher = Uitgever
document-window-identifier-place = Plaats
document-window-identifier-doi = DOI
document-window-identifier-name = Naam van een andere identificatie
document-window-identifier-name-placeholder = ISSN, LCCN…
# Beside a plus: adds the identifier named.
document-window-identifier-add = identificatie

## The parts: the kinds of elements the template gives the document a place for.

document-window-parts-hint = De soorten elementen waaraan dit sjabloon een plaats geeft, en de elementen onder dit element die er elk een vullen. Een onderdeel is een element: zijn tekst wordt in de boom geschreven.
document-window-parts-none = Dit sjabloon heeft geen onderdelen naast de hoofdtekst.
document-window-parts-missing = Nog geen
document-window-parts-make = Er een maken
# On the second element of a kind a document has one of.
document-window-parts-doubled = Alleen het eerste wordt gebruikt

## The look: the layout and the citations, which are chosen and set in the
## panel beside the preview, where the rest of the look is.

document-window-look-hint = Hoe de pagina's eruitzien en hoe het document citeert, wordt ingesteld in Vormgeving, het paneel naast het voorbeeld: de lay-out en de citeerstijl, het lettertype, de pagina, de vormgeving van de soorten.
document-window-look-now = Lay-out: { $layout } · Citeerstijl: { $style }
document-window-look-open = Vormgeving openen
document-window-layout = Lay-out
document-window-style = Citeerstijl
document-window-style-change = Deze citeerstijl wijzigen…

## The language.

document-window-language = Taal van de tekst

## The checklist: what the template requires, against what the tree holds.

document-window-checklist-hint = Wat het sjabloon eist, tegenover de tekst en de boom. Er wordt niets ingekort.
document-window-checklist-clear = Niets op aan te merken.
document-window-requirement-words = Woorden in de tekst
document-window-requirement-anonymous = Voor beoordeling: de auteurs worden uit het document weggelaten.
