# Vinduet med dokumentinnstillingene til et element (ADR 0038): malen,
# opplysningene som står på første side, delene, oppsettet og
# referansestilen, språket og sjekklisten.

document-window = Dokumentinnstillinger
# I menyen til et element, og knappen over forhåndsvisningen.
document-window-menu = Dokumentinnstillinger …
document-window-sections = Delene av vinduet
# Et oppsett, en stil eller en mal som verken er valgt eller arvet: den fra innstillingene, med navn.
document-window-usual = Den vanlige ({ $name })
# Det første valget av oppsett eller stil: det malen bringer med seg, med navn.
document-window-as-template = Som malen har det ({ $name })
# Det første valget der et element over dette har valgt: elementet, og det det valgte.
document-window-from-with = Fra { $name } ({ $what })

## Delene av vinduet, slik de står nedover til venstre.

document-window-section-template = Mal
document-window-section-details = Opplysninger
document-window-section-parts = Deler
document-window-section-layout = Oppsett og kildehenvisninger
document-window-section-language = Språk
document-window-section-checklist = Sjekkliste

## Malen.

document-window-template-hint = Hva dokumentet består av: delene i sin rekkefølge, slagene den legger i hånden, det den krever, og oppsettet og referansestilen den bringer med seg.
document-window-template-search = Søk i malene
document-window-template-search-placeholder = En teksttype, et tidsskrift, et forlag …
document-window-template-none-found = Ingen mal heter det.
# Tar malen fra elementet over dette igjen, i stedet for elementets egen.
document-window-template-again = Ta den fra { $name } igjen
document-window-template-usual-again = Ta den vanlige igjen
document-window-template-layout = Oppsett: { $layout }
document-window-template-style = Referansestil: { $style }
document-window-template-change = Endre denne malen …
document-window-template-new = Ny mal …
document-window-template-of-project = Ligger i prosjektet: ikke blant dine egne maler på denne maskinen.

## Opplysningene: det som står på første side, og i metadataene til filene.

document-window-details-hint = Det som står på første side, og det filene bærer med seg som metadata. Alt annet skrives i treet.
document-window-title = Tittel
document-window-title-placeholder = Navnet på elementet
document-window-title-hint = Står feltet tomt, blir navnet på elementet tittelen.
document-window-subtitle = Undertittel
document-window-authors = Forfattere
document-window-name = Navn
document-window-author-name = Navn på forfatter { $number }
document-window-affiliation = Tilknytning
document-window-author-affiliation = Tilknytningen til forfatter { $number }
document-window-email = E-post
document-window-author-email = E-post til forfatter { $number }
document-window-orcid = ORCID
document-window-author-orcid = ORCID til forfatter { $number }
# Ved siden av et pluss, under forfatterne: legger til en.
document-window-add-author = forfatter
document-window-date = Dato
document-window-date-placeholder = Slik den skal stå i dokumentet
document-window-keywords = Nøkkelord
document-window-keywords-placeholder = Skilt med komma
document-window-keywords-count = { $count ->
    [one] { $count } nøkkelord
   *[other] { $count } nøkkelord
}
# Nøkkelordene som er gitt, og det meste malen tillater.
document-window-keywords-of = { $count } av { $limit }
document-window-identifiers = Identifikatorer
document-window-identifier-isbn = ISBN
document-window-identifier-edition = Utgave
document-window-identifier-publisher = Forlag
document-window-identifier-place = Sted
document-window-identifier-doi = DOI
document-window-identifier-name = Navn på en annen identifikator
document-window-identifier-name-placeholder = ISSN, LCCN …
# Ved siden av et pluss: legger til identifikatoren som er navngitt.
document-window-identifier-add = identifikator

## Delene: slagene elementer malen gir dokumentet plass til.

document-window-parts-hint = Slagene elementer denne malen gir plass til, og elementene under dette som fyller hvert av dem. En del er et element: teksten skrives i treet.
document-window-parts-none = Denne malen har ingen deler utover teksten.
document-window-parts-missing = Ingen ennå
document-window-parts-make = Lag en
# På det andre elementet av et slag et dokument har ett av.
document-window-parts-doubled = Bare det første brukes

## Oppsettet og kildehenvisningene.

document-window-layout = Oppsett
document-window-layout-hint = Hvordan siden ser ut: side, skrift, avstand, overskrifter, hvordan slagene settes
document-window-layout-change = Endre dette oppsettet …
document-window-style = Referansestil
document-window-style-hint = Hvordan kildehenvisningene og litteraturlisten skrives
document-window-style-change = Endre denne referansestilen …

## Språket.

document-window-language = Språket i teksten

## Sjekklisten: det malen krever, mot det treet inneholder.

document-window-checklist-hint = Det malen krever, mot teksten og treet. Ingenting kuttes.
document-window-checklist-clear = Ingenting å bemerke.
document-window-requirement-words = Ord i teksten
document-window-requirement-anonymous = Til fagfellevurdering: forfatterne utelates fra dokumentet.
