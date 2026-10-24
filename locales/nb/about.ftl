# Dokumentegenskaper: det et elements dokument sier om seg selv,
# opplysningene, typen (hva du skriver, malen), språket og sjekklisten over
# det malen krever. Hvordan det ser ut og hva det inneholder, settes i
# Utseende.

about-window = Dokumentegenskaper
# I menyen til et element, og nederst i Utseende.
about-menu = Dokumentegenskaper …
about-sections = Delene av vinduet

## Delene av vinduet, slik de står nedover til venstre.

about-section-details = Opplysninger
about-section-language = Språk
about-section-checklist = Sjekkliste

## Malen.

## Opplysningene: det som står på første side, og i metadataene til filene.

about-details-hint = Det som står på første side, og det filene bærer med seg som metadata. Alt annet skrives i treet.
about-title = Tittel
about-title-placeholder = Navnet på elementet
about-title-hint = Står feltet tomt, blir navnet på elementet tittelen.
about-subtitle = Undertittel
about-authors = Forfattere
about-name = Navn
about-author-name = Navn på forfatter { $number }
about-affiliation = Tilknytning
about-author-affiliation = Tilknytningen til forfatter { $number }
about-email = E-post
about-author-email = E-post til forfatter { $number }
about-orcid = ORCID
about-author-orcid = ORCID til forfatter { $number }
# Ved siden av et pluss, under forfatterne: legger til en.
about-add-author = forfatter
about-date = Dato
about-date-placeholder = Slik den skal stå i dokumentet
about-keywords = Nøkkelord
about-keywords-placeholder = Skilt med komma
about-keywords-count = { $count ->
    [one] { $count } nøkkelord
   *[other] { $count } nøkkelord
}
# Nøkkelordene som er gitt, og det meste malen tillater.
about-keywords-of = { $count } av { $limit }
about-identifiers = Identifikatorer
about-identifier-isbn = ISBN
about-identifier-edition = Utgave
about-identifier-publisher = Forlag
about-identifier-place = Sted
about-identifier-doi = DOI
about-identifier-name = Navn på en annen identifikator
about-identifier-name-placeholder = ISSN, LCCN …
# Ved siden av et pluss: legger til identifikatoren som er navngitt.
about-identifier-add = identifikator

## Delene: slagene elementer malen gir dokumentet plass til.

## Utseendet: oppsettet og kildehenvisningene, som velges og stilles inn i
## panelet ved siden av forhåndsvisningen.

## Språket.

about-language = Språket i teksten

## Sjekklisten: det malen krever, mot det treet inneholder.

about-checklist-hint = Det malen krever, mot teksten og treet. Ingenting kuttes.
about-checklist-clear = Ingenting å bemerke.
about-requirement-words = Ord i teksten
about-requirement-anonymous = Til fagfellevurdering: forfatterne utelates fra dokumentet.

## The sides, the panes and the bars, stage 2: the typesetting pane, the document pane, Document properties.

about-section-type = Dokumenttype
about-line-numbers = Nummerer linjene på siden
about-line-numbers-hint = Hver linje på den trykte siden, nummerert i margen, i dette dokumentet og dem under det.

## Fewer words, stage 3: the source of a layout's requirements, under the layout the type brings.

about-layout-source = Kilde: { $name }
