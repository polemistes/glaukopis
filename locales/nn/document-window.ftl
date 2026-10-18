# The window of an element's document settings (ADR 0038): its template,
# the details that stand on its first page, its parts, its layout and
# reference style, its language, and the checklist.

document-window = Dokumentinnstillingar
# In the menu of an element, and the button over the preview.
document-window-menu = Dokumentinnstillingar …
document-window-sections = Delane av vindauget
# A layout, a style or a template that is neither chosen nor inherited: the one from the settings, named.
document-window-usual = Som vanleg ({ $name })
# The first choice of a layout or a style: what the template brings, named.
document-window-as-template = Som malen har det ({ $name })
# The first choice where an element over this one has chosen: the element, and what it chose.
document-window-from-with = Frå { $name } ({ $what })

## The parts of the window, as they stand down its left.

document-window-section-template = Mal
document-window-section-details = Opplysningar
document-window-section-parts = Delar
document-window-section-look = Utsjånad
document-window-section-language = Språk
document-window-section-checklist = Sjekkliste

## The template.

document-window-template-hint = Kva dokumentet består av: delane i rekkjefølgja si, typane og slaga malen legg i handa, kva den krev, og oppsettet og referansestilen den tek med seg.
document-window-template-search = Søk i malane
document-window-template-search-placeholder = Ein teksttype, eit tidsskrift, eit forlag …
document-window-template-none-found = Ingen mal heiter det.
# Takes the template of the element over this one again, in place of this element's own.
document-window-template-again = Ta den frå { $name } igjen
document-window-template-usual-again = Ta den vanlege igjen
document-window-template-layout = Oppsett: { $layout }
document-window-template-style = Referansestil: { $style }
document-window-template-change = Endre denne malen …
document-window-template-new = Ny mal …
# A template the project carries a copy of, that is not among the writer's own on this computer.
document-window-template-of-project = Ligg i prosjektet: ikkje blant dine eigne malar på denne datamaskina.

## The details: what stands on the first page, and in the metadata of the files.

document-window-details-hint = Det som står på første side, og det filene ber med seg som metadata. Alt anna blir skrive i treet.
document-window-title = Tittel
document-window-title-placeholder = Namnet på elementet
document-window-title-hint = Står feltet tomt, blir namnet på elementet tittelen.
document-window-subtitle = Undertittel
document-window-authors = Forfattarar
document-window-name = Namn
document-window-author-name = Namnet på forfattar { $number }
document-window-affiliation = Tilknyting
document-window-author-affiliation = Tilknytinga til forfattar { $number }
document-window-email = E-post
document-window-author-email = E-posten til forfattar { $number }
document-window-orcid = ORCID
document-window-author-orcid = ORCID til forfattar { $number }
# Beside a plus, under the authors: adds one.
document-window-add-author = forfattar
document-window-date = Dato
document-window-date-placeholder = Slik den skal stå i dokumentet
document-window-keywords = Nøkkelord
document-window-keywords-placeholder = Skilde med komma
document-window-keywords-count = { $count ->
    [one] { $count } nøkkelord
   *[other] { $count } nøkkelord
}
# The keywords given, and the most the template allows.
document-window-keywords-of = { $count } av { $limit }
document-window-identifiers = Identifikatorar
document-window-identifier-isbn = ISBN
document-window-identifier-edition = Utgåve
document-window-identifier-publisher = Forlag
document-window-identifier-place = Stad
document-window-identifier-doi = DOI
document-window-identifier-name = Namnet på ein annan identifikator
document-window-identifier-name-placeholder = ISSN, LCCN …
# Beside a plus: adds the identifier named.
document-window-identifier-add = identifikator

## The parts: the kinds of elements the template gives the document a place for.

document-window-parts-hint = Typane av element denne malen gir plass til, og elementa under dette som fyller kvar av dei. Ein del er eit element: teksten blir skriven i treet.
document-window-parts-none = Denne malen har ingen delar utover teksten.
document-window-parts-missing = Ingen enno
document-window-parts-make = Lag ein
# On the second element of a kind a document has one of.
document-window-parts-doubled = Berre det første blir brukt

## The look: the layout and the citations, which are chosen and set in the
## panel beside the preview, where the rest of the look is.

document-window-look-hint = Korleis sidene ser ut, og korleis dokumentet viser til kjelder, blir stilt inn i Utsjånad, panelet ved sida av førehandsvisinga: oppsettet og referansestilen, skrifta, sida, utsjånaden til slaga.
document-window-look-now = Oppsett: { $layout } · Referansestil: { $style }
document-window-look-open = Opne Utsjånad
document-window-layout = Oppsett
document-window-style = Referansestil
document-window-style-change = Endre denne referansestilen …

## The language.

document-window-language = Språket i teksten

## The checklist: what the template requires, against what the tree holds.

document-window-checklist-hint = Det malen krev, mot teksten og treet. Ingenting blir kutta.
document-window-checklist-clear = Ingen merknader.
document-window-requirement-words = Ord i teksten
document-window-requirement-anonymous = Til fagfellevurdering: forfattarane blir utelatne frå dokumentet.
